import * as authController from "../controllers/auth.js";
import { authenticate } from "../middlewares/auth.js";
import * as authService from "../services/auth.js";

/**
 * Debug 路由组 - 用于调试和检查用户状态
 */
export default async function debugRoutes(fastify) {
  // 调试用户信息 - 显示完整的认证数据
  fastify.get("/me", { preHandler: authenticate }, async (request, reply) => {
    return reply.send({
      code: "SUCCESS",
      msg: "Debug user info",
      data: {
        user: request.user,
        hasIsAdmin: "is_admin" in request.user,
        isAdminValue: request.user.is_admin,
        isAdminType: typeof request.user.is_admin,
      },
    });
  });

  // 调试接口 - 通过 query 参数传递 token (无需 Authorization header)
  fastify.get("/token-info", async (request, reply) => {
    try {
      const token = request.query.token;
      if (!token) {
        return reply.status(400).send({
          code: 400,
          msg: "Please provide token in query parameter: /api/debug/token-info?token=YOUR_TOKEN",
        });
      }

      const user = await authService.verifyToken(token);
      const userProfile = await authService.getUserById(user.id);

      return reply.send({
        code: 200,
        msg: "Token debug info",
        data: {
          authUser: {
            id: user.id,
            email: user.email,
            raw: user,
          },
          userProfile: userProfile,
          hasProfile: !!userProfile,
          profileKeys: userProfile ? Object.keys(userProfile) : [],
          hasIsAdmin: userProfile ? "is_admin" in userProfile : false,
          isAdminValue: userProfile?.is_admin,
          isAdminType: typeof userProfile?.is_admin,
          finalUserData: userProfile || {
            id: user.id,
            email: user.email,
            is_admin: false,
            banned: false,
          },
        },
      });
    } catch (error) {
      return reply.status(500).send({
        code: 500,
        msg: error.message,
        stack: error.stack,
      });
    }
  });

  // 获取当前用户信息（完整版）
  fastify.get("/user", authController.getCurrentUser);
}
