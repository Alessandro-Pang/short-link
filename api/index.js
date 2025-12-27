/*
 * @Author: zi.yang
 * @Date: 2024-12-13 17:38:41
 * @LastEditors: zi.yang
 * @LastEditTime: 2025-12-27 21:00:00
 * @Description: Fastify 后端 API - 集成 Supabase Auth 和完整功能
 * @FilePath: /short-link/api/index.js
 */
import Fastify from "fastify";
import cors from "@fastify/cors";
import * as linkService from "../service/link.js";
import * as authService from "../service/auth.js";
import * as dashboardService from "../service/dashboard.js";

const app = Fastify({
  logger: true,
});

// 启用 CORS
await app.register(cors, {
  origin: true,
  credentials: true,
});

// ============================================
// 认证中间件
// ============================================
async function authenticate(request, reply) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      reply.status(401).send({
        code: 401,
        msg: "未授权：缺少认证令牌",
      });
      return;
    }

    const token = authHeader.substring(7);
    const user = await authService.verifyToken(token);

    if (!user) {
      reply.status(401).send({
        code: 401,
        msg: "未授权：无效的令牌",
      });
      return;
    }

    request.user = user;
  } catch (error) {
    reply.status(401).send({
      code: 401,
      msg: "未授权：" + error.message,
    });
  }
}

// ============================================
// 认证相关接口
// ============================================

// 获取当前用户信息
app.get("/api/auth/user", { preHandler: authenticate }, async (req, reply) => {
  return reply.send({
    code: 200,
    msg: "success",
    data: req.user,
  });
});

