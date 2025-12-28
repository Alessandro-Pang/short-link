-- 账号绑定功能数据库迁移脚本
-- 用于支持用户绑定/解绑邮箱、GitHub、Google 账号

-- 1. 创建用户身份绑定表
create table if not exists public.user_identities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('email', 'github', 'google')),
  provider_user_id text not null, -- 第三方平台的用户ID
  provider_email text, -- 第三方平台的邮箱
  provider_metadata jsonb default '{}'::jsonb, -- 第三方平台的其他信息（如头像、用户名等）
  linked_at timestamp with time zone not null default now(),

  -- 确保同一个用户不会重复绑定同一个第三方账号
  unique(user_id, provider),
  -- 确保同一个第三方账号只能绑定到一个用户
  unique(provider, provider_user_id)
);

-- 2. 添加索引以提高查询性能
create index if not exists idx_user_identities_user_id on public.user_identities(user_id);
create index if not exists idx_user_identities_provider on public.user_identities(provider);

-- 3. 启用 RLS (Row Level Security)
alter table public.user_identities enable row level security;

-- 4. 创建 RLS 策略 - 用户只能查看自己的绑定信息
create policy "用户查看自己的身份绑定"
  on public.user_identities for select
  using (auth.uid() = user_id);

-- 5. 创建 RLS 策略 - 用户只能插入自己的绑定信息
create policy "用户创建自己的身份绑定"
  on public.user_identities for insert
  with check (auth.uid() = user_id);

-- 6. 创建 RLS 策略 - 用户只能删除自己的绑定信息
create policy "用户删除自己的身份绑定"
  on public.user_identities for delete
  using (auth.uid() = user_id);

-- 7. 创建函数：迁移现有用户的认证信息到 user_identities 表
create or replace function migrate_existing_identities()
returns void
language plpgsql
security definer
as $$
declare
  user_record record;
  identity_data jsonb;
begin
  -- 遍历所有已登录用户
  for user_record in
    select
      id,
      email,
      raw_app_meta_data,
      raw_user_meta_data
    from auth.users
  loop
    -- 处理邮箱登录
    if user_record.email is not null then
      insert into public.user_identities (user_id, provider, provider_user_id, provider_email)
      values (user_record.id, 'email', user_record.id::text, user_record.email)
      on conflict (user_id, provider) do nothing;
    end if;

    -- 处理 OAuth 登录（GitHub/Google）
    if user_record.raw_app_meta_data ? 'provider' then
      declare
        oauth_provider text := user_record.raw_app_meta_data->>'provider';
        oauth_sub text := user_record.raw_app_meta_data->>'provider_id';
        oauth_email text := user_record.email;
      begin
        if oauth_provider in ('github', 'google') and oauth_sub is not null then
          insert into public.user_identities (
            user_id,
            provider,
            provider_user_id,
            provider_email,
            provider_metadata
          )
          values (
            user_record.id,
            oauth_provider,
            oauth_sub,
            oauth_email,
            user_record.raw_user_meta_data
          )
          on conflict (user_id, provider) do nothing;
        end if;
      end;
    end if;
  end loop;
end;
$$;

-- 8. 执行迁移（可选：首次运行时取消注释）
-- select migrate_existing_identities();

-- 9. 创建触发器函数：当新用户通过 OAuth 注册时，自动创建身份绑定记录
create or replace function handle_new_oauth_user()
returns trigger
language plpgsql
security definer
as $$
declare
  oauth_provider text;
  oauth_sub text;
begin
  -- 获取 OAuth 提供商信息
  oauth_provider := new.raw_app_meta_data->>'provider';
  oauth_sub := new.raw_app_meta_data->>'provider_id';

  -- 如果是 OAuth 登录，创建身份绑定记录
  if oauth_provider in ('github', 'google') and oauth_sub is not null then
    insert into public.user_identities (
      user_id,
      provider,
      provider_user_id,
      provider_email,
      provider_metadata
    )
    values (
      new.id,
      oauth_provider,
      oauth_sub,
      new.email,
      new.raw_user_meta_data
    )
    on conflict (user_id, provider) do nothing;
  end if;

  -- 如果有邮箱，也创建邮箱绑定记录
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

-- 10. 创建触发器：在用户创建时自动添加身份绑定
drop trigger if exists on_auth_user_created_identity on auth.users;
create trigger on_auth_user_created_identity
  after insert on auth.users
  for each row
  execute function handle_new_oauth_user();

-- 11. 添加账号删除日志表（用于审计）
create table if not exists public.account_deletion_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  user_email text,
  deleted_at timestamp with time zone not null default now(),
  deletion_reason text,
  deleted_by uuid references auth.users(id) -- 操作者（可能是用户自己或管理员）
);

-- 12. 创建函数：安全删除用户账号
create or replace function delete_user_account(
  target_user_id uuid,
  deletion_reason text default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  user_email text;
  result jsonb;
begin
  -- 检查权限：只有用户本人可以删除自己的账号
  if auth.uid() != target_user_id then
    raise exception '无权删除其他用户的账号';
  end if;

  -- 获取用户邮箱用于日志记录
  select email into user_email from auth.users where id = target_user_id;

  -- 记录删除日志
  insert into public.account_deletion_logs (user_id, user_email, deletion_reason, deleted_by)
  values (target_user_id, user_email, deletion_reason, auth.uid());

  -- 删除用户相关数据（级联删除会自动处理 user_identities, user_profiles, links 等）
  delete from auth.users where id = target_user_id;

  result := jsonb_build_object(
    'success', true,
    'message', '账号已成功删除',
    'deleted_user_id', target_user_id
  );

  return result;
exception
  when others then
    result := jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
    return result;
end;
$$;

-- 13. 添加注释
comment on table public.user_identities is '用户身份绑定表，存储用户绑定的邮箱、GitHub、Google 等账号信息';
comment on column public.user_identities.provider is '认证提供商：email, github, google';
comment on column public.user_identities.provider_user_id is '第三方平台的用户唯一标识';
comment on column public.user_identities.provider_metadata is '第三方平台返回的用户元数据（JSON 格式）';

comment on table public.account_deletion_logs is '账号删除日志表，用于审计和记录';
comment on function delete_user_account is '安全删除用户账号，包含权限检查和日志记录';
