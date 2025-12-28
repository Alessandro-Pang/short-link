# 账号绑定功能说明

## 当前限制

Supabase 默认禁用了手动链接身份的功能（`manual_linking_disabled`），这是一个安全限制。

## 推荐的实现方案

有两种方案可以实现账号绑定：

### 方案 1：启用 Supabase Manual Linking（推荐）

在 Supabase Dashboard 中启用手动链接功能：

1. 进入 Supabase Dashboard > Authentication > Providers
2. 找到你要配置的 Provider（GitHub 或 Google）
3. 在高级设置中，启用 **"Allow manual linking"** 选项
4. 保存配置

启用后，代码中的 `supabase.auth.linkIdentity()` 就可以正常工作了。

### 方案 2：通过邮箱自动关联（当前实现）

如果不启用 Manual Linking，系统会：

1. **用户首次使用 GitHub 登录** → 创建新账号（账号 A）
2. **用户首次使用 Google 登录** → 如果邮箱相同，关联到账号 A；如果不同，创建新账号（账号 B）
3. **用户使用邮箱密码登录** → 关联到对应的账号

**这种方式的限制**：
- ❌ 无法主动"绑定"新的登录方式
- ✅ 只要使用相同邮箱，Supabase 会自动关联
- ✅ 可以查看当前账号的所有登录方式
- ✅ 可以解绑（删除身份）

## 建议的配置步骤

### 启用 Manual Linking（最佳方案）

**步骤 1：在 Supabase 启用设置**

对于 GitHub Provider：
```
Supabase Dashboard 
→ Authentication 
→ Providers 
→ GitHub 
→ 展开 "Advanced settings"
→ 勾选 "Enable manual linking"
→ Save
```

对于 Google Provider：
```
Supabase Dashboard 
→ Authentication 
→ Providers 
→ Google
→ 展开 "Advanced settings"
→ 勾选 "Enable manual linking"
→ Save
```

**步骤 2：更新 Supabase 配置**

确保在 Authentication > Settings 中：
- ✅ "Enable email confirmations" 可以关闭（测试环境）
- ✅ "Confirm email" 设置为适合你的选项

### 如果不启用 Manual Linking

那么需要调整用户界面，改为显示：

**当前的登录方式**：
- ✅ 显示已绑定的方式（GitHub、Google、Email）
- ✅ 支持解绑
- ❌ 不显示"绑定"按钮（因为无法主动绑定）

**提示用户**：
"如果你想使用其他方式登录，请先登出，然后使用该方式登录。如果使用相同的邮箱，系统会自动关联到你的账号。"

## 我的建议

**推荐使用方案 1（启用 Manual Linking）**，因为：
1. ✅ 用户体验更好，可以主动绑定
2. ✅ 功能更完整，符合预期
3. ✅ 只需要在 Supabase Dashboard 中点几下

**如果你无法启用 Manual Linking**（例如使用的是受限版本），我可以调整 UI，隐藏"绑定"按钮，只显示当前已有的登录方式。

---

你想要哪种方案？
1. 启用 Manual Linking（需要在 Supabase Dashboard 中配置）
2. 调整 UI，只显示已有的登录方式，不提供主动绑定功能
