/**
 * API 服务模块
 * 所有请求都通过 Fastify 后端 API
 */

import type { ApiResponse } from "@/types";
import type {
	BatchOperationResponse,
	DashboardLinksQuery,
	DashboardLinksResponse,
	DashboardStatsResponse,
	ExpirationOptionsResponse,
	LinkAccessLogsQuery,
	LinkAccessLogsResponse,
	LinkDetailResponse,
	ShortLinkResponse,
	UpdateLinkRequest,
	UserResponse,
} from "../../types/api";
import type { AccessRestrictions, Link, LinkCreateOptions } from "../../types/shared";
import { dashboardLinkApi } from "./link-api";
import { ApiError, fetchApi } from "./request";

// 导出 ApiError 供外部使用
export { ApiError };

/**
 * 获取过期时间选项
 * @returns {Promise} - 返回过期时间选项列表
 */
export async function getExpirationOptions(): Promise<ApiResponse<ExpirationOptionsResponse>> {
	return fetchApi<ExpirationOptionsResponse>("/api/expiration-options", {
		auth: false,
	});
}

/**
 * 添加 URL 生成短链接（支持高级配置）
 * @param {string} url - 要缩短的 URL
 * @param {Object} options - 高级配置选项
 * @returns {Promise} - 返回包含短链接的 Promise
 */
export async function addUrl(
	url: string,
	options: LinkCreateOptions = {},
): Promise<ApiResponse<ShortLinkResponse>> {
	return fetchApi<ShortLinkResponse>("/api/addUrl", {
		method: "POST",
		body: { url, options },
	});
}

/**
 * 获取 URL 信息
 * @param {string} shortCode - 短链接代码
 * @returns {Promise} - 返回包含原始 URL 的 Promise
 */
export async function getUrl(shortCode: string): Promise<ApiResponse<Link>> {
	return fetchApi<Link>(`/api/getUrl/${shortCode}`);
}

export async function verifyLinkPassword(
	shortCode: string,
	password: string,
): Promise<ApiResponse<{ url: string }>> {
	return fetchApi<{ url: string }>(`/api/verify-password/${shortCode}`, {
		method: "POST",
		body: { password },
		auth: false,
	});
}

/**
 * 获取用户统计数据
 * @returns {Promise} - 返回统计数据
 */
export async function getDashboardStats(): Promise<ApiResponse<DashboardStatsResponse>> {
	return fetchApi<DashboardStatsResponse>("/api/dashboard/stats");
}

/**
 * 获取用户链接列表
 */
export async function getDashboardLinks(
	options: DashboardLinksQuery = {},
): Promise<ApiResponse<DashboardLinksResponse>> {
	return dashboardLinkApi.getLinks(options);
}

/**
 * 获取单个链接详情
 */
export async function getLinkDetail(linkId: number): Promise<ApiResponse<LinkDetailResponse>> {
	return dashboardLinkApi.getLinkDetail(linkId) as Promise<ApiResponse<LinkDetailResponse>>;
}

/**
 * 获取链接访问日志
 */
export async function getLinkAccessLogs(
	linkId: number,
	options: LinkAccessLogsQuery = {},
): Promise<ApiResponse<LinkAccessLogsResponse>> {
	return dashboardLinkApi.getLinkAccessLogs(linkId, options);
}

/**
 * 更新链接配置
 */
export async function updateLink(
	linkId: number,
	updates: UpdateLinkRequest,
): Promise<ApiResponse<Link>> {
	return dashboardLinkApi.updateLink(linkId, updates as Record<string, unknown>);
}

/**
 * 切换链接启用状态
 */
export async function toggleLinkStatus(
	linkId: number,
	isActive: boolean,
): Promise<ApiResponse<Link>> {
	return dashboardLinkApi.toggleLinkStatus(linkId, isActive);
}

/**
 * 删除链接
 */
export async function deleteLink(linkId: number): Promise<ApiResponse<void>> {
	return dashboardLinkApi.deleteLink(linkId);
}

/**
 * 批量删除链接
 */
export async function batchDeleteLinks(
	linkIds: number[],
): Promise<ApiResponse<BatchOperationResponse>> {
	return dashboardLinkApi.batchDeleteLinks(linkIds) as Promise<ApiResponse<BatchOperationResponse>>;
}

/**
 * 批量切换链接状态
 */
export async function batchToggleLinks(
	linkIds: number[],
	isActive: boolean,
): Promise<ApiResponse<BatchOperationResponse>> {
	return dashboardLinkApi.batchToggleLinks(linkIds, isActive) as Promise<
		ApiResponse<BatchOperationResponse>
	>;
}

/**
 * 更新链接密码
 */
export async function updateLinkPassword(
	linkId: number,
	password: string | null,
): Promise<ApiResponse<Link>> {
	return dashboardLinkApi.updateLinkPassword(linkId, password);
}

/**
 * 验证当前用户
 * @returns {Promise} - 返回用户信息
 */
export async function verifyUser(): Promise<ApiResponse<UserResponse>> {
	return fetchApi<UserResponse>("/api/dashboard/user");
}

/**
 * 访问限制配置模板
 */
export const ACCESS_RESTRICTIONS_TEMPLATE: Required<AccessRestrictions> = {
	// IP 白名单（只允许这些 IP 访问）
	ip_whitelist: [],
	// IP 黑名单（禁止这些 IP 访问）
	ip_blacklist: [],
	// 允许的国家/地区代码
	allowed_countries: [],
	// 禁止的国家/地区代码
	blocked_countries: [],
	// 允许的设备类型: mobile, tablet, desktop
	allowed_devices: [],
	// 允许的来源域名
	allowed_referrers: [],
	// 禁止的来源域名
	blocked_referrers: [],
};

/**
 * 重定向类型选项
 */
export const REDIRECT_TYPE_OPTIONS = [
	{
		value: 301,
		label: "301 永久重定向",
		description: "告诉搜索引擎此页面已永久移动",
	},
	{ value: 302, label: "302 临时重定向", description: "临时重定向，默认选项" },
	{
		value: 307,
		label: "307 临时重定向",
		description: "保持请求方法不变的临时重定向",
	},
	{
		value: 308,
		label: "308 永久重定向",
		description: "保持请求方法不变的永久重定向",
	},
];

/**
 * 设备类型选项
 */
export const DEVICE_TYPE_OPTIONS = [
	{ value: "mobile", label: "手机" },
	{ value: "tablet", label: "平板" },
	{ value: "desktop", label: "桌面设备" },
];
