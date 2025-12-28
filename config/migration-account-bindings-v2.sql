-- 账号绑定功能数据库迁移脚本（简化版）
-- 用于支持用户绑定/解绑邮箱、GitHub、Google 账号

-- 1. 创建用户身份绑定表
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

-- 2. 添加索引
create index if not exists idx_user_identities_user_id on public.user_identities(user_id);
create index if not exists idx_user_identities_provider on public.user_identities(provider);

-- 3. 启用 RLS
alter table public.user_identities enable row level security;

-- 4. RLS 策略
create policy "用户查看自己的身份绑定"
  on public.user_identities for select
  using (auth.uid() = user_id);

create policy "用户创建自己的身份绑定"
  on public.user_identities for insert
  with check (auth.uid() = user_id);

create policy "用户删除自己的身份绑定"
  on public.user_identities for delete
  using (auth.uid() = user_id);

-- 5. 创建函数：从 Supabase Auth 同步现有用户的身份信息
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
      -- 插入到 user_identities 表
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

-- 6. 创建触发器函数：新用户注册时自动同步身份
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

-- 7. 创建触发器（如果不存在）
drop trigger if exists on_auth_user_created_identity on auth.users;
create trigger on_auth_user_created_identity
  after insert on auth.users
  for each row
  execute function handle_new_user_identity();

-- 8. 执行初始同步（首次运行时取消注释）
-- select sync_user_identities();

-- 9. 添加注释
comment on table public.user_identities is '用户身份绑定表，从 auth.identities 同步';
comment on column public.user_identities.provider is '认证提供商：email, github, google';
comment on column public.user_identities.provider_user_id is '第三方平台的用户唯一标识';
comment on function sync_user_identities is '从 Supabase Auth 同步现有用户的身份信息';
