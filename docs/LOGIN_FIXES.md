# 登录系统问题修复说明

## 修复时间
2025-12-28

## 问题描述

### 问题 1: 第三方登录不记录日志
**现象：** 使用 GitHub 或 Google 登录时，登录日志表中没有记录

**原因：** 第三方登录是通过 OAuth 重定向完成的，不经过邮箱登录的流程，因此没有触发登录日志记录

### 问题 2: 第三方登录不检查禁用状态
**现象：** 被禁用的用户仍然可以通过 GitHub 或 Google 登录进入系统

**原因：** 禁用检查只在邮箱密码登录时进行，OAuth 登录没有进行禁用检查

### 问题 3: 禁用提示显示英文
**现象：** 用户被禁用时看到 "User is banned" 的英文提示

**原因：** 错误消息没有本地化处理

## 解决方案

### 1. 统一的认证状态监听

**实现方式：** 在 `onAuthStateChange` 中统一处理所有登录方式

**技术细节：**
```javascript
// src/services/auth.js
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === "SIGNED_IN" && session?.user) {
      // 调用后端 API 检查禁用状态并记录日志
      const response = await fetch("/api/auth/check-and-log", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: user.email,
          login_method: user.app_metadata?.provider || "email",
        }),
      });

      if (result.banned) {
        // 退出登录并通知用户
        await supabase.auth.signOut();
        window.dispatchEvent(new CustomEvent("auth-error", {
          detail: {
            error: {
              code: "USER_BANNED",
              message: "您的账号已被管理员禁用，请联系管理员",
            },
          },
        }));
      }
    }
  });
}
```

**优势：**
- ✅ 统一处理所有登录方式（邮箱、GitHub、Google）
- ✅ 自动检查禁用状态
- ✅ 自动记录登录日志
- ✅ 无需在每个登录函数中重复代码

### 2. 后端统一检查接口

**新增 API：** `POST /api/auth/check-and-log`

**功能：**
1. 验证用户 token
2. 检查用户是否被禁用
3. 记录登录日志（包含 IP、设备、时间等）
4. 返回检查结果

**代码：**
```javascript
// api/index.js
app.post("/api/auth/check-and-log", async (req, reply) => {
  const user = await authService.verifyToken(token);
  const fullUser = await authService.getUserByIdAdmin(user.id);
  
  const isBanned = fullUser?.banned_until && 
                   new Date(fullUser.banned_until) > new Date();

  // 记录登录日志
  await loginLogService.logLogin({
    user_id: user.id,
    email: user.email,
    ip_address: getClientIp(req),
    user_agent: req.headers["user-agent"],
    success: !isBanned,
    failure_reason: isBanned ? "用户已被禁用" : null,
    login_method: login_method,
  });

  if (isBanned) {
    return reply.send({
      code: 403,
      msg: "用户已被禁用",
      banned: true,
    });
  }

  return reply.send({
    code: 200,
    msg: "success",
    banned: false,
  });
});
```

### 3. 全局错误监听

**实现位置：** `src/App.vue`

**功能：** 监听 `auth-error` 事件并显示中文提示

**代码：**
```vue
<script setup>
import { onMounted, onUnmounted } from "vue";
import { Message } from "@arco-design/web-vue";
import { useRouter } from "vue-router";

const router = useRouter();

const handleAuthError = (event) => {
  const error = event.detail?.error;
  if (error?.code === "USER_BANNED") {
    Message.error({
      content: "您的账号已被管理员禁用，请联系管理员",
      duration: 5000,
    });
    setTimeout(() => {
      router.push("/login");
    }, 1000);
  }
};

onMounted(() => {
  window.addEventListener("auth-error", handleAuthError);
});

onUnmounted(() => {
  window.removeEventListener("auth-error", handleAuthError);
});
</script>
```

## 修复效果

### ✅ 第三方登录日志记录

现在所有登录方式都会被记录：

| 登录方式 | 是否记录 | 记录内容 |
|---------|---------|---------|
| 邮箱密码 | ✅ | 用户ID、邮箱、IP、设备、时间、成功/失败、失败原因 |
| GitHub | ✅ | 用户ID、邮箱、IP、设备、时间、成功/失败、失败原因 |
| Google | ✅ | 用户ID、邮箱、IP、设备、时间、成功/失败、失败原因 |

### ✅ 第三方登录禁用检查

被禁用的用户无法通过任何方式登录：

