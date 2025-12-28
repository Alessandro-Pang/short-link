# 账号绑定功能 - 使用指南

## 功能概述

账号绑定功能允许用户在个人信息页面管理多个登录方式（GitHub、Google），方便使用不同方式登录。同时支持解绑和删除账号功能。

## 部署步骤

### 1. 执行数据库迁移

在 Supabase 控制台的 SQL Editor 中执行迁移脚本：

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 点击左侧菜单的 "SQL Editor"
4. 点击 "New query"
5. 复制 `config/migration-account-bindings-v2.sql` 的全部内容
6. 粘贴到编辑器中
7. 点击 "Run" 执行

**首次运行建议**：取消注释最后一行以同步现有用户数据：
```sql
select sync_user_identities();
```

### 2. 配置 OAuth 提供商（如未配置）

#### GitHub OAuth
1. 访问 [GitHub Developer Settings](https://github.com/settings/developers)
2. 创建新的 OAuth App
3. 配置回调 URL: `https://your-supabase-project.supabase.co/auth/v1/callback`
4. 在 Supabase Dashboard > Authentication > Providers 中配置 GitHub

#### Google OAuth
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建 OAuth 2.0 客户端 ID
3. 配置回调 URL: `https://your-supabase-project.supabase.co/auth/v1/callback`
4. 在 Supabase Dashboard > Authentication > Providers 中配置 Google

## 使用说明

### 访问账号绑定管理

用户登录后，进入 **Dashboard > 个人信息** 页面，向下滚动即可看到：
- **账号绑定** 部分 - 管理登录方式
- **危险操作** 部分 - 删除账号

### 功能详情

#### 1. 查看绑定状态
- 显示当前已绑定的所有登录方式
- 显示每个绑定的邮箱、状态等信息

#### 2. 绑定 GitHub/Google 账号
1. 点击对应账号旁的"绑定"按钮
2. 自动跳转到 OAuth 授权页面
3. 授权后自动绑定并返回
4. 刷新页面可看到绑定状态

#### 3. 解绑账号
1. 点击已绑定账号旁的"解绑"按钮
2. 确认解绑操作
3. **限制**：必须至少保留一种登录方式

#### 4. 删除账号
1. 在"危险操作"区域点击"删除账号"
2. 输入删除原因（可选）
3. 二次确认
4. **警告**：此操作不可逆，将删除所有数据

## API 接口

### 获取身份绑定列表
```http
GET /api/account/identities
Authorization: Bearer {token}

Response:
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "provider": "github|google|email",
    "provider_user_id": "string",
    "provider_email": "string",
    "provider_metadata": {},
    "linked_at": "timestamp"
  }
]
```

### 绑定新身份
```http
POST /api/account/link
Authorization: Bearer {token}
Content-Type: application/json

{
  "provider": "github|google|email",
  "provider_user_id": "string",
  "provider_email": "string",
  "provider_metadata": {}
}
```

### 解绑身份
```http
DELETE /api/account/unlink/:provider
Authorization: Bearer {token}
```

### 删除账号
```http
DELETE /api/account/delete
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "string (optional)"
}
```

## 数据库结构

### user_identities 表
```sql
create table public.user_identities (
  id uuid primary key,
  user_id uuid references auth.users(id),
  provider text check (provider in ('email', 'github', 'google')),
  provider_user_id text,
  provider_email text,
  provider_metadata jsonb,
  linked_at timestamp with time zone,
  
  unique(user_id, provider),
  unique(provider, provider_user_id)
);
```

## 技术实现

### 关键特性

1. **自动同步**: 从 Supabase Auth 的 `auth.identities` 表自动同步绑定信息
2. **RLS 保护**: 用户只能查看和修改自己的绑定信息
3. **唯一性约束**: 防止重复绑定和账号冲突
4. **最小登录方式**: 强制用户至少保留一种登录方式
5. **级联删除**: 删除用户时自动清理相关数据

### 前端组件

- **位置**: `src/views/dashboard/profile/index.vue`（个人信息页面的一部分）
- **服务**: `src/services/account.js`
- **路由**: `/dashboard/profile`

### 后端服务

- **Auth Service**: `service/auth.js` - 身份管理逻辑
- **API 路由**: `api/index.js` - RESTful 接口

## 常见问题

**Q: 为什么看不到绑定状态？**  
A: 首次部署需要执行数据库迁移脚本中的 `sync_user_identities()` 函数来同步现有用户数据。

**Q: 为什么无法解绑某个账号？**  
A: 系统要求至少保留一种登录方式。请先绑定其他方式后再解绑。

**Q: OAuth 绑定失败怎么办？**  
A: 检查 Supabase 的 OAuth 配置是否正确，回调 URL 是否匹配。

**Q: 删除账号后能恢复吗？**  
A: 不能。账号删除是永久性的，所有数据都会被清除。

## 文件清单

### 新增文件
- `config/migration-account-bindings-v2.sql` - 数据库迁移脚本（简化版）
- `src/services/account.js` - 前端账号管理服务
- `docs/account-bindings-guide.md` - 本文档

### 修改文件
- `service/auth.js` - 添加账号绑定相关函数
- `api/index.js` - 添加账号绑定 API 路由
- `src/views/dashboard/profile/index.vue` - 集成账号绑定功能

### 已废弃（可删除）
- `src/views/account/bindings.vue` - 独立的账号绑定页面（已整合到 profile）
- `config/migration-account-bindings.sql` - 旧版迁移脚本（包含删除日志表）
- `docs/account-bindings.md` - 旧版文档

## 注意事项

1. ✅ 使用 `migration-account-bindings-v2.sql`（简化版）
2. ✅ 账号绑定功能现已整合到个人信息页面
3. ✅ 移除了不必要的删除日志表
4. ✅ 绑定状态自动从 Supabase Auth 同步
5. ⚠️ 首次部署务必执行 `sync_user_identities()` 同步现有用户

## 更新日志

**2025-12-28 v2**
- 简化数据库设计，移除删除日志表
- 账号绑定功能整合到个人信息页面
- 优化绑定状态同步逻辑
- 改进用户体验和页面布局
