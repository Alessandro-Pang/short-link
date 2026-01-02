

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."check_ip_in_cidr"("ip_address" "text", "cidr_list" "jsonb") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."check_ip_in_cidr"("ip_address" "text", "cidr_list" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."clean_old_login_logs"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    DELETE FROM login_logs
    WHERE login_at < NOW() - INTERVAL '90 days';
END;
$$;


ALTER FUNCTION "public"."clean_old_login_logs"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."clean_old_login_logs"() IS '清理 90 天前的登录日志';



CREATE OR REPLACE FUNCTION "public"."get_top_links_by_period"("p_user_id" "uuid" DEFAULT NULL::"uuid", "p_start_date" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_limit" integer DEFAULT 20) RETURNS TABLE("id" bigint, "short" "text", "link" "text", "click_count" bigint, "user_id" "uuid", "created_at" timestamp with time zone, "is_active" boolean, "period_clicks" bigint)
    LANGUAGE "plpgsql" STABLE
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
      AND (p_start_date IS NULL OR lal.accessed_at >= p_start_date)
  WHERE
    p_user_id IS NULL OR l.user_id = p_user_id
  GROUP BY
    l.id, l.short, l.link, l.click_count, l.user_id, l.created_at, l.is_active
  having 
    COUNT(lal.id) > 0
  ORDER BY
    period_clicks DESC,
    l.click_count DESC
  LIMIT
    p_limit;
END;
$$;


ALTER FUNCTION "public"."get_top_links_by_period"("p_user_id" "uuid", "p_start_date" timestamp with time zone, "p_limit" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_top_links_by_period"("p_user_id" "uuid", "p_start_date" timestamp with time zone, "p_limit" integer) IS '获取链接排行榜。p_user_id 为 NULL 时返回全局排行榜，否则返回指定用户的排行榜。p_start_date 为 NULL 时统计所有时间的点击数。';



CREATE OR REPLACE FUNCTION "public"."get_valid_link"("short_code" "text", "visitor_ip" "text" DEFAULT NULL::"text", "visitor_device" "text" DEFAULT NULL::"text", "visitor_referrer" "text" DEFAULT NULL::"text") RETURNS TABLE("id" bigint, "link" "text", "redirect_type" smallint, "pass_query_params" boolean, "forward_headers" boolean, "forward_header_list" "jsonb", "is_valid" boolean, "error_message" "text")
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."get_valid_link"("short_code" "text", "visitor_ip" "text", "visitor_device" "text", "visitor_referrer" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  insert into public.user_profiles (id, username)
  values (
    new.id,
    new.raw_user_meta_data->>'username'
  );
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user_identity"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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


ALTER FUNCTION "public"."handle_new_user_identity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_click_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  update public.links
  set click_count = click_count + 1
  where id = new.link_id;
  return new;
end;
$$;


ALTER FUNCTION "public"."increment_click_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_user_identities"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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


ALTER FUNCTION "public"."sync_user_identities"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."sync_user_identities"() IS '从 Supabase Auth 同步现有用户的身份信息';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."expiration_options" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "days" integer,
    "is_permanent" boolean DEFAULT false,
    "sort_order" integer DEFAULT 0,
    "hours" integer
);


ALTER TABLE "public"."expiration_options" OWNER TO "postgres";


COMMENT ON TABLE "public"."expiration_options" IS '过期时间预设选项';



COMMENT ON COLUMN "public"."expiration_options"."hours" IS '小时数，用于小时级别的过期时间配置';



ALTER TABLE "public"."expiration_options" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."expiration_options_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."link_access_logs" (
    "id" bigint NOT NULL,
    "link_id" bigint NOT NULL,
    "accessed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ip_address" "text",
    "user_agent" "text",
    "referrer" "text",
    "country" "text",
    "city" "text",
    "device_type" "text",
    "browser" "text",
    "os" "text"
);


ALTER TABLE "public"."link_access_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."link_access_logs" IS '访问日志表，记录每次短链接访问';



COMMENT ON COLUMN "public"."link_access_logs"."device_type" IS '设备类型: mobile, tablet, desktop';



ALTER TABLE "public"."link_access_logs" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."link_access_logs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."links" (
    "link" "text" NOT NULL,
    "short" "text" NOT NULL,
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid",
    "click_count" bigint DEFAULT 0,
    "title" "text",
    "description" "text",
    "expiration_date" timestamp without time zone,
    "is_active" boolean DEFAULT true,
    "password_hash" "text",
    "max_clicks" integer,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "redirect_type" smallint DEFAULT 302,
    "pass_query_params" boolean DEFAULT false,
    "forward_headers" boolean DEFAULT false,
    "forward_header_list" "jsonb" DEFAULT '[]'::"jsonb",
    "access_restrictions" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "chk_redirect_type" CHECK (("redirect_type" = ANY (ARRAY[301, 302, 307, 308])))
);


ALTER TABLE "public"."links" OWNER TO "postgres";


COMMENT ON TABLE "public"."links" IS '短链接表，支持用户关联和匿名创建';



COMMENT ON COLUMN "public"."links"."short" IS '短链接哈希值，全局唯一';



COMMENT ON COLUMN "public"."links"."user_id" IS '关联 auth.users.id，null 表示匿名创建';



COMMENT ON COLUMN "public"."links"."click_count" IS '点击次数缓存，通过触发器自动更新';



COMMENT ON COLUMN "public"."links"."password_hash" IS '可选的访问密码 (bcrypt hash)';



COMMENT ON COLUMN "public"."links"."max_clicks" IS '可选的最大点击次数限制';



COMMENT ON COLUMN "public"."links"."redirect_type" IS '重定向类型: 301(永久), 302(临时), 307(临时-保持方法), 308(永久-保持方法)';



COMMENT ON COLUMN "public"."links"."pass_query_params" IS '是否透传 URL 参数到目标链接';



COMMENT ON COLUMN "public"."links"."forward_headers" IS '是否转发指定的请求头';



COMMENT ON COLUMN "public"."links"."forward_header_list" IS '需要转发的请求头列表 (JSON 数组)';



COMMENT ON COLUMN "public"."links"."access_restrictions" IS '访问限制配置 (JSON 对象)';



ALTER TABLE "public"."links" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."links_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."login_logs" (
    "id" bigint NOT NULL,
    "user_id" "uuid",
    "email" "text" NOT NULL,
    "ip_address" "text",
    "user_agent" "text",
    "success" boolean DEFAULT false NOT NULL,
    "failure_reason" "text",
    "login_method" "text" DEFAULT 'email'::"text" NOT NULL,
    "login_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."login_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."login_logs" IS '用户登录日志表';



COMMENT ON COLUMN "public"."login_logs"."user_id" IS '用户 ID，登录成功时才会有值';



COMMENT ON COLUMN "public"."login_logs"."email" IS '登录邮箱';



COMMENT ON COLUMN "public"."login_logs"."ip_address" IS '登录 IP 地址';



COMMENT ON COLUMN "public"."login_logs"."user_agent" IS '用户代理字符串';



COMMENT ON COLUMN "public"."login_logs"."success" IS '登录是否成功';



COMMENT ON COLUMN "public"."login_logs"."failure_reason" IS '登录失败原因';



COMMENT ON COLUMN "public"."login_logs"."login_method" IS '登录方式：email/github/google';



COMMENT ON COLUMN "public"."login_logs"."login_at" IS '登录时间';



CREATE SEQUENCE IF NOT EXISTS "public"."login_logs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."login_logs_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."login_logs_id_seq" OWNED BY "public"."login_logs"."id";



CREATE TABLE IF NOT EXISTS "public"."user_identities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "provider" "text" NOT NULL,
    "provider_user_id" "text" NOT NULL,
    "provider_email" "text",
    "provider_metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "linked_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_identities_provider_check" CHECK (("provider" = ANY (ARRAY['email'::"text", 'github'::"text", 'google'::"text"])))
);


