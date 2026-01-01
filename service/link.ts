/*
 * @Author: zi.yang
 * @Date: 2024-12-11 19:47:42
 * @LastEditors: zi.yang
 * @LastEditTime: 2025-12-29 00:00:00
 * @Description: 短链接服务 - 集成 Supabase，支持高级配置和缓存
 * @FilePath: /short-link/service/link.js
 */
import supabase from "./db.js";
import dayjs from "dayjs";
import {
  generateSecureHash,
  MAX_HASH_RETRIES,
} from "../server/utils/security.js";
import cache, { CACHE_KEYS } from "../server/utils/cache.js";
import { CACHE_CONFIG } from "../server/config/index.js";
import type {
  VisitorInfo,
  LinkCreateOptions,
  AccessRestrictions,
} from "../server/types/index.js";

/**
 * 缓存 TTL 配置（秒）
 */
const EXPIRATION_OPTIONS_CACHE_TTL = CACHE_CONFIG.EXPIRATION_OPTIONS_TTL; // 5 分钟

/**
 * 解析 User-Agent 获取设备类型
 * @param {string} userAgent - User-Agent 字符串
 * @returns {string} 设备类型: mobile/tablet/desktop
 */
export function parseDeviceType(userAgent: string | undefined): string {
  if (!userAgent) return "unknown";

  const ua = userAgent.toLowerCase();

  // 检查是否是平板
  if (
    /ipad|tablet|playbook|silk/.test(ua) ||
    (/android/.test(ua) && !/mobile/.test(ua))
  ) {
    return "tablet";
  }

  // 检查是否是手机
  if (
    /mobile|iphone|ipod|android.*mobile|windows phone|blackberry|opera mini|opera mobi/.test(
      ua,
    )
  ) {
    return "mobile";
  }

  // 默认为桌面设备
  return "desktop";
}

/**
 * 检查 IP 是否在 CIDR 范围内
 * @param {string} ip - IP 地址
 * @param {string} cidr - CIDR 格式的地址范围
 * @returns {boolean}
 */
function ipInCidr(ip, cidr) {
  try {
    const [range, bits = "32"] = cidr.split("/");
    const mask = ~(2 ** (32 - parseInt(bits)) - 1);

    const ipParts = ip.split(".").map(Number);
    const rangeParts = range.split(".").map(Number);

    const ipNum =
      (ipParts[0] << 24) + (ipParts[1] << 16) + (ipParts[2] << 8) + ipParts[3];
    const rangeNum =
      (rangeParts[0] << 24) +
      (rangeParts[1] << 16) +
      (rangeParts[2] << 8) +
      rangeParts[3];

    return (ipNum & mask) === (rangeNum & mask);
  } catch {
    return false;
  }
}

/**
 * 检查 IP 是否在列表中（支持 CIDR）
 * @param {string} ip - IP 地址
 * @param {Array} ipList - IP/CIDR 列表
 * @returns {boolean}
 */
function checkIpInList(ip, ipList) {
  if (!ip || !ipList || ipList.length === 0) return false;

  for (const item of ipList) {
    if (item.includes("/")) {
      if (ipInCidr(ip, item)) return true;
    } else {
      if (ip === item) return true;
    }
  }
  return false;
}

/**
 * 验证访问限制
 * @param {Object} restrictions - 访问限制配置
 * @param {Object} visitorInfo - 访问者信息
 * @returns {Object} { allowed: boolean, reason: string }
 */
