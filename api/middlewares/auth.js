import * as authService from "../../service/auth.js";

/**
 * 认证中间件 - 必须提供有效的 token
 */
export async function authenticate(request, reply) {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.status(401).send({
        code: "UNAUTHORIZED",
        msg: "Missing or invalid authorization header",
      });
    }

    const token = authHeader.substring(7);
    const user = await authService.verifyToken(token);

    if (!user || !user.id) {
      return reply.status(401).send({
        code: "UNAUTHORIZED",
        msg: "Invalid token",
      });
    }

    // 获取用户详细信息（从 user_profiles 表）
    const userProfile = await authService.getUserById(user.id);

    // 如果 user_profiles 没有数据，使用 auth user 数据
    const userData = userProfile || {
      id: user.id,
      email: user.email,
      is_admin: false,
      banned: false,
    };

    request.user = userData;
  } catch (error) {
    request.log.error("Authentication error:", error);
    return reply.status(401).send({
      code: "UNAUTHORIZED",
      msg: error.message || "Authentication failed",
    });
  }
}

/**
 * 可选认证中间件 - 如果提供 token 则验证，否则继续
 */
export async function optionalAuthenticate(request, reply) {
  try {
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const user = await authService.verifyToken(token);
      if (user && user.id) {
        const userProfile = await authService.getUserById(user.id);
        const userData = userProfile || {
          id: user.id,
          email: user.email,
          is_admin: false,
          banned: false,
        };
        request.user = userData;
      }
    }
  } catch (error) {
    // 可选认证失败不阻止请求
    request.log.warn("Optional authentication failed:", error.message);
  }
}

/**
 * 认证并检查管理员权限
 */
export async function authenticateWithAdminCheck(request, reply) {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.status(401).send({
        code: "UNAUTHORIZED",
        msg: "Missing or invalid authorization header",
      });
    }

    const token = authHeader.substring(7);
    const user = await authService.verifyToken(token);

    if (!user || !user.id) {
      return reply.status(401).send({
        code: "UNAUTHORIZED",
        msg: "Invalid token",
      });
    }

    const userProfile = await authService.getUserById(user.id);
    const userData = userProfile || {
      id: user.id,
      email: user.email,
      is_admin: false,
      banned: false,
    };

    request.user = userData;

    if (!userData.is_admin) {
      return reply.status(403).send({
        code: "FORBIDDEN",
        msg: "Admin access required",
      });
    }
  } catch (error) {
    request.log.error("Admin authentication error:", error);
    return reply.status(401).send({
      code: "UNAUTHORIZED",
      msg: error.message || "Authentication failed",
    });
  }
}

/**
 * 仅管理员认证中间件
 */
export async function authenticateAdmin(request, reply) {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.status(401).send({
        code: "UNAUTHORIZED",
        msg: "Missing or invalid authorization header",
      });
    }

    const token = authHeader.substring(7);
    const user = await authService.verifyToken(token);

    if (!user || !user.id) {
      return reply.status(401).send({
        code: "UNAUTHORIZED",
        msg: "Invalid token",
      });
    }

    const userProfile = await authService.getUserById(user.id);
    const userData = userProfile || {
      id: user.id,
      email: user.email,
      is_admin: false,
      banned: false,
    };

    if (!userData.is_admin) {
      request.log.warn(
        `User ${user.id} (${user.email}) attempted admin access but is_admin=${userData.is_admin}`,
      );
      return reply.status(403).send({
        code: "FORBIDDEN",
        msg: "Admin access required",
      });
    }

    request.user = userData;
  } catch (error) {
    request.log.error("Admin authentication error:", error);
    return reply.status(401).send({
      code: "UNAUTHORIZED",
      msg: error.message || "Authentication failed",
    });
  }
}
