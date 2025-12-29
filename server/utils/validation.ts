/*
 * @Author: zi.yang
 * @Date: 2025-12-29 00:00:00
 * @LastEditors: zi.yang
 * @LastEditTime: 2025-12-29 00:00:00
 * @Description: 输入验证模块 - 统一的验证逻辑（增强版）
 * @FilePath: /short-link/api/utils/validation.js
 */

import type { UrlValidationOptions } from "../types/index.js";

/**
 * 验证配置常量
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
};

/**
 * 有效的重定向类型
 */
export const VALID_REDIRECT_TYPES = [301, 302, 307, 308];

/**
 * 有效的设备类型
 */
export const VALID_DEVICE_TYPES = ["mobile", "tablet", "desktop"];

/**
 * 禁止的 URL 协议（防止 XSS 和其他攻击）
 */
const BLOCKED_PROTOCOLS = [
  /^javascript:/i,
  /^vbscript:/i,
  /^data:/i,
  /^file:/i,
  /^ftp:/i,
  /^mailto:/i,
  /^tel:/i,
];

/**
 * 内网 IP 范围（SSRF 保护）
 */
const PRIVATE_IP_RANGES = [
  // IPv4 私有地址
  /^127\./, // 127.0.0.0/8 - Loopback
  /^10\./, // 10.0.0.0/8 - Private
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12 - Private
  /^192\.168\./, // 192.168.0.0/16 - Private
  /^169\.254\./, // 169.254.0.0/16 - Link-local
  /^0\./, // 0.0.0.0/8 - Current network
  /^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./, // 100.64.0.0/10 - Carrier-grade NAT
  /^192\.0\.0\./, // 192.0.0.0/24 - IETF Protocol Assignments
  /^192\.0\.2\./, // 192.0.2.0/24 - TEST-NET-1
  /^198\.51\.100\./, // 198.51.100.0/24 - TEST-NET-2
  /^203\.0\.113\./, // 203.0.113.0/24 - TEST-NET-3
  /^224\./, // 224.0.0.0/4 - Multicast
  /^240\./, // 240.0.0.0/4 - Reserved
  /^255\.255\.255\.255$/, // Broadcast
  // IPv6 私有地址
  /^::1$/, // Loopback
  /^fe80:/i, // Link-local
  /^fc00:/i, // Unique local
  /^fd00:/i, // Unique local
];

/**
 * 云服务元数据端点（SSRF 保护）
 */
const BLOCKED_HOSTNAMES = [
  "metadata.google.internal",
  "metadata.goog",
  "169.254.169.254", // AWS/GCP/Azure metadata
  "metadata.azure.com",
  "100.100.100.200", // Alibaba Cloud metadata
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "[::1]",
];

/**
 * URL 格式正则表达式（更严格）
 * 支持 http://, https://, #小程序://
 */
const URL_PATTERN =
  /^(https?:\/\/)[a-zA-Z0-9][-a-zA-Z0-9]*(\.[a-zA-Z0-9][-a-zA-Z0-9]*)+(:\d{1,5})?(\/[^\s<>"{}|\\^`[\]]*)?$/;

/**
 * 小程序链接格式正则
 */
const MINIPROGRAM_PATTERN =
  /^#小程序:\/\/[a-zA-Z0-9_-]+(?:\/[^\s<>"{}|\\^`[\]]*)?$/;

/**
 * 邮箱格式正则表达式
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * IP 地址格式正则表达式 (IPv4)
 */
const IPV4_PATTERN = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;

/**
 * IP 地址格式正则表达式 (IPv6)
 */
const IPV6_PATTERN = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}(\/\d{1,3})?$/;

/**
 * 短链接哈希格式正则表达式（字母数字）
 */
const HASH_PATTERN = /^[A-Za-z0-9]+$/;

/**
 * 验证结果对象
 */
export interface ValidationResult {
  valid: boolean;
  error: string | null;
}

/**
 * 创建验证结果
 * @param {boolean} valid
 * @param {string|null} error
 * @returns {ValidationResult}
 */
function result(valid: boolean, error: string | null = null): ValidationResult {
  return { valid, error };
}

/**
 * 检查 URL 是否使用禁止的协议
 * @param {string} url - URL 字符串
 * @returns {boolean} 是否使用禁止的协议
 */
function hasBlockedProtocol(url: string): boolean {
  return BLOCKED_PROTOCOLS.some((pattern) => pattern.test(url));
}

/**
 * 检查主机名是否为私有/内网地址（SSRF 保护）
 * @param {string} hostname - 主机名
 * @returns {boolean} 是否为私有地址
 */
function isPrivateHost(hostname: string): boolean {
  // 检查是否为明确禁止的主机名
  const lowerHostname = hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.includes(lowerHostname)) {
    return true;
  }

  // 检查是否为私有 IP 范围
  return PRIVATE_IP_RANGES.some((pattern) => pattern.test(hostname));
}

