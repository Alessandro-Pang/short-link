/*
 * @Author: zi.yang
 * @Date: 2025-12-27
 * @Description: Dashboard 数据服务
 * @FilePath: /short-link/service/dashboard.js
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

/**
 * 获取用户统计数据
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 统计数据
 */
export async function getUserStats(userId) {
  try {
    // 直接从 links 表查询并计算统计
    const { data: links, error } = await supabase
      .from("links")
      .select("id, click_count, created_at")
      .eq("user_id", userId);

    if (error) {
      console.error("查询用户链接失败:", error);
      throw error;
    }

    if (!links || links.length === 0) {
      return {
        total_links: 0,
        total_clicks: 0,
        weekly_new_links: 0,
        avg_clicks_per_link: 0,
      };
    }

    // 计算统计数据
    const totalLinks = links.length;
    const totalClicks = links.reduce(
      (sum, link) => sum + (link.click_count || 0),
      0,
    );

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weeklyNewLinks = links.filter(
      (link) => new Date(link.created_at) >= oneWeekAgo,
    ).length;

    const avgClicksPerLink =
      totalLinks > 0 ? (totalClicks / totalLinks).toFixed(2) : 0;

    return {
      total_links: totalLinks,
      total_clicks: totalClicks,
      weekly_new_links: weeklyNewLinks,
      avg_clicks_per_link: parseFloat(avgClicksPerLink),
    };
  } catch (error) {
    console.error("获取用户统计失败:", error);
    throw error;
  }
}

/**
 * 获取用户链接列表
 * @param {string} userId - 用户 ID
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} 链接列表和总数
 */
export async function getUserLinks(userId, options = {}) {
  const {
    limit = 50,
    offset = 0,
    orderBy = "created_at",
    ascending = false,
  } = options;

  try {
    const { data, error, count } = await supabase
      .from("links")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order(orderBy, { ascending })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("查询用户链接失败:", error);
      throw error;
    }

    return {
      links: data || [],
      total: count || 0,
    };
  } catch (error) {
    console.error("获取用户链接列表失败:", error);
    throw error;
  }
}

/**
 * 获取单个链接详情
 * @param {number} linkId - 链接 ID
 * @param {string} userId - 用户 ID（用于权限验证）
 * @returns {Promise<Object|null>} 链接详情
 */
export async function getLinkDetail(linkId, userId) {
  try {
    const { data, error } = await supabase
      .from("links")
      .select("*")
      .eq("id", linkId)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      console.error("查询链接详情失败:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("获取链接详情失败:", error);
    throw error;
  }
}

/**
 * 获取链接访问日志
 * @param {number} linkId - 链接 ID
 * @param {string} userId - 用户 ID（用于权限验证）
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} 访问日志列表
 */
export async function getLinkAccessLogs(linkId, userId, options = {}) {
  const { limit = 50, offset = 0 } = options;

  try {
    // 首先验证链接是否属于该用户
    const { data: link } = await supabase
      .from("links")
      .select("user_id")
      .eq("id", linkId)
      .single();

    if (!link || link.user_id !== userId) {
      throw new Error("无权访问此链接的日志");
    }

    // 查询访问日志
    const { data, error, count } = await supabase
      .from("link_access_logs")
      .select("*", { count: "exact" })
      .eq("link_id", linkId)
      .order("accessed_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("查询访问日志失败:", error);
      throw error;
    }

    return {
      logs: data || [],
      total: count || 0,
    };
  } catch (error) {
    console.error("获取链接访问日志失败:", error);
    throw error;
  }
}

/**
 * 更新链接
 * @param {number} linkId - 链接 ID
 * @param {string} userId - 用户 ID（用于权限验证）
 * @param {Object} updates - 更新数据
 * @returns {Promise<Object>} 更新后的链接
 */
export async function updateLink(linkId, userId, updates) {
  try {
    // 首先验证链接是否属于该用户
    const { data: link } = await supabase
      .from("links")
      .select("user_id")
      .eq("id", linkId)
      .single();

    if (!link || link.user_id !== userId) {
      throw new Error("无权更新此链接");
    }

    // 允许更新的字段
    const allowedFields = [
      "is_active",
      "title",
      "description",
      "expiration_date",
      "max_clicks",
      "redirect_type",
      "pass_query_params",
      "forward_headers",
      "forward_header_list",
      "access_restrictions",
    ];

    // 过滤只保留允许更新的字段
    const filteredUpdates = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }

    // 更新链接
    const { data, error } = await supabase
      .from("links")
      .update(filteredUpdates)
      .eq("id", linkId)
      .select()
      .single();

    if (error) {
      console.error("更新链接失败:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("更新链接失败:", error);
    throw error;
  }
}

/**
 * 删除链接
 * @param {number} linkId - 链接 ID
 * @param {string} userId - 用户 ID（用于权限验证）
 * @returns {Promise}
 */
export async function deleteLink(linkId, userId) {
  try {
    // 首先验证链接是否属于该用户
    const { data: link } = await supabase
      .from("links")
      .select("user_id")
      .eq("id", linkId)
      .single();

    if (!link || link.user_id !== userId) {
      throw new Error("无权删除此链接");
    }

    // 删除链接
    const { error } = await supabase.from("links").delete().eq("id", linkId);

    if (error) {
      console.error("删除链接失败:", error);
      throw error;
    }
  } catch (error) {
    console.error("删除链接失败:", error);
    throw error;
  }
}

/**
 * 获取链接访问统计（按日期分组）
 * @param {number} linkId - 链接 ID
 * @param {string} userId - 用户 ID（用于权限验证）
 * @param {number} days - 统计天数
 * @returns {Promise<Array>} 按日期分组的访问统计
 */
export async function getLinkAccessStats(linkId, userId, days = 7) {
  try {
    // 首先验证链接是否属于该用户
    const { data: link } = await supabase
      .from("links")
      .select("user_id")
      .eq("id", linkId)
      .single();

    if (!link || link.user_id !== userId) {
      throw new Error("无权访问此链接的统计");
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 查询访问日志
    const { data, error } = await supabase
      .from("link_access_logs")
      .select("accessed_at, device_type, country")
      .eq("link_id", linkId)
      .gte("accessed_at", startDate.toISOString())
      .order("accessed_at", { ascending: true });

    if (error) {
      console.error("查询访问统计失败:", error);
      throw error;
    }

    // 按日期分组统计
    const dailyStats = {};
    const deviceStats = {};
    const countryStats = {};

    for (const log of data || []) {
      const date = log.accessed_at.split("T")[0];
      dailyStats[date] = (dailyStats[date] || 0) + 1;

      if (log.device_type) {
        deviceStats[log.device_type] = (deviceStats[log.device_type] || 0) + 1;
      }

      if (log.country) {
        countryStats[log.country] = (countryStats[log.country] || 0) + 1;
      }
    }

    return {
      daily: Object.entries(dailyStats).map(([date, count]) => ({
        date,
        count,
      })),
      devices: Object.entries(deviceStats).map(([device, count]) => ({
        device,
        count,
      })),
      countries: Object.entries(countryStats).map(([country, count]) => ({
        country,
        count,
      })),
      total: data?.length || 0,
    };
  } catch (error) {
    console.error("获取链接访问统计失败:", error);
    throw error;
  }
}
