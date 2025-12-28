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
  fastify.post(
    "/addUrl",
    { preHandler: optionalAuthenticate },
    linkController.createShortLink,
  );

  // 登录日志
  fastify.post("/log-login-attempt", authController.logLoginAttempt);

  // 健康检查已移至 index.js 的根路径 /health，包含真实的数据库连接检查
}
