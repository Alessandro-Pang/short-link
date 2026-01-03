/*
 * @Author: zi.yang
 * @Date: 2025-12-29 00:00:00
 * @LastEditors: zi.yang
 * @LastEditTime: 2025-12-29 00:00:00
 * @Description: Dashboard 路由组 - 需要用户认证
 * @FilePath: /short-link/api/routes/dashboard
 */

import { RATE_LIMIT_CONFIG } from "../config/index.js";
import * as authController from "../controllers/auth.js";
import * as linkController from "../controllers/link.js";
import * as userController from "../controllers/user.js";
import { authenticate } from "../middlewares/auth.js";

/**
 * Dashboard 路由组 - 需要用户认证
 */
export default async function dashboardRoutes(fastify) {
	// 所有 dashboard 路由都需要认证
	fastify.addHook("preHandler", authenticate);

	// Dashboard 默认速率限制配置
	const dashboardRateLimitConfig = {
		config: {
			rateLimit: {
				max: RATE_LIMIT_CONFIG.GLOBAL.MAX,
				timeWindow: RATE_LIMIT_CONFIG.GLOBAL.TIME_WINDOW,
				errorResponseBuilder: (_request, context) => {
					return {
						code: 429,
						msg: "请求过于频繁，请稍后再试",
						retryAfter: Math.ceil(context.ttl / 1000),
					};
				},
			},
		},
	};

	// 批量操作使用更严格的限制
	const batchRateLimitConfig = {
		config: {
			rateLimit: {
				max: 20, // 每分钟最多 20 次批量操作
				timeWindow: "1 minute",
				errorResponseBuilder: (_request, context) => {
					return {
						code: 429,
						msg: "批量操作过于频繁，请稍后再试",
						retryAfter: Math.ceil(context.ttl / 1000),
					};
				},
			},
		},
	};

	// 写操作使用更严格的限制
	const writeRateLimitConfig = {
		config: {
			rateLimit: {
				max: 30, // 每分钟最多 30 次写操作
				timeWindow: "1 minute",
				errorResponseBuilder: (_request, context) => {
					return {
						code: 429,
						msg: "操作过于频繁，请稍后再试",
						retryAfter: Math.ceil(context.ttl / 1000),
					};
				},
			},
		},
	};

	// 用户信息
	fastify.get("/user", dashboardRateLimitConfig, authController.getCurrentUser);

	// 用户身份管理
	fastify.get("/user/identities", dashboardRateLimitConfig, userController.getUserIdentities);
	fastify.post("/user/identities", writeRateLimitConfig, userController.bindIdentity);
	fastify.delete("/user/identities/:provider", writeRateLimitConfig, userController.unbindIdentity);
	fastify.delete("/user/account", writeRateLimitConfig, userController.deleteAccount);

	// 短链接统计
	fastify.get("/stats", dashboardRateLimitConfig, linkController.getUserStats);

	// 排行榜
	fastify.get("/top-links", dashboardRateLimitConfig, linkController.getTopLinks);

	// 短链接管理 - 读操作
	fastify.get("/links", dashboardRateLimitConfig, linkController.getUserLinks);
	fastify.get("/links/:id", dashboardRateLimitConfig, linkController.getLinkDetails);
	fastify.get("/links/:id/access-logs", dashboardRateLimitConfig, linkController.getLinkAccessLogs);

	// 短链接管理 - 写操作
	fastify.put("/links/:id", writeRateLimitConfig, linkController.updateLink);
	fastify.patch("/links/:id/status", writeRateLimitConfig, linkController.toggleLinkStatus);
	fastify.delete("/links/:id", writeRateLimitConfig, linkController.deleteLink);

	// 批量操作 - 最严格的限制
	fastify.post("/links/batch-delete", batchRateLimitConfig, linkController.batchDeleteLinks);
	fastify.post("/links/batch-status", batchRateLimitConfig, linkController.batchUpdateLinkStatus);
}
