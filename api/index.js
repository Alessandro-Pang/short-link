/*
 * @Author: zi.yang
 * @Date: 2024-12-13 17:38:41
 * @LastEditors: zi.yang
 * @LastEditTime: 2025-01-01 00:00:00
 * @Description: Fastify 后端 API
 * @FilePath: /short-link/api/index.js
 */
import Fastify from "fastify";
import cors from "@fastify/cors";
import * as linkController from "./controllers/link.js";
import apiRoutes from "./routes/api.js";
import dashboardRoutes from "./routes/dashboard.js";
import adminRoutes from "./routes/admin.js";
import { checkHealth } from "../service/db.js";

const app = Fastify({
  logger: true,
});

/**
 * CORS 配置 - 安全的域名白名单
 * 生产环境只允许指定域名访问
 */
const ALLOWED_ORIGINS = [
  "https://short.pangcy.cn",
  "https://www.short.pangcy.cn",
];

// 开发环境添加本地地址
if (process.env.NODE_ENV !== "production") {
  ALLOWED_ORIGINS.push(
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
  );
}

// 启用 CORS
await app.register(cors, {
  origin: (origin, cb) => {
    // 允许无 origin 的请求（如服务端请求、curl 等）
    if (!origin) {
      cb(null, true);
      return;
    }

    if (ALLOWED_ORIGINS.includes(origin)) {
      cb(null, true);
    } else {
      // 记录被拒绝的跨域请求
      app.log.warn(`CORS rejected origin: ${origin}`);
      cb(new Error("Not allowed by CORS"), false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: [
    "X-RateLimit-Limit",
    "X-RateLimit-Remaining",
    "X-RateLimit-Reset",
  ],
  maxAge: 86400, // 预检请求缓存 24 小时
});

/**
 * 速率限制配置
 * 使用内存存储（生产环境建议使用 Redis）
 */
const rateLimitStore = new Map();

// 清理过期的速率限制记录（每分钟执行一次）
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000);

/**
 * 速率限制中间件
 * @param {Object} options - 配置选项
 * @param {number} options.max - 时间窗口内最大请求数
 * @param {number} options.timeWindow - 时间窗口（毫秒）
 */
function createRateLimiter(options = {}) {
  const { max = 100, timeWindow = 60000 } = options;

  return async (request, reply) => {
    // 获取客户端 IP
    const clientIp =
      request.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      request.headers["x-real-ip"] ||
      request.ip;

    const key = `${clientIp}:${request.routeOptions?.url || request.url}`;
    const now = Date.now();

    let record = rateLimitStore.get(key);

    if (!record || record.resetTime < now) {
      // 创建新记录或重置过期记录
      record = {
        count: 1,
        resetTime: now + timeWindow,
      };
      rateLimitStore.set(key, record);
    } else {
      record.count++;
    }

    // 设置速率限制响应头
    reply.header("X-RateLimit-Limit", max);
    reply.header("X-RateLimit-Remaining", Math.max(0, max - record.count));
    reply.header("X-RateLimit-Reset", Math.ceil(record.resetTime / 1000));

    if (record.count > max) {
      return reply.status(429).send({
        code: 429,
        msg: "请求过于频繁，请稍后再试",
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
      });
    }
  };
}

// 全局速率限制：每分钟 100 次请求
app.addHook("onRequest", createRateLimiter({ max: 100, timeWindow: 60000 }));

// 短链接创建接口更严格的限制：每分钟 10 次
app.addHook("onRequest", async (request, reply) => {
  if (request.method === "POST" && request.url === "/api/link") {
    const limiter = createRateLimiter({ max: 10, timeWindow: 60000 });
    return limiter(request, reply);
  }
});

// 注册短链接重定向路由（独立于 API 路由组）
app.get("/u/:hash", linkController.redirectShortLink);

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
      timestamp: new Date().toISOString(),
      checks: {
        database: dbHealth.healthy ? "ok" : "error",
        ...(dbHealth.error && { databaseError: dbHealth.error }),
      },
    },
  });
});

// Vercel 导出
export default async function handler(req, reply) {
  await app.ready();
  app.server.emit("request", req, reply);
}

// 本地开发启动
if (process.env.NODE_ENV !== "production") {
  const start = async () => {
    try {
      await app.listen({ port: 3000, host: "0.0.0.0" });
      console.log("🚀 Server listening on http://localhost:3000");
    } catch (err) {
      app.log.error(err);
      process.exit(1);
    }
  };
  start();
}
