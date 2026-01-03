/**
 * API 服务模块
 * 所有请求都通过 Fastify 后端 API
 */

import type { ApiResponse } from "@/types";
import type {
	BatchDeleteLinksRequest,
	BatchOperationResponse,
	BatchToggleLinksRequest,
	DashboardLinksQuery,
	DashboardLinksResponse,
	DashboardStatsResponse,
	ExpirationOptionsResponse,
	LinkAccessLogsQuery,
	LinkAccessLogsResponse,
	LinkDetailResponse,
	ShortLinkResponse,
	ToggleLinkStatusRequest,
	UpdateLinkRequest,
	UserResponse,
} from "../../types/api";
import type { Link, LinkCreateOptions } from "../../types/shared";
import { ApiError, buildUrl, fetchApi } from "./request";

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

/**
 * 获取用户统计数据
 * @returns {Promise} - 返回统计数据
 */
export async function getDashboardStats(): Promise<ApiResponse<DashboardStatsResponse>> {
	return fetchApi<DashboardStatsResponse>("/api/dashboard/stats");
}

/**
 * 获取用户链接列表
 * @param {Object} options - 查询选项
 * @returns {Promise} - 返回链接列表
 */
export async function getDashboardLinks(
	options: DashboardLinksQuery = {},
): Promise<ApiResponse<DashboardLinksResponse>> {
	const {
		limit = 50,
		offset = 0,
		orderBy = "created_at",
		ascending = false,
		linkId = null,
		keyword = null,
	} = options;

	const url = buildUrl("/api/dashboard/links", {
		limit,
		offset,
		orderBy,
		ascending,
		linkId,
		keyword,
	});

	return fetchApi<DashboardLinksResponse>(url);
}

/**
 * 获取单个链接详情
 * @param {number} linkId - 链接 ID
 * @returns {Promise} - 返回链接详情
 */
export async function getLinkDetail(linkId: number): Promise<ApiResponse<LinkDetailResponse>> {
	return fetchApi<LinkDetailResponse>(`/api/dashboard/links/${linkId}`);
}

/**
 * 获取链接访问日志
 * @param {number} linkId - 链接 ID
 * @param {Object} options - 查询选项
 * @returns {Promise} - 返回访问日志
 */
export async function getLinkAccessLogs(
	linkId: number,
	options: LinkAccessLogsQuery = {},
): Promise<ApiResponse<LinkAccessLogsResponse>> {
	const { limit = 50, offset = 0 } = options;

	const url = buildUrl(`/api/dashboard/links/${linkId}/logs`, {
		limit,
		offset,
	});

	return fetchApi<LinkAccessLogsResponse>(url);
}

/**
 * 更新链接配置
 * @param {number} linkId - 链接 ID
 * @param {Object} updates - 更新数据
 * @returns {Promise} - 返回更新后的链接
 */
export async function updateLink(
	linkId: number,
	updates: UpdateLinkRequest,
): Promise<ApiResponse<Link>> {
	return fetchApi<Link>(`/api/dashboard/links/${linkId}`, {
		method: "PUT",
		body: updates,
	});
}

/**
 * 切换链接启用状态
 * @param {number} linkId - 链接 ID
 * @param {boolean} isActive - 是否启用
 * @returns {Promise} - 返回更新结果
 */
export async function toggleLinkStatus(
	linkId: number,
	isActive: boolean,
): Promise<ApiResponse<Link>> {
	return fetchApi<Link>(`/api/dashboard/links/${linkId}/status`, {
		method: "PATCH",
		body: { is_active: isActive } as ToggleLinkStatusRequest,
	});
}

/**
 * 删除链接
 * @param {number} linkId - 链接 ID
 * @returns {Promise}
 */
export async function deleteLink(linkId: number): Promise<ApiResponse<void>> {
	return fetchApi<void>(`/api/dashboard/links/${linkId}`, {
		method: "DELETE",
	});
}

/**
 * 批量删除链接
 * @param {Array<number>} linkIds - 链接 ID 数组
 * @returns {Promise} - 返回删除结果
 */
export async function batchDeleteLinks(
	linkIds: number[],
): Promise<ApiResponse<BatchOperationResponse>> {
	return fetchApi<BatchOperationResponse>("/api/dashboard/links/batch-delete", {
		method: "POST",
		body: { linkIds } as BatchDeleteLinksRequest,
	});
}

/**
 * 批量切换链接状态
 * @param {Array<number>} linkIds - 链接 ID 数组
 * @param {boolean} isActive - 是否启用
 * @returns {Promise} - 返回操作结果
 */
export async function batchToggleLinks(
	linkIds: number[],
	isActive: boolean,
): Promise<ApiResponse<BatchOperationResponse>> {
	return fetchApi<BatchOperationResponse>("/api/dashboard/links/batch-status", {
		method: "POST",
		body: { linkIds, is_active: isActive } as BatchToggleLinksRequest,
	});
}

/**
 * 更新链接密码
 * @param {number} linkId - 链接 ID
 * @param {string|null} password - 新密码，null 表示删除密码
 * @returns {Promise} - 返回操作结果
 */
export async function updateLinkPassword(
	linkId: number,
	password: string | null,
): Promise<ApiResponse<Link>> {
	return fetchApi<Link>(`/api/dashboard/links/${linkId}`, {
		method: "PUT",
		body: { password } as UpdateLinkRequest,
	});
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
export const ACCESS_RESTRICTIONS_TEMPLATE = {
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
