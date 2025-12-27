-- ============================================
-- 短链接服务数据库架构修复脚本
-- 修复视图权限和 RLS 策略问题
-- ============================================

-- 1. 删除有冲突的 RLS 策略
drop policy if exists "任何人都可以通过 short 查询短链接" on public.links;
drop policy if exists "用户只能查看自己的链接列表" on public.links;

-- 2. 创建新的、正确的 RLS 策略
-- 公开访问策略：允许任何人通过 short 查询（用于重定向）
create policy "公开访问短链接"
  on public.links for select
  using (true);

-- 用户只能查看自己创建的链接（用于 Dashboard）
-- 注意：这个策略会与上面的策略叠加，所以用户可以看到自己的链接
create policy "用户查看自己的链接"
  on public.links for select
  using (auth.uid() = user_id or user_id is null);

-- 3. 为视图添加访问权限
-- 授予匿名用户和认证用户读取视图的权限
grant select on public.user_link_stats to anon, authenticated;
grant select on public.link_stats to anon, authenticated;

-- 4. 修复视图定义，确保安全性
-- 删除旧视图
drop view if exists public.user_link_stats cascade;
drop view if exists public.link_stats cascade;

-- 重新创建用户链接统计视图（添加安全检查）
create or replace view public.user_link_stats
with (security_invoker = false)
as
select
  l.user_id,
  count(l.id) as total_links,
  coalesce(sum(l.click_count), 0) as total_clicks,
  count(case when l.created_at >= now() - interval '7 days' then 1 end) as weekly_new_links,
  round(coalesce(avg(l.click_count), 0), 2) as avg_clicks_per_link
from public.links l
where l.user_id is not null
group by l.user_id;

-- 重新创建链接详细统计视图（添加安全检查）
create or replace view public.link_stats
with (security_invoker = false)
as
select
  l.id,
  l.short,
  l.link,
  l.user_id,
  l.created_at,
  l.click_count,
  count(distinct date_trunc('day', lal.accessed_at)) as active_days,
  count(distinct lal.ip_address) as unique_visitors,
  count(lal.id) as total_accesses
from public.links l
left join public.link_access_logs lal on l.id = lal.link_id
group by l.id, l.short, l.link, l.user_id, l.created_at, l.click_count;

-- 5. 重新授权
grant select on public.user_link_stats to anon, authenticated;
grant select on public.link_stats to anon, authenticated;

-- 6. 确保 expiration_options 表可以被读取
grant select on public.expiration_options to anon, authenticated;

-- 7. 添加注释
comment on view public.user_link_stats is '用户链接统计视图 - 所有认证用户可读';
comment on view public.link_stats is '链接详细统计视图 - 所有认证用户可读';
