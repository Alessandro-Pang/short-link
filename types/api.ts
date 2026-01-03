/**
 * API Contract Types
 * Single source of truth for all API request/response types
 * Shared between frontend and backend
 */

import type { ExpirationOption, Link, LinkAccessLog, UserProfile } from "./database.schema";
import type { AccessRestrictions, LinkCreateOptions } from "./shared";

// ============================================================================
// Common Types
// ============================================================================

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
	code: number;
	msg: string;
	data?: T;
}

// ============================================================================
// Request DTOs
// ============================================================================

/**
 * Request to create a new short link
 */
export interface CreateLinkRequest {
	url: string;
	options?: LinkCreateOptions;
}

/**
 * Request to update an existing link
 */
export interface UpdateLinkRequest {
	title?: string | null;
	description?: string | null;
	is_active?: boolean;
	redirect_type?: number;
	pass_query_params?: boolean;
	forward_headers?: boolean;
	forward_header_list?: string[];
	expiration_option_id?: number | null;
	expiration_date?: string | null;
	max_clicks?: number | null;
	password?: string | null;
	access_restrictions?: AccessRestrictions | null;
}

/**
 * Query parameters for fetching dashboard links
 */
export interface DashboardLinksQuery {
	limit?: number;
	offset?: number;
	orderBy?: string;
	ascending?: boolean;
	linkId?: number | null;
	keyword?: string | null;
}

/**
 * Query parameters for fetching link access logs
 */
export interface LinkAccessLogsQuery {
	limit?: number;
	offset?: number;
}

/**
 * Request to batch delete links
 */
export interface BatchDeleteLinksRequest {
	linkIds: number[];
}

/**
 * Request to batch toggle link status
 */
export interface BatchToggleLinksRequest {
	linkIds: number[];
	is_active: boolean;
}

/**
 * Request to toggle link status
 */
export interface ToggleLinkStatusRequest {
	is_active: boolean;
}

// ============================================================================
// Response DTOs
// ============================================================================

/**
 * Response containing a single link with additional details
 */
export type LinkDetailResponse = {
	click_count?: number;
	last_clicked_at?: string | null;
} & Link;

/**
 * Response containing dashboard statistics
 */
export interface DashboardStatsResponse {
	total_links: number;
	active_links: number;
	total_clicks: number;
	clicks_today: number;
	weekly_new_links?: number;
	avg_clicks_per_link?: number;
}

/**
 * Response containing a list of links
 */
export interface DashboardLinksResponse {
	links: Link[];
	total: number;
}

/**
 * Response containing link access logs
 */
export interface LinkAccessLogsResponse {
	logs: LinkAccessLog[];
	total: number;
}

/**
 * Response containing expiration options
 */
export interface ExpirationOptionsResponse {
	data: ExpirationOption[];
}

/**
 * Response containing user information
 */
export interface UserResponse {
	user: UserProfile;
}

/**
 * Response for batch operations
 */
export interface BatchOperationResponse {
	success: boolean;
	affected: number;
	errors?: string[];
}

/**
 * Response containing a short link URL
 */
export interface ShortLinkResponse {
	link: Link;
	short_url: string;
}
