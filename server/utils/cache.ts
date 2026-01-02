/*
 * @Author: zi.yang
 * @Date: 2025-12-29 00:00:00
 * @LastEditors: zi.yang
 * @LastEditTime: 2025-12-29 00:00:00
 * @Description: 简单的内存缓存模块
 * @FilePath: /short-link/api/utils/cache
 */

import type { CacheOptions } from "../types/index.js";

/**
 * 缓存项结构
 */
interface CacheItem {
  value: unknown;
  expireAt: number;
  createdAt: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
}

/**
 * 简单的内存缓存类
 * 适用于单实例部署，生产环境建议使用 Redis
 */
class MemoryCache {
  private store: Map<string, CacheItem>;
  private defaultTTL: number;
  private maxSize: number;
  private cleanupInterval: number;
  private stats: CacheStats;
  private _cleanupTimer: NodeJS.Timeout | null;

  constructor(options: Partial<CacheOptions> = {}) {
    /**
     * 缓存存储
     * @type {Map<string, CacheItem>}
     */
    this.store = new Map();

    /**
     * 默认 TTL（秒）
     */
    this.defaultTTL = options.defaultTTL || 300; // 5 分钟

    /**
     * 最大缓存条目数
     */
    this.maxSize = options.maxSize || 10000;

    /**
     * 清理间隔（毫秒）
     */
    this.cleanupInterval = options.cleanupInterval || 60000; // 1 分钟

    /**
     * 统计信息
     */
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
    };

    // 启动定期清理任务
    this._startCleanupTask();
  }

  /**
   * 获取缓存
   * @param {string} key - 缓存键
   * @returns {any} 缓存值，不存在或已过期返回 undefined
   */
  get(key) {
    const item = this.store.get(key);

    if (!item) {
      this.stats.misses++;
      return undefined;
    }

    // 检查是否过期
    if (Date.now() > item.expireAt) {
      this.store.delete(key);
      this.stats.misses++;
      return undefined;
    }

    this.stats.hits++;
    return item.value;
  }

  /**
   * 设置缓存
   * @param {string} key - 缓存键
   * @param {any} value - 缓存值
   * @param {number} [ttl] - 过期时间（秒），默认使用 defaultTTL
   * @returns {boolean} 是否设置成功
   */
  set(key, value, ttl = this.defaultTTL) {
    // 检查是否需要清理（超过最大容量）
    if (this.store.size >= this.maxSize && !this.store.has(key)) {
      this._evictOldest();
    }

    const now = Date.now();
    this.store.set(key, {
      value,
      expireAt: now + ttl * 1000,
      createdAt: now,
    });

    this.stats.sets++;
    return true;
  }

  /**
   * 删除缓存
   * @param {string} key - 缓存键
   * @returns {boolean} 是否删除成功
   */
  delete(key) {
    const result = this.store.delete(key);
    if (result) {
      this.stats.deletes++;
    }
    return result;
  }

  /**
   * 检查缓存是否存在且未过期
   * @param {string} key - 缓存键
   * @returns {boolean}
   */
  has(key) {
    const item = this.store.get(key);
    if (!item) return false;
    if (Date.now() > item.expireAt) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  /**
   * 清空所有缓存
   */
  clear() {
    this.store.clear();
  }

  /**
   * 获取缓存大小
   * @returns {number}
   */
  size() {
    return this.store.size;
  }

  /**
   * 获取统计信息
   * @returns {Object}
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? (this.stats.hits / total).toFixed(4) : 0,
      size: this.store.size,
    };
  }

  /**
   * 重置统计信息
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
    };
  }

  /**
   * 获取或设置缓存（带回调）
   * @param {string} key - 缓存键
   * @param {Function} fetchFn - 获取数据的回调函数
   * @param {number} [ttl] - 过期时间（秒）
   * @returns {Promise<any>}
   */
  async getOrSet(key, fetchFn, ttl = this.defaultTTL) {
    const cached = this.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const value = await fetchFn();
    if (value !== undefined && value !== null) {
      this.set(key, value, ttl);
    }
    return value;
  }

  /**
   * 批量获取缓存
   * @param {string[]} keys - 缓存键数组
   * @returns {Map<string, any>}
   */
  mget(keys) {
    const result = new Map();
    for (const key of keys) {
      const value = this.get(key);
      if (value !== undefined) {
        result.set(key, value);
      }
    }
    return result;
  }

  /**
   * 批量设置缓存
   * @param {Map<string, any>|Object} entries - 键值对
   * @param {number} [ttl] - 过期时间（秒）
   */
  mset(entries, ttl = this.defaultTTL) {
    const items = entries instanceof Map ? entries : Object.entries(entries);
    for (const [key, value] of items) {
      this.set(key, value, ttl);
    }
  }

  /**
   * 按前缀删除缓存
   * @param {string} prefix - 键前缀
   * @returns {number} 删除的数量
   */
  deleteByPrefix(prefix) {
    let count = 0;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        count++;
      }
    }
    this.stats.deletes += count;
    return count;
  }

  /**
   * 启动定期清理任务
   * @private
   */
  _startCleanupTask() {
    this._cleanupTimer = setInterval(() => {
      this._cleanup();
    }, this.cleanupInterval);

    // 确保定时器不会阻止进程退出
    if (this._cleanupTimer.unref) {
      this._cleanupTimer.unref();
    }
  }

  /**
   * 清理过期缓存
   * @private
   */
  _cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, item] of this.store) {
      if (now > item.expireAt) {
        this.store.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      // 可以在这里添加日志
      // console.log(`Cache cleanup: removed ${cleaned} expired items`);
    }
  }

  /**
   * 淘汰最旧的缓存项
   * @private
   */
  _evictOldest() {
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, item] of this.store) {
      if (item.createdAt < oldestTime) {
        oldestTime = item.createdAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.store.delete(oldestKey);
    }
  }

  /**
   * 停止清理任务
   */
  destroy() {
    if (this._cleanupTimer) {
      clearInterval(this._cleanupTimer);
      this._cleanupTimer = null;
    }
    this.clear();
  }
}

/**
 * 全局缓存实例
 */
const globalCache = new MemoryCache({
  defaultTTL: 300, // 5 分钟
  maxSize: 10000,
  cleanupInterval: 60000, // 1 分钟
});

/**
 * 缓存键前缀
 */
export const CACHE_KEYS = {
  // 用户相关
  USER_INFO: "user:info:",
  USER_ADMIN_STATUS: "user:admin:",
  USER_PROFILE: "user:profile:",

  // 链接相关
  LINK_INFO: "link:info:",
  LINK_BY_SHORT: "link:short:",

  // 过期时间选项
  EXPIRATION_OPTIONS: "config:expiration_options",

  // 统计相关
  STATS_GLOBAL: "stats:global",
  STATS_USER: "stats:user:",

  // 热门链接
  HOT_LINKS: "hot:links",
};

/**
 * 构建缓存键
 * @param {string} prefix - 键前缀
 * @param {string|number} id - 标识符
 * @returns {string}
 */
export function buildCacheKey(prefix, id) {
  return `${prefix}${id}`;
}

/**
 * 创建新的缓存实例
 * @param {Object} options - 配置选项
 * @returns {MemoryCache}
 */
export function createCache(options = {}) {
  return new MemoryCache(options);
}

export { MemoryCache };
export default globalCache;