/**
 * 验证 URL 格式和长度（增强版，包含 SSRF 保护）
 * @param {string} url - 要验证的 URL
 * @param {Object} options - 验证选项
 * @param {boolean} options.allowPrivateHosts - 是否允许私有/内网地址（默认 false）
 * @returns {ValidationResult}
 */
export function validateUrl(
  url: string,
  options: Partial<UrlValidationOptions> = {},
): ValidationResult {
  const { allowPrivateHosts = false } = options;

  if (!url || typeof url !== "string") {
    return result(false, "URL 是必填参数");
  }

  const trimmedUrl = url.trim();

  if (trimmedUrl.length < VALIDATION_LIMITS.URL_MIN_LENGTH) {
    return result(
      false,
      `URL 长度不能少于 ${VALIDATION_LIMITS.URL_MIN_LENGTH} 个字符`,
    );
  }

  if (trimmedUrl.length > VALIDATION_LIMITS.URL_MAX_LENGTH) {
    return result(
      false,
      `URL 长度不能超过 ${VALIDATION_LIMITS.URL_MAX_LENGTH} 个字符`,
    );
  }

  // 检查禁止的协议
  if (hasBlockedProtocol(trimmedUrl)) {
    return result(false, "不支持的 URL 协议");
  }

  // 处理小程序链接
  if (trimmedUrl.startsWith("#小程序://")) {
    if (!MINIPROGRAM_PATTERN.test(trimmedUrl)) {
      return result(false, "小程序链接格式不正确");
    }
    return result(true);
  }

  // 验证 HTTP/HTTPS URL
  if (!trimmedUrl.startsWith("http://") && !trimmedUrl.startsWith("https://")) {
    return result(false, "URL 必须以 http://、https:// 或 #小程序:// 开头");
  }

  // 尝试解析 URL
  let parsedUrl;
  try {
    parsedUrl = new URL(trimmedUrl);
  } catch {
    return result(false, "URL 格式无效，无法解析");
  }

  // SSRF 保护：检查主机名
  if (!allowPrivateHosts) {
    const hostname = parsedUrl.hostname;

    // 检查是否为私有/内网地址
    if (isPrivateHost(hostname)) {
      return result(false, "不允许使用内网地址或私有 IP");
    }

    // 检查是否包含用户凭证（可能用于绕过）
    if (parsedUrl.username || parsedUrl.password) {
      return result(false, "URL 不能包含用户凭证");
    }

    // 检查端口（阻止常见的危险端口）
    const dangerousPorts = [22, 23, 25, 110, 143, 445, 3306, 5432, 6379, 27017];
    if (
      parsedUrl.port &&
      dangerousPorts.includes(parseInt(parsedUrl.port, 10))
    ) {
      return result(false, "URL 端口不被允许");
    }
  }

  // 基本格式验证
  if (!URL_PATTERN.test(trimmedUrl)) {
    // 放宽检查 - 只要能解析成功就可以
    // URL_PATTERN 可能过于严格，有些合法 URL 可能不匹配
    // 但至少确保协议正确
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return result(false, "URL 格式不正确");
    }
  }

  return result(true);
}

/**
 * 验证重定向类型
 * @param {number} redirectType - 重定向类型
 * @returns {ValidationResult}
 */
export function validateRedirectType(
  redirectType: number | string | undefined | null,
): ValidationResult {
  if (redirectType === undefined || redirectType === null) {
    return result(true); // 可选参数
  }

  const type = parseInt(String(redirectType), 10);

  if (Number.isNaN(type) || !VALID_REDIRECT_TYPES.includes(type)) {
    return result(
      false,
      `重定向类型必须是 ${VALID_REDIRECT_TYPES.join("、")} 之一`,
    );
  }

  return result(true);
}

/**
 * 验证最大点击次数
 * @param {number|string|null|undefined} maxClicks - 最大点击次数
 * @returns {ValidationResult}
 */
