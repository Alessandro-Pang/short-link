/*
 * @Author: zi.yang
 * @Date: 2025-12-28
 * @Description: 登录日志服务
 * @FilePath: /short-link/service/login-log.js
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  },
);

/**
 * 记录登录日志
 * @param {Object} logData - 登录日志数据
 * @returns {Promise<Object>} 记录结果
 */
export async function logLogin(logData) {
  try {
    const {
      user_id,
      email,
      ip_address,
      user_agent,
      success,
      failure_reason = null,
      login_method = "email",
    } = logData;

    const { data, error } = await supabase
      .from("login_logs")
      .insert({
        user_id,
        email,
        ip_address,
        user_agent,
        success,
        failure_reason,
        login_method,
        login_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("记录登录日志失败:", error);
      // 不抛出错误，避免影响登录流程
      return null;
    }

    return data;
  } catch (error) {
    console.error("记录登录日志异常:", error);
    return null;
  }
}

/**
 * 获取用户的登录日志
 * @param {string} userId - 用户 ID
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} 登录日志列表
 */
export async function getUserLoginLogs(userId, options = {}) {
  try {
    const { limit = 50, offset = 0 } = options;

    const { data, error, count } = await supabase
      .from("login_logs")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("login_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("获取登录日志失败:", error);
      throw error;
    }

    return {
      logs: data || [],
      total: count || 0,
    };
  } catch (error) {
    console.error("获取登录日志异常:", error);
    throw error;
  }
}

/**
 * 获取所有登录日志（管理员专用）
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} 登录日志列表
 */
export async function getAllLoginLogs(options = {}) {
  try {
    const {
      limit = 50,
      offset = 0,
      userId = null,
      success = null,
      startDate = null,
      endDate = null,
    } = options;

    let query = supabase
      .from("login_logs")
      .select("*", { count: "exact" })
      .order("login_at", { ascending: false });

    // 添加筛选条件
    if (userId) {
      query = query.eq("user_id", userId);
    }

    if (success !== null) {
      query = query.eq("success", success);
    }

    if (startDate) {
      query = query.gte("login_at", startDate);
    }

    if (endDate) {
      query = query.lte("login_at", endDate);
    }

    const { data, error, count } = await query.range(
      offset,
      offset + limit - 1,
    );

    if (error) {
      console.error("获取登录日志失败:", error);
      throw error;
    }

    return {
      logs: data || [],
      total: count || 0,
    };
  } catch (error) {
    console.error("获取登录日志异常:", error);
    throw error;
  }
}

/**
 * 获取登录统计信息
 * @param {string} userId - 用户 ID（可选，不传则获取全局统计）
 * @returns {Promise<Object>} 登录统计
 */
export async function getLoginStats(userId = null) {
  try {
    let query = supabase.from("login_logs").select("success, login_at");

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("获取登录统计失败:", error);
      throw error;
    }

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const stats = {
      total: data.length,
      successful: data.filter((log) => log.success).length,
      failed: data.filter((log) => !log.success).length,
      last24h: data.filter((log) => new Date(log.login_at) >= last24h).length,
      last7d: data.filter((log) => new Date(log.login_at) >= last7d).length,
      last30d: data.filter((log) => new Date(log.login_at) >= last30d).length,
    };

    return stats;
  } catch (error) {
    console.error("获取登录统计异常:", error);
    throw error;
  }
}

/**
 * 清理旧的登录日志（保留最近 90 天）
 * @returns {Promise<Object>} 清理结果
 */
export async function cleanOldLoginLogs() {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { error, count } = await supabase
      .from("login_logs")
      .delete()
      .lt("login_at", ninetyDaysAgo.toISOString());

    if (error) {
      console.error("清理登录日志失败:", error);
      throw error;
    }

    return {
      success: true,
      deleted: count || 0,
      message: `已清理 ${count || 0} 条登录日志`,
    };
  } catch (error) {
    console.error("清理登录日志异常:", error);
    throw error;
  }
}

/**
 * 记录登录尝试（别名，用于控制器调用）
 * @param {Object} logData - 登录日志数据
 * @returns {Promise<Object>} 记录结果
 */
export async function recordLoginAttempt(logData) {
  return logLogin(logData);
}