export function validateAccessRestrictions(
  restrictions: AccessRestrictions | null | undefined,
  visitorInfo: VisitorInfo,
) {
  if (!restrictions || Object.keys(restrictions).length === 0) {
    return { allowed: true };
  }

  const { ip, device, referrer, country } = visitorInfo;

  // IP 白名单检查
  if (restrictions.ip_whitelist && restrictions.ip_whitelist.length > 0) {
    if (!checkIpInList(ip, restrictions.ip_whitelist)) {
      return { allowed: false, reason: "IP 地址不在允许范围内" };
    }
  }

  // IP 黑名单检查
  if (restrictions.ip_blacklist && restrictions.ip_blacklist.length > 0) {
    if (checkIpInList(ip, restrictions.ip_blacklist)) {
      return { allowed: false, reason: "IP 地址已被禁止访问" };
    }
  }

  // 国家/地区限制（允许列表）
  if (
    restrictions.allowed_countries &&
    restrictions.allowed_countries.length > 0
  ) {
    if (
      country &&
      !restrictions.allowed_countries.includes(country.toUpperCase())
    ) {
      return { allowed: false, reason: "当前地区不允许访问" };
    }
  }

  // 国家/地区限制（禁止列表）
  if (
    restrictions.blocked_countries &&
    restrictions.blocked_countries.length > 0
  ) {
    if (
      country &&
      restrictions.blocked_countries.includes(country.toUpperCase())
    ) {
      return { allowed: false, reason: "当前地区已被禁止访问" };
    }
  }

  // 设备类型限制
  if (restrictions.allowed_devices && restrictions.allowed_devices.length > 0) {
    if (device && !restrictions.allowed_devices.includes(device)) {
      return { allowed: false, reason: "当前设备类型不允许访问" };
    }
  }

  // 来源限制（允许列表）
  if (
    restrictions.allowed_referrers &&
    restrictions.allowed_referrers.length > 0
  ) {
    if (referrer) {
      const isAllowed = restrictions.allowed_referrers.some((ref) =>
        referrer.toLowerCase().includes(ref.toLowerCase()),
      );
      if (!isAllowed) {
        return { allowed: false, reason: "访问来源不在允许范围内" };
      }
    }
  }

  // 来源限制（禁止列表）
  if (
    restrictions.blocked_referrers &&
    restrictions.blocked_referrers.length > 0
  ) {
    if (referrer) {
      const isBlocked = restrictions.blocked_referrers.some((ref) =>
        referrer.toLowerCase().includes(ref.toLowerCase()),
      );
      if (isBlocked) {
        return { allowed: false, reason: "访问来源已被禁止" };
      }
    }
  }

  return { allowed: true };
}

/**
 * 构建重定向 URL（处理参数透传）
 * @param {string} targetUrl - 目标 URL
 * @param {string} queryString - 原始请求的查询字符串
 * @param {boolean} passQueryParams - 是否透传参数
 * @returns {string} 最终重定向 URL
 */
export function buildRedirectUrl(targetUrl, queryString, passQueryParams) {
  if (!passQueryParams || !queryString) {
    return targetUrl;
  }

  try {
    const url = new URL(targetUrl);
    const incomingParams = new URLSearchParams(queryString);

    // 合并参数，原始参数优先
    for (const [key, value] of incomingParams) {
      if (!url.searchParams.has(key)) {
        url.searchParams.append(key, value);
      }
    }

    return url.toString();
  } catch {
    // 如果 URL 解析失败，简单拼接
    const separator = targetUrl.includes("?") ? "&" : "?";
    return `${targetUrl}${separator}${queryString}`;
  }
}

/**
 * 通过短链接哈希获取原始 URL
 * @param {string} short - 短链接哈希
 * @param {Object} visitorInfo - 访问者信息（可选）
 * @returns {Promise} 链接信息
 */
export async function getUrl(short: string, visitorInfo: VisitorInfo = {}) {
  try {
    const { data, error } = await supabase
      .from("links")
      .select("*")
      .eq("short", short)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { data: null, error: { message: "短链接不存在" } };
      }
      return { data: null, error };
    }

    // 检查是否启用
    if (!data.is_active) {
      return { data: null, error: { message: "链接已被禁用" } };
    }

    // 检查是否过期
    if (data.expiration_date && dayjs(data.expiration_date).isBefore(dayjs())) {
      return { data: null, error: { message: "链接已过期" } };
    }

    // 检查点击次数限制
    if (data.max_clicks && data.click_count >= data.max_clicks) {
      return { data: null, error: { message: "链接已达到最大访问次数" } };
    }

    // 验证访问限制
    if (
      data.access_restrictions &&
      Object.keys(data.access_restrictions).length > 0
    ) {
      const deviceType = parseDeviceType(visitorInfo.userAgent || "");
      const validation = validateAccessRestrictions(data.access_restrictions, {
        ip: visitorInfo.ip,
        device: deviceType,
        referrer: visitorInfo.referrer,
        country: visitorInfo.country,
      });

      if (!validation.allowed) {
        return { data: null, error: { message: validation.reason } };
      }
    }

    return { data, error: null };
  } catch (error) {
    console.error("获取短链接失败:", error);
    return { data: null, error };
  }
}

