/*
 * @Author: zi.yang
 * @Date: 2024-12-13 17:38:41
 * @LastEditors: zi.yang
 * @LastEditTime: 2025-12-28 00:00:00
 * @Description: Fastify 后端 API
 * @FilePath: /short-link/api/index.js
 */
import Fastify from "fastify";
import cors from "@fastify/cors";
import * as linkController from "./controllers/link.js";
import apiRoutes from "./routes/api.js";
import dashboardRoutes from "./routes/dashboard.js";
import adminRoutes from "./routes/admin.js";

const app = Fastify({
  logger: true,
});

// 启用 CORS
await app.register(cors, {
  origin: true,
  credentials: true,
});

// 注册短链接重定向路由（独立于 API 路由组）
app.get("/u/:hash", linkController.redirectShortLink);

// 注册路由组
app.register(apiRoutes, { prefix: "/api" });
app.register(dashboardRoutes, { prefix: "/api/dashboard" });
app.register(adminRoutes, { prefix: "/api/admin" });

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
