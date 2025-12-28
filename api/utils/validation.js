/*
 * @Author: zi.yang
 * @Date: 2025-01-01 00:00:00
 * @LastEditors: zi.yang
 * @LastEditTime: 2025-01-01 00:00:00
 * @Description: 输入验证模块 - 统一的验证逻辑
 * @FilePath: /short-link/api/utils/validation.js
 */

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
 * URL 格式正则表达式
 * 支持 http://, https://, #小程序://
 */
const URL_PATTERN = /^(https?:\/\/|#小程序:\/\/)[^\s<>"{}|\\^`[\]]+$/;

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
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - 是否验证通过
 * @property {string|null} error - 错误消息
 */

/**
 * 创建验证结果
 * @param {boolean} valid
 * @param {string|null} error
 * @returns {ValidationResult}
 */
function result(valid, error = null) {
  return { valid, error };
}

/**
 * 验证 URL 格式和长度
 * @param {string} url - 要验证的 URL
 * @returns {ValidationResult}
 */
export function validateUrl(url) {
  if (!url || typeof url !== "string") {
    return result(false, "URL 是必填参数");
  }

  const trimmedUrl = url.trim();

  if (trimmedUrl.length < VALIDATION_LIMITS.URL_MIN_LENGTH) {
    return result(false, `URL 长度不能少于 ${VALIDATION_LIMITS.URL_MIN_LENGTH} 个字符`);
  }

  if (trimmedUrl.length > VALIDATION_LIMITS.URL_MAX_LENGTH) {
    return result(false, `URL 长度不能超过 ${VALIDATION_LIMITS.URL_MAX_LENGTH} 个字符`);
  }

  if (!URL_PATTERN.test(trimmedUrl)) {
    return result(false, "URL 格式不正确，必须以 http://、https:// 或 #小程序:// 开头");
  }

  // 尝试解析 URL（跳过小程序链接）
  if (!trimmedUrl.startsWith("#小程序://")) {
    try {
      new URL(trimmedUrl);
    } catch {
      return result(false, "URL 格式无效，无法解析");
    }
  }

  return result(true);
}

/**
 * 验证重定向类型
 * @param {number} redirectType - 重定向类型
 * @returns {ValidationResult}
 */
export function validateRedirectType(redirectType) {
  if (redirectType === undefined || redirectType === null) {
    return result(true); // 可选参数
  }

  const type = parseInt(redirectType, 10);

  if (isNaN(type) || !VALID_REDIRECT_TYPES.includes(type)) {
    return result(false, `重定向类型必须是 ${VALID_REDIRECT_TYPES.join("、")} 之一`);
  }

  return result(true);
}

/**
 * 验证最大点击次数
 * @param {number|string|null|undefined} maxClicks - 最大点击次数
 * @returns {ValidationResult}
 */
export function validateMaxClicks(maxClicks) {
  if (maxClicks === undefined || maxClicks === null || maxClicks === "") {
    return result(true); // 可选参数
  }

  const clicks = parseInt(maxClicks, 10);

  if (isNaN(clicks) || clicks < 1) {
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
export function validateTitle(title) {
  if (!title || typeof title !== "string") {
    return result(true); // 可选参数
  }

  if (title.length > VALIDATION_LIMITS.TITLE_MAX_LENGTH) {
    return result(false, `标题长度不能超过 ${VALIDATION_LIMITS.TITLE_MAX_LENGTH} 个字符`);
  }

  return result(true);
}

/**
 * 验证描述
 * @param {string} description - 描述
 * @returns {ValidationResult}
 */
export function validateDescription(description) {
  if (!description || typeof description !== "string") {
    return result(true); // 可选参数
  }

  if (description.length > VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH) {
    return result(false, `描述长度不能超过 ${VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH} 个字符`);
  }

  return result(true);
}

/**
 * 验证 IP 地址格式（支持 CIDR）
 * @param {string} ip - IP 地址
 * @returns {boolean}
 */
export function isValidIp(ip) {
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
export function validateIpList(ipList) {
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
export function validateDeviceTypes(devices) {
  if (!devices) {
    return result(true); // 可选参数
  }

  if (!Array.isArray(devices)) {
    return result(false, "设备类型必须是数组格式");
  }

  for (const device of devices) {
    if (!VALID_DEVICE_TYPES.includes(device)) {
      return result(false, `无效的设备类型: ${device}，有效值为: ${VALID_DEVICE_TYPES.join(", ")}`);
    }
  }

  return result(true);
}

/**
 * 验证访问限制配置
 * @param {Object} restrictions - 访问限制配置
 * @returns {ValidationResult}
 */
export function validateAccessRestrictions(restrictions) {
  if (!restrictions || typeof restrictions !== "object") {
    return result(true); // 可选参数
  }

  // 验证 IP 白名单
  if (restrictions.ip_whitelist) {
    const ipWhitelistResult = validateIpList(restrictions.ip_whitelist);
    if (!ipWhitelistResult.valid) {
      return result(false, `IP 白名单${ipWhitelistResult.error}`);
    }
  }

  // 验证 IP 黑名单
  if (restrictions.ip_blacklist) {
    const ipBlacklistResult = validateIpList(restrictions.ip_blacklist);
    if (!ipBlacklistResult.valid) {
      return result(false, `IP 黑名单${ipBlacklistResult.error}`);
    }
  }

  // 验证设备类型
  if (restrictions.allowed_devices) {
    const devicesResult = validateDeviceTypes(restrictions.allowed_devices);
    if (!devicesResult.valid) {
      return devicesResult;
    }
  }

  // 验证来源限制列表
  if (restrictions.allowed_referrers && !Array.isArray(restrictions.allowed_referrers)) {
    return result(false, "允许的来源必须是数组格式");
  }

  if (restrictions.blocked_referrers && !Array.isArray(restrictions.blocked_referrers)) {
    return result(false, "禁止的来源必须是数组格式");
  }

  // 验证国家/地区限制
  if (restrictions.allowed_countries && !Array.isArray(restrictions.allowed_countries)) {
    return result(false, "允许的国家/地区必须是数组格式");
  }

  if (restrictions.blocked_countries && !Array.isArray(restrictions.blocked_countries)) {
    return result(false, "禁止的国家/地区必须是数组格式");
  }

  return result(true);
}

/**
 * 验证邮箱格式
 * @param {string} email - 邮箱地址
 * @returns {ValidationResult}
 */
export function validateEmail(email) {
  if (!email || typeof email !== "string") {
    return result(false, "邮箱是必填参数");
  }

  const trimmedEmail = email.trim();

  if (trimmedEmail.length > VALIDATION_LIMITS.EMAIL_MAX_LENGTH) {
    return result(false, `邮箱长度不能超过 ${VALIDATION_LIMITS.EMAIL_MAX_LENGTH} 个字符`);
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
export function validatePassword(password) {
  if (!password || typeof password !== "string") {
    return result(false, "密码是必填参数");
  }

  if (password.length < VALIDATION_LIMITS.PASSWORD_MIN_LENGTH) {
    return result(false, `密码长度不能少于 ${VALIDATION_LIMITS.PASSWORD_MIN_LENGTH} 个字符`);
  }

  if (password.length > VALIDATION_LIMITS.PASSWORD_MAX_LENGTH) {
    return result(false, `密码长度不能超过 ${VALIDATION_LIMITS.PASSWORD_MAX_LENGTH} 个字符`);
  }

  return result(true);
}

/**
 * 验证短链接哈希格式
 * @param {string} hash - 短链接哈希
 * @returns {ValidationResult}
 */
export function validateShortHash(hash) {
  if (!hash || typeof hash !== "string") {
    return result(false, "短链接哈希是必填参数");
  }

  if (hash.length > VALIDATION_LIMITS.SHORT_HASH_MAX_LENGTH) {
    return result(false, `短链接哈希长度不能超过 ${VALIDATION_LIMITS.SHORT_HASH_MAX_LENGTH} 个字符`);
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
export function validateBatchIds(ids) {
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
    return result(false, `批量操作最多支持 ${VALIDATION_LIMITS.BATCH_OPERATION_MAX_ITEMS} 个项目`);
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
export function validatePagination(params) {
  const { page, pageSize } = params || {};

  if (page !== undefined) {
    const pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1) {
      return result(false, "页码必须是大于 0 的整数");
    }
  }

  if (pageSize !== undefined) {
    const size = parseInt(pageSize, 10);
    if (isNaN(size) || size < 1) {
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
 * @param {any} value - 值
 * @param {string} fieldName - 字段名称
 * @returns {ValidationResult}
 */
export function validateBoolean(value, fieldName) {
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
export function validateCreateLinkParams(params) {
  const { url, options = {} } = params || {};

  // 验证 URL
  const urlResult = validateUrl(url);
  if (!urlResult.valid) {
    return urlResult;
  }

  // 验证标题
  const titleResult = validateTitle(options.title);
  if (!titleResult.valid) {
    return titleResult;
  }

  // 验证描述
  const descResult = validateDescription(options.description);
  if (!descResult.valid) {
    return descResult;
  }

  // 验证重定向类型
  const redirectResult = validateRedirectType(options.redirect_type);
  if (!redirectResult.valid) {
    return redirectResult;
  }

  // 验证最大点击次数
  const clicksResult = validateMaxClicks(options.max_clicks);
  if (!clicksResult.valid) {
    return clicksResult;
  }

  // 验证访问限制
  const restrictionsResult = validateAccessRestrictions(options.access_restrictions);
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
export function validateUpdateLinkParams(updates) {
  if (!updates || typeof updates !== "object") {
    return result(false, "更新参数不能为空");
  }

  // 验证标题
  if (updates.title !== undefined) {
    const titleResult = validateTitle(updates.title);
    if (!titleResult.valid) {
      return titleResult;
    }
  }

  // 验证描述
  if (updates.description !== undefined) {
    const descResult = validateDescription(updates.description);
    if (!descResult.valid) {
      return descResult;
    }
  }

  // 验证重定向类型
  if (updates.redirect_type !== undefined) {
    const redirectResult = validateRedirectType(updates.redirect_type);
    if (!redirectResult.valid) {
      return redirectResult;
    }
  }

  // 验证最大点击次数
  if (updates.max_clicks !== undefined) {
    const clicksResult = validateMaxClicks(updates.max_clicks);
    if (!clicksResult.valid) {
      return clicksResult;
    }
  }

  // 验证访问限制
  if (updates.access_restrictions !== undefined) {
    const restrictionsResult = validateAccessRestrictions(updates.access_restrictions);
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
export function sanitizeString(str) {
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
export function sanitizeUrl(url) {
  if (!url || typeof url !== "string") {
    return "";
  }
  return url.trim();
}
