/*
 * @Author: zi.yang
 * @Date: 2025-12-29 00:00:00
 * @LastEditors: zi.yang
 * @LastEditTime: 2025-12-29 00:00:00
 * @Description: 认证中间件 - 重构版，合并重复代码并添加缓存支持
 * @FilePath: /short-link/api/middlewares/auth
 */

import { CACHE_CONFIG } from "../config/index.js";
import * as authService from "../services/auth.js";
import type {
	AuthenticatedRequest,
	AuthMiddlewareOptions,
	FastifyReply,
	FastifyRequest,
} from "../types/index.js";
import cache, { buildCacheKey, CACHE_KEYS } from "../utils/cache.js";
import { AuthenticationError, AuthorizationError } from "./errorHandler.js";

/**
 * 从请求头中提取 Bearer Token
 * @param {Object} request - Fastify request 对象
 * @returns {string|null} Token 或 null
 */
function extractToken(request: FastifyRequest): string | null {
	const authHeader = request.headers.authorization;
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return null;
	}
	return authHeader.substring(7);
}

/**
 * 验证 Token 并获取用户信息（带缓存）
 * @param {string} token - JWT Token
 * @param {Object} request - Fastify request 对象（用于日志）
 * @returns {Promise<Object>} 用户信息
 */
async function verifyAndGetUser(
	token: string,
	_request: FastifyRequest,
): Promise<AuthenticatedRequest["user"]> {
	// 首先验证 token（这步必须每次执行，不能缓存）
	const user = await authService.verifyToken(token);

	if (!user || !user.id) {
		throw new AuthenticationError("无效的 Token");
	}

	// 尝试从缓存获取用户 profile
	const cacheKey = buildCacheKey(CACHE_KEYS.USER_PROFILE, user.id);
	let userProfile = cache.get(cacheKey);

	if (userProfile === undefined) {
		// 缓存未命中，从数据库获取
		userProfile = await authService.getUserById(user.id);

		// 缓存用户信息
		if (userProfile) {
			cache.set(cacheKey, userProfile, CACHE_CONFIG.USER_INFO_TTL);
		}
	}

	// 如果 user_profiles 没有数据，使用 auth user 数据
	const userData: AuthenticatedRequest["user"] = (userProfile as AuthenticatedRequest["user"]) || {
		id: user.id,
		email: user.email,
		is_admin: false,
		banned: false,
	};

	// 检查用户是否被禁用
	if (userData && userData.banned) {
		throw new AuthorizationError("用户已被禁用");
	}

	return userData;
}

/**
 * 清除用户缓存
 * @param {string} userId - 用户 ID
 */
export function clearUserCache(userId: string): void {
	cache.delete(buildCacheKey(CACHE_KEYS.USER_PROFILE, userId));
	cache.delete(buildCacheKey(CACHE_KEYS.USER_ADMIN_STATUS, userId));
	cache.delete(buildCacheKey(CACHE_KEYS.USER_INFO, userId));
}

/**
 * 创建认证错误响应
 * @param {Object} reply - Fastify reply 对象
 * @param {string} msg - 错误消息
 * @param {number} statusCode - HTTP 状态码
 * @returns {Object}
 */
function sendAuthError(reply: FastifyReply, msg: string, statusCode = 401) {
	return reply.status(statusCode).send({
		code: statusCode === 401 ? "UNAUTHORIZED" : "FORBIDDEN",
		msg,
	});
}

/**
 * 基础认证处理
 * @param {Object} request - Fastify request 对象
 * @param {Object} reply - Fastify reply 对象
 * @param {Object} options - 选项
 * @param {boolean} options.required - 是否必须认证
 * @param {boolean} options.requireAdmin - 是否需要管理员权限
 * @returns {Promise<boolean>} 是否继续处理请求
 */
async function handleAuth(
	request: AuthenticatedRequest,
	reply: FastifyReply,
	options: Partial<AuthMiddlewareOptions> = {},
): Promise<boolean | void> {
	const { required = true, requireAdmin = false } = options;

	try {
		const token = extractToken(request);

		// 如果没有 token
		if (!token) {
			if (required) {
				return sendAuthError(reply, "缺少授权头或格式不正确");
			}
			// 可选认证，继续处理
			return true;
		}

		// 验证 token 并获取用户信息
		const userData = await verifyAndGetUser(token, request);
		request.user = userData;

		// 如果需要管理员权限
		if (requireAdmin) {
			if (!userData.is_admin) {
				request.log.warn(
					`User ${userData.id} (${userData.email}) attempted admin access but is_admin=${userData.is_admin}`,
				);
				return sendAuthError(reply, "需要管理员权限", 403);
			}
		}

		return true;
	} catch (error) {
		// 可选认证失败不阻止请求
		if (!required) {
			request.log.warn("Optional authentication failed:", error.message);
			return true;
		}

		request.log.error("Authentication error:", error);

		if (error instanceof AuthorizationError) {
			return sendAuthError(reply, error.message, 403);
		}

		return sendAuthError(reply, error.message || "认证失败");
	}
}