/**
 * 生成唯一的短链接哈希（带重试限制）
 * @param {number} retryCount - 当前重试次数
 * @returns {Promise<{hash: string|null, error: string|null}>}
 */
async function generateUniqueHash(retryCount = 0) {
  if (retryCount >= MAX_HASH_RETRIES) {
    return {
      hash: null,
      error: "无法生成唯一的短链接，请稍后重试",
    };
  }

  const short = generateSecureHash(6);

  // 检查短链接哈希是否已存在
  const { data: existingShort } = await supabase
    .from("links")
    .select("id")
    .eq("short", short)
    .maybeSingle();

  if (existingShort) {
    // 哈希冲突，递归重试（带计数）
    return generateUniqueHash(retryCount + 1);
  }

  return { hash: short, error: null };
}

/**
 * 创建短链接
 * @param {string} link - 原始链接
 * @param {string|null} userId - 用户 ID（可选）
 * @param {Object} options - 高级配置选项
 * @returns {Promise} 创建结果
 */
export async function addUrl(
  link: string,
  userId: string | null = null,
  options: Partial<LinkCreateOptions> = {},
) {
  try {
    if (userId) {
      // 已登录用户：检查该用户是否已创建过相同链接
      const { data: existingUserLinks } = await supabase
        .from("links")
        .select("*")
        .eq("link", link)
        .eq("user_id", userId)
        .limit(1);

      if (existingUserLinks && existingUserLinks.length > 0) {
        // 用户已创建过该链接，返回错误提示去控制台管理
        return {
          data: null,
          error: {
            code: "DUPLICATE_LINK",
            message: "您已创建过该链接的短链接，请前往控制台管理",
            existingLink: existingUserLinks[0],
          },
        };
      }
    } else {
      // 未登录用户：检查是否存在相同的匿名链接（user_id 为 null）
      const { data: existingAnonymousLinks } = await supabase
        .from("links")
        .select("*")
        .eq("link", link)
        .is("user_id", null)
        .limit(1);

      if (existingAnonymousLinks && existingAnonymousLinks.length > 0) {
        // 直接返回已存在的短链接，不创建新的
        return { data: existingAnonymousLinks[0], error: null };
      }
    }

    // 生成唯一的短链接哈希（带重试限制）
    const { hash: short, error: hashError } = await generateUniqueHash();

    if (hashError) {
      return { data: null, error: { message: hashError } };
    }

    // 处理过期时间
    let expirationDate = null;
    if (options.expiration_option_id) {
      const { data: expOption } = await supabase
        .from("expiration_options")
        .select("*")
        .eq("id", options.expiration_option_id)
        .single();

      if (expOption && !expOption.is_permanent) {
        let expirationTime = dayjs();
        if (expOption.hours) {
          expirationTime = expirationTime.add(expOption.hours, "hour");
        } else if (expOption.days) {
          expirationTime = expirationTime.add(expOption.days, "day");
        }
        expirationDate = expirationTime.toISOString();
      }
    } else if (options.expiration_date) {
      expirationDate = options.expiration_date;
    }

    // 构建插入数据 - 基础字段
    const insertData: Record<string, unknown> = {
      link,
      short,
      user_id: userId,
      is_active: options.is_active !== false, // 默认启用
      click_count: 0,
      expiration_date: expirationDate,
      title: options.title || null,
      description: options.description || null,
    };

    // 添加高级配置字段（可能在旧数据库中不存在）
    // 只有当值有意义时才添加
    if (options.redirect_type !== undefined) {
      insertData.redirect_type = options.redirect_type || 302;
    }
    if (options.pass_query_params !== undefined) {
      insertData.pass_query_params = options.pass_query_params || false;
    }
    if (options.forward_headers !== undefined) {
      insertData.forward_headers = options.forward_headers || false;
    }
    if (options.forward_header_list !== undefined) {
      insertData.forward_header_list = options.forward_header_list || [];
    }
    if (options.max_clicks !== undefined && options.max_clicks !== null) {
      insertData.max_clicks = options.max_clicks;
    }
    if (
      options.access_restrictions !== undefined &&
      options.access_restrictions !== null
    ) {
      insertData.access_restrictions = options.access_restrictions;
    }

    // 插入新链接
    const { data, error } = await supabase
      .from("links")
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error("创建短链接失败:", error);
      // 如果是唯一性冲突，重试一次
      if (error.code === "23505") {
        // 使用非递归方式重试一次
        const { hash: retryShort, error: retryHashError } =
          await generateUniqueHash();
        if (retryHashError) {
          return { data: null, error: { message: retryHashError } };
        }
        insertData.short = retryShort;

        const { data: retryData, error: retryError } = await supabase
          .from("links")
          .insert([insertData])
          .select()
          .single();

        if (retryError) {
          return { data: null, error: retryError };
        }
        return { data: retryData, error: null };
      }
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error("创建短链接异常:", error);
    return { data: null, error };
  }
}

