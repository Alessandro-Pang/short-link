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

  // 用户信息
  fastify.get("/user", authController.getCurrentUser);

  // 用户身份管理
  fastify.get("/user/identities", userController.getUserIdentities);
  fastify.post("/user/identities", userController.bindIdentity);
  fastify.delete("/user/identities/:provider", userController.unbindIdentity);
  fastify.delete("/user/account", userController.deleteAccount);

  // 短链接统计
  fastify.get("/stats", linkController.getUserStats);

  // 短链接管理
  fastify.get("/links", linkController.getUserLinks);
  fastify.get("/links/:id", linkController.getLinkDetails);
  fastify.get("/links/:id/access-logs", linkController.getLinkAccessLogs);
  fastify.put("/links/:id", linkController.updateLink);
  fastify.patch("/links/:id/status", linkController.toggleLinkStatus);
  fastify.delete("/links/:id", linkController.deleteLink);

  // 批量操作
  fastify.post("/links/batch-delete", linkController.batchDeleteLinks);
  fastify.post("/links/batch-status", linkController.batchUpdateLinkStatus);
}
