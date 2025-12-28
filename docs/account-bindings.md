# 账号绑定功能使用说明

## 功能概述

账号绑定功能允许用户将多个登录方式（邮箱、GitHub、Google）绑定到同一个账号，方便用户使用不同方式登录。同时支持解绑和删除账号功能。

## 部署步骤

### 1. 执行数据库迁移

在 Supabase 控制台的 SQL Editor 中执行迁移脚本：

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 点击左侧菜单的 "SQL Editor"
4. 点击 "New query"
5. 复制 `config/migration-account-bindings.sql` 的内容
6. 粘贴到编辑器中
7. 点击 "Run" 执行

**重要提示**：如果你想迁移现有用户的认证信息，请取消注释第 8 步中的这行代码：
```sql
select migrate_existing_identities();
```

### 2. 配置 OAuth 提供商（如果还未配置）

#### GitHub OAuth

1. 访问 [GitHub Developer Settings](https://github.com/settings/developers)
2. 创建新的 OAuth App
3. 填写信息：
   - Homepage URL: `https://your-domain.com`
   - Authorization callback URL: `https://your-supabase-project.supabase.co/auth/v1/callback`
4. 获取 Client ID 和 Client Secret
5. 在 Supabase Dashboard > Authentication > Providers 中配置 GitHub

#### Google OAuth

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建 OAuth 2.0 客户端 ID
3. 配置授权重定向 URI: `https://your-supabase-project.supabase.co/auth/v1/callback`
4. 获取 Client ID 和 Client Secret
5. 在 Supabase Dashboard > Authentication > Providers 中配置 Google

### 3. 更新 Supabase Auth 配置

确保在 Supabase Dashboard > Authentication > URL Configuration 中设置：
- Site URL: `https://your-domain.com`
- Redirect URLs: 添加 `https://your-domain.com/account/bindings`

## 功能说明

### 用户功能

#### 1. 查看绑定状态
- 路径：`/account/bindings`
- 显示当前账号已绑定的所有登录方式
- 显示每个绑定的邮箱、绑定时间等信息

#### 2. 绑定新账号
**邮箱绑定**：
- 点击"绑定"按钮
- 输入邮箱和密码（至少6位）
- 确认绑定

**GitHub/Google 绑定**：
- 点击"绑定"按钮
- 自动跳转到 OAuth 授权页面
- 授权后自动绑定并返回

#### 3. 解绑账号
- 点击已绑定账号旁的"解绑"按钮
- 确认解绑
- **限制**：必须至少保留一种登录方式

#### 4. 删除账号
- 在"危险操作"区域点击"删除账号"
- 输入删除原因（可选）
- 二次确认
- **警告**：此操作不可逆，将删除所有数据：
  - 所有创建的短链接
  - 访问统计数据
  - 账号绑定信息
  - 个人资料

### API 接口

#### 获取身份绑定列表
```
GET /api/account/identities
Headers: Authorization: Bearer {token}

Response:
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "provider": "email|github|google",
    "provider_user_id": "string",
    "provider_email": "string",
    "provider_metadata": {},
    "linked_at": "timestamp"
  }
]
```

#### 绑定新身份
```
POST /api/account/link
Headers: Authorization: Bearer {token}
Body:
{
  "provider": "email|github|google",
  "provider_user_id": "string",
  "provider_email": "string",
  "provider_metadata": {}
}

Response:
{
  "code": 200,
  "msg": "成功绑定 {provider} 账号",
  "data": {...}
}
```

#### 解绑身份
```
DELETE /api/account/unlink/:provider
Headers: Authorization: Bearer {token}

Response:
{
  "code": 200,
  "msg": "已成功解绑 {provider} 账号",
  "data": {...}
}
```

#### 删除账号
```
DELETE /api/account/delete
Headers: Authorization: Bearer {token}
Body:
{
  "reason": "string (optional)"
}

Response:
{
  "code": 200,
  "msg": "账号已成功删除",
  "data": {...}
}
```

## 数据库表结构

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

### account_deletion_logs 表
```sql
create table public.account_deletion_logs (
  id uuid primary key,
  user_id uuid,
  user_email text,
  deleted_at timestamp with time zone,
  deletion_reason text,
  deleted_by uuid references auth.users(id)
);
```

## 安全特性

1. **RLS (Row Level Security)**：用户只能查看和修改自己的绑定信息
2. **唯一性约束**：防止重复绑定和账号冲突
3. **最小登录方式限制**：强制用户至少保留一种登录方式
4. **删除审计**：记录所有账号删除操作
5. **级联删除**：删除用户时自动清理相关数据

## 前端组件路径

- 账号绑定页面：`src/views/account/bindings.vue`
- 账号管理服务：`src/services/account.js`
- 路由配置：`src/router/index.js`

## 访问入口

用户可以通过以下方式访问账号绑定页面：

1. Dashboard 左侧菜单 > "账号绑定"
2. 用户头像下拉菜单 > "账号绑定"
3. 直接访问 `/account/bindings`

## 常见问题

### Q: 为什么无法解绑某个账号？
A: 系统要求至少保留一种登录方式。如果你只绑定了一个账号，需要先绑定其他方式才能解绑。

### Q: OAuth 绑定失败怎么办？
A: 请检查：
1. Supabase 的 OAuth 配置是否正确
2. 重定向 URL 是否已添加到白名单
3. OAuth 应用的回调 URL 是否正确

### Q: 删除账号后能恢复吗？
A: 不能。账号删除是永久性的，所有数据都会被清除。

### Q: 如何查看账号删除日志？
A: 管理员可以在 Supabase Dashboard > Table Editor > account_deletion_logs 中查看。

## 技术栈

- **前端**: Vue 3 + Vite + Arco Design
- **后端**: Fastify + Node.js
- **数据库**: PostgreSQL (Supabase)
- **认证**: Supabase Auth
- **OAuth**: GitHub OAuth, Google OAuth

## 注意事项

1. 首次部署时务必执行数据库迁移脚本
2. 确保 OAuth 提供商已正确配置
3. 建议在测试环境先测试完整流程
4. 删除账号功能应谨慎开放给用户
5. 定期备份 account_deletion_logs 表用于审计

## 贡献者

- zi.yang
- 创建日期：2025-12-28
