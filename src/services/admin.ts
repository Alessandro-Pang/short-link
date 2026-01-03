/**
 * 管理员 API 服务模块
 * 所有管理员专用接口
 */

import type { ApiResponse, LinkDetailResponse } from "../../types/api";
import type { Link, LinkAccessLog, LoginLog, UserProfile } from "../../types/shared";
import { ApiError, buildUrl, fetchApi } from "./request";

// 导出 ApiError 供外部使用
export { ApiError };

// Admin API 查询选项类型
interface AdminLinksQuery {
	limit?: number;
	offset?: number;
	orderBy?: string;
	ascending?: boolean;
	linkId?: number | null;
	keyword?: string | null;
	userId?: string | null;
}

interface AccessLogsQuery {
	limit?: number;
	offset?: number;
}

interface AllLoginLogsQuery {
	limit?: number;
	offset?: number;
	userId?: string | null;
	success?: boolean | null;
	startDate?: string | null;
	endDate?: string | null;
}

interface UsersQuery {
	page?: number;
	perPage?: number;
}

interface AdminAccessLogsQuery {
	limit?: number;
	offset?: number;
	linkId?: number | null;
	startDate?: string | null;
	endDate?: string | null;
}

// Admin API 响应类型
interface GlobalStatsResponse {
	total_links: number;
	total_users: number;
	total_clicks: number;
	active_links: number;
	clicks_today: number;
	[key: string]: unknown;
}

interface AllLinksResponse {
	links: Link[];
	total: number;
}

interface LinkAccessLogsResponse {
	logs: LinkAccessLog[];
	total: number;
}

interface AllUsersResponse {
	users: UserProfile[];
	total: number;
}

interface LoginLogsResponse {
	logs: LoginLog[];
	total: number;
}

interface LoginStatsResponse {
	total: number;
	success: number;
	failed: number;
	[key: string]: unknown;
}

interface UserInfoResponse {
	id: string;
	email: string;
	isAdmin: boolean;
	[key: string]: unknown;
}

interface BatchOperationResponse {
	success: boolean;
	updated: number;
	failed: number;
}

interface TopLinksResponse {
	links: Array<Link & { click_count: number }>;
}

/**
 * 获取全局统计数据（管理员专用）
 * @returns {Promise} - 返回全局统计数据
 */
export async function getGlobalStats(): Promise<GlobalStatsResponse | undefined> {
	const response = await fetchApi<GlobalStatsResponse>("/api/admin/stats");
	return response.data;
}

/**
 * 获取所有链接列表（管理员专用）
 * @param {Object} options - 查询选项
 * @returns {Promise} - 返回链接列表
 */
export async function getAllLinks(
	options: AdminLinksQuery = {},
): Promise<AllLinksResponse | undefined> {
	const {
		limit = 50,
		offset = 0,
		orderBy = "created_at",
		ascending = false,
		linkId = null,
		keyword = null,
		userId = null,
	} = options;

	const url = buildUrl("/api/admin/links", {
		limit,
		offset,
		orderBy,
		ascending,
		linkId,
		keyword,
		userId,
	});

	const response = await fetchApi<AllLinksResponse>(url);
	return response.data;
}

/**
 * 获取单个链接详情（管理员专用）
 * @param {number} linkId - 链接 ID
 * @returns {Promise} - 返回链接详情
 */
export async function getLinkDetail(linkId: number): Promise<ApiResponse<LinkDetailResponse>> {
	return fetchApi<LinkDetailResponse>(`/api/admin/links/${linkId}`);
}

/**
 * 获取链接访问日志（管理员专用）
 * @param {number} linkId - 链接 ID
 * @param {Object} options - 查询选项
 * @returns {Promise} - 返回访问日志
 */
export async function getLinkAccessLogs(
	linkId: number,
	options: AccessLogsQuery = {},
): Promise<LinkAccessLogsResponse | undefined> {
	const { limit = 50, offset = 0 } = options;

	const url = buildUrl(`/api/admin/links/${linkId}/access-logs`, {
		limit,
		offset,
	});

	const response = await fetchApi<LinkAccessLogsResponse>(url);
	return response.data;
}

/**
 * 更新链接配置（管理员专用）
 * @param {number} linkId - 链接 ID
 * @param {Object} updates - 更新数据
 * @returns {Promise} - 返回更新后的链接
 */