ALTER TABLE "public"."user_identities" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_identities" IS '用户身份绑定表，从 auth.identities 同步';



COMMENT ON COLUMN "public"."user_identities"."provider" IS '认证提供商：email, github, google';



COMMENT ON COLUMN "public"."user_identities"."provider_user_id" IS '第三方平台的用户唯一标识';



COMMENT ON COLUMN "public"."user_identities"."provider_metadata" IS '第三方平台返回的用户元数据（JSON 格式）';



CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" NOT NULL,
    "username" "text",
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_admin" boolean DEFAULT false
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_profiles" IS '用户扩展信息表，关联 Supabase auth.users';



COMMENT ON COLUMN "public"."user_profiles"."is_admin" IS '是否为管理员';



ALTER TABLE ONLY "public"."login_logs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."login_logs_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."expiration_options"
    ADD CONSTRAINT "expiration_options_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."link_access_logs"
    ADD CONSTRAINT "link_access_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."links"
    ADD CONSTRAINT "links_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."links"
    ADD CONSTRAINT "links_short_unique" UNIQUE ("short");



ALTER TABLE ONLY "public"."login_logs"
    ADD CONSTRAINT "login_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_identities"
    ADD CONSTRAINT "user_identities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_identities"
    ADD CONSTRAINT "user_identities_provider_provider_user_id_key" UNIQUE ("provider", "provider_user_id");



