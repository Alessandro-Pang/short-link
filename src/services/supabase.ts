/**
 * Supabase 客户端配置
 * 仅用于前端认证（Auth UI），不直接操作数据库
 */

import { createClient } from "@supabase/supabase-js";

// 从环境变量中获取 Supabase 配置
const supabaseUrl = __SUPABASE_URL__;
const supabaseAnonKey = __SUPABASE_ANON_KEY__;

// 创建 Supabase 客户端实例
// 注意：仅用于认证，所有数据操作都通过后端 API
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
