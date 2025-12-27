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

// 可选认证中间件（不强制要求登录）
async function optionalAuthenticate(request, reply) {
  try {
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const user = await authService.verifyToken(token);
      request.user = user;
    }
  } catch (error) {
    // 忽略认证错误，继续处理请求
    console.log("可选认证失败，继续处理请求");
  }
}

// ============================================
// 辅助函数
// ============================================

/**
 * 获取客户端真实 IP
 */
function getClientIp(request) {
  return (
    request.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    request.headers["x-real-ip"] ||
    request.ip ||
    "unknown"
  );
}

/**
 * 构建需要转发的 Headers
 */
function buildForwardHeaders(request, forwardHeaderList) {
  if (!forwardHeaderList || forwardHeaderList.length === 0) {
    return {};
  }

  const headers = {};
  for (const headerName of forwardHeaderList) {
    const lowerName = headerName.toLowerCase();
    if (request.headers[lowerName]) {
      headers[headerName] = request.headers[lowerName];
    }
  }
  return headers;
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

// 获取过期时间选项
app.get("/api/expiration-options", async (req, reply) => {
  try {
    const result = await linkService.getExpirationOptions();

    if (result.error) {
      return reply.send({
        code: 500,
        msg: result.error.message || "获取过期时间选项失败",
      });
    }

    return reply.send({
      code: 200,
      msg: "success",
      data: result.data,
    });
  } catch (error) {
    console.error("获取过期时间选项失败:", error);
    return reply.send({
      code: 500,
      msg: error.message || "服务器错误",
    });
  }
});

// 创建短链接（支持高级配置）
app.post(
  "/api/addUrl",
  { preHandler: optionalAuthenticate },
  async (req, reply) => {
    const { url, options = {} } = req.body || {};
    const inputUrl = url || req.body?.url;
    const userId = req.user?.id || null;

    // 未登录用户不允许使用高级配置
    if (!userId) {
      const hasAdvancedOptions =
        options.title ||
        options.expiration_option_id ||
        options.redirect_type !== 302 ||
        options.max_clicks ||
        options.pass_query_params ||
        options.forward_headers ||
        options.access_restrictions;

      if (hasAdvancedOptions) {
        return reply.send({
          code: 401,
          msg: "登录后才能使用高级配置功能",
        });
      }
    }

    if (!inputUrl) {
      return reply.send({
        code: 401,
        msg: "URL 是必填参数",
      });
    }

    // 验证URL格式
    const urlPattern = /^(https?:\/\/|#小程序:\/\/).+/;
    if (!urlPattern.test(inputUrl)) {
      return reply.send({
        code: 401,
        msg: "URL 格式不正确，必须以 http://、https:// 或 #小程序:// 开头",
      });
    }

    // 验证重定向类型
    if (
      options.redirect_type &&
      ![301, 302, 307, 308].includes(options.redirect_type)
    ) {
      return reply.send({
        code: 401,
        msg: "重定向类型必须是 301、302、307 或 308",
      });
    }

    // 验证最大点击次数
    if (options.max_clicks !== undefined && options.max_clicks !== null) {
      const maxClicks = parseInt(options.max_clicks);
      if (isNaN(maxClicks) || maxClicks < 1) {
        return reply.send({
          code: 401,
          msg: "最大点击次数必须是大于0的整数",
        });
      }
      options.max_clicks = maxClicks;
    }

    // 验证访问限制配置
    if (options.access_restrictions) {
      const restrictions = options.access_restrictions;

      // 验证 IP 列表格式
      if (
        restrictions.ip_whitelist &&
        !Array.isArray(restrictions.ip_whitelist)
      ) {
        return reply.send({
          code: 401,
          msg: "IP 白名单必须是数组格式",
        });
      }
      if (
        restrictions.ip_blacklist &&
        !Array.isArray(restrictions.ip_blacklist)
      ) {
        return reply.send({
          code: 401,
          msg: "IP 黑名单必须是数组格式",
        });
      }

      // 验证设备类型
      if (restrictions.allowed_devices) {
        if (!Array.isArray(restrictions.allowed_devices)) {
          return reply.send({
            code: 401,
            msg: "允许的设备类型必须是数组格式",
          });
        }
        const validDevices = ["mobile", "tablet", "desktop"];
        for (const device of restrictions.allowed_devices) {
          if (!validDevices.includes(device)) {
            return reply.send({
              code: 401,
              msg: `无效的设备类型: ${device}，有效值为: ${validDevices.join(", ")}`,
            });
          }
        }
      }
    }

    try {
      const result = await linkService.addUrl(inputUrl, userId, options);

      if (result.error) {
        // 处理重复链接的特殊错误码
        if (result.error.code === "DUPLICATE_LINK") {
          return reply.send({
            code: 409, // Conflict
            msg: result.error.message,
            existingLink: result.error.existingLink,
          });
        }
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
  },
);

// 短链接重定向
app.get("/u/:hash", async (req, reply) => {
  if (!req.params?.hash) {
    return reply.send({
      code: 404,
      msg: "短链接不存在",
    });
  }

  try {
    // 收集访问者信息
    const visitorInfo = {
      ip: getClientIp(req),
      userAgent: req.headers["user-agent"],
      referrer: req.headers.referer || req.headers.referrer,
      country: req.headers["cf-ipcountry"] || null, // Cloudflare 提供的国家代码
    };

    const result = await linkService.getUrl(req.params.hash, visitorInfo);

    if (!result || !result.data || result.error) {
      // 返回友好的错误页面或 JSON
      const errorMsg = result?.error?.message || "短链接不存在";

      // 检查是否需要返回 HTML 错误页面
      const acceptHeader = req.headers.accept || "";
      if (acceptHeader.includes("text/html")) {
        return reply.status(404).type("text/html").send(`
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>链接无效</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f5f5f5; }
                .container { text-align: center; padding: 40px; background: white; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 400px; }
                h1 { color: #e74c3c; margin-bottom: 16px; }
                p { color: #666; margin-bottom: 24px; }
                a { color: #3498db; text-decoration: none; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>😕 链接无效</h1>
                <p>${errorMsg}</p>
                <a href="/">返回首页</a>
              </div>
            </body>
            </html>
          `);
      }

      return reply.send({
        code: 404,
        msg: errorMsg,
      });
    }

    const linkData = result.data;

    // 记录访问日志
    const accessInfo = {
      ip_address: visitorInfo.ip,
      user_agent: visitorInfo.userAgent,
      referrer: visitorInfo.referrer,
      country: visitorInfo.country,
    };
    await linkService.logAccess(linkData.id, accessInfo);

    // 构建最终重定向 URL
    let targetUrl = linkData.link;

    // 处理 URL 参数透传
    if (linkData.pass_query_params) {
      const queryString = req.url.split("?")[1];
      if (queryString) {
        targetUrl = linkService.buildRedirectUrl(targetUrl, queryString, true);
      }
    }

    // 处理 Header 转发（通过 Location header 无法直接转发，需要代理请求）
    // 这里我们将转发信息记录到日志，实际转发需要代理实现
    if (linkData.forward_headers && linkData.forward_header_list?.length > 0) {
      const forwardedHeaders = buildForwardHeaders(
        req,
        linkData.forward_header_list,
      );
      console.log("需要转发的 Headers:", forwardedHeaders);
      // 注意：标准的 HTTP 重定向无法转发 headers
      // 如果需要真正的 header 转发，需要使用服务端代理
    }

    // 获取重定向状态码
    const redirectType = linkData.redirect_type || 302;

    return reply.status(redirectType).redirect(targetUrl);
  } catch (error) {
    console.error("重定向失败:", error);
    return reply.send({
      code: 404,
      msg: error.message || "短链接不存在",
    });
  }
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

// 获取单个链接详情
app.get(
  "/api/dashboard/links/:linkId",
  { preHandler: authenticate },
  async (req, reply) => {
    try {
      const { linkId } = req.params;

      const result = await dashboardService.getLinkDetail(
        parseInt(linkId),
        req.user.id,
      );

      if (!result) {
        return reply.send({
          code: 404,
          msg: "链接不存在或无权访问",
        });
      }

      return reply.send({
        code: 200,
        msg: "success",
        data: result,
      });
    } catch (error) {
      console.error("获取链接详情失败:", error);
      return reply.send({
        code: 500,
        msg: error.message || "获取链接详情失败",
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

      // 验证重定向类型
      if (
        updates.redirect_type &&
        ![301, 302, 307, 308].includes(updates.redirect_type)
      ) {
        return reply.send({
          code: 401,
          msg: "重定向类型必须是 301、302、307 或 308",
        });
      }

      // 验证最大点击次数
      if (updates.max_clicks !== undefined && updates.max_clicks !== null) {
        const maxClicks = parseInt(updates.max_clicks);
        if (isNaN(maxClicks) || maxClicks < 1) {
          return reply.send({
            code: 401,
            msg: "最大点击次数必须是大于0的整数",
          });
        }
        updates.max_clicks = maxClicks;
      }

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

// 切换链接启用状态
app.patch(
  "/api/dashboard/links/:linkId/toggle",
  { preHandler: authenticate },
  async (req, reply) => {
    try {
      const { linkId } = req.params;
      const { is_active } = req.body;

      if (typeof is_active !== "boolean") {
        return reply.send({
          code: 401,
          msg: "is_active 必须是布尔值",
        });
      }

      const result = await dashboardService.updateLink(
        parseInt(linkId),
        req.user.id,
        { is_active },
      );

      return reply.send({
        code: 200,
        msg: is_active ? "链接已启用" : "链接已禁用",
        data: result,
      });
    } catch (error) {
      console.error("切换链接状态失败:", error);
      return reply.send({
        code: 500,
        msg: error.message || "切换链接状态失败",
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
      console.log("  - GET    /api/expiration-options");
      console.log("  - GET    /api/auth/user");
      console.log("  - POST   /api/auth/verify");
      console.log("  - GET    /api/dashboard/stats");
      console.log("  - GET    /api/dashboard/links");
      console.log("  - GET    /api/dashboard/links/:linkId");
      console.log("  - GET    /api/dashboard/links/:linkId/logs");
      console.log("  - PUT    /api/dashboard/links/:linkId");
      console.log("  - PATCH  /api/dashboard/links/:linkId/toggle");
      console.log("  - DELETE /api/dashboard/links/:linkId");
    } catch (err) {
      app.log.error(err);
      process.exit(1);
    }
  };
  start();
}