export function validateMaxClicks(
  maxClicks: number | string | null | undefined,
): ValidationResult {
  if (maxClicks === undefined || maxClicks === null || maxClicks === "") {
    return result(true); // 可选参数
  }

  const clicks = parseInt(String(maxClicks), 10);

  if (Number.isNaN(clicks) || clicks < 1) {
    return result(false, "最大点击次数必须是大于 0 的整数");
  }

  if (clicks > 1000000000) {
    return result(false, "最大点击次数不能超过 10 亿");
  }

  return result(true);
}

/**
 * 验证标题
 * @param {string} title - 标题
 * @returns {ValidationResult}
 */
export function validateTitle(
  title: string | undefined | null,
): ValidationResult {
  if (!title || typeof title !== "string") {
    return result(true); // 可选参数
  }

  if (title.length > VALIDATION_LIMITS.TITLE_MAX_LENGTH) {
    return result(
      false,
      `标题长度不能超过 ${VALIDATION_LIMITS.TITLE_MAX_LENGTH} 个字符`,
    );
  }

  return result(true);
}

/**
 * 验证描述
 * @param {string} description - 描述
 * @returns {ValidationResult}
 */
export function validateDescription(
  description: string | undefined | null,
): ValidationResult {
  if (!description || typeof description !== "string") {
    return result(true); // 可选参数
  }

  if (description.length > VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH) {
    return result(
      false,
      `描述长度不能超过 ${VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH} 个字符`,
    );
  }

  return result(true);
}

/**
 * 验证 IP 地址格式（支持 CIDR）
 * @param {string} ip - IP 地址
 * @returns {boolean}
 */
export function isValidIp(ip: string | undefined | null): boolean {
  if (!ip || typeof ip !== "string") {
    return false;
  }

  return IPV4_PATTERN.test(ip) || IPV6_PATTERN.test(ip);
}

/**
 * 验证 IP 列表
 * @param {Array} ipList - IP 地址列表
 * @returns {ValidationResult}
 */
export function validateIpList(
  ipList: string[] | undefined | null,
): ValidationResult {
  if (!ipList) {
    return result(true); // 可选参数
  }

  if (!Array.isArray(ipList)) {
    return result(false, "IP 列表必须是数组格式");
  }

  if (ipList.length > 100) {
    return result(false, "IP 列表最多包含 100 个地址");
  }

  for (const ip of ipList) {
    if (!isValidIp(ip)) {
      return result(false, `无效的 IP 地址格式: ${ip}`);
    }
  }

  return result(true);
}

/**
 * 验证设备类型列表
 * @param {Array} devices - 设备类型列表
 * @returns {ValidationResult}
 */
export function validateDeviceTypes(
  devices: string[] | undefined | null,
): ValidationResult {
  if (!devices) {
    return result(true); // 可选参数
  }

  if (!Array.isArray(devices)) {
    return result(false, "设备类型必须是数组格式");
  }

  for (const device of devices) {
    if (!VALID_DEVICE_TYPES.includes(device)) {
      return result(
        false,
        `无效的设备类型: ${device}，有效值为: ${VALID_DEVICE_TYPES.join(", ")}`,
      );
    }
  }

  return result(true);
}

/**
 * 验证访问限制配置
 * @param {Object} restrictions - 访问限制配置
 * @returns {ValidationResult}
 */
export function validateAccessRestrictions(
  restrictions: Record<string, unknown> | undefined | null,
): ValidationResult {
  if (!restrictions || typeof restrictions !== "object") {
    return result(true); // 可选参数
  }

  // 验证 IP 白名单
  if (restrictions.ip_whitelist) {
    const ipWhitelistResult = validateIpList(
      restrictions.ip_whitelist as string[],
    );
    if (!ipWhitelistResult.valid) {
      return result(false, `IP 白名单${ipWhitelistResult.error}`);
    }
  }

  // 验证 IP 黑名单
  if (restrictions.ip_blacklist) {
    const ipBlacklistResult = validateIpList(
      restrictions.ip_blacklist as string[],
    );
    if (!ipBlacklistResult.valid) {
      return result(false, `IP 黑名单${ipBlacklistResult.error}`);
    }
  }

  // 验证设备类型
  if (restrictions.allowed_devices) {
    const devicesResult = validateDeviceTypes(
      restrictions.allowed_devices as string[],
    );
    if (!devicesResult.valid) {
      return devicesResult;
    }
  }

  // 验证来源限制列表
  if (
    restrictions.allowed_referrers &&
    !Array.isArray(restrictions.allowed_referrers)
  ) {
    return result(false, "允许的来源必须是数组格式");
  }

  if (
    restrictions.blocked_referrers &&
    !Array.isArray(restrictions.blocked_referrers)
  ) {
    return result(false, "禁止的来源必须是数组格式");
  }

  // 验证国家/地区限制
  if (
    restrictions.allowed_countries &&
    !Array.isArray(restrictions.allowed_countries)
  ) {
    return result(false, "允许的国家/地区必须是数组格式");
  }

  if (
    restrictions.blocked_countries &&
    !Array.isArray(restrictions.blocked_countries)
  ) {
    return result(false, "禁止的国家/地区必须是数组格式");
  }

  return result(true);
}

