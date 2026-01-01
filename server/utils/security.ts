/*
 * @Author: zi.yang
 * @Date: 2025-12-29 00:00:00
 * @LastEditors: zi.yang
 * @LastEditTime: 2025-12-29 00:00:00
 * @Description: 安全工具函数模块
 * @FilePath: /short-link/api/utils/security
 */
import { randomBytes } from "node:crypto";

/**
 * HTML 实体转义映射表
 */
const HTML_ENTITIES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "`": "&#x60;",
  "=": "&#x3D;",
};

/**
 * HTML 转义 - 防止 XSS 攻击
 * @param {string} str - 要转义的字符串
 * @returns {string} 转义后的字符串
 */
export function escapeHtml(str) {
  if (typeof str !== "string") {
    return "";
  }
  return str.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char]);
}

/**
 * 安全的短链接哈希字符集
 * 排除容易混淆的字符：0/O, 1/l/I
 */
const HASH_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

/**
 * 生成安全的随机短链接哈希
 * 使用密码学安全的随机数生成器
 * @param {number} length - 哈希长度，默认 6
 * @returns {string} 随机哈希字符串
 */
export function generateSecureHash(length = 6) {
  if (length < 4 || length > 16) {
    throw new Error("Hash length must be between 4 and 16");
  }

  const bytes = randomBytes(length);
  let result = "";

  for (let i = 0; i < length; i++) {
    result += HASH_CHARSET[bytes[i] % HASH_CHARSET.length];
  }

  return result;
}

/**
 * 最大重试次数常量
 */
export const MAX_HASH_RETRIES = 10;

/**
 * 验证哈希是否符合格式要求
 * @param {string} hash - 要验证的哈希
 * @returns {boolean}
 */
export function isValidHash(hash) {
  if (typeof hash !== "string" || hash.length < 4 || hash.length > 16) {
    return false;
  }
  // 只允许字母数字
  return /^[A-Za-z0-9]+$/.test(hash);
}

/**
 * 清理用户输入，移除潜在的危险字符
 * @param {string} input - 用户输入
 * @returns {string} 清理后的字符串
 */
export function sanitizeInput(input) {
  if (typeof input !== "string") {
    return "";
  }
  // 移除控制字符和零宽字符
  // 使用 Unicode 转义避免字面量控制字符
  const controlCharsRegex = new RegExp("[\\u0000-\\u001F\\u007F]", "g");
  const zeroWidthRegex = new RegExp("[\\u200B-\\u200D\\uFEFF]", "g");
  return input
    .replace(controlCharsRegex, "")
    .replace(zeroWidthRegex, "")
    .trim();
}

/**
 * 检测潜在的 SQL 注入模式
 * @param {string} input - 用户输入
 * @returns {boolean} 是否包含可疑模式
 */
export function hasSqlInjectionPattern(input) {
  if (typeof input !== "string") {
    return false;
  }

  const patterns = [
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/i,
    /(--|#|\/\*)/,
    /(\bor\b|\band\b)\s*(\d+\s*=\s*\d+|'[^']*'\s*=\s*'[^']*')/i,
  ];

  return patterns.some((pattern) => pattern.test(input));
}

/**
 * 生成错误页面 HTML（已转义）
 * @param {string} title - 页面标题
 * @param {string} message - 错误消息
 * @param {string} homeUrl - 首页链接
 * @returns {string} 安全的 HTML 字符串
 */
export function generateErrorPageHtml(
  title = "链接无效",
  message = "短链接不存在",
  homeUrl = "/",
) {
  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message);
  const safeHomeUrl = escapeHtml(homeUrl);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${safeTitle}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f5f5f5; }
    .container { text-align: center; padding: 40px; background: white; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 400px; }
    h1 { color: #e74c3c; margin-bottom: 16px; }
    p { color: #666; margin-bottom: 24px; }
    a { color: #3498db; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <h1>😕 ${safeTitle}</h1>
    <p>${safeMessage}</p>
    <a href="${safeHomeUrl}">返回首页</a>
  </div>
</body>
</html>`;
}