export async function updateLink(
	linkId: number,
	updates: Record<string, unknown>,
): Promise<ApiResponse<Link>> {
	return fetchApi<Link>(`/api/admin/links/${linkId}`, {
		method: "PUT",
		body: updates,
	});
}

/**
 * 切换链接启用状态（管理员专用）
 * @param {number} linkId - 链接 ID
 * @param {boolean} isActive - 是否启用
 * @returns {Promise} - 返回更新结果
 */
export async function toggleLinkStatus(
	linkId: number,
	isActive: boolean,
): Promise<ApiResponse<Link>> {
	return fetchApi<Link>(`/api/admin/links/${linkId}/status`, {
		method: "PATCH",
		body: { is_active: isActive },
	});
}

/**
 * 删除链接（管理员专用）
 * @param {number} linkId - 链接 ID
 * @returns {Promise}
 */
export async function deleteLink(linkId: number): Promise<ApiResponse<void>> {
	return fetchApi<void>(`/api/admin/links/${linkId}`, {
		method: "DELETE",
	});
}

/**
 * 批量删除链接（管理员专用）
 * @param {Array<number>} linkIds - 链接 ID 数组
 * @returns {Promise} - 返回删除结果
 */
export async function batchDeleteLinks(
	linkIds: number[],
): Promise<ApiResponse<BatchOperationResponse>> {
	return fetchApi<BatchOperationResponse>("/api/admin/links/batch-delete", {
		method: "POST",
		body: { linkIds },
	});
}

/**
 * 批量切换链接状态（管理员专用）
 * @param {Array<number>} linkIds - 链接 ID 数组
 * @param {boolean} isActive - 是否启用
 * @returns {Promise} - 返回操作结果
 */
export async function batchToggleLinks(
	linkIds: number[],
	isActive: boolean,
): Promise<ApiResponse<BatchOperationResponse>> {
	return fetchApi<BatchOperationResponse>("/api/admin/links/batch-status", {
		method: "POST",
		body: { linkIds, is_active: isActive },
	});
}

/**
 * 更新链接密码（管理员专用）
 * @param {number} linkId - 链接 ID
 * @param {string|null} password - 新密码，null 表示删除密码
 * @returns {Promise} - 返回操作结果
 */
export async function updateLinkPassword(
	linkId: number,
	password: string | null,
): Promise<ApiResponse<Link>> {
	return fetchApi<Link>(`/api/admin/links/${linkId}`, {
		method: "PUT",
		body: { password },
	});
}

/**
 * 获取所有用户列表（管理员专用）
 * @param {Object} options - 查询选项
 * @returns {Promise} - 返回用户列表
 */
export async function getAllUsers(options: UsersQuery = {}): Promise<AllUsersResponse | undefined> {
	const { page = 1, perPage = 50 } = options;

	const url = buildUrl("/api/admin/users", {
		page,
		perPage,
	});

	const response = await fetchApi<AllUsersResponse>(url);
	return response.data;
}

/**
 * 获取用户详细信息（管理员专用）
 * @param {string} userId - 用户 ID
 * @returns {Promise} - 返回用户详情
 */
export async function getUserDetails(userId: string): Promise<UserProfile | undefined> {
	const response = await fetchApi<UserProfile>(`/api/admin/users/${userId}`);
	return response.data;
}

/**
 * 创建新用户（管理员专用）
 * @param {Object} userData - 用户数据
 * @returns {Promise} - 返回创建结果
 */
export async function createUser(
	userData: Record<string, unknown>,
): Promise<ApiResponse<UserProfile>> {
	return fetchApi<UserProfile>("/api/admin/users", {
		method: "POST",
		body: userData,
	});
}

/**
 * 更新用户信息（管理员专用）
 * @param {string} userId - 用户 ID
 * @param {Object} updates - 更新数据
 * @returns {Promise} - 返回更新结果
 */
export async function updateUser(
	userId: string,
	updates: Record<string, unknown>,
): Promise<ApiResponse<UserProfile>> {
	return fetchApi<UserProfile>(`/api/admin/users/${userId}`, {
		method: "PUT",
		body: updates,
	});
}

/**
 * 删除用户（管理员专用）
 * @param {string} userId - 用户 ID
 * @returns {Promise}
 */
export async function deleteUser(userId: string): Promise<ApiResponse<void>> {
	return fetchApi<void>(`/api/admin/users/${userId}`, {
		method: "DELETE",
	});
}