/**
 * 验证邮箱格式
 * @param {string} email - 邮箱地址
 * @returns {ValidationResult}
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || typeof email !== "string") {
    return result(false, "邮箱是必填参数");
  }

  const trimmedEmail = email.trim();

  if (trimmedEmail.length > VALIDATION_LIMITS.EMAIL_MAX_LENGTH) {
    return result(
      false,
      `邮箱长度不能超过 ${VALIDATION_LIMITS.EMAIL_MAX_LENGTH} 个字符`,
    );
  }

  if (!EMAIL_PATTERN.test(trimmedEmail)) {
    return result(false, "邮箱格式不正确");
  }

  return result(true);
}

/**
 * 验证密码强度
 * @param {string} password - 密码
 * @returns {ValidationResult}
 */
export function validatePassword(password: string): ValidationResult {
  if (!password || typeof password !== "string") {
    return result(false, "密码是必填参数");
  }

  if (password.length < VALIDATION_LIMITS.PASSWORD_MIN_LENGTH) {
    return result(
      false,
      `密码长度不能少于 ${VALIDATION_LIMITS.PASSWORD_MIN_LENGTH} 个字符`,
    );
  }

  if (password.length > VALIDATION_LIMITS.PASSWORD_MAX_LENGTH) {
    return result(
      false,
      `密码长度不能超过 ${VALIDATION_LIMITS.PASSWORD_MAX_LENGTH} 个字符`,
    );
  }

  return result(true);
}

/**
 * 验证短链接哈希格式
 * @param {string} hash - 短链接哈希
 * @returns {ValidationResult}
 */
export function validateShortHash(hash: string): ValidationResult {
  if (!hash || typeof hash !== "string") {
    return result(false, "短链接哈希是必填参数");
  }

  if (hash.length > VALIDATION_LIMITS.SHORT_HASH_MAX_LENGTH) {
    return result(
      false,
      `短链接哈希长度不能超过 ${VALIDATION_LIMITS.SHORT_HASH_MAX_LENGTH} 个字符`,
    );
  }

  if (!HASH_PATTERN.test(hash)) {
    return result(false, "短链接哈希只能包含字母和数字");
  }

  return result(true);
}

/**
 * 验证批量操作的 ID 列表
 * @param {Array} ids - ID 列表
 * @returns {ValidationResult}
 */
export function validateBatchIds(
  ids: Array<number | string>,
): ValidationResult {
  if (!ids) {
    return result(false, "ID 列表是必填参数");
  }

  if (!Array.isArray(ids)) {
    return result(false, "ID 列表必须是数组格式");
  }

  if (ids.length === 0) {
    return result(false, "ID 列表不能为空");
  }

  if (ids.length > VALIDATION_LIMITS.BATCH_OPERATION_MAX_ITEMS) {
    return result(
      false,
      `批量操作最多支持 ${VALIDATION_LIMITS.BATCH_OPERATION_MAX_ITEMS} 个项目`,
    );
  }

  for (const id of ids) {
    if (typeof id !== "number" && typeof id !== "string") {
      return result(false, "ID 列表中的每个项目必须是数字或字符串");
    }
  }

  return result(true);
}

/**
 * 验证分页参数
 * @param {Object} params - 分页参数
 * @param {number|string} params.page - 页码
 * @param {number|string} params.pageSize - 每页数量
 * @returns {ValidationResult}
 */
export function validatePagination(
  params:
    | { page?: number | string; pageSize?: number | string }
    | undefined
    | null,
): ValidationResult {
  const { page, pageSize } = params || {};

  if (page !== undefined) {
    const pageNum = parseInt(String(page), 10);
    if (Number.isNaN(pageNum) || pageNum < 1) {
      return result(false, "页码必须是大于 0 的整数");
    }
  }

  if (pageSize !== undefined) {
    const size = parseInt(String(pageSize), 10);
    if (Number.isNaN(size) || size < 1) {
      return result(false, "每页数量必须是大于 0 的整数");
    }
    if (size > 100) {
      return result(false, "每页数量不能超过 100");
    }
  }

  return result(true);
}

