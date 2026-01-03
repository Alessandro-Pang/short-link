// Re-export database types for convenience

// Re-export API types for convenience
export type { ApiResponse } from "../../types/api";
export type { Link, LoginLog } from "../../types/database.schema";

// 用户相关类型
export interface User {
	id: string;
	email: string;
	username?: string;
	avatar_url?: string;
	role?: "user" | "admin";
	created_at?: string;
	updated_at?: string;
}

export interface AuthUser extends User {
	access_token?: string;
	refresh_token?: string;
}

// 短链接相关类型 - 已移至 shared.types.ts，这里保留用于向后兼容
export interface CreateLinkPayload {
	original_url: string;
	short_code?: string;
	title?: string;
	description?: string;
	tags?: string[];
	expires_at?: string;
	password?: string;
	custom_params?: Record<string, unknown>;
}

export interface UpdateLinkPayload {
	original_url?: string;
	title?: string;
	description?: string;
	tags?: string[];
	is_active?: boolean;
	expires_at?: string;
	password?: string;
	custom_params?: Record<string, unknown>;
}

// 统计相关类型
export interface LinkStats {
	total_links: number;
	total_clicks: number;
	active_links: number;
	expired_links: number;
}

export interface ClickLog {
	id: string;
	link_id: string;
	clicked_at: string;
	ip_address?: string;
	user_agent?: string;
	referer?: string;
	country?: string;
	city?: string;
}

// 分页相关类型
export interface PaginationParams {
	page?: number;
	limit?: number;
	sort_by?: string;
	order?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
	items: T[];
	total: number;
	page: number;
	limit: number;
	total_pages: number;
}
