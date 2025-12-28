# 用户管理功能部署指南

## 功能概述

本次更新为 Short Link 项目添加了完整的用户管理功能，包括：

### 管理员功能
1. **用户管理**
   - 查看所有用户列表
   - 创建新用户
   - 删除用户
   - 重置用户密码
   - 启用/禁用用户账号

2. **登录日志**
   - 查看所有登录记录
   - 按用户、状态、时间筛选
   - 登录统计（总次数、成功/失败、24小时/7天/30天）
   - 查看登录详情（IP、设备、时间等）

3. **安全增强**
   - 登录时检查用户是否被禁用
   - 自动记录所有登录尝试
   - 支持查看失败登录原因

## 部署步骤

### 1. 数据库设置

在 Supabase Dashboard 中执行以下 SQL：

```sql
-- 创建登录日志表
CREATE TABLE IF NOT EXISTS login_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    success BOOLEAN NOT NULL DEFAULT false,
    failure_reason TEXT,
    login_method TEXT NOT NULL DEFAULT 'email',
    login_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_email ON login_logs(email);
CREATE INDEX IF NOT EXISTS idx_login_logs_login_at ON login_logs(login_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_logs_success ON login_logs(success);

-- 添加管理员字段到 user_profiles 表
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 启用 RLS
ALTER TABLE login_logs ENABLE ROW LEVEL SECURITY;

-- RLS 策略
CREATE POLICY "Users can view their own login logs"
    ON login_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert any login log"
    ON login_logs FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Service role can view all login logs"
    ON login_logs FOR SELECT
    USING (auth.jwt()->>'role' = 'service_role');
```

完整的 SQL 脚本请查看：`docs/database-schema-user-management.sql`

### 2. 设置管理员

在 Supabase Dashboard 中执行：

```sql
-- 将用户设置为管理员（替换为实际的用户 ID）
UPDATE user_profiles SET is_admin = true WHERE id = 'YOUR_USER_ID';
```

或者在 Table Editor 中直接勾选 `is_admin` 字段。

**获取用户 ID 的方法：**
1. 在 Supabase Dashboard -> Authentication -> Users 中查看
2. 登录后在浏览器控制台执行：`(await supabase.auth.getUser()).data.user.id`

### 3. 环境变量检查

确保 `.env.local` 或 `.env.development.local` 中包含：

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. 安装依赖并启动

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

## 使用说明

### 管理员访问

1. 使用管理员账号登录
2. 在 Dashboard 侧边栏中会看到 "管理员" 部分
3. 点击 "用户管理" 或 "登录日志" 进入相应页面

### 用户管理页面

**创建用户：**
- 点击 "创建用户" 按钮
- 输入邮箱、密码、姓名（可选）
- 点击确定

**重置密码：**
- 点击用户行的 "重置密码" 按钮
- 输入新密码（至少 6 位）
- 点击确定

**启用/禁用用户：**
- 点击用户行的 "启用" 或 "禁用" 按钮
- 确认操作
- 被禁用的用户无法登录

**删除用户：**
- 点击用户行的 "删除" 按钮
- 确认操作
- 将删除用户及其所有数据（链接、日志等）

### 登录日志页面

**查看统计：**
- 页面顶部显示总登录次数、成功/失败次数、近期登录统计

**筛选日志：**
- 点击 "筛选" 按钮展开筛选条件
- 可按用户 ID、登录状态、时间范围筛选
- 点击 "应用筛选" 查看结果

**查看详情：**
- 表格显示登录状态、用户信息、IP 地址、设备、时间等
- 失败的登录会显示失败原因

## API 接口

### 用户管理接口（管理员专用）

```
GET    /api/admin/users              # 获取用户列表
GET    /api/admin/users/:userId      # 获取用户详情
POST   /api/admin/users              # 创建用户
PUT    /api/admin/users/:userId      # 更新用户信息
DELETE /api/admin/users/:userId      # 删除用户
POST   /api/admin/users/:userId/reset-password   # 重置密码
PATCH  /api/admin/users/:userId/toggle-status    # 启用/禁用用户
```

