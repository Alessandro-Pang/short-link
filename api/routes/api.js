import * as authController from "../controllers/auth.js";
import * as linkController from "../controllers/link.js";
import { optionalAuthenticate, authenticate } from "../middlewares/auth.js";

/**
 * API 路由组 - 公开接口
 */
export default async function apiRoutes(fastify) {
  // 认证相关
  fastify.post("/validate-token", authController.validateToken);

  // 兼容旧路由 /api/auth/*
  fastify.get("/auth/user", authController.getCurrentUser);
  fastify.post("/auth/verify", authController.validateToken);

  // 兼容旧路由 /api/account/* -> /api/dashboard/user/*
  const userController = await import("../controllers/user.js");
  fastify.get(
    "/account/identities",
    { preHandler: authenticate },
    userController.getUserIdentities,
  );
  fastify.post(
    "/account/identities",
    { preHandler: authenticate },
    userController.bindIdentity,
  );
  fastify.delete(
    "/account/identities/:provider",
    { preHandler: authenticate },
    userController.unbindIdentity,
  );
  fastify.delete(
    "/account",
    { preHandler: authenticate },
    userController.deleteAccount,
  );

  // 短链接相关
  fastify.get("/expiration-options", linkController.getExpirationOptions);
  fastify.post(
    "/addUrl",
    { preHandler: optionalAuthenticate },
    linkController.createShortLink,
  );

  // 登录日志
  fastify.post("/log-login-attempt", authController.logLoginAttempt);

  // 健康检查
  fastify.get("/health", async (_, reply) => {
    return reply.send({
      code: 200,
      msg: "Service is running",
      data: {
        status: "healthy",
        timestamp: new Date().toISOString(),
      },
    });
  });
}
