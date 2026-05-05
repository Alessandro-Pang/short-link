import type { ApiResponse, BatchOperationResponse } from "../../types/api";
import type { Link, LinkAccessLog } from "../../types/shared";
import { buildUrl, fetchApi } from "./request";

interface LinkListQuery {
	limit?: number;
	offset?: number;
	orderBy?: string;
	ascending?: boolean;
	linkId?: number | null;
	keyword?: string | null;
	userId?: string | null;
}

interface LinkListResponse {
	links: Link[];
	total: number;
}

interface LinkAccessLogsQuery {
	limit?: number;
	offset?: number;
}

interface LinkAccessLogsResponse {
	logs: LinkAccessLog[];
	total: number;
}

export function createLinkApi(basePath: string) {
	return {
		getLinks(options: LinkListQuery = {}): Promise<ApiResponse<LinkListResponse>> {
			const {
				limit = 50,
				offset = 0,
				orderBy = "created_at",
				ascending = false,
				linkId = null,
				keyword = null,
				userId = null,
			} = options;
			const url = buildUrl(`${basePath}`, {
				limit,
				offset,
				orderBy,
				ascending,
				linkId,
				keyword,
				userId,
			});
			return fetchApi<LinkListResponse>(url);
		},

		getLinkDetail(linkId: number): Promise<ApiResponse<Link>> {
			return fetchApi<Link>(`${basePath}/${linkId}`);
		},

		getLinkAccessLogs(
			linkId: number,
			options: LinkAccessLogsQuery = {},
		): Promise<ApiResponse<LinkAccessLogsResponse>> {
			const { limit = 50, offset = 0 } = options;
			const logsPath = basePath.includes("admin") ? "access-logs" : "logs";
			const url = buildUrl(`${basePath}/${linkId}/${logsPath}`, { limit, offset });
			return fetchApi<LinkAccessLogsResponse>(url);
		},

		updateLink(linkId: number, updates: Record<string, unknown>): Promise<ApiResponse<Link>> {
			return fetchApi<Link>(`${basePath}/${linkId}`, { method: "PUT", body: updates });
		},

		toggleLinkStatus(linkId: number, isActive: boolean): Promise<ApiResponse<Link>> {
			return fetchApi<Link>(`${basePath}/${linkId}/status`, {
				method: "PATCH",
				body: { is_active: isActive },
			});
		},

		deleteLink(linkId: number): Promise<ApiResponse<void>> {
			return fetchApi<void>(`${basePath}/${linkId}`, { method: "DELETE" });
		},

		batchDeleteLinks(linkIds: number[]): Promise<ApiResponse<BatchOperationResponse>> {
			return fetchApi<BatchOperationResponse>(`${basePath}/batch-delete`, {
				method: "POST",
				body: { linkIds },
			});
		},

		batchToggleLinks(
			linkIds: number[],
			isActive: boolean,
		): Promise<ApiResponse<BatchOperationResponse>> {
			return fetchApi<BatchOperationResponse>(`${basePath}/batch-status`, {
				method: "POST",
				body: { linkIds, is_active: isActive },
			});
		},

		updateLinkPassword(linkId: number, password: string | null): Promise<ApiResponse<Link>> {
			return fetchApi<Link>(`${basePath}/${linkId}`, { method: "PUT", body: { password } });
		},
	};
}

export const dashboardLinkApi = createLinkApi("/api/dashboard/links");
export const adminLinkApi = createLinkApi("/api/admin/links");
