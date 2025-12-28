-- ============================================
-- 用户管理功能所需的数据库表结构
-- ============================================

-- 1. 登录日志表
CREATE TABLE IF NOT EXISTS login_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    success BOOLEAN NOT NULL DEFAULT false,
    failure_reason TEXT,
    login_method TEXT NOT NULL DEFAULT 'email', -- email, github, google
    login_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_email ON login_logs(email);
CREATE INDEX IF NOT EXISTS idx_login_logs_login_at ON login_logs(login_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_logs_success ON login_logs(success);

-- 添加注释
COMMENT ON TABLE login_logs IS '用户登录日志表';
COMMENT ON COLUMN login_logs.user_id IS '用户 ID，登录成功时才会有值';
COMMENT ON COLUMN login_logs.email IS '登录邮箱';
COMMENT ON COLUMN login_logs.ip_address IS '登录 IP 地址';
COMMENT ON COLUMN login_logs.user_agent IS '用户代理字符串';
COMMENT ON COLUMN login_logs.success IS '登录是否成功';
COMMENT ON COLUMN login_logs.failure_reason IS '登录失败原因';
COMMENT ON COLUMN login_logs.login_method IS '登录方式：email/github/google';
COMMENT ON COLUMN login_logs.login_at IS '登录时间';

-- ============================================
-- RLS (Row Level Security) 策略
-- ============================================

-- 启用 RLS
ALTER TABLE login_logs ENABLE ROW LEVEL SECURITY;

-- 策略：用户只能查看自己的登录日志
CREATE POLICY "Users can view their own login logs"
    ON login_logs
    FOR SELECT
    USING (auth.uid() = user_id);

-- 策略：服务角色可以插入任何日志
CREATE POLICY "Service role can insert any login log"
    ON login_logs
    FOR INSERT
    WITH CHECK (true);

-- 策略：服务角色可以查看所有日志
CREATE POLICY "Service role can view all login logs"
    ON login_logs
    FOR SELECT
    USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- 可选：定期清理旧日志的函数（保留 90 天）
-- ============================================

CREATE OR REPLACE FUNCTION clean_old_login_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM login_logs
    WHERE login_at < NOW() - INTERVAL '90 days';
END;
$$;

COMMENT ON FUNCTION clean_old_login_logs() IS '清理 90 天前的登录日志';

-- ============================================
-- 注意事项
-- ============================================

-- 1. 需要在 Supabase Dashboard 中手动执行此 SQL
-- 2. 确保 auth.users 表存在（Supabase 默认提供）
-- 3. 如需自动清理旧日志，可以使用 pg_cron 扩展设置定时任务
-- 4. 管理员权限通过 user_profiles 表的 is_admin 字段控制

-- ============================================
-- 示例：设置用户为管理员
-- ============================================

-- 更新 user_profiles 表，添加 is_admin 字段（如果还没有）
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 将特定用户设置为管理员（替换为实际的用户 ID）
-- UPDATE user_profiles SET is_admin = true WHERE id = 'YOUR_USER_ID';

COMMENT ON COLUMN user_profiles.is_admin IS '是否为管理员';
