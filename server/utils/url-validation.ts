/*
 * @Author: zi.yang
 * @Date: 2025-12-29 00:00:00
 * @LastEditors: zi.yang
 * @LastEditTime: 2025-12-29 00:00:00
 * @Description: URL 安全验证模块 - SSRF 防护、协议检查、私有 IP 检测
 * @FilePath: /short-link/api/utils/url-validation
 */

import type { UrlValidationOptions } from "../types/index.js";
import { VALIDATION_LIMITS, result } from "./validation-types.js";
import type { ValidationResult } from "./validation-types.js";

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
const MINIPROGRAM_PATTERN = /^#小程序:\/\/[a-zA-Z0-9_-]+(?:\/[^\s<>"{}|\\^`[\]]*)?$/;

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
		return result(false, `URL 长度不能少于 ${VALIDATION_LIMITS.URL_MIN_LENGTH} 个字符`);
	}

	if (trimmedUrl.length > VALIDATION_LIMITS.URL_MAX_LENGTH) {
		return result(false, `URL 长度不能超过 ${VALIDATION_LIMITS.URL_MAX_LENGTH} 个字符`);
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
	let parsedUrl: URL;
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
		if (parsedUrl.port && dangerousPorts.includes(parseInt(parsedUrl.port, 10))) {
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