/**
 * 验证布尔值
 * @param {unknown} value - 值
 * @param {string} fieldName - 字段名称
 * @returns {ValidationResult}
 */
export function validateBoolean(
  value: unknown,
  fieldName: string,
): ValidationResult {
  if (value === undefined || value === null) {
    return result(true); // 可选参数
  }

  if (typeof value !== "boolean") {
    return result(false, `${fieldName} 必须是布尔值`);
  }

  return result(true);
}

/**
 * 验证创建短链接的完整参数
 * @param {Object} params - 创建参数
 * @returns {ValidationResult}
 */
export function validateCreateLinkParams(params: {
  url: string;
  options?: Record<string, unknown>;
}): ValidationResult {
  const { url, options = {} } = params || {};

  // 验证 URL
  const urlResult = validateUrl(url);
  if (!urlResult.valid) {
    return urlResult;
  }

  // 验证标题
  const titleResult = validateTitle(options.title as string);
  if (!titleResult.valid) {
    return titleResult;
  }

  // 验证描述
  const descResult = validateDescription(options.description as string);
  if (!descResult.valid) {
    return descResult;
  }

  // 验证重定向类型
  const redirectResult = validateRedirectType(options.redirect_type as number);
  if (!redirectResult.valid) {
    return redirectResult;
  }

  // 验证最大点击次数
  const clicksResult = validateMaxClicks(options.max_clicks as number);
  if (!clicksResult.valid) {
    return clicksResult;
  }

  // 验证访问限制
  const restrictionsResult = validateAccessRestrictions(
    options.access_restrictions as Record<string, unknown>,
  );
  if (!restrictionsResult.valid) {
    return restrictionsResult;
  }

  return result(true);
}

/**
 * 验证更新短链接的参数
 * @param {Object} updates - 更新参数
 * @returns {ValidationResult}
 */
export function validateUpdateLinkParams(
  updates: Record<string, unknown>,
): ValidationResult {
  if (!updates || typeof updates !== "object") {
    return result(false, "更新参数不能为空");
  }

  // 验证标题
  if (updates.title !== undefined) {
    const titleResult = validateTitle(updates.title as string);
    if (!titleResult.valid) {
      return titleResult;
    }
  }

  // 验证描述
  if (updates.description !== undefined) {
    const descResult = validateDescription(updates.description as string);
    if (!descResult.valid) {
      return descResult;
    }
  }

  // 验证重定向类型
  if (updates.redirect_type !== undefined) {
    const redirectResult = validateRedirectType(
      updates.redirect_type as number,
    );
    if (!redirectResult.valid) {
      return redirectResult;
    }
  }

  // 验证最大点击次数
  if (updates.max_clicks !== undefined) {
    const clicksResult = validateMaxClicks(updates.max_clicks as number);
    if (!clicksResult.valid) {
      return clicksResult;
    }
  }

  // 验证访问限制
  if (updates.access_restrictions !== undefined) {
    const restrictionsResult = validateAccessRestrictions(
      updates.access_restrictions as Record<string, unknown>,
    );
    if (!restrictionsResult.valid) {
      return restrictionsResult;
    }
  }

  // 验证 is_active
  if (updates.is_active !== undefined) {
    const activeResult = validateBoolean(updates.is_active, "is_active");
    if (!activeResult.valid) {
      return activeResult;
    }
  }

  return result(true);
}

/**
 * 清理字符串（去除首尾空格和多余空白）
 * @param {string} str - 输入字符串
 * @returns {string}
 */
export function sanitizeString(str: string | undefined | null): string {
  if (!str || typeof str !== "string") {
    return "";
  }
  return str.trim().replace(/\s+/g, " ");
}

/**
 * 清理 URL（去除首尾空格）
 * @param {string} url - 输入 URL
 * @returns {string}
 */
export function sanitizeUrl(url: string | undefined | null): string {
  if (!url || typeof url !== "string") {
    return "";
  }
  return url.trim();
}

/**
 * 检查是否为私有/内网 IP（导出供其他模块使用）
 * @param {string} hostname - 主机名或 IP
 * @returns {boolean}
 */
export function isPrivateIp(hostname: string): boolean {
  return isPrivateHost(hostname);
}
