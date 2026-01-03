/*
 * @Author: zi.yang
 * @Date: 2025-12-29 00:00:00
 * @LastEditors: zi.yang
 * @LastEditTime: 2025-12-29 00:00:00
 * @Description: 统一的错误处理中间件
 * @FilePath: /short-link/api/middlewares/errorHandler
 */

import { ENV } from "../config/index.js";
import type { ErrorResponse, FastifyReply, FastifyRequest } from "../types/index.js";

/**
 * 判断是否为开发环境
 * 明确检查 development，避免 NODE_ENV 未设置时泄露信息
 */
const isDevelopment = ENV.NODE_ENV === "development";

/**
 * 自定义业务错误类
 */
export class AppError extends Error {
	statusCode: number;
	code: string | null;
	data: unknown;
	isOperational: boolean;

	/**
	 * @param {string} message - 错误消息
	 * @param {number} statusCode - HTTP 状态码
	 * @param {string} [code] - 错误代码
	 * @param {unknown} [data] - 附加数据
	 */
	constructor(
		message: string,
		statusCode: number = 400,
		code: string | null = null,
		data: unknown = null,
	) {
		super(message);
		this.name = "AppError";
		this.statusCode = statusCode;
		this.code = code;
		this.data = data;
		this.isOperational = true; // 标记为可预期的业务错误

		Error.captureStackTrace(this, this.constructor);
	}

	/**
	 * 创建 400 Bad Request 错误
	 */
	static badRequest(message: string, data: unknown = null) {
		return new AppError(message, 400, "BAD_REQUEST", data);
	}

	/**
	 * 创建 401 Unauthorized 错误
	 */
	static unauthorized(message = "未授权访问") {
		return new AppError(message, 401, "UNAUTHORIZED");
	}

	/**
	 * 创建 403 Forbidden 错误
	 */
	static forbidden(message = "禁止访问") {
		return new AppError(message, 403, "FORBIDDEN");
	}

	/**
	 * 创建 404 Not Found 错误
	 */
	static notFound(message = "资源不存在") {
		return new AppError(message, 404, "NOT_FOUND");
	}

	/**
	 * 创建 409 Conflict 错误
	 */
	static conflict(message: string, data: unknown = null) {
		return new AppError(message, 409, "CONFLICT", data);
	}

	/**
	 * 创建 429 Too Many Requests 错误
	 */
	static tooManyRequests(message = "请求过于频繁", retryAfter = 60) {
		return new AppError(message, 429, "TOO_MANY_REQUESTS", { retryAfter });
	}

	/**
	 * 创建 500 Internal Server Error 错误
	 */
	static internal(message = "服务器内部错误") {
		return new AppError(message, 500, "INTERNAL_ERROR");
	}

	/**
	 * 从错误码创建错误
	 */
	static fromErrorCode(
		errorCode: { code: number; msg: string },
		data: unknown = null,
		customMsg: string | null = null,
	) {
		return new AppError(customMsg || errorCode.msg, errorCode.code, null, data);
	}
}

/**
 * 验证错误类
 */
export class ValidationError extends AppError {
	field: string | null;

	constructor(message: string, field: string | null = null) {
		super(message, 400, "VALIDATION_ERROR", field ? { field } : null);
		this.name = "ValidationError";
		this.field = field;
	}
}

/**
 * 数据库错误类
 */
export class DatabaseError extends AppError {
	originalError: Error | null;

	constructor(message: string, originalError: Error | null = null) {
		super(message, 500, "DATABASE_ERROR");
		this.name = "DatabaseError";
		this.originalError = originalError;
	}
}

/**
 * 认证错误类
 */
export class AuthenticationError extends AppError {
	constructor(message = "认证失败") {
		super(message, 401, "AUTHENTICATION_ERROR");
		this.name = "AuthenticationError";
	}
}

/**
 * 授权错误类
 */
export class AuthorizationError extends AppError {
	constructor(message = "权限不足") {
		super(message, 403, "AUTHORIZATION_ERROR");
		this.name = "AuthorizationError";
	}
}

/**
 * 格式化错误响应
 * @param {Error} error - 错误对象
 * @returns {Object}
 */
function formatErrorResponse(
	error: Error & {
		statusCode?: number;
		code?: string;
		data?: unknown;
		stack?: string;
	},
): ErrorResponse {
	const response: ErrorResponse = {
		code: error.statusCode || 500,
		msg: error.message || "服务器内部错误",
	};

	// 添加错误代码
	if (error.code) {
		response.errorCode = error.code;
	}

	// 添加附加数据
	if (error.data) {
		response.data = error.data;
	}

	// 仅在开发环境添加堆栈信息（明确检查 development）
	if (isDevelopment && error.stack) {
		response.stack = error.stack.split("\n").map((line: string) => line.trim());
	}

	return response;
}

/**
 * 处理 Fastify 验证错误
 * @param {Error} error - 错误对象
 * @returns {Object|null}
 */
function handleFastifyValidationError(
	error: Error & {
		validation?: Array<{
			params?: { missingProperty?: string };
			instancePath?: string;
			message?: string;
		}>;
	},
): ErrorResponse | null {
	if (error.validation && Array.isArray(error.validation)) {
		const messages = error.validation.map((v) => {
			const field = v.params?.missingProperty || v.instancePath?.replace("/", "") || "unknown";
			return `${field}: ${v.message}`;
		});

		return {
			code: 400,
			msg: "请求参数验证失败",
			errorCode: "VALIDATION_ERROR",
			data: {
				errors: messages,
			},
		};
	}
	return null;
}