/**
 * 认证中间件 - 必须提供有效的 token
 * @param {Object} request - Fastify request 对象
 * @param {Object} reply - Fastify reply 对象
 */
export async function authenticate(
	request: AuthenticatedRequest,
	reply: FastifyReply,
): Promise<boolean | void> {
	const result = await handleAuth(request, reply, {
		required: true,
		requireAdmin: false,
	});

	// 如果返回的不是 true，说明已经发送了错误响应
	if (result !== true) {
		return result;
	}
}

/**
 * 可选认证中间件 - 如果提供 token 则验证，否则继续
 * @param {Object} request - Fastify request 对象
 * @param {Object} reply - Fastify reply 对象
 */
export async function optionalAuthenticate(
	request: AuthenticatedRequest,
	reply: FastifyReply,
): Promise<void> {
	await handleAuth(request, reply, {
		required: false,
		requireAdmin: false,
	});
}

/**
 * 认证并检查管理员权限
 * @param {Object} request - Fastify request 对象
 * @param {Object} reply - Fastify reply 对象
 */
export async function authenticateWithAdminCheck(
	request: AuthenticatedRequest,
	reply: FastifyReply,
): Promise<boolean | void> {
	const result = await handleAuth(request, reply, {
		required: true,
		requireAdmin: true,
	});

	if (result !== true) {
		return result;
	}
}

/**
 * 仅管理员认证中间件（别名，与 authenticateWithAdminCheck 相同）
 * @param {Object} request - Fastify request 对象
 * @param {Object} reply - Fastify reply 对象
 */
export async function authenticateAdmin(
	request: AuthenticatedRequest,
	reply: FastifyReply,
): Promise<boolean | void> {
	return authenticateWithAdminCheck(request, reply);
}

/**
 * 创建自定义认证中间件
 * @param {Object} options - 配置选项
 * @param {boolean} options.required - 是否必须认证
 * @param {boolean} options.requireAdmin - 是否需要管理员权限
 * @param {Function} options.customCheck - 自定义检查函数 (user) => boolean|Promise<boolean>
 * @param {string} options.customCheckErrorMsg - 自定义检查失败时的错误消息
 * @returns {Function} 中间件函数
 */
export function createAuthMiddleware(options: Partial<AuthMiddlewareOptions> = {}) {
	const {
		required = true,
		requireAdmin = false,
		customCheck = null,
		customCheckErrorMsg = "权限验证失败",
	} = options;

	return async (request: AuthenticatedRequest, reply: FastifyReply) => {
		const result = await handleAuth(request, reply, {
			required,
			requireAdmin,
		});

		if (result !== true) {
			return result;
		}

		// 执行自定义检查
		if (customCheck && request.user) {
			try {
				const checkResult = await customCheck(request.user, request);
				if (!checkResult) {
					return sendAuthError(reply, customCheckErrorMsg, 403);
				}
			} catch (error) {
				request.log.error("Custom auth check error:", error);
				return sendAuthError(reply, customCheckErrorMsg, 403);
			}
		}
	};
}

/**
 * 资源所有者验证中间件工厂
 * 用于验证用户是否有权访问特定资源
 * @param {Function} getResourceOwnerId - 获取资源所有者 ID 的函数 (request) => string|Promise<string>
 * @returns {Function} 中间件函数
 */
export function requireOwnership(
	getResourceOwnerId: (request: AuthenticatedRequest) => string | Promise<string>,
) {
	return createAuthMiddleware({
		required: true,
		requireAdmin: false,
		customCheck: async (user, request) => {
			// 管理员可以访问所有资源
			if (user.is_admin) {
				return true;
			}

			const ownerId = await getResourceOwnerId(request);
			return ownerId === user.id;
		},
		customCheckErrorMsg: "无权访问此资源",
	});
}

/**
 * 获取缓存统计信息
 * @returns {Object}
 */
export function getAuthCacheStats() {
	return cache.getStats();
}

export default {
	authenticate,
	optionalAuthenticate,
	authenticateWithAdminCheck,
	authenticateAdmin,
	createAuthMiddleware,
	requireOwnership,
	clearUserCache,
	getAuthCacheStats,
};
