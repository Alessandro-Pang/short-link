/*
 * @Author: zi.yang
 * @Date: 2025-12-29 00:00:00
 * @LastEditors: zi.yang
 * @LastEditTime: 2026-01-02 00:00:00
 * @Description: 安全工具函数模块
 * @FilePath: /short-link/api/utils/security
 */
import { createHash, randomBytes } from "node:crypto";

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
	const controlCharsRegex = /[\u0000-\u001F\u007F]/g;
	const zeroWidthRegex = /[\u200B-\u200D\uFEFF]/g;
	return input.replace(controlCharsRegex, "").replace(zeroWidthRegex, "").trim();
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
 * MD5 加密密码
 * @param {string} password - 原始密码
 * @returns {string} MD5 哈希值
 */
export function hashPassword(password: string): string {
	if (!password || typeof password !== "string") {
		throw new Error("密码不能为空");
	}
	return createHash("md5").update(password).digest("hex");
}

/**
 * 验证密码
 * @param {string} password - 原始密码
 * @param {string} hash - MD5 哈希值
 * @returns {boolean} 是否匹配
 */
export function verifyPassword(password: string, hash: string): boolean {
	if (!password || !hash) {
		return false;
	}
	return hashPassword(password) === hash;
}
