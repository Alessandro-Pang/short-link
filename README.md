<!--
 * @Author: zi.yang
 * @Date: 2024-12-11 19:24:33
 * @LastEditors: zi.yang
 * @LastEditTime: 2025-04-09 10:56:39
 * @Description: 
 * @FilePath: /short-link/README.md
-->
# 短链接服务

一个基于 Fastify、Vercel 和 Supabase 构建的 URL 缩短服务。

## 概述

短链接服务允许用户缩短 URL，以便于分享和管理。它利用 Fastify 作为后端，Vercel 进行部署，并使用 Supabase 作为数据库解决方案。

## 在线访问

你可以在线访问该服务：[https://short.pangcy.cn](https://short.pangcy.cn)

## 功能

- **快速可靠**：使用 Fastify 构建，性能优越。
- **可扩展性**：部署在 Vercel 上，确保可扩展性和可靠性。
- **安全性**：使用 Supabase 进行安全的数据存储。
- **用户友好界面**：简单直观的 UI，便于 URL 缩短。

## 快速开始

### 前提条件

确保您已安装以下软件：

- Node.js
- Vercel CLI

### 安装

克隆仓库并安装依赖：

```bash
git clone https://github.com/Alessandro-Pang/short-link.git
cd short-link
npm install
```

### 本地开发

要在本地运行项目，请按照以下步骤操作：

1. 全局安装 Vercel CLI：

   ```bash
   npm install -g vercel@latest
   ```

2. 将您的项目与 Vercel 关联：

   ```bash
   vercel link
   ```

3. 拉取环境变量：

   ```bash
   vercel env pull .env.development.local
   ```

4. 启动开发服务器：

   ```bash
   vercel dev
   ```

## 使用方法

1. 在输入框中输入您希望缩短的 URL。
2. 点击“添加”按钮生成短链接。
3. 复制生成的短链接以便分享。

## 界面预览

![预览](./readme/image.png)

## 贡献

欢迎贡献！请 fork 仓库并提交 pull request 以进行任何改进或错误修复。

## 许可证

本项目采用 MIT 许可证。详情请参阅 [LICENSE](./LICENSE) 文件。