// 验证 token
app.post("/api/auth/verify", async (req, reply) => {
  try {
    const { token } = req.body;
    if (!token) {
      return reply.send({
        code: 401,
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
    return reply.send({
      code: 401,
      msg: error.message,
    });
  }
});

// ============================================
// 短链接相关接口
// ============================================

// 创建短链接
app.post("/api/addUrl", async (req, reply) => {
  const url = req.body?.url;
  if (!url) {
    return reply.send({
      code: 401,
      msg: "URL 是必填参数",
    });
  }

  // 验证URL格式
  const urlPattern = /^(https?:\/\/|#小程序:\/\/).+/;
  if (!urlPattern.test(url)) {
    return reply.send({
      code: 401,
      msg: "URL 格式不正确，必须以 http://、https:// 或 #小程序:// 开头",
    });
  }

  try {
    // 尝试获取用户信息（如果有 token）
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        const user = await authService.verifyToken(token);
        userId = user?.id;
      } catch (e) {
        // 忽略认证错误，继续创建匿名链接
        console.log("创建匿名短链接");
      }
    }

    const result = await linkService.addUrl(url, userId);

    if (result.error) {
      return reply.send({
        code: 401,
        msg: result.error.message || "未知错误",
      });
    }

    return reply.send({
      code: 200,
      msg: "success",
      url: `/u/${result.data.short}`,
      data: result.data,
    });
  } catch (error) {
    console.error("创建短链接失败:", error);
    return reply.send({
      code: 500,
      msg: error.message || "服务器错误",
    });
  }
});

// 短链接重定向
app.get("/u/:hash", async (req, reply) => {
  if (req.params?.hash) {
    try {
      const result = await linkService.getUrl(req.params.hash);

      if (!result || !result.data || result.error) {
        return reply.send({
          code: 404,
          msg: result?.error?.message || "短链接不存在",
        });
      }

      // 记录访问日志
      const accessInfo = {
        ip_address: req.ip,
        user_agent: req.headers["user-agent"],
        referrer: req.headers.referer || req.headers.referrer,
      };
      await linkService.logAccess(result.data.id, accessInfo);

      return reply.status(302).redirect(result.data.link);
    } catch (error) {
      console.error("重定向失败:", error);
      return reply.send({
        code: 404,
        msg: error.message || "短链接不存在",
      });
    }
  }

  return reply.send({
    code: 404,
    msg: "短链接不存在",
  });
});

// ============================================
// Dashboard 相关接口（需要认证）
// ============================================

// 获取用户统计数据
app.get(
  "/api/dashboard/stats",
  { preHandler: authenticate },
  async (req, reply) => {
    try {
      const stats = await dashboardService.getUserStats(req.user.id);

      return reply.send({
        code: 200,
        msg: "success",
        data: stats,
      });
    } catch (error) {
      console.error("获取统计数据失败:", error);
      return reply.send({
        code: 500,
        msg: error.message || "获取统计数据失败",
      });
    }
  },
);

// 获取用户链接列表
app.get(
  "/api/dashboard/links",
  { preHandler: authenticate },
  async (req, reply) => {
    try {
      const {
        limit = 50,
        offset = 0,
        orderBy = "created_at",
        ascending = false,
      } = req.query;

      const result = await dashboardService.getUserLinks(req.user.id, {
        limit: parseInt(limit),
        offset: parseInt(offset),
        orderBy,
        ascending: ascending === "true",
      });

      return reply.send({
        code: 200,
        msg: "success",
        data: result,
      });
    } catch (error) {
      console.error("获取链接列表失败:", error);
      return reply.send({
        code: 500,
        msg: error.message || "获取链接列表失败",
      });
    }
  },
);

// 获取链接访问日志
app.get(
  "/api/dashboard/links/:linkId/logs",
  { preHandler: authenticate },
  async (req, reply) => {
    try {
      const { linkId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const result = await dashboardService.getLinkAccessLogs(
        parseInt(linkId),
        req.user.id,
        {
          limit: parseInt(limit),
          offset: parseInt(offset),
        },
      );

      return reply.send({
        code: 200,
        msg: "success",
        data: result,
      });
    } catch (error) {
      console.error("获取访问日志失败:", error);
      return reply.send({
        code: 500,
        msg: error.message || "获取访问日志失败",
      });
    }
  },
);

// 更新链接
app.put(
  "/api/dashboard/links/:linkId",
  { preHandler: authenticate },
  async (req, reply) => {
    try {
      const { linkId } = req.params;
      const updates = req.body;

      const result = await dashboardService.updateLink(
        parseInt(linkId),
        req.user.id,
        updates,
      );

      return reply.send({
        code: 200,
        msg: "success",
        data: result,
      });
    } catch (error) {
      console.error("更新链接失败:", error);
      return reply.send({
        code: 500,
        msg: error.message || "更新链接失败",
      });
    }
  },
);

// 删除链接
app.delete(
  "/api/dashboard/links/:linkId",
  { preHandler: authenticate },
  async (req, reply) => {
    try {
      const { linkId } = req.params;

      await dashboardService.deleteLink(parseInt(linkId), req.user.id);

      return reply.send({
        code: 200,
        msg: "success",
      });
    } catch (error) {
      console.error("删除链接失败:", error);
      return reply.send({
        code: 500,
        msg: error.message || "删除链接失败",
      });
    }
  },
);

// ============================================
// 健康检查
// ============================================
app.get("/api/health", async (req, reply) => {
  return reply.send({
    code: 200,
    msg: "OK",
    data: {
      status: "healthy",
      timestamp: new Date().toISOString(),
    },
  });
});

// ============================================
// Vercel 导出
// ============================================
export default async function handler(req, reply) {
  await app.ready();
  app.server.emit("request", req, reply);
}

// ============================================
// 本地开发启动
// ============================================
if (process.env.NODE_ENV !== "production") {
  const start = async () => {
    try {
      await app.listen({ port: 3000, host: "0.0.0.0" });
      console.log(`🚀 Server listening on http://localhost:3000`);
      console.log("📝 API Endpoints:");
      console.log("  - POST   /api/addUrl");
      console.log("  - GET    /u/:hash");
      console.log("  - GET    /api/auth/user");
      console.log("  - POST   /api/auth/verify");
      console.log("  - GET    /api/dashboard/stats");
      console.log("  - GET    /api/dashboard/links");
      console.log("  - GET    /api/dashboard/links/:linkId/logs");
      console.log("  - PUT    /api/dashboard/links/:linkId");
      console.log("  - DELETE /api/dashboard/links/:linkId");
    } catch (err) {
      app.log.error(err);
      process.exit(1);
    }
  };
  start();
}