ALTER TABLE ONLY "public"."user_identities"
    ADD CONSTRAINT "user_identities_user_id_provider_key" UNIQUE ("user_id", "provider");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_username_key" UNIQUE ("username");



CREATE INDEX "idx_link_access_logs_accessed_at" ON "public"."link_access_logs" USING "btree" ("accessed_at" DESC);



CREATE INDEX "idx_link_access_logs_device_type" ON "public"."link_access_logs" USING "btree" ("device_type");



CREATE INDEX "idx_link_access_logs_link_id" ON "public"."link_access_logs" USING "btree" ("link_id");



CREATE INDEX "idx_links_created_at" ON "public"."links" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_links_expiration" ON "public"."links" USING "btree" ("expiration_date") WHERE ("expiration_date" IS NOT NULL);



CREATE INDEX "idx_links_is_active" ON "public"."links" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_links_pass_query_params" ON "public"."links" USING "btree" ("pass_query_params") WHERE ("pass_query_params" = true);



CREATE INDEX "idx_links_redirect_type" ON "public"."links" USING "btree" ("redirect_type");



CREATE INDEX "idx_links_short" ON "public"."links" USING "btree" ("short");



CREATE INDEX "idx_links_user_id" ON "public"."links" USING "btree" ("user_id");



CREATE INDEX "idx_login_logs_email" ON "public"."login_logs" USING "btree" ("email");



CREATE INDEX "idx_login_logs_login_at" ON "public"."login_logs" USING "btree" ("login_at" DESC);



CREATE INDEX "idx_login_logs_success" ON "public"."login_logs" USING "btree" ("success");



CREATE INDEX "idx_login_logs_user_id" ON "public"."login_logs" USING "btree" ("user_id");



CREATE INDEX "idx_user_identities_provider" ON "public"."user_identities" USING "btree" ("provider");



CREATE INDEX "idx_user_identities_user_id" ON "public"."user_identities" USING "btree" ("user_id");



CREATE INDEX "idx_user_profiles_username" ON "public"."user_profiles" USING "btree" ("username");



CREATE OR REPLACE TRIGGER "on_link_access" AFTER INSERT ON "public"."link_access_logs" FOR EACH ROW EXECUTE FUNCTION "public"."increment_click_count"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."links" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



ALTER TABLE ONLY "public"."link_access_logs"
    ADD CONSTRAINT "link_access_logs_link_id_fkey" FOREIGN KEY ("link_id") REFERENCES "public"."links"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."links"
    ADD CONSTRAINT "links_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."login_logs"
    ADD CONSTRAINT "login_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_identities"
    ADD CONSTRAINT "user_identities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Service role can insert any login log" ON "public"."login_logs" FOR INSERT WITH CHECK (true);