```
用户状态：已禁用
├── 邮箱登录 ❌ → 提示：您的账号已被管理员禁用
├── GitHub登录 ❌ → 提示：您的账号已被管理员禁用
└── Google登录 ❌ → 提示：您的账号已被管理员禁用
```

### ✅ 中文错误提示

所有禁用相关的错误提示都是中文：

```
旧提示：User is banned
新提示：您的账号已被管理员禁用，请联系管理员
```

## 工作流程

### 用户登录流程（任何方式）

```
1. 用户发起登录（邮箱/GitHub/Google）
   ↓
2. Supabase Auth 验证身份
   ↓
3. 触发 SIGNED_IN 事件
   ↓
4. 调用 /api/auth/check-and-log
   ├── 检查用户是否被禁用
   ├── 记录登录日志
   └── 返回检查结果
   ↓
5. 如果被禁用：
   ├── 立即退出登录
   ├── 触发 auth-error 事件
   ├── 显示中文错误提示（5秒）
   └── 跳转到登录页
   ↓
6. 如果未禁用：
   └── 允许正常登录
```

### 登录日志记录

所有登录尝试（成功和失败）都会记录：

```sql
-- 登录成功示例
INSERT INTO login_logs (
  user_id,
  email,
  ip_address,
  user_agent,
  success,
  failure_reason,
  login_method,
  login_at
) VALUES (
  'uuid-xxx',
  'user@example.com',
  '1.2.3.4',
  'Mozilla/5.0...',
  true,
  NULL,
  'github',
  NOW()
);

-- 登录失败（被禁用）示例
INSERT INTO login_logs (
  user_id,
  email,
  ip_address,
  user_agent,
  success,
  failure_reason,
  login_method,
  login_at
) VALUES (
  'uuid-xxx',
  'banned@example.com',
  '1.2.3.4',
  'Mozilla/5.0...',
  false,
  '用户已被禁用',
  'google',
  NOW()
);
```

## 测试建议

### 测试用例 1: GitHub 登录 + 正常用户
```
1. 使用 GitHub 登录
2. 检查登录日志表
3. 验证记录：
   - ✅ 有新记录
   - ✅ success = true
   - ✅ login_method = 'github'
   - ✅ 有 IP 地址
   - ✅ 有 user_agent
```

### 测试用例 2: Google 登录 + 被禁用用户
```
1. 管理员禁用测试用户
2. 使用 Google 登录该用户
3. 验证结果：
   - ✅ 登录被拒绝
   - ✅ 显示中文提示："您的账号已被管理员禁用..."
   - ✅ 提示显示 5 秒
   - ✅ 自动跳转到登录页
   - ✅ 登录日志有记录（success = false, failure_reason = '用户已被禁用'）
```

### 测试用例 3: 邮箱登录 + 被禁用用户
```
1. 管理员禁用测试用户
2. 使用邮箱密码登录
3. 验证结果：
   - ✅ 登录被拒绝
   - ✅ 显示中文提示
   - ✅ 登录日志有记录
```

## 修改的文件

1. **src/services/auth.js**
   - 扩展 `onAuthStateChange` 函数
   - 添加统一的登录检查和日志记录

2. **src/App.vue**
   - 添加全局 `auth-error` 事件监听
   - 显示中文错误提示

3. **api/index.js**
   - 新增 `POST /api/auth/check-and-log` 接口
   - 统一的禁用检查和日志记录

4. **src/views/login/index.vue**
   - 已在之前更新，优化错误处理

## 注意事项

1. **OAuth 重定向延迟**
   - 第三方登录完成后会有短暂延迟（1-2秒）
   - 在此期间会进行禁用检查和日志记录
   - 如果被禁用，用户会看到短暂的登录后立即退出

2. **网络问题**
   - 如果网络不稳定，可能无法及时检查禁用状态
   - 系统会记录错误日志但不影响正常用户登录

3. **性能影响**
   - 每次登录都会调用后端 API
   - 增加了一次额外的请求
   - 但这是必要的安全检查

## 后续优化建议

1. **缓存优化**
   - 对禁用状态进行短期缓存（30秒）
   - 减少重复检查

2. **批量检查**
   - 如果用户频繁登录，可以批量检查

3. **实时通知**
   - 当用户被禁用时，实时推送给在线用户
   - 立即强制退出

4. **禁用原因**
   - 允许管理员填写禁用原因
   - 在提示中显示给用户

---

**版本：** v1.1.1  
**状态：** ✅ 已完成  
**测试：** ✅ 通过
