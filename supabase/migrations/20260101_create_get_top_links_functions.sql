-- 删除旧函数并重新创建（修复返回类型）
DROP FUNCTION IF EXISTS get_top_links_by_period(UUID, TIMESTAMPTZ, INTEGER);
DROP FUNCTION IF EXISTS get_global_top_links_by_period(TIMESTAMPTZ, INTEGER);

-- 创建获取用户排行榜的数据库函数
-- 直接在数据库层面完成联表查询和聚合

CREATE OR REPLACE FUNCTION get_top_links_by_period(
  p_user_id UUID,
  p_start_date TIMESTAMPTZ,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id BIGINT,
  short TEXT,
  link TEXT,
  click_count BIGINT,
  user_id UUID,
  created_at TIMESTAMPTZ,
  is_active BOOLEAN,
  period_clicks BIGINT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.short,
    l.link,
    l.click_count,
    l.user_id,
    l.created_at,
    l.is_active,
    COUNT(lal.id) AS period_clicks
  FROM
    links l
  LEFT JOIN
    link_access_logs lal ON l.id = lal.link_id
      AND lal.accessed_at >= p_start_date
  WHERE
    l.user_id = p_user_id
  GROUP BY
    l.id, l.short, l.link, l.click_count, l.user_id, l.created_at, l.is_active
  ORDER BY
    period_clicks DESC,
    l.click_count DESC
  LIMIT
    p_limit;
END;
$$;

-- 创建获取全局排行榜的数据库函数
CREATE OR REPLACE FUNCTION get_global_top_links_by_period(
  p_start_date TIMESTAMPTZ,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id BIGINT,
  short TEXT,
  link TEXT,
  click_count BIGINT,
  user_id UUID,
  created_at TIMESTAMPTZ,
  is_active BOOLEAN,
  period_clicks BIGINT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.short,
    l.link,
    l.click_count,
    l.user_id,
    l.created_at,
    l.is_active,
    COUNT(lal.id) AS period_clicks
  FROM
    links l
  LEFT JOIN
    link_access_logs lal ON l.id = lal.link_id
      AND lal.accessed_at >= p_start_date
  GROUP BY
    l.id, l.short, l.link, l.click_count, l.user_id, l.created_at, l.is_active
  ORDER BY
    period_clicks DESC,
    l.click_count DESC
  LIMIT
    p_limit;
END;
$$;

-- 添加函数注释
COMMENT ON FUNCTION get_top_links_by_period IS '获取用户在指定时间段内的链接排行榜，按周期点击数降序排列';
COMMENT ON FUNCTION get_global_top_links_by_period IS '获取全局链接排行榜，按周期点击数降序排列';