/**
 * 重置用户密码（管理员专用）
 * @param {string} userId - 用户 ID
 * @param {string} password - 新密码
 * @returns {Promise}
 */
export async function resetUserPassword(
	userId: string,
	password: string,
): Promise<ApiResponse<void>> {
	return fetchApi<void>(`/api/admin/users/${userId}/reset-password`, {
		method: "POST",
		body: { password },
	});
}

/**
 * 启用/禁用用户（管理员专用）
 * @param {string} userId - 用户 ID
 * @param {boolean} banned - 是否禁用
 * @returns {Promise}
 */
export async function toggleUserStatus(
	userId: string,
	banned: boolean,
): Promise<ApiResponse<void>> {
	return fetchApi<void>(`/api/admin/users/${userId}/ban-status`, {
		method: "PATCH",
		body: { banned },
	});
}

/**
 * 获取所有登录日志（管理员专用）
 * @param {Object} options - 查询选项
 * @returns {Promise} - 返回登录日志列表
 */
export async function getAllLoginLogs(
	options: AllLoginLogsQuery = {},
): Promise<LoginLogsResponse | undefined> {
	const {
		limit = 50,
		offset = 0,
		userId = null,
		success = null,
		startDate = null,
		endDate = null,
	} = options;

	const url = buildUrl("/api/admin/logs/login", {
		limit,
		offset,
		userId,
		success,
		startDate,
		endDate,
	});

	const response = await fetchApi<LoginLogsResponse>(url);
	return response.data;
}

/**
 * 获取登录统计（管理员专用）
 * @param {string} userId - 用户 ID（可选）
 * @returns {Promise} - 返回登录统计
 */
export async function getLoginStats(
	userId: string | null = null,
): Promise<LoginStatsResponse | undefined> {
	const url = buildUrl("/api/admin/login/stats", { userId });
	const response = await fetchApi<LoginStatsResponse>(url);
	return response.data;
}

/**
 * 检查当前用户是否为管理员
 * @returns {Promise<boolean>} - 返回是否为管理员
 */
export async function checkIsAdmin(): Promise<boolean> {
	try {
		const response = await fetchApi<UserInfoResponse>("/api/dashboard/user", {
			throwOnError: false,
		});
		return response.data?.isAdmin === true;
	} catch (error) {
		console.error("检查管理员状态失败:", error);
		return false;
	}
}

/**
 * 获取用户信息（包含管理员状态）
 * @returns {Promise<Object>} - 返回用户信息
 */
export async function getCurrentUserWithAdminStatus(): Promise<UserInfoResponse | undefined> {
	const response = await fetchApi<UserInfoResponse>("/api/dashboard/user");
	return response.data;
}

/**
 * 获取访问日志（管理员专用）
 * @param {Object} options - 查询选项
 * @returns {Promise} - 返回访问日志列表
 */
export async function getAccessLogs(
	options: AdminAccessLogsQuery = {},
): Promise<LinkAccessLogsResponse | undefined> {
	const { limit = 50, offset = 0, linkId = null, startDate = null, endDate = null } = options;

	const url = buildUrl("/api/admin/logs/access", {
		limit,
		offset,
		linkId,
		startDate,
		endDate,
	});

	const response = await fetchApi<LinkAccessLogsResponse>(url);
	return response.data;
}

/**
 * 获取管理员仪表盘统计（管理员专用）
 * @returns {Promise} - 返回统计数据
 */
export async function getAdminStats(): Promise<GlobalStatsResponse | undefined> {
	const response = await fetchApi<GlobalStatsResponse>("/api/admin/stats");
	return response.data;
}

/**
 * 获取全局排行榜数据（管理员专用）
 * @param {string} period - 时间周期 ('daily' | 'weekly' | 'monthly')
 * @param {number} limit - 返回条数，默认 20
 * @returns {Promise} - 返回排行榜数据
 */
export async function getGlobalTopLinks(
	period: string = "daily",
	limit: number = 20,
): Promise<TopLinksResponse> {
	try {
		const response = await fetchApi<TopLinksResponse>(
			`/api/admin/top-links?period=${period}&limit=${limit}`,
		);
		return response.data || { links: [] };
	} catch (error) {
		console.error("获取全局排行榜数据失败:", error);
		return { links: [] };
	}
}