/**
 * 处理 Supabase 数据库错误
 * @param {Error} error - 错误对象
 * @returns {Object|null}
 */
function handleSupabaseError(error: Error & { code?: string }): ErrorResponse | null {
	// Supabase 错误通常有特定的 code
	if (error.code) {
		switch (error.code) {
			case "PGRST116": // 没有找到记录
				return {
					code: 404,
					msg: "资源不存在",
					errorCode: "NOT_FOUND",
				};
			case "23505": // 唯一性约束冲突
				return {
					code: 409,
					msg: "数据已存在",
					errorCode: "CONFLICT",
				};
			case "23503": // 外键约束冲突
				return {
					code: 400,
					msg: "关联数据不存在",
					errorCode: "FOREIGN_KEY_ERROR",
				};
			case "42501": // 权限不足
				return {
					code: 403,
					msg: "数据库权限不足",
					errorCode: "DB_PERMISSION_DENIED",
				};
			default:
				// 其他数据库错误
				if (error.code.startsWith("22") || error.code.startsWith("23")) {
					return {
						code: 400,
						msg: "数据格式或约束错误",
						errorCode: "DB_CONSTRAINT_ERROR",
					};
				}
		}
	}
	return null;
}

/**
 * 全局错误处理中间件
 * @param {Error} error - 错误对象
 * @param {Object} request - Fastify request 对象
 * @param {Object} reply - Fastify reply 对象
 */
export async function globalErrorHandler(
	error: Error & {
		statusCode?: number;
		code?: string;
		message?: string;
		stack?: string;
	},
	request: FastifyRequest,
	reply: FastifyReply,
) {
	// 记录错误日志（始终记录，但生产环境不返回详细信息）
	request.log.error({
		err: error,
		request: {
			method: request.method,
			url: request.url,
			params: request.params,
			query: request.query,
			// 不记录敏感信息如 body 和 headers
		},
	});

	// 处理自定义业务错误
	if (error instanceof AppError) {
		const response = formatErrorResponse(error);
		return reply.status(error.statusCode).send(response);
	}

	// 处理 Fastify 验证错误
	const validationResponse = handleFastifyValidationError(error);
	if (validationResponse) {
		return reply.status(400).send(validationResponse);
	}

	// 处理 Supabase 数据库错误
	const supabaseResponse = handleSupabaseError(error);
	if (supabaseResponse) {
		return reply.status(supabaseResponse.code).send(supabaseResponse);
	}

	// 处理 JWT 错误
	if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
		return reply.status(401).send({
			code: 401,
			msg: error.name === "TokenExpiredError" ? "Token 已过期" : "无效的 Token",
			errorCode: "TOKEN_ERROR",
		});
	}

	// 处理 CORS 错误
	if (error.message?.includes("CORS")) {
		return reply.status(403).send({
			code: 403,
			msg: "跨域请求被拒绝",
			errorCode: "CORS_ERROR",
		});
	}

	// 处理 Rate Limit 错误
	if (error.statusCode === 429) {
		return reply.status(429).send({
			code: 429,
			msg: "请求过于频繁，请稍后再试",
			errorCode: "RATE_LIMITED",
		});
	}

	// 默认服务器错误
	const statusCode = error.statusCode || 500;
	const response: ErrorResponse = {
		code: statusCode,
		// 仅在开发环境显示实际错误消息，生产环境统一返回通用消息
		msg: isDevelopment ? error.message : "服务器内部错误",
		errorCode: "INTERNAL_ERROR",
	};

	// 仅在开发环境添加堆栈信息
	if (isDevelopment && error.stack) {
		response.stack = error.stack.split("\n").map((line: string) => line.trim());
	}

	return reply.status(statusCode).send(response);
}

/**
 * 404 处理中间件
 * @param {Object} request - Fastify request 对象
 * @param {Object} reply - Fastify reply 对象
 */
export async function notFoundHandler(request: FastifyRequest, reply: FastifyReply) {
	return reply.status(404).send({
		code: 404,
		msg: `路由不存在: ${request.method} ${request.url}`,
		errorCode: "NOT_FOUND",
	});
}

/**
 * 注册错误处理器到 Fastify 实例
 * @param {Object} fastify - Fastify 实例
 */
export function registerErrorHandlers(fastify: {
	setErrorHandler: (handler: typeof globalErrorHandler) => void;
	setNotFoundHandler: (handler: typeof notFoundHandler) => void;
}) {
	// 设置全局错误处理器
	fastify.setErrorHandler(globalErrorHandler);

	// 设置 404 处理器
	fastify.setNotFoundHandler(notFoundHandler);
}

/**
 * 异步包装器 - Fastify 已自动处理异步错误,此函数仅用于兼容性
 * @param {Function} fn - 异步处理函数
 * @returns {Function}
 */
export function asyncHandler<T extends (...args: unknown[]) => Promise<unknown>>(fn: T): T {
	return fn;
}

/**
 * 安全执行函数（不抛出错误）
 * @param {Function} fn - 要执行的函数
 * @param {T} defaultValue - 错误时的默认返回值
 * @returns {Promise<T>}
 */
export async function safeExecute<T>(
	fn: () => Promise<T>,
	defaultValue: T | null = null,
): Promise<T | null> {
	try {
		return await fn();
	} catch (error) {
		console.error("Safe execute error:", error);
		return defaultValue;
	}
}

export default {
	AppError,
	ValidationError,
	DatabaseError,
	AuthenticationError,
	AuthorizationError,
	globalErrorHandler,
	notFoundHandler,
	registerErrorHandlers,
	asyncHandler,
	safeExecute,
};
