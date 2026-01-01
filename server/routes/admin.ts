/*
 * @Author: zi.yang
 * @Date: 2025-12-29 00:00:00
 * @LastEditors: zi.yang
 * @LastEditTime: 2025-12-29 00:00:00
 * @Description: Admin 路由组 - 需要管理员权限
 * @FilePath: /short-link/api/routes/admin.js
 */

import * as adminController from "../controllers/admin.js";
import { authenticateAdmin } from "../middlewares/auth.js";
import { RATE_LIMIT_CONFIG } from "../config/index.js";

/**
 * Admin 路由组 - 需要管理员权限
 */
export default async function adminRoutes(fastify) {
  // 为所有管理员路由配置速率限制
  const adminRateLimitConfig = {
    config: {
      rateLimit: {
        max: RATE_LIMIT_CONFIG.ADMIN.MAX,
        timeWindow: RATE_LIMIT_CONFIG.ADMIN.TIME_WINDOW,
        errorResponseBuilder: (_request, context) => {
          return {
            code: 429,
            msg: "管理员操作过于频繁，请稍后再试",
            retryAfter: Math.ceil(context.ttl / 1000),
          };
        },
      },
    },
  };

  // 所有 admin 路由都需要管理员认证
  fastify.addHook("preHandler", authenticateAdmin);

  // 系统统计
  fastify.get("/stats", adminRateLimitConfig, adminController.getAdminStats);

  // 排行榜
  fastify.get("/top-links", adminRateLimitConfig, adminController.getTopLinks);

  // 短链接管理
  fastify.get("/links", adminRateLimitConfig, adminController.getAllLinks);
  fastify.get(
    "/links/:id",
    adminRateLimitConfig,
    adminController.getLinkDetails,
  );
  fastify.get(
    "/links/:id/access-logs",
    adminRateLimitConfig,
    adminController.getLinkAccessLogs,
  );
  fastify.put("/links/:id", adminRateLimitConfig, adminController.updateLink);
  fastify.patch(
    "/links/:id/status",
    adminRateLimitConfig,
    adminController.toggleLinkStatus,
  );
  fastify.delete(
    "/links/:id",
    adminRateLimitConfig,
    adminController.deleteLink,
  );

  // 批量操作 - 更严格的限制
  const batchRateLimitConfig = {
    config: {
      rateLimit: {
        max: 20, // 批量操作每分钟最多 20 次
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
  fastify.post(
    "/links/batch-delete",
    batchRateLimitConfig,
    adminController.batchDeleteLinks,
  );
  fastify.post(
    "/links/batch-status",
    batchRateLimitConfig,
    adminController.batchUpdateLinkStatus,
  );

  // 用户管理
  fastify.get("/users", adminRateLimitConfig, adminController.getAllUsers);
  fastify.get(
    "/users/:id",
    adminRateLimitConfig,
    adminController.getUserDetails,
  );
  fastify.post("/users", adminRateLimitConfig, adminController.createUser);
  fastify.put("/users/:id", adminRateLimitConfig, adminController.updateUser);
  fastify.delete(
    "/users/:id",
    adminRateLimitConfig,
    adminController.deleteUser,
  );
  fastify.post(
    "/users/:id/reset-password",
    adminRateLimitConfig,
    adminController.resetPassword,
  );
  fastify.patch(
    "/users/:id/ban-status",
    adminRateLimitConfig,
    adminController.toggleBanStatus,
  );

  // 日志管理
  fastify.get(
    "/logs/login",
    adminRateLimitConfig,
    adminController.getLoginLogs,
  );
  fastify.get(
    "/logs/access",
    adminRateLimitConfig,
    adminController.getAccessLogs,
  );
  fastify.get(
    "/login/stats",
    adminRateLimitConfig,
    adminController.getLoginStats,
  );
}
