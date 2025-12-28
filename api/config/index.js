/*
 * @Author: zi.yang
 * @Date: 2025-01-01 00:00:00
 * @LastEditors: zi.yang
 * @LastEditTime: 2025-01-01 00:00:00
 * @Description: 配置管理模块 - 集中管理所有配置常量
 * @FilePath: /short-link/api/config/index.js
 */

/**
 * 环境变量
 */
export const ENV = {
  NODE_ENV: process.env.NODE_ENV || "development",
  IS_PRODUCTION: process.env.NODE_ENV === "production",
  IS_DEVELOPMENT: process.env.NODE_ENV !== "production",
  PORT: parseInt(process.env.PORT, 10) || 3000,
};

/**
 * CORS 配置
 */
export const CORS_CONFIG = {
  // 允许的域名列表
  ALLOWED_ORIGINS: ENV.IS_PRODUCTION
    ? ["https://short.pangcy.cn", "https://www.short.pangcy.cn"]
    : [
        "https://short.pangcy.cn",
        "https://www.short.pangcy.cn",
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
      ],
  // 允许的请求方法
  METHODS: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  // 允许的请求头
  ALLOWED_HEADERS: ["Content-Type", "Authorization", "X-Requested-With"],
  // 暴露给客户端的响应头
  EXPOSED_HEADERS: [
    "X-RateLimit-Limit",
    "X-RateLimit-Remaining",
    "X-RateLimit-Reset",
  ],
  // 预检请求缓存时间（秒）
  MAX_AGE: 86400,
  // 是否允许携带凭证
  CREDENTIALS: true,
};

/**
 * 速率限制配置
 */
export const RATE_LIMIT_CONFIG = {
  // 全局速率限制
  GLOBAL: {
    MAX: 100, // 最大请求数
    TIME_WINDOW: "1 minute", // 时间窗口
  },
  // 创建短链接接口限制
  CREATE_LINK: {
    MAX: 10,
    TIME_WINDOW: "1 minute",
  },
  // 登录接口限制
  LOGIN: {
    MAX: 5,
    TIME_WINDOW: "1 minute",
  },
  // 管理员接口限制
  ADMIN: {
    MAX: 50,
    TIME_WINDOW: "1 minute",
  },
  // 是否添加响应头
  ADD_HEADERS: true,
  // 是否添加 Retry-After 头
  ADD_RETRY_AFTER_HEADER: true,
};

/**
 * 缓存配置
 */
export const CACHE_CONFIG = {
  // 过期时间选项缓存时间（秒）
  EXPIRATION_OPTIONS_TTL: 300, // 5 分钟
  // 用户信息缓存时间（秒）
  USER_INFO_TTL: 60, // 1 分钟
  // 管理员状态缓存时间（秒）
  ADMIN_STATUS_TTL: 60, // 1 分钟
  // 热门短链接缓存时间（秒）
  HOT_LINKS_TTL: 60, // 1 分钟
  // 统计数据缓存时间（秒）
  STATS_TTL: 30, // 30 秒
};

/**
 * 短链接配置
 */
export const LINK_CONFIG = {
  // 短链接哈希长度
  HASH_LENGTH: 6,
  // 最大哈希生成重试次数
  MAX_HASH_RETRIES: 10,
  // 有效的重定向类型
  VALID_REDIRECT_TYPES: [301, 302, 307, 308],
  // 默认重定向类型
  DEFAULT_REDIRECT_TYPE: 302,
  // 有效的设备类型
  VALID_DEVICE_TYPES: ["mobile", "tablet", "desktop"],
};

/**
 * 验证限制配置
 */
export const VALIDATION_LIMITS = {
  URL_MAX_LENGTH: 2048,
  URL_MIN_LENGTH: 10,
  TITLE_MAX_LENGTH: 200,
  DESCRIPTION_MAX_LENGTH: 1000,
  SHORT_HASH_LENGTH: 6,
  SHORT_HASH_MAX_LENGTH: 20,
  IP_MAX_LENGTH: 45, // IPv6 最大长度
  USER_AGENT_MAX_LENGTH: 1024,
  REFERRER_MAX_LENGTH: 2048,
  EMAIL_MAX_LENGTH: 254,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  BATCH_OPERATION_MAX_ITEMS: 100,
  IP_LIST_MAX_ITEMS: 100,
  PAGE_SIZE_MAX: 100,
  PAGE_SIZE_DEFAULT: 10,
};

/**
 * 错误码定义
 */
export const ERROR_CODES = {
  // 通用错误
  SUCCESS: { code: 200, msg: "success" },
  BAD_REQUEST: { code: 400, msg: "Bad Request" },
  UNAUTHORIZED: { code: 401, msg: "Unauthorized" },
  FORBIDDEN: { code: 403, msg: "Forbidden" },
  NOT_FOUND: { code: 404, msg: "Not Found" },
  CONFLICT: { code: 409, msg: "Conflict" },
  RATE_LIMITED: { code: 429, msg: "Too Many Requests" },
  INTERNAL_ERROR: { code: 500, msg: "Internal Server Error" },
  SERVICE_UNAVAILABLE: { code: 503, msg: "Service Unavailable" },

  // 业务错误
  INVALID_URL: { code: 400, msg: "URL 格式不正确" },
  INVALID_TOKEN: { code: 401, msg: "无效的 Token" },
  TOKEN_EXPIRED: { code: 401, msg: "Token 已过期" },
  ADMIN_REQUIRED: { code: 403, msg: "需要管理员权限" },
  USER_BANNED: { code: 403, msg: "用户已被禁用" },
  LINK_NOT_FOUND: { code: 404, msg: "短链接不存在" },
  LINK_EXPIRED: { code: 410, msg: "链接已过期" },
  LINK_DISABLED: { code: 410, msg: "链接已被禁用" },
  LINK_MAX_CLICKS: { code: 410, msg: "链接已达到最大访问次数" },
  DUPLICATE_LINK: { code: 409, msg: "您已创建过该链接的短链接" },
  ACCESS_DENIED: { code: 403, msg: "访问被拒绝" },
};

/**
 * 日志级别
 */
export const LOG_LEVELS = {
  DEBUG: "debug",
  INFO: "info",
  WARN: "warn",
  ERROR: "error",
  FATAL: "fatal",
};

/**
 * 获取完整配置
 */
export function getConfig() {
  return {
    env: ENV,
    cors: CORS_CONFIG,
    rateLimit: RATE_LIMIT_CONFIG,
    cache: CACHE_CONFIG,
    link: LINK_CONFIG,
    validation: VALIDATION_LIMITS,
    errorCodes: ERROR_CODES,
    logLevels: LOG_LEVELS,
  };
}

export default getConfig();
