/*
 * @Author: zi.yang
 * @Date: 2024-12-13 17:38:41
 * @LastEditors: zi.yang
 * @LastEditTime: 2025-12-29 00:00:00
 * @Description: Fastify 后端 API - 重构版
 * @FilePath: /short-link/api/index
 */
import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import dayjs from "dayjs";
import * as linkController from "./controllers/link.js";
import apiRoutes from "./routes/api.js";
import dashboardRoutes from "./routes/dashboard.js";
import adminRoutes from "./routes/admin.js";
import { checkHealth } from "./database/client.js";
import { CORS_CONFIG, RATE_LIMIT_CONFIG, ENV } from "./config/index.js";
import { registerErrorHandlers } from "./middlewares/errorHandler.js";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import { customAlphabet } from "nanoid";
const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 10);

const app = Fastify({
  logger: {
    level: ENV.IS_PRODUCTION ? "info" : "debug",
    transport: ENV.IS_DEVELOPMENT
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        }
      : undefined,
  },
  // 请求 ID 生成
  genReqId: () => `req::${Date.now()}:${nanoid()}`,
  // 信任代理（用于正确获取客户端 IP）
  trustProxy: true,
});

// 注册全局错误处理器
registerErrorHandlers(app);

app.register(swagger, {
  openapi: {
    info: {
      title: "API",
      version: "1.0.0",
    },
  },
});

// 仅开发环境注册 UI
if (process.env.NODE_ENV !== "production") {
  app.register(swaggerUI, {
    routePrefix: "/api/docs",
    uiConfig: {
      docExpansion: "list",
      tryItOutEnabled: true,
    },
  });
}

// 启用 CORS
app.register(cors as any, {
  origin: (origin, cb) => {
    // 允许无 origin 的请求（如服务端请求、curl 等）
    if (!origin) {
      cb(null, true);
      return;
    }

    if (
      CORS_CONFIG.ALLOWED_ORIGINS.length === 0 ||
      CORS_CONFIG.ALLOWED_ORIGINS.includes(origin)
    ) {
      cb(null, true);
    } else {
      // 记录被拒绝的跨域请求
      app.log.warn(`CORS rejected origin: ${origin}`);
      cb(new Error("Not allowed by CORS"), false);
    }
  },
  credentials: CORS_CONFIG.CREDENTIALS,
  methods: CORS_CONFIG.METHODS,
  allowedHeaders: CORS_CONFIG.ALLOWED_HEADERS,
  exposedHeaders: CORS_CONFIG.EXPOSED_HEADERS,
  maxAge: CORS_CONFIG.MAX_AGE,
});

// 注册 @fastify/rate-limit 插件
app.register(rateLimit as any, {
  global: true,
  max: RATE_LIMIT_CONFIG.GLOBAL.MAX,
  timeWindow: RATE_LIMIT_CONFIG.GLOBAL.TIME_WINDOW,
  addHeaders: {
    "x-ratelimit-limit": RATE_LIMIT_CONFIG.ADD_HEADERS,
    "x-ratelimit-remaining": RATE_LIMIT_CONFIG.ADD_HEADERS,
    "x-ratelimit-reset": RATE_LIMIT_CONFIG.ADD_HEADERS,
    "retry-after": RATE_LIMIT_CONFIG.ADD_RETRY_AFTER_HEADER,
  },
  // 自定义错误响应
  errorResponseBuilder: (_request, context) => {
    return {
      code: 429,
      msg: "请求过于频繁，请稍后再试",
      retryAfter: Math.ceil(context.ttl / 1000),
    };
  },
  // 从请求中获取唯一标识（IP 地址）
  keyGenerator: (request) => {
    const forwardedFor = request.headers["x-forwarded-for"];
    const forwardedIp =
      typeof forwardedFor === "string"
        ? forwardedFor.split(",")[0]?.trim()
        : Array.isArray(forwardedFor)
          ? forwardedFor[0]?.trim()
          : undefined;

    return forwardedIp || request.headers["x-real-ip"] || request.ip;
  },
  // 跳过某些请求的速率限制
  skipOnError: (request) => {
    // 健康检查端点不限制
    if (request.url === "/health") {
      return true;
    }
    return false;
  },
});

// 注册短链接重定向路由（独立于 API 路由组）
// 为重定向接口设置更宽松的速率限制
app.get(
  "/u/:hash",
  {
    config: {
      rateLimit: {
        max: 200,
        timeWindow: "1 minute",
      },
    },
  },
  linkController.redirectShortLink,
);

// 注册路由组
app.register(apiRoutes, { prefix: "/api" });
app.register(dashboardRoutes, { prefix: "/api/dashboard" });
app.register(adminRoutes, { prefix: "/api/admin" });

/**
 * 真实的健康检查端点
 * 检查数据库连接状态
 */
app.get("/health", async (_request, reply) => {
  const dbHealth = await checkHealth();

  const status = dbHealth.healthy ? "healthy" : "unhealthy";
  const httpStatus = dbHealth.healthy ? 200 : 503;

  return reply.status(httpStatus).send({
    code: httpStatus,
    msg: dbHealth.healthy ? "Service is running" : "Service is degraded",
    data: {
      status,
      timestamp: dayjs().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
      environment: ENV.NODE_ENV,
      checks: {
        database: dbHealth.healthy ? "ok" : "error",
        ...(dbHealth.error && { databaseError: dbHealth.error }),
      },
    },
  });
});

/**
 * 根路径
 */
app.get("/", async (_request, reply) => {
  return reply.send({
    code: 200,
    msg: "Short Link API",
    data: {
      version: process.env.npm_package_version || "1.0.0",
      docs: "/api/docs",
    },
  });
});

// Vercel 导出
export default async function handler(req, reply) {
  await app.ready();
  app.server.emit("request", req, reply);
}

// 本地开发启动
if (ENV.IS_DEVELOPMENT) {
  const start = async () => {
    try {
      await app.listen({ port: ENV.PORT, host: "0.0.0.0" });
      console.log(`🚀 Server listening on http://localhost:${ENV.PORT}`);
    } catch (err) {
      app.log.error(err);
      process.exit(1);
    }
  };
  start();
}