/**
 * 记录链接访问
 * @param {number} linkId - 链接 ID
 * @param {Object} accessInfo - 访问信息
 * @returns {Promise}
 */
export async function logAccess(linkId, accessInfo) {
  try {
    const deviceType = parseDeviceType(accessInfo.user_agent);

    await supabase.from("link_access_logs").insert([
      {
        link_id: linkId,
        ip_address: accessInfo.ip_address,
        user_agent: accessInfo.user_agent,
        referrer: accessInfo.referrer,
        device_type: deviceType,
        country: accessInfo.country || null,
        city: accessInfo.city || null,
      },
    ]);

    // 触发器会自动更新 click_count
  } catch (error) {
    console.error("记录访问日志失败:", error);
    // 不抛出错误，因为日志记录失败不应影响重定向
  }
}

/**
 * 获取过期时间选项列表（带缓存）
 * @returns {Promise} 过期时间选项
 */
export async function getExpirationOptions() {
  try {
    // 尝试从缓存获取
    const cacheKey = CACHE_KEYS.EXPIRATION_OPTIONS;
    const cached = cache.get(cacheKey);

    if (cached !== undefined) {
      return { data: cached, error: null };
    }

    // 缓存未命中，从数据库查询
    const { data, error } = await supabase
      .from("expiration_options")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("获取过期时间选项失败:", error);
      return { data: [], error };
    }

    // 缓存结果
    if (data && data.length > 0) {
      cache.set(cacheKey, data, EXPIRATION_OPTIONS_CACHE_TTL);
    }

    return { data, error: null };
  } catch (error) {
    console.error("获取过期时间选项异常:", error);
    return { data: [], error };
  }
}

/**
 * 清除过期时间选项缓存
 */
export function clearExpirationOptionsCache() {
  cache.delete(CACHE_KEYS.EXPIRATION_OPTIONS);
}

/**
 * 更新链接配置
 * @param {number} linkId - 链接 ID
 * @param {string} userId - 用户 ID（用于权限验证）
 * @param {Object} updates - 更新数据
 * @returns {Promise} 更新结果
 */
export async function updateLinkConfig(linkId, userId, updates) {
  try {
    // 首先验证链接是否属于该用户
    const { data: link } = await supabase
      .from("links")
      .select("user_id")
      .eq("id", linkId)
      .single();

    if (!link || link.user_id !== userId) {
      return { data: null, error: { message: "无权更新此链接" } };
    }

    // 允许更新的字段
    const allowedFields = [
      "is_active",
      "redirect_type",
      "pass_query_params",
      "forward_headers",
      "forward_header_list",
      "max_clicks",
      "expiration_date",
      "access_restrictions",
      "title",
      "description",
    ];

    // 过滤只保留允许更新的字段
    const filteredUpdates = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }

    const { data, error } = await supabase
      .from("links")
      .update(filteredUpdates)
      .eq("id", linkId)
      .select()
      .single();

    if (error) {
      console.error("更新链接失败:", error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error("更新链接配置异常:", error);
    return { data: null, error };
  }
}
