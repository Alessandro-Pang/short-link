/*
 * @Description: Shared TypeScript type definitions
 */

import type { FastifyReply, FastifyRequest } from "fastify";

// Import shared types instead of duplicating
export type {
	AccessRestrictions,
	LinkCreateOptions,
	VisitorInfo,
} from "../../types/shared.js";

/**
 * Fastify Request with user context
 */
export interface AuthenticatedRequest extends FastifyRequest {
	user?: {
		id: string;
		email: string;
		is_admin: boolean;
		banned: boolean;
		[key: string]: unknown;
	};
}

/**
 * Pagination options
 */
export interface PaginationOptions {
	page?: number;
	perPage?: number;
	limit?: number;
	offset?: number;
}

/**
 * Sorting options
 */
export interface SortOptions {
	sortBy?: string;
	sortOrder?: "asc" | "desc";
	orderBy?: string;
	ascending?: boolean;
}

/**
 * Query options combining pagination and sorting
 */
export interface QueryOptions extends PaginationOptions, SortOptions {
	[key: string]: unknown;
}

/**
 * Date range filter
 */
export interface DateRangeFilter {
	startDate?: string | Date | null;
	endDate?: string | Date | null;
	days?: number;
}

/**
 * Link query options
 */
export interface LinkQueryOptions extends QueryOptions {
	linkId?: number | null;
	keyword?: string | null;
	userId?: string | null;
}

/**
 * Login log query options
 */
export interface LoginLogQueryOptions extends QueryOptions, DateRangeFilter {
	userId?: string | null;
	success?: boolean | null;
}

/**
 * User list options
 */
export interface UserListOptions extends PaginationOptions {
	page?: number;
	perPage?: number;
}

/**
 * Link access stats options
 */
export interface LinkAccessStatsOptions {
	days?: number;
}

/**
 * URL validation options
 */
export interface UrlValidationOptions {
	allowPrivateHosts?: boolean;
}

/**
 * Authentication middleware options
 */
export interface AuthMiddlewareOptions {
	required?: boolean;
	requireAdmin?: boolean;
	customCheck?:
		| ((user: AuthenticatedRequest["user"], request: FastifyRequest) => boolean | Promise<boolean>)
		| null;
	customCheckErrorMsg?: string;
}

/**
 * Service result pattern
 */
export interface ServiceResult<T> {
	data: T | null;
	error: {
		message?: string;
		code?: string;
		[key: string]: unknown;
	} | null;
}

/**
 * Handle service result options
 */
export interface HandleServiceResultOptions {
	successMsg?: string;
	notFoundCode?: number;
	notFoundMsg?: string;
}

/**
 * Error response format
 */
export interface ErrorResponse {
	code: number;
	msg: string;
	errorCode?: string;
	data?: unknown;
	stack?: string[];
}

/**
 * Success response format
 */
export interface SuccessResponse<T = unknown> {
	code: number;
	msg: string;
	data?: T;
}

/**
 * Cache options
 */
export interface CacheOptions {
	defaultTTL?: number;
	maxSize?: number;
	cleanupInterval?: number;
}

/**
 * User update data
 */
export interface UserUpdateData {
	email?: string;
	password?: string;
	is_admin?: boolean;
	banned?: boolean;
	[key: string]: unknown;
}

/**
 * Export Fastify types for convenience
 */
export type { FastifyRequest, FastifyReply };
