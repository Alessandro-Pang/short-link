/**
 * 管理员 API 服务模块
 * 所有管理员专用接口
 */

import type { ApiResponse, BatchOperationResponse, LinkDetailResponse } from "../../types/api";
import type { Link, LinkAccessLog, LoginLog, UserProfile } from "../../types/shared";
import { adminLinkApi } from "./link-api";
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

interface TopLinksResponse {
	links: Array<Link & { click_count: number }>;
}

export async function getGlobalStats(): Promise<GlobalStatsResponse | undefined> {
	const response = await fetchApi<GlobalStatsResponse>("/api/admin/stats");
	return response.data;
}

export async function getAllLinks(
	options: AdminLinksQuery = {},
): Promise<AllLinksResponse | undefined> {
	const response = await adminLinkApi.getLinks(options);
	return response.data as AllLinksResponse | undefined;
}

export async function getLinkDetail(linkId: number): Promise<ApiResponse<LinkDetailResponse>> {
	return adminLinkApi.getLinkDetail(linkId) as Promise<ApiResponse<LinkDetailResponse>>;
}

export async function getLinkAccessLogs(
	linkId: number,
	options: AccessLogsQuery = {},
): Promise<LinkAccessLogsResponse | undefined> {
	const response = await adminLinkApi.getLinkAccessLogs(linkId, options);
	return response.data as LinkAccessLogsResponse | undefined;
}

export async function updateLink(
	linkId: number,
	updates: Record<string, unknown>,
): Promise<ApiResponse<Link>> {
	return adminLinkApi.updateLink(linkId, updates);
}

export async function toggleLinkStatus(
	linkId: number,
	isActive: boolean,
): Promise<ApiResponse<Link>> {
	return adminLinkApi.toggleLinkStatus(linkId, isActive);
}

export async function deleteLink(linkId: number): Promise<ApiResponse<void>> {
	return adminLinkApi.deleteLink(linkId);
}

export async function batchDeleteLinks(
	linkIds: number[],
): Promise<ApiResponse<BatchOperationResponse>> {
	return adminLinkApi.batchDeleteLinks(linkIds);
}

export async function batchToggleLinks(
	linkIds: number[],
	isActive: boolean,
): Promise<ApiResponse<BatchOperationResponse>> {
	return adminLinkApi.batchToggleLinks(linkIds, isActive);
}

export async function updateLinkPassword(
	linkId: number,
	password: string | null,
): Promise<ApiResponse<Link>> {
	return adminLinkApi.updateLinkPassword(linkId, password);
}

export async function getAllUsers(options: UsersQuery = {}): Promise<AllUsersResponse | undefined> {
	const { page = 1, perPage = 50 } = options;

	const url = buildUrl("/api/admin/users", {
		page,
		perPage,
	});

	const response = await fetchApi<AllUsersResponse>(url);
	return response.data;
}

export async function getUserDetails(userId: string): Promise<UserProfile | undefined> {
	const response = await fetchApi<UserProfile>(`/api/admin/users/${userId}`);
	return response.data;
}

export async function createUser(
	userData: Record<string, unknown>,
): Promise<ApiResponse<UserProfile>> {
	return fetchApi<UserProfile>("/api/admin/users", {
		method: "POST",
		body: userData,
	});
}

export async function updateUser(
	userId: string,
	updates: Record<string, unknown>,
): Promise<ApiResponse<UserProfile>> {
	return fetchApi<UserProfile>(`/api/admin/users/${userId}`, {
		method: "PUT",
		body: updates,
	});
}

export async function deleteUser(userId: string): Promise<ApiResponse<void>> {
	return fetchApi<void>(`/api/admin/users/${userId}`, {
		method: "DELETE",
	});
}

export async function resetUserPassword(
	userId: string,
	password: string,
): Promise<ApiResponse<void>> {
	return fetchApi<void>(`/api/admin/users/${userId}/reset-password`, {
		method: "POST",
		body: { password },
	});
}

export async function toggleUserStatus(
	userId: string,
	banned: boolean,
): Promise<ApiResponse<void>> {
	return fetchApi<void>(`/api/admin/users/${userId}/ban-status`, {
		method: "PATCH",
		body: { banned },
	});
}

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

export async function getLoginStats(
	userId: string | null = null,
): Promise<LoginStatsResponse | undefined> {
	const url = buildUrl("/api/admin/login/stats", { userId });
	const response = await fetchApi<LoginStatsResponse>(url);
	return response.data;
}

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

export async function getCurrentUserWithAdminStatus(): Promise<UserInfoResponse | undefined> {
	const response = await fetchApi<UserInfoResponse>("/api/dashboard/user");
	return response.data;
}

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

export async function getAdminStats(): Promise<GlobalStatsResponse | undefined> {
	const response = await fetchApi<GlobalStatsResponse>("/api/admin/stats");
	return response.data;
}

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
