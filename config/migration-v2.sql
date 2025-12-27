-- ============================================
-- 短链接服务数据库迁移 V2
-- 新增链接高级配置功能
-- ============================================

-- 1. 添加重定向类型字段
-- 支持 301 (永久重定向), 302 (临时重定向), 307 (临时重定向-保持方法), 308 (永久重定向-保持方法)
ALTER TABLE public.links
ADD COLUMN IF NOT EXISTS redirect_type smallint DEFAULT 302;

-- 添加检查约束确保重定向类型合法
ALTER TABLE public.links
ADD CONSTRAINT chk_redirect_type
CHECK (redirect_type IN (301, 302, 307, 308));

-- 2. 添加 URL 参数透传字段
-- 当为 true 时，原链接的 query 参数会追加到目标 URL
ALTER TABLE public.links
ADD COLUMN IF NOT EXISTS pass_query_params boolean DEFAULT false;

-- 3. 添加 Header 转发字段
-- 当为 true 时，转发指定的请求头到目标 URL
ALTER TABLE public.links
ADD COLUMN IF NOT EXISTS forward_headers boolean DEFAULT false;

-- 4. 添加需要转发的 Header 列表（JSON 数组格式）
-- 例如: ["User-Agent", "Accept-Language", "X-Custom-Header"]
ALTER TABLE public.links
ADD COLUMN IF NOT EXISTS forward_header_list jsonb DEFAULT '[]'::jsonb;

-- 5. 添加访问来源限制（JSONB 格式）
-- 结构示例:
-- {
--   "ip_whitelist": ["192.168.1.0/24", "10.0.0.1"],
--   "ip_blacklist": ["1.2.3.4"],
--   "allowed_countries": ["CN", "US", "JP"],
--   "blocked_countries": [],
--   "allowed_devices": ["mobile", "desktop", "tablet"],
--   "allowed_referrers": ["google.com", "baidu.com"],
--   "blocked_referrers": ["spam.com"]
-- }
ALTER TABLE public.links
ADD COLUMN IF NOT EXISTS access_restrictions jsonb DEFAULT '{}'::jsonb;

-- 6. 更新过期时间选项表，添加小时级别选项
INSERT INTO public.expiration_options (name, days, is_permanent, sort_order)
VALUES ('1小时', 0, false, 1)
ON CONFLICT DO NOTHING;

-- 更新 1小时 选项，添加 hours 字段支持
ALTER TABLE public.expiration_options
ADD COLUMN IF NOT EXISTS hours integer DEFAULT NULL;

-- 更新现有数据
UPDATE public.expiration_options SET hours = 1 WHERE name = '1小时';

-- 添加更多时效选项
INSERT INTO public.expiration_options (name, days, hours, is_permanent, sort_order) VALUES
  ('6小时', 0, 6, false, 2),
  ('12小时', 0, 12, false, 3),
  ('3天', 3, null, false, 5),
  ('14天', 14, null, false, 7),
  ('90天', 90, null, false, 9),
  ('180天', 180, null, false, 10),
  ('365天', 365, null, false, 11)
ON CONFLICT DO NOTHING;

-- 7. 创建访问限制验证函数
CREATE OR REPLACE FUNCTION public.check_ip_in_cidr(ip_address text, cidr_list jsonb)
RETURNS boolean AS $$
DECLARE
  cidr_item text;
BEGIN
  IF cidr_list IS NULL OR jsonb_array_length(cidr_list) = 0 THEN
    RETURN true;
  END IF;

  FOR cidr_item IN SELECT jsonb_array_elements_text(cidr_list)
  LOOP
    IF ip_address::inet <<= cidr_item::inet THEN
      RETURN true;
    END IF;
  END LOOP;

  RETURN false;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql;

-- 8. 创建获取有效链接的函数（包含所有验证）
CREATE OR REPLACE FUNCTION public.get_valid_link(
  short_code text,
  visitor_ip text DEFAULT NULL,
  visitor_device text DEFAULT NULL,
  visitor_referrer text DEFAULT NULL
)
RETURNS TABLE (
  id bigint,
  link text,
  redirect_type smallint,
  pass_query_params boolean,
  forward_headers boolean,
  forward_header_list jsonb,
  is_valid boolean,
  error_message text
) AS $$
DECLARE
  link_record record;
  restrictions jsonb;
  ip_whitelist jsonb;
  ip_blacklist jsonb;
  allowed_devices jsonb;
  allowed_referrers jsonb;
  blocked_referrers jsonb;
