-- ============================================
-- 短链接服务数据库字段检查脚本
-- 用于诊断高级配置字段是否已添加
-- ============================================

-- 检查 links 表的字段
SELECT
    'links' as table_name,
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'links'
ORDER BY ordinal_position;

-- 检查关键字段是否存在
SELECT
    '检查结果' as check_type,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'links' AND column_name = 'redirect_type'
    ) THEN '✅ 存在' ELSE '❌ 缺失' END as redirect_type,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'links' AND column_name = 'pass_query_params'
    ) THEN '✅ 存在' ELSE '❌ 缺失' END as pass_query_params,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'links' AND column_name = 'forward_headers'
    ) THEN '✅ 存在' ELSE '❌ 缺失' END as forward_headers,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'links' AND column_name = 'forward_header_list'
    ) THEN '✅ 存在' ELSE '❌ 缺失' END as forward_header_list,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'links' AND column_name = 'max_clicks'
    ) THEN '✅ 存在' ELSE '❌ 缺失' END as max_clicks,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'links' AND column_name = 'access_restrictions'
    ) THEN '✅ 存在' ELSE '❌ 缺失' END as access_restrictions;

-- 检查 expiration_options 表的 hours 字段
SELECT
    '过期选项表' as check_type,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'expiration_options' AND column_name = 'hours'
    ) THEN '✅ hours 字段存在' ELSE '❌ hours 字段缺失' END as hours_field;

-- 检查 link_access_logs 表的 device_type 字段
SELECT
    '访问日志表' as check_type,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'link_access_logs' AND column_name = 'device_type'
    ) THEN '✅ device_type 字段存在' ELSE '❌ device_type 字段缺失' END as device_type_field;

-- 测试插入数据（不会真正插入，仅用于检测字段）
-- 如果以下查询报错，说明字段不存在
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '如果上面的检查显示字段缺失，请执行：';
    RAISE NOTICE 'config/migration-add-fields.sql';
    RAISE NOTICE '来添加必要的字段';
    RAISE NOTICE '========================================';
END $$;
