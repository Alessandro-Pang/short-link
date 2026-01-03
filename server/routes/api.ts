/*
 * @Author: zi.yang
 * @Date: 2025-12-29 00:00:00
 * @LastEditors: zi.yang
 * @LastEditTime: 2025-12-29 00:00:00
 * @Description: API 路由组 - 公开接口
 * @FilePath: /short-link/api/routes/api
 */

import { RATE_LIMIT_CONFIG } from "../config/index.js";
import * as authController from "../controllers/auth.js";
import * as linkController from "../controllers/link.js";
import { optionalAuthenticate } from "../middlewares/auth.js";

/**
 * API 路由组 - 公开接口
 */
export default async function apiRoutes(fastify) {
	// 认证相关
	fastify.post("/validate-token", authController.validateToken);

	// 短链接相关
	fastify.get("/expiration-options", linkController.getExpirationOptions);

	// 验证短链接密码
	fastify.post(
		"/verify-password/:hash",
		{
			config: {
				rateLimit: {
					max: RATE_LIMIT_CONFIG.LOGIN.MAX, // 使用登录限制防止暴力破解
					timeWindow: RATE_LIMIT_CONFIG.LOGIN.TIME_WINDOW,
					errorResponseBuilder: (_request, context) => {
						return {
							code: 429,
							msg: "密码验证过于频繁，请稍后再试",
							retryAfter: Math.ceil(context.ttl / 1000),
						};
					},
				},
			},
		},
		linkController.verifyLinkPassword,
	);

	// 创建短链接 - 更严格的速率限制
	fastify.post(
		"/addUrl",
		{
			preHandler: optionalAuthenticate,
			config: {
				rateLimit: {
					max: RATE_LIMIT_CONFIG.CREATE_LINK.MAX,
					timeWindow: RATE_LIMIT_CONFIG.CREATE_LINK.TIME_WINDOW,
					// 自定义错误响应
					errorResponseBuilder: (_request, context) => {
						return {
							code: 429,
							msg: "创建短链接过于频繁，请稍后再试",
							retryAfter: Math.ceil(context.ttl / 1000),
						};
					},
				},
			},
		},
		linkController.createShortLink,
	);

	// 登录日志 - 严格限制防止滥用
	fastify.post(
		"/log-login-attempt",
		{
			config: {
				rateLimit: {
					max: RATE_LIMIT_CONFIG.LOGIN.MAX,
					timeWindow: RATE_LIMIT_CONFIG.LOGIN.TIME_WINDOW,
					errorResponseBuilder: (_request, context) => {
						return {
							code: 429,
							msg: "登录尝试过于频繁，请稍后再试",
							retryAfter: Math.ceil(context.ttl / 1000),
						};
					},
				},
			},
		},
		authController.logLoginAttempt,
	);

	// 健康检查已移至 index 的根路径 /health，包含真实的数据库连接检查
}