BEGIN
  -- 查询链接
  SELECT l.* INTO link_record
  FROM public.links l
  WHERE l.short = short_code;

  -- 链接不存在
  IF NOT FOUND THEN
    RETURN QUERY SELECT
      NULL::bigint, NULL::text, NULL::smallint, NULL::boolean, NULL::boolean, NULL::jsonb,
      false, '短链接不存在'::text;
    RETURN;
  END IF;

  -- 检查是否启用
  IF NOT link_record.is_active THEN
    RETURN QUERY SELECT
      link_record.id, NULL::text, NULL::smallint, NULL::boolean, NULL::boolean, NULL::jsonb,
      false, '链接已被禁用'::text;
    RETURN;
  END IF;

  -- 检查是否过期
  IF link_record.expiration_date IS NOT NULL AND link_record.expiration_date < NOW() THEN
    RETURN QUERY SELECT
      link_record.id, NULL::text, NULL::smallint, NULL::boolean, NULL::boolean, NULL::jsonb,
      false, '链接已过期'::text;
    RETURN;
  END IF;

  -- 检查点击次数限制
  IF link_record.max_clicks IS NOT NULL AND link_record.click_count >= link_record.max_clicks THEN
    RETURN QUERY SELECT
      link_record.id, NULL::text, NULL::smallint, NULL::boolean, NULL::boolean, NULL::jsonb,
      false, '链接已达到最大访问次数'::text;
    RETURN;
  END IF;

  -- 获取访问限制配置
  restrictions := COALESCE(link_record.access_restrictions, '{}'::jsonb);

  -- IP 白名单检查
  ip_whitelist := restrictions->'ip_whitelist';
  IF ip_whitelist IS NOT NULL AND jsonb_array_length(ip_whitelist) > 0 AND visitor_ip IS NOT NULL THEN
    IF NOT public.check_ip_in_cidr(visitor_ip, ip_whitelist) THEN
      RETURN QUERY SELECT
        link_record.id, NULL::text, NULL::smallint, NULL::boolean, NULL::boolean, NULL::jsonb,
        false, 'IP 地址不在允许范围内'::text;
      RETURN;
    END IF;
  END IF;

  -- IP 黑名单检查
  ip_blacklist := restrictions->'ip_blacklist';
  IF ip_blacklist IS NOT NULL AND jsonb_array_length(ip_blacklist) > 0 AND visitor_ip IS NOT NULL THEN
    IF public.check_ip_in_cidr(visitor_ip, ip_blacklist) THEN
      RETURN QUERY SELECT
        link_record.id, NULL::text, NULL::smallint, NULL::boolean, NULL::boolean, NULL::jsonb,
        false, 'IP 地址已被禁止访问'::text;
      RETURN;
    END IF;
  END IF;

  -- 设备类型检查
  allowed_devices := restrictions->'allowed_devices';
  IF allowed_devices IS NOT NULL AND jsonb_array_length(allowed_devices) > 0 AND visitor_device IS NOT NULL THEN
    IF NOT (allowed_devices ? visitor_device) THEN
      RETURN QUERY SELECT
        link_record.id, NULL::text, NULL::smallint, NULL::boolean, NULL::boolean, NULL::jsonb,
        false, '当前设备类型不允许访问'::text;
      RETURN;
    END IF;
  END IF;

  -- 来源限制检查（允许列表）
  allowed_referrers := restrictions->'allowed_referrers';
  IF allowed_referrers IS NOT NULL AND jsonb_array_length(allowed_referrers) > 0 AND visitor_referrer IS NOT NULL THEN
    -- 检查 referrer 是否在允许列表中
    DECLARE
      ref_item text;
      is_allowed boolean := false;
    BEGIN
      FOR ref_item IN SELECT jsonb_array_elements_text(allowed_referrers)
      LOOP
        IF visitor_referrer ILIKE '%' || ref_item || '%' THEN
          is_allowed := true;
          EXIT;
        END IF;
      END LOOP;

      IF NOT is_allowed THEN
        RETURN QUERY SELECT
          link_record.id, NULL::text, NULL::smallint, NULL::boolean, NULL::boolean, NULL::jsonb,
          false, '访问来源不在允许范围内'::text;
        RETURN;
      END IF;
    END;
  END IF;

  -- 来源限制检查（禁止列表）
  blocked_referrers := restrictions->'blocked_referrers';
  IF blocked_referrers IS NOT NULL AND jsonb_array_length(blocked_referrers) > 0 AND visitor_referrer IS NOT NULL THEN
    DECLARE
      ref_item text;
    BEGIN
      FOR ref_item IN SELECT jsonb_array_elements_text(blocked_referrers)
      LOOP
        IF visitor_referrer ILIKE '%' || ref_item || '%' THEN
          RETURN QUERY SELECT
            link_record.id, NULL::text, NULL::smallint, NULL::boolean, NULL::boolean, NULL::jsonb,
            false, '访问来源已被禁止'::text;
          RETURN;
        END IF;
      END LOOP;
    END;
  END IF;

  -- 所有检查通过，返回有效链接
  RETURN QUERY SELECT
    link_record.id,
    link_record.link,
    link_record.redirect_type,
    link_record.pass_query_params,
    link_record.forward_headers,
    link_record.forward_header_list,
    true,
    NULL::text;
END;
$$ LANGUAGE plpgsql;

-- 9. 添加索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_links_redirect_type ON public.links(redirect_type);
CREATE INDEX IF NOT EXISTS idx_links_pass_query_params ON public.links(pass_query_params) WHERE pass_query_params = true;

-- 10. 添加字段注释
COMMENT ON COLUMN public.links.redirect_type IS '重定向类型: 301(永久), 302(临时), 307(临时-保持方法), 308(永久-保持方法)';
COMMENT ON COLUMN public.links.pass_query_params IS '是否透传 URL 参数到目标链接';
COMMENT ON COLUMN public.links.forward_headers IS '是否转发指定的请求头';
COMMENT ON COLUMN public.links.forward_header_list IS '需要转发的请求头列表 (JSON 数组)';
COMMENT ON COLUMN public.links.access_restrictions IS '访问限制配置 (JSON 对象)，包含 IP、设备、来源等限制规则';
COMMENT ON COLUMN public.expiration_options.hours IS '小时数，用于小时级别的过期时间配置';

-- 11. 创建 RLS 策略更新（如果需要）
-- 确保新字段也受到 RLS 保护，现有策略已覆盖整表操作

-- ============================================
-- 迁移完成
-- ============================================