### 登录日志接口

```
GET  /api/login-logs                 # 获取当前用户登录日志
GET  /api/admin/login-logs           # 获取所有登录日志（管理员）
GET  /api/admin/login-stats          # 获取登录统计（管理员）
POST /api/auth/log-login             # 记录登录日志（公开）
```

## 安全说明

### 用户禁用机制

- 禁用用户时，系统会设置 `ban_duration` 为 100 年
- 启用用户时，设置 `ban_duration` 为 `none`
- 登录时会检查 `banned_until` 字段，如果未过期则拒绝登录
- 被禁用的用户会被立即登出

### 登录日志

- 所有登录尝试都会被记录（成功和失败）
- 记录包含：用户 ID、邮箱、IP 地址、设备信息、时间、状态、失败原因
- 日志记录不会影响登录流程（异步处理）
- 建议定期清理旧日志（默认保留 90 天）

### 权限控制

- 所有管理员接口都需要验证管理员权限
- 使用 `is_admin` 字段判断管理员身份
- 非管理员用户无法访问管理功能

## 注意事项

1. **首次部署**
   - 必须先执行数据库 SQL 脚本
   - 至少设置一个管理员账号

2. **性能优化**
   - 登录日志表已创建索引
   - 建议定期清理旧日志
   - 可使用 pg_cron 设置自动清理任务

3. **数据备份**
   - 删除用户会级联删除其所有数据
   - 建议在删除前先备份数据

4. **安全建议**
   - 定期审查管理员列表
   - 监控失败登录尝试
   - 设置强密码策略

## 故障排查

### 管理员菜单不显示

1. 检查用户的 `is_admin` 字段是否为 `true`
2. 清除浏览器缓存并重新登录
3. 检查浏览器控制台是否有错误

### 无法记录登录日志

1. 检查 `login_logs` 表是否创建成功
2. 检查 RLS 策略是否正确设置
3. 检查后端服务是否正常运行

### 禁用用户后仍能登录

1. 检查 `banned_until` 字段是否正确设置
2. 清除用户的所有会话
3. 检查前端登录逻辑是否正确

## 技术栈

- **后端：** Fastify + Supabase
- **前端：** Vue 3 + Arco Design
- **数据库：** PostgreSQL (Supabase)
- **认证：** Supabase Auth

## 文件清单

### 后端文件
- `service/auth.js` - 用户管理服务（扩展）
- `service/login-log.js` - 登录日志服务（新增）
- `api/index.js` - API 接口（扩展）

### 前端文件
- `src/services/admin.js` - 管理员服务（扩展）
- `src/services/auth.js` - 认证服务（扩展，添加禁用检查和日志记录）
- `src/views/dashboard/admin/users.vue` - 用户管理页面（新增）
- `src/views/dashboard/admin/login-logs.vue` - 登录日志页面（新增）
- `src/views/dashboard/index.vue` - Dashboard 主页（更新菜单）
- `src/router/index.js` - 路由配置（添加新路由）

### 文档文件
- `docs/database-schema-user-management.sql` - 数据库表结构（新增）
- `docs/USER_MANAGEMENT_GUIDE.md` - 本文档（新增）

## 更新日志

### v1.0.0 (2025-12-28)

**新增功能：**
- ✅ 用户管理（CRUD 操作）
- ✅ 用户启用/禁用
- ✅ 密码重置
- ✅ 登录日志记录
- ✅ 登录统计
- ✅ 登录时禁用检查

**安全增强：**
- ✅ 登录失败记录
- ✅ IP 地址记录
- ✅ 设备信息记录
- ✅ 管理员权限验证

## 联系支持

如有问题或建议，请提交 Issue 或联系开发团队。