CREATE POLICY "Service role can view all login logs" ON "public"."login_logs" FOR SELECT USING ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));



CREATE POLICY "Users can view their own login logs" ON "public"."login_logs" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."expiration_options" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."link_access_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."links" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."login_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_identities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "任何人都可以插入访问日志" ON "public"."link_access_logs" FOR INSERT WITH CHECK (true);



CREATE POLICY "公开访问短链接" ON "public"."links" FOR SELECT USING (true);



CREATE POLICY "匿名用户可以创建短链接" ON "public"."links" FOR INSERT WITH CHECK (("user_id" IS NULL));



CREATE POLICY "用户创建自己的身份绑定" ON "public"."user_identities" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "用户删除自己的身份绑定" ON "public"."user_identities" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "用户只能删除自己的链接" ON "public"."links" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "用户只能更新自己的链接" ON "public"."links" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "用户可以插入自己的资料" ON "public"."user_profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "用户可以更新自己的资料" ON "public"."user_profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "用户可以查看自己的资料" ON "public"."user_profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "用户查看自己的身份绑定" ON "public"."user_identities" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "用户查看自己的链接" ON "public"."links" FOR SELECT USING ((("auth"."uid"() = "user_id") OR ("user_id" IS NULL)));



CREATE POLICY "认证用户可以创建短链接" ON "public"."links" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "链接所有者可以查看访问日志" ON "public"."link_access_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."links"
  WHERE (("links"."id" = "link_access_logs"."link_id") AND ("links"."user_id" = "auth"."uid"())))));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




















































































































































































GRANT ALL ON FUNCTION "public"."check_ip_in_cidr"("ip_address" "text", "cidr_list" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."check_ip_in_cidr"("ip_address" "text", "cidr_list" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_ip_in_cidr"("ip_address" "text", "cidr_list" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."clean_old_login_logs"() TO "anon";
GRANT ALL ON FUNCTION "public"."clean_old_login_logs"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."clean_old_login_logs"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_top_links_by_period"("p_user_id" "uuid", "p_start_date" timestamp with time zone, "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_top_links_by_period"("p_user_id" "uuid", "p_start_date" timestamp with time zone, "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_top_links_by_period"("p_user_id" "uuid", "p_start_date" timestamp with time zone, "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_valid_link"("short_code" "text", "visitor_ip" "text", "visitor_device" "text", "visitor_referrer" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_valid_link"("short_code" "text", "visitor_ip" "text", "visitor_device" "text", "visitor_referrer" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_valid_link"("short_code" "text", "visitor_ip" "text", "visitor_device" "text", "visitor_referrer" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user_identity"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user_identity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user_identity"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_click_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."increment_click_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_click_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_user_identities"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_user_identities"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_user_identities"() TO "service_role";


















GRANT ALL ON TABLE "public"."expiration_options" TO "anon";
GRANT ALL ON TABLE "public"."expiration_options" TO "authenticated";
GRANT ALL ON TABLE "public"."expiration_options" TO "service_role";



GRANT ALL ON SEQUENCE "public"."expiration_options_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."expiration_options_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."expiration_options_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."link_access_logs" TO "anon";
GRANT ALL ON TABLE "public"."link_access_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."link_access_logs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."link_access_logs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."link_access_logs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."link_access_logs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."links" TO "anon";
GRANT ALL ON TABLE "public"."links" TO "authenticated";
GRANT ALL ON TABLE "public"."links" TO "service_role";



GRANT ALL ON SEQUENCE "public"."links_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."links_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."links_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."login_logs" TO "anon";
GRANT ALL ON TABLE "public"."login_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."login_logs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."login_logs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."login_logs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."login_logs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_identities" TO "anon";
GRANT ALL ON TABLE "public"."user_identities" TO "authenticated";
GRANT ALL ON TABLE "public"."user_identities" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























