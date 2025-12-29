/*
 * @Author: zi.yang
 * @Date: 2025-12-28
 * @LastEditors: zi.yang
 * @LastEditTime: 2025-12-29 00:00:00
 * @Description: 登录日志服务 - 优化版（使用数据库聚合查询）
 * @FilePath: /short-link/service/login-log.js
 */
import supabase from "./db.js";
import type { LoginLogQueryOptions } from "../server/types/index.js";

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
export async function getUserLoginLogs(
  userId: string,
  options: Partial<LoginLogQueryOptions> = {},
) {
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
export async function getAllLoginLogs(
  options: Partial<LoginLogQueryOptions> = {},
) {
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
 * 获取登录统计信息（使用数据库聚合查询优化）
 * @param {string} userId - 用户 ID（可选，不传则获取全局统计）
 * @returns {Promise<Object>} 登录统计
 */
export async function getLoginStats(userId = null) {
  try {
    // 计算时间范围
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const last7d = new Date(
      now.getTime() - 7 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const last30d = new Date(
      now.getTime() - 30 * 24 * 60 * 60 * 1000,
    ).toISOString();

    // 构建基础查询条件
    const buildQuery = (baseQuery) => {
      if (userId) {
        return baseQuery.eq("user_id", userId);
      }
      return baseQuery;
    };

    // 查询 1：获取总数
    const { count: total, error: totalError } = await buildQuery(
      supabase.from("login_logs").select("id", { count: "exact", head: true }),
    );

    if (totalError) {
      console.error("查询登录总数失败:", totalError);
      throw totalError;
    }

    // 查询 2：获取成功登录数
    const { count: successful, error: successError } = await buildQuery(
      supabase
        .from("login_logs")
        .select("id", { count: "exact", head: true })
        .eq("success", true),
    );

    if (successError) {
      console.error("查询成功登录数失败:", successError);
      throw successError;
    }

    // 查询 3：最近 24 小时登录数
    const { count: countLast24h, error: error24h } = await buildQuery(
      supabase
        .from("login_logs")
        .select("id", { count: "exact", head: true })
        .gte("login_at", last24h),
    );

    if (error24h) {
      console.error("查询24小时登录数失败:", error24h);
      throw error24h;
    }

    // 查询 4：最近 7 天登录数
    const { count: countLast7d, error: error7d } = await buildQuery(
      supabase
        .from("login_logs")
        .select("id", { count: "exact", head: true })
        .gte("login_at", last7d),
    );

    if (error7d) {
      console.error("查询7天登录数失败:", error7d);
      throw error7d;
    }

    // 查询 5：最近 30 天登录数
    const { count: countLast30d, error: error30d } = await buildQuery(
      supabase
        .from("login_logs")
        .select("id", { count: "exact", head: true })
        .gte("login_at", last30d),
    );

    if (error30d) {
      console.error("查询30天登录数失败:", error30d);
      throw error30d;
    }

    return {
      total: total || 0,
      successful: successful || 0,
      failed: (total || 0) - (successful || 0),
      last24h: countLast24h || 0,
      last7d: countLast7d || 0,
      last30d: countLast30d || 0,
      successRate:
        total > 0 ? ((successful / total) * 100).toFixed(2) + "%" : "0%",
    };
  } catch (error) {
    console.error("获取登录统计异常:", error);
    throw error;
  }
}

/**
 * 获取登录趋势数据（按日期聚合）
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} 登录趋势数据
 */
export async function getLoginTrend(
  options: Partial<LoginLogQueryOptions> = {},
) {
  try {
    const { userId = null, days = 30 } = options;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = supabase
      .from("login_logs")
      .select("login_at, success")
      .gte("login_at", startDate.toISOString())
      .order("login_at", { ascending: true });

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("获取登录趋势失败:", error);
      throw error;
    }

    // 按日期聚合
    const dailyStats: Record<
      string,
      { total: number; success: number; failed: number }
    > = {};

    for (const log of data || []) {
      const date = new Date(log.login_at).toISOString().split("T")[0];

      if (!dailyStats[date]) {
        dailyStats[date] = { total: 0, success: 0, failed: 0 };
      }

      dailyStats[date].total++;
      if (log.success) {
        dailyStats[date].success++;
      } else {
        dailyStats[date].failed++;
      }
    }

    // 转换为数组格式
    const trend = Object.entries(dailyStats)
      .map(([date, stats]: [string, any]) => ({
        date,
        ...stats,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      trend,
      total: data?.length || 0,
    };
  } catch (error) {
    console.error("获取登录趋势异常:", error);
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
 * 获取最近的失败登录尝试（用于安全监控）
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} 失败登录列表
 */
export async function getRecentFailedAttempts(
  options: Partial<LoginLogQueryOptions> = {},
) {
  try {
    const { limit = 100, hours = 24 } = options;

    const sinceTime = new Date();
    sinceTime.setHours(sinceTime.getHours() - Number(hours));

    const { data, error, count } = await supabase
      .from("login_logs")
      .select("*", { count: "exact" })
      .eq("success", false)
      .gte("login_at", sinceTime.toISOString())
      .order("login_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("获取失败登录尝试失败:", error);
      throw error;
    }

    // 按 IP 分组统计
    const ipStats: Record<
      string,
      {
        count: number;
        lastAttempt: string;
        user_id: string | null;
        emails: Set<string>;
      }
    > = {};
    for (const log of data || []) {
      const ip = log.ip_address || "unknown";
      if (!ipStats[ip]) {
        ipStats[ip] = {
          count: 0,
          lastAttempt: "",
          user_id: null,
          emails: new Set(),
        };
      }
      ipStats[ip].count++;
      if (log.email) {
        ipStats[ip].emails.add(log.email);
      }
    }

    // 转换为数组并按次数排序
    const suspiciousIps = Object.entries(ipStats)
      .map(([ip, stats]: [string, any]) => ({
        ip,
        attempts: stats.count,
        uniqueEmails: stats.emails.size,
        emails: Array.from(stats.emails),
      }))
      .filter((item) => item.attempts >= 3) // 3次以上失败视为可疑
      .sort((a, b) => b.attempts - a.attempts);

    return {
      logs: data || [],
      total: count || 0,
      suspiciousIps,
    };
  } catch (error) {
    console.error("获取失败登录尝试异常:", error);
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
