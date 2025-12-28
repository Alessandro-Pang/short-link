/*
 * @Author: zi.yang
 * @Date: 2024-12-13 17:38:41
 * @LastEditors: zi.yang
 * @LastEditTime: 2025-12-29 00:00:00
 * @Description: Vercel Serverless Function 入口 - 转发到 server 模块
 * @FilePath: /short-link/api/index.js
 */

// 导出 server 模块的 handler
export { default } from '../server/index.js';
