/*
 * @Author: zi.yang
 * @Date: 2025-12-29 00:00:00
 * @LastEditors: zi.yang
 * @LastEditTime: 2025-12-29 00:00:00
 * @Description: 统一的 Supabase 数据库连接模块
 * @FilePath: /short-link/service/db.ts
 */
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

// 验证环境变量
if (!process.env.SUPABASE_URL) {
  throw new Error("Missing SUPABASE_URL environment variable");
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
}

/**
 * Supabase 客户端单例
 * 使用 Service Role Key，具有管理员权限
 * 仅在服务端使用，切勿暴露给客户端
 */
const supabase: SupabaseClient = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    // 数据库连接池配置
    db: {
      schema: "public",
    },
    // 全局请求配置
    global: {
      headers: {
        "x-application-name": "short-link-service",
      },
    },
  },
) as any;

/**
 * 健康检查 - 验证数据库连接是否正常
 */
export async function checkHealth(): Promise<{
  healthy: boolean;
  error?: string;
}> {
  try {
    const { error } = await supabase.from("links").select("id").limit(1);

    if (error) {
      return { healthy: false, error: error.message };
    }

    return { healthy: true };
  } catch (err: any) {
    return { healthy: false, error: err.message };
  }
}

export default supabase;
