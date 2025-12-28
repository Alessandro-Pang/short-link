# 数据库迁移指南

## 情况说明

如果你已经执行了旧版的 `migration-account-bindings.sql`，请使用**升级脚本**而不是 v2 脚本。

## 三种情况对应的脚本

### 情况 1：还没有执行任何迁移（全新部署）
**使用脚本**: `config/migration-account-bindings-v2.sql`

执行步骤：
1. 在 Supabase SQL Editor 中执行整个脚本
2. 取消注释最后一行并执行：`select sync_user_identities();`

---

### 情况 2：已经执行了旧版 migration-account-bindings.sql（你的情况）
**使用脚本**: `config/migration-account-bindings-upgrade.sql` ⭐

执行步骤：
1. 在 Supabase SQL Editor 中执行 `migration-account-bindings-upgrade.sql`
2. 脚本会自动：
   - ✅ 删除不需要的 `account_deletion_logs` 表
   - ✅ 删除旧的 `delete_user_account()` 函数
   - ✅ 更新同步逻辑
   - ✅ 自动同步所有现有用户的身份信息
3. 执行完成后会看到成功提示

**这个脚本是安全的**：
- ✅ 不会删除 `user_identities` 表中的数据
- ✅ 不会影响现有用户
- ✅ 可以重复执行（幂等性）

---

### 情况 3：需要完全重置
如果出现问题，想从头开始：

```sql
-- 1. 删除所有相关对象
drop table if exists public.user_identities cascade;
drop table if exists public.account_deletion_logs cascade;
drop function if exists public.delete_user_account(uuid, text) cascade;
drop function if exists public.sync_user_identities() cascade;
drop function if exists public.migrate_existing_identities() cascade;
drop function if exists public.handle_new_user_identity() cascade;
drop function if exists public.handle_new_oauth_user() cascade;

-- 2. 然后执行 v2 脚本
-- 粘贴 migration-account-bindings-v2.sql 的内容
```

## 验证迁移是否成功

执行以下查询检查：

```sql
-- 1. 检查表是否存在
select table_name 
from information_schema.tables 
where table_schema = 'public' 
  and table_name = 'user_identities';

-- 2. 检查你的绑定数据
select * from public.user_identities 
where user_id = auth.uid();

-- 3. 检查函数是否存在
select routine_name 
from information_schema.routines 
where routine_schema = 'public' 
  and routine_name = 'sync_user_identities';

-- 4. 检查是否还有旧表（应该返回空）
select table_name 
from information_schema.tables 
where table_schema = 'public' 
  and table_name = 'account_deletion_logs';
```

## 常见问题

### Q: 升级脚本会删除我的数据吗？
A: 不会。它只删除 `account_deletion_logs` 表（删除日志），不会删除 `user_identities` 表中的绑定数据。

### Q: 为什么我看不到绑定状态？
A: 升级脚本会自动执行 `sync_user_identities()`，如果还是看不到，手动执行一次：
```sql
select sync_user_identities();
```

### Q: 可以重复执行升级脚本吗？
A: 可以。脚本设计为幂等的，多次执行不会有副作用。

### Q: 如何确认迁移成功？
A: 登录应用，进入 Dashboard > 个人信息，应该能看到"账号绑定"部分显示你当前的登录方式（GitHub、Google 等）。

## 推荐的执行顺序

**对于你的情况（已执行旧版脚本）**：

1. ✅ 执行 `migration-account-bindings-upgrade.sql`
2. ✅ 验证数据库更改
3. ✅ 测试应用功能
4. ✅ 如果一切正常，可以删除旧文件：
   - `config/migration-account-bindings.sql`
   - `src/views/account/bindings.vue`
   - `docs/account-bindings.md`

## 需要帮助？

如果迁移过程中遇到问题：

1. 检查 Supabase SQL Editor 的错误信息
2. 查看上面的"验证迁移是否成功"部分
3. 如果需要，可以使用"完全重置"方案重新开始
