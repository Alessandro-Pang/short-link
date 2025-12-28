-- 账号绑定功能 - 兼容性迁移脚本
-- 适用于已经执行过 migration-account-bindings.sql 的情况
-- 此脚本会安全地清理旧功能，添加新功能

-- 1. 检查并删除旧的删除日志表（如果存在）
drop table if exists public.account_deletion_logs cascade;

-- 2. 删除旧的删除账号函数（如果存在）
drop function if exists public.delete_user_account(uuid, text) cascade;

-- 3. 确保 user_identities 表存在且结构正确
-- 如果表已存在，这个命令不会报错
create table if not exists public.user_identities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('email', 'github', 'google')),
  provider_user_id text not null,
  provider_email text,
  provider_metadata jsonb default '{}'::jsonb,
  linked_at timestamp with time zone not null default now(),

  unique(user_id, provider),
  unique(provider, provider_user_id)
);

-- 4. 确保索引存在
create index if not exists idx_user_identities_user_id on public.user_identities(user_id);
create index if not exists idx_user_identities_provider on public.user_identities(provider);

-- 5. 确保 RLS 已启用
alter table public.user_identities enable row level security;

-- 6. 重新创建 RLS 策略（先删除旧的，避免冲突）
drop policy if exists "用户查看自己的身份绑定" on public.user_identities;
drop policy if exists "用户创建自己的身份绑定" on public.user_identities;
drop policy if exists "用户删除自己的身份绑定" on public.user_identities;

create policy "用户查看自己的身份绑定"
  on public.user_identities for select
  using (auth.uid() = user_id);

create policy "用户创建自己的身份绑定"
  on public.user_identities for insert
  with check (auth.uid() = user_id);

create policy "用户删除自己的身份绑定"
  on public.user_identities for delete
  using (auth.uid() = user_id);

-- 7. 删除旧的迁移函数（如果存在）
drop function if exists public.migrate_existing_identities() cascade;

-- 8. 创建新的同步函数：从 Supabase Auth 同步现有用户的身份信息
create or replace function sync_user_identities()
returns void
language plpgsql
security definer
as $$
declare
  user_record record;
  identity_record record;
begin
  -- 遍历所有用户
  for user_record in
    select id, email, raw_app_meta_data, raw_user_meta_data
    from auth.users
  loop
    -- 从 auth.identities 表获取用户的所有身份
    for identity_record in
      select provider, id as provider_id, identity_data
      from auth.identities
      where user_id = user_record.id
    loop
      -- 插入或更新到 user_identities 表
      insert into public.user_identities (
        user_id,
        provider,
        provider_user_id,
        provider_email,
        provider_metadata
      )
      values (
        user_record.id,
        identity_record.provider,
        identity_record.provider_id,
        coalesce(
          identity_record.identity_data->>'email',
          user_record.email
        ),
        identity_record.identity_data
      )
      on conflict (user_id, provider) do update
      set
        provider_email = excluded.provider_email,
        provider_metadata = excluded.provider_metadata;
    end loop;

    -- 如果用户有邮箱但没有 email provider，添加一个
    if user_record.email is not null then
      insert into public.user_identities (
        user_id,
        provider,
        provider_user_id,
        provider_email
      )
      values (
        user_record.id,
        'email',
        user_record.id::text,
        user_record.email
      )
      on conflict (user_id, provider) do nothing;
    end if;
  end loop;
end;
$$;

-- 9. 删除旧的触发器函数（如果存在）
drop function if exists public.handle_new_user_identity() cascade;
drop function if exists public.handle_new_oauth_user() cascade;

-- 10. 创建新的触发器函数：新用户注册时自动同步身份
create or replace function handle_new_user_identity()
returns trigger
language plpgsql
security definer
as $$
begin
  -- 从 auth.identities 表同步身份信息
  insert into public.user_identities (
    user_id,
    provider,
    provider_user_id,
    provider_email,
    provider_metadata
  )
  select
    new.id,
    i.provider,
    i.id,
    coalesce(i.identity_data->>'email', new.email),
    i.identity_data
  from auth.identities i
  where i.user_id = new.id
  on conflict (user_id, provider) do nothing;

  -- 如果有邮箱，确保有 email provider
  if new.email is not null then
    insert into public.user_identities (
      user_id,
      provider,
      provider_user_id,
      provider_email
    )
    values (
      new.id,
      'email',
      new.id::text,
      new.email
    )
    on conflict (user_id, provider) do nothing;
  end if;

  return new;
end;
$$;

-- 11. 删除并重新创建触发器
drop trigger if exists on_auth_user_created_identity on auth.users;
create trigger on_auth_user_created_identity
  after insert on auth.users
  for each row
  execute function handle_new_user_identity();

-- 12. 立即执行同步（同步所有现有用户）
select sync_user_identities();

-- 13. 更新注释
comment on table public.user_identities is '用户身份绑定表，从 auth.identities 同步';
comment on column public.user_identities.provider is '认证提供商：email, github, google';
comment on column public.user_identities.provider_user_id is '第三方平台的用户唯一标识';
comment on function sync_user_identities is '从 Supabase Auth 同步现有用户的身份信息';

-- 14. 输出完成信息
do $$
begin
  raise notice '✅ 迁移完成！';
  raise notice '- 已清理旧的删除日志表和函数';
  raise notice '- 已更新同步逻辑';
  raise notice '- 已同步所有现有用户的身份信息';
  raise notice '';
  raise notice '现在你可以在 Dashboard > 个人信息 页面查看和管理账号绑定';
end $$;
