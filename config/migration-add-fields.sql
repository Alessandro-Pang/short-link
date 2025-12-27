-- ============================================
-- 短链接服务数据库迁移脚本
-- 添加高级配置字段
-- ============================================

-- 1. 添加重定向类型字段
ALTER TABLE public.links
ADD COLUMN IF NOT EXISTS redirect_type smallint DEFAULT 302;

-- 2. 添加 URL 参数透传字段
ALTER TABLE public.links
ADD COLUMN IF NOT EXISTS pass_query_params boolean DEFAULT false;

-- 3. 添加 Header 转发字段
ALTER TABLE public.links
ADD COLUMN IF NOT EXISTS forward_headers boolean DEFAULT false;

-- 4. 添加需要转发的 Header 列表
ALTER TABLE public.links
ADD COLUMN IF NOT EXISTS forward_header_list jsonb DEFAULT '[]'::jsonb;

-- 5. 添加访问限制配置
ALTER TABLE public.links
ADD COLUMN IF NOT EXISTS access_restrictions jsonb DEFAULT '{}'::jsonb;

-- 6. 为过期时间选项表添加小时字段
ALTER TABLE public.expiration_options
ADD COLUMN IF NOT EXISTS hours integer DEFAULT NULL;

-- 7. 更新过期时间选项数据
-- 先删除旧数据
DELETE FROM public.expiration_options;

-- 插入新的过期时间选项
INSERT INTO public.expiration_options (name, days, hours, is_permanent, sort_order) VALUES
  ('1小时', NULL, 1, false, 1),
  ('6小时', NULL, 6, false, 2),
  ('12小时', NULL, 12, false, 3),
  ('1天', 1, NULL, false, 4),
  ('3天', 3, NULL, false, 5),
  ('7天', 7, NULL, false, 6),
  ('14天', 14, NULL, false, 7),
  ('30天', 30, NULL, false, 8),
  ('90天', 90, NULL, false, 9),
  ('180天', 180, NULL, false, 10),
  ('365天', 365, NULL, false, 11),
  ('永久', NULL, NULL, true, 12);

-- 8. 为访问日志表添加设备类型字段
ALTER TABLE public.link_access_logs
ADD COLUMN IF NOT EXISTS device_type text;

-- 9. 添加索引优化查询
CREATE INDEX IF NOT EXISTS idx_links_redirect_type ON public.links(redirect_type);
CREATE INDEX IF NOT EXISTS idx_links_expiration ON public.links(expiration_date) WHERE expiration_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_link_access_logs_device_type ON public.link_access_logs(device_type);

-- 10. 添加字段注释
COMMENT ON COLUMN public.links.redirect_type IS '重定向类型: 301(永久), 302(临时), 307(临时-保持方法), 308(永久-保持方法)';
COMMENT ON COLUMN public.links.pass_query_params IS '是否透传 URL 参数到目标链接';
COMMENT ON COLUMN public.links.forward_headers IS '是否转发指定的请求头';
COMMENT ON COLUMN public.links.forward_header_list IS '需要转发的请求头列表 (JSON 数组)';
COMMENT ON COLUMN public.links.access_restrictions IS '访问限制配置 (JSON 对象)';
COMMENT ON COLUMN public.expiration_options.hours IS '小时数，用于小时级别的过期时间配置';
COMMENT ON COLUMN public.link_access_logs.device_type IS '设备类型: mobile, tablet, desktop';

-- ============================================
-- 迁移完成
-- 请在 Supabase 控制台的 SQL Editor 中执行此脚本
-- ============================================
