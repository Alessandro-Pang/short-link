import * as authService from "../../service/auth.js";
import * as loginLogService from "../../service/login-log.js";
import { getClientIp } from "../middlewares/utils.js";

/**
 * 验证 Token
 */
export async function validateToken(request, reply) {
  try {
    const { token } = request.body;
    if (!token) {
      return reply.status(400).send({
        code: 400,
        msg: "缺少 token",
      });
    }

    const user = await authService.verifyToken(token);
    return reply.send({
      code: 200,
      msg: "success",
      data: { user, valid: !!user },
    });
  } catch (error) {
    return reply.status(401).send({
      code: 401,
      msg: error.message,
    });
  }
}

/**
 * 记录登录尝试
 */
export async function logLoginAttempt(request, reply) {
  try {
    const { email, success, failure_reason, login_method, user_agent } =
      request.body;

    if (!email) {
      return reply.status(400).send({
        code: 400,
        msg: "Email is required",
      });
    }

    let userId = null;
    if (success) {
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        try {
          const token = authHeader.substring(7);
          const user = await authService.verifyToken(token);
          if (user && user.id) {
            userId = user.id;
          }
        } catch (err) {
          request.log.warn("Failed to extract user from token:", err.message);
        }
      }
    }

    const ipAddress = getClientIp(request);

    await loginLogService.recordLoginAttempt({
      user_id: userId,
      email,
      ip_address: ipAddress,
      user_agent: user_agent || request.headers["user-agent"],
      success: success || false,
      failure_reason: failure_reason || null,
      login_method: login_method || "unknown",
    });

    return reply.send({
      code: 200,
      msg: "Login attempt recorded",
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      code: 500,
      msg: "Failed to record login attempt",
    });
  }
}

/**
 * 获取当前用户信息
 */
export async function getCurrentUser(request, reply) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.status(401).send({
        code: 401,
        msg: "Missing or invalid authorization header",
      });
    }

    const token = authHeader.substring(7);
    const user = await authService.verifyToken(token);

    if (!user || !user.id) {
      return reply.status(401).send({
        code: 401,
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

    const isBanned = userData.banned || false;
    const ipAddress = getClientIp(request);

    // 记录登录尝试（失败不应阻止用户获取信息）
    try {
      await loginLogService.recordLoginAttempt({
        user_id: user.id,
        email: user.email,
        ip_address: ipAddress,
        user_agent: request.headers["user-agent"],
        success: !isBanned,
        failure_reason: isBanned ? "User is banned" : null,
        login_method: "jwt",
      });
    } catch (logError) {
      request.log.warn("Failed to log login attempt:", logError);
    }

    if (isBanned) {
      return reply.status(403).send({
        code: 403,
        msg: "Your account has been banned",
        banned: true,
      });
    }

    return reply.send({
      code: 200,
      msg: "User data retrieved successfully",
      data: {
        id: userData.id,
        email: user.email,
        is_admin: userData.is_admin || false,
        isAdmin: userData.is_admin || false, // 前端使用的驼峰命名
        ...userData,
      },
    });
  } catch (error) {
    request.log.error("getCurrentUser error:", error);
    return reply.status(500).send({
      code: 500,
      msg: error.message || "Failed to retrieve user data",
      data: {
        status: "error",
        timestamp: new Date().toISOString(),
      },
    });
  }
}
