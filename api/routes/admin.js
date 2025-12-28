import * as adminController from "../controllers/admin.js";
import { authenticateAdmin } from "../middlewares/auth.js";

/**
 * Admin 路由组 - 需要管理员权限
 */
export default async function adminRoutes(fastify) {
  // 所有 admin 路由都需要管理员认证
  fastify.addHook("preHandler", authenticateAdmin);

  // 系统统计
  fastify.get("/stats", adminController.getAdminStats);

  // 短链接管理
  fastify.get("/links", adminController.getAllLinks);
  fastify.get("/links/:id", adminController.getLinkDetails);
  fastify.get("/links/:id/access-logs", adminController.getLinkAccessLogs);
  fastify.put("/links/:id", adminController.updateLink);
  fastify.patch("/links/:id/status", adminController.toggleLinkStatus);
  fastify.delete("/links/:id", adminController.deleteLink);

  // 批量操作
  fastify.post("/links/batch-delete", adminController.batchDeleteLinks);
  fastify.post("/links/batch-status", adminController.batchUpdateLinkStatus);

  // 用户管理
  fastify.get("/users", adminController.getAllUsers);
  fastify.get("/users/:id", adminController.getUserDetails);
  fastify.post("/users", adminController.createUser);
  fastify.put("/users/:id", adminController.updateUser);
  fastify.delete("/users/:id", adminController.deleteUser);
  fastify.post("/users/:id/reset-password", adminController.resetPassword);
  fastify.patch("/users/:id/ban-status", adminController.toggleBanStatus);

  // 日志管理
  fastify.get("/logs/login", adminController.getLoginLogs);
  fastify.get("/logs/access", adminController.getAccessLogs);
  fastify.get("/login/stats", adminController.getLoginStats);
}
