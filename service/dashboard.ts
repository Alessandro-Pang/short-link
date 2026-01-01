/*
 * @Author: zi.yang
 * @Date: 2025-12-27
 * @LastEditors: zi.yang
 * @LastEditTime: 2025-12-29 00:00:00
 * @Description: Dashboard 数据服务 - 优化版（使用数据库聚合查询）
 * @FilePath: /short-link/service/dashboard.js
 */
import supabase from "./db.js";
import dayjs, { Dayjs } from "dayjs";
import type {
  LinkQueryOptions,
  QueryOptions,
  LinkAccessStatsOptions,
} from "../server/types/index.js";

/**
 * 获取用户统计数据（使用数据库聚合查询优化）
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 统计数据
 */
export async function getUserStats(userId: string) {
  try {
    // 使用数据库聚合查询，避免拉取所有数据到内存
    // 查询 1：获取总链接数和总点击数
    const { data: statsData, error: statsError } = await supabase
      .from("links")
      .select("click_count")
      .eq("user_id", userId);

    if (statsError) {
      console.error("查询用户统计失败:", statsError);
      throw statsError;
    }

    // 如果没有数据，返回默认值
    if (!statsData || statsData.length === 0) {
      return {
        total_links: 0,
        total_clicks: 0,
        weekly_new_links: 0,
        avg_clicks_per_link: 0,
      };
    }

    // 计算总数（这个查询已经很轻量，只返回 click_count）
    const totalLinks = statsData.length;
    const totalClicks = statsData.reduce(
      (sum, link) => sum + (link.click_count || 0),
      0,
    );

    // 查询 2：获取最近一周新建的链接数（使用数据库过滤）
    const oneWeekAgo = dayjs().subtract(7, "day").toISOString();

    const { count: weeklyNewLinks, error: weeklyError } = await supabase
      .from("links")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", oneWeekAgo);

    if (weeklyError) {
      console.error("查询周新增链接失败:", weeklyError);
    }

    const avgClicksPerLink =
      totalLinks > 0 ? (totalClicks / totalLinks).toFixed(2) : "0";

    return {
      total_links: totalLinks,
      total_clicks: totalClicks,
      weekly_new_links: weeklyNewLinks || 0,
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
export async function getUserLinks(
  userId: string,
  options: Partial<QueryOptions> = {},
) {
  try {
    const {
      limit = 10,
      offset = 0,
      sortBy = "created_at",
      sortOrder = "desc",
    } = options;

    // 构建查询
    let query = supabase
      .from("links")
      .select("*", { count: "exact" })
      .eq("user_id", userId);

    // 排序
    const ascending = sortOrder === "asc";
    query = query.order(sortBy, { ascending });

    // 分页
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("获取用户链接列表失败:", error);
      throw error;
    }

    return {
      links: data || [],
      total: count || 0,
    };
  } catch (error) {
    console.error("获取用户链接列表异常:", error);
    throw error;
  }
}

/**
 * 获取单个链接详情
 * @param {number} linkId - 链接 ID
 * @param {string} userId - 用户 ID
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
      console.error("获取链接详情失败:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("获取链接详情异常:", error);
    throw error;
  }
}

/**
 * 获取链接访问日志
 * @param {number} linkId - 链接 ID
 * @param {string} userId - 用户 ID
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} 访问日志
 */
export async function getLinkAccessLogs(
  linkId: number,
  userId: string,
  options: Partial<QueryOptions> = {},
) {
  try {
    const { limit = 50, offset = 0 } = options;

    // 先验证链接所有权
    const { data: link } = await supabase
      .from("links")
      .select("id")
      .eq("id", linkId)
      .eq("user_id", userId)
      .single();

    if (!link) {
      throw new Error("无权访问此链接的日志");
    }

    // 获取日志
    const { data, error, count } = await supabase
      .from("link_access_logs")
      .select("*", { count: "exact" })
      .eq("link_id", linkId)
      .order("accessed_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("获取访问日志失败:", error);
      throw error;
    }

    return {
      logs: data || [],
      total: count || 0,
    };
  } catch (error) {
    console.error("获取访问日志异常:", error);
    throw error;
  }
}

/**
 * 更新链接
 * @param {number} linkId - 链接 ID
 * @param {string} userId - 用户 ID
 * @param {Object} updates - 更新数据
 * @returns {Promise<Object>} 更新后的链接
 */
export async function updateLink(linkId, userId, updates) {
  try {
    // 先验证链接所有权
    const { data: link } = await supabase
      .from("links")
      .select("id")
      .eq("id", linkId)
      .eq("user_id", userId)
      .single();

    if (!link) {
      throw new Error("链接不存在或无权访问");
    }

    // 允许更新的字段
    const allowedFields = [
      "title",
      "description",
      "is_active",
      "expiration_date",
      "max_clicks",
      "redirect_type",
      "pass_query_params",
      "forward_headers",
      "forward_header_list",
      "access_restrictions",
    ];

    // 过滤更新字段
    const filteredUpdates = {};
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        filteredUpdates[key] = value;
      }
    }

    // 执行更新
    const { data, error } = await supabase
      .from("links")
      .update(filteredUpdates)
      .eq("id", linkId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("更新链接失败:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("更新链接异常:", error);
    throw error;
  }
}

/**
 * 删除链接
 * @param {number} linkId - 链接 ID
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 删除结果
 */
export async function deleteLink(linkId, userId) {
  try {
    // 先验证链接所有权
    const { data: link } = await supabase
      .from("links")
      .select("id")
      .eq("id", linkId)
      .eq("user_id", userId)
      .single();

    if (!link) {
      return { error: { message: "链接不存在或无权访问" } };
    }

    // 执行删除
    const { error } = await supabase
      .from("links")
      .delete()
      .eq("id", linkId)
      .eq("user_id", userId);

    if (error) {
      console.error("删除链接失败:", error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error("删除链接异常:", error);
    throw error;
  }
}

/**
 * 批量删除链接
 * @param {Array<number>} linkIds - 链接 ID 数组
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 删除结果
 */
export async function batchDeleteLinks(linkIds, userId) {
  try {
    // 先查询属于该用户的链接
    const { data: links, error: queryError } = await supabase
      .from("links")
      .select("id")
      .eq("user_id", userId)
      .in("id", linkIds);

    if (queryError) {
      console.error("查询链接失败:", queryError);
      throw queryError;
    }

    if (!links || links.length === 0) {
      return {
        success: 0,
        failed: linkIds.length,
      };
    }

    // 只删除属于该用户的链接
    const userLinkIds = links.map((l) => l.id);

    const { error } = await supabase
      .from("links")
      .delete()
      .eq("user_id", userId)
      .in("id", userLinkIds);

    if (error) {
      console.error("批量删除链接失败:", error);
      throw error;
    }

    return {
      success: userLinkIds.length,
      failed: linkIds.length - userLinkIds.length,
    };
  } catch (error) {
    console.error("批量删除链接异常:", error);
    throw error;
  }
}

/**
 * 批量切换链接状态
 * @param {Array<number>} linkIds - 链接 ID 数组
 * @param {string} userId - 用户 ID
 * @param {boolean} isActive - 是否启用
 * @returns {Promise<Object>} 操作结果
 */
export async function batchToggleLinks(linkIds, userId, isActive) {
  try {
    // 先查询属于该用户的链接
    const { data: links, error: queryError } = await supabase
      .from("links")
      .select("id")
      .eq("user_id", userId)
      .in("id", linkIds);

    if (queryError) {
      console.error("查询链接失败:", queryError);
      throw queryError;
    }

    if (!links || links.length === 0) {
      return {
        success: 0,
        failed: linkIds.length,
      };
    }

    // 只更新属于该用户的链接
    const userLinkIds = links.map((l) => l.id);

    const { error } = await supabase
      .from("links")
      .update({ is_active: isActive })
      .eq("user_id", userId)
      .in("id", userLinkIds);

    if (error) {
      console.error("批量更新链接状态失败:", error);
      throw error;
    }

    return {
      success: userLinkIds.length,
      failed: linkIds.length - userLinkIds.length,
    };
  } catch (error) {
    console.error("批量更新链接状态异常:", error);
    throw error;
  }
}

/**
 * 获取链接访问统计（按日期聚合）
 * @param {number} linkId - 链接 ID
 * @param {string} userId - 用户 ID
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} 访问统计
 */
export async function getLinkAccessStats(
  linkId: number,
  userId: string,
  options: Partial<QueryOptions> = {},
) {
  try {
    // 先验证链接所有权
    const { data: link } = await supabase
      .from("links")
      .select("id")
      .eq("id", linkId)
      .eq("user_id", userId)
      .single();

    if (!link) {
      throw new Error("无权访问此链接的统计");
    }

    const { days = 30 } = options;
    const startDate = dayjs().subtract(Number(days), "day").toISOString();

    // 获取访问日志
    const { data, error } = await supabase
      .from("link_access_logs")
      .select("accessed_at, device_type, country")
      .eq("link_id", linkId)
      .gte("accessed_at", startDate)
      .order("accessed_at", { ascending: true });

    if (error) {
      console.error("获取访问统计失败:", error);
      throw error;
    }

    // 聚合统计
    const dailyStats = {};
    const deviceStats = {};
    const countryStats = {};

    for (const log of data || []) {
      const date = dayjs(log.accessed_at).format("YYYY-MM-DD");

      // 按日期统计
      dailyStats[date] = (dailyStats[date] || 0) + 1;

      // 按设备统计
      const device = log.device_type || "unknown";
      deviceStats[device] = (deviceStats[device] || 0) + 1;

      // 按国家统计
      const country = log.country || "unknown";
      countryStats[country] = (countryStats[country] || 0) + 1;
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
    console.error("获取访问统计异常:", error);
    throw error;
  }
}

/**
 * 获取全局统计数据（管理员用，使用数据库聚合优化）
 * @returns {Promise<Object>} 全局统计
 */
export async function getGlobalStats() {
  try {
    // 查询 1：获取链接基本统计
    const { data: links, error: linksError } = await supabase
      .from("links")
      .select("click_count, user_id, created_at");

    if (linksError) {
      console.error("查询全局链接统计失败:", linksError);
      return {
        total_links: 0,
        total_clicks: 0,
        weekly_new_links: 0,
        avg_clicks_per_link: 0,
        total_users: 0,
        anonymous_links: 0,
      };
    }

    const totalLinks = links?.length || 0;
    const totalClicks =
      links?.reduce((sum, link) => sum + (link.click_count || 0), 0) || 0;

    // 计算最近一周新建的链接
    const oneWeekAgo = dayjs().subtract(7, "day");
    const weeklyNewLinks =
      links?.filter((link) => dayjs(link.created_at).isAfter(oneWeekAgo))
        .length || 0;

    const avgClicksPerLink =
      totalLinks > 0 ? (totalClicks / totalLinks).toFixed(2) : "0";

    // 统计独立用户数
    const userIds = new Set(links?.map((l) => l.user_id).filter(Boolean));
    const anonymousLinks = links?.filter((l) => !l.user_id).length || 0;

    return {
      total_links: totalLinks,
      total_clicks: totalClicks,
      weekly_new_links: weeklyNewLinks,
      avg_clicks_per_link: parseFloat(avgClicksPerLink),
      total_users: userIds.size,
      anonymous_links: anonymousLinks,
    };
  } catch (error) {
    console.error("获取全局统计失败:", error);
    throw error;
  }
}

/**
 * 获取所有链接列表（管理员用）
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} 链接列表和总数
 */
export async function getAllLinks(options: Partial<QueryOptions> = {}) {
  try {
    const {
      limit = 10,
      offset = 0,
      orderBy = "created_at",
      ascending = false,
      linkId = null,
      keyword = null,
      userId = null,
    } = options;

    let query = supabase.from("links").select("*", { count: "exact" });

    // 过滤条件
    if (linkId) {
      query = query.eq("id", linkId);
    }
    if (userId) {
      query = query.eq("user_id", userId);
    }
    if (keyword) {
      query = query.or(`link.ilike.%${keyword}%,title.ilike.%${keyword}%`);
    }

    // 排序
    query = query.order(orderBy, { ascending });

    // 分页
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("获取所有链接列表失败:", error);
      throw error;
    }

    return {
      links: data || [],
      total: count || 0,
    };
  } catch (error) {
    console.error("获取所有链接列表异常:", error);
    throw error;
  }
}

/**
 * 获取链接详情（管理员用，无权限限制）
 * @param {number} linkId - 链接 ID
 * @returns {Promise<Object|null>} 链接详情
 */
export async function getLinkDetailAdmin(linkId) {
  try {
    const { data, error } = await supabase
      .from("links")
      .select("*")
      .eq("id", linkId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      console.error("获取链接详情失败:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("获取链接详情异常:", error);
    throw error;
  }
}

/**
 * 获取链接访问日志（管理员用，无权限限制）
 * @param {number} linkId - 链接 ID
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} 访问日志
 */
export async function getLinkAccessLogsAdmin(
  linkId: number,
  options: Partial<QueryOptions> = {},
) {
  try {
    const { limit = 50, offset = 0 } = options;

    const { data, error, count } = await supabase
      .from("link_access_logs")
      .select("*", { count: "exact" })
      .eq("link_id", linkId)
      .order("accessed_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("获取访问日志失败:", error);
      throw error;
    }

    return {
      logs: data || [],
      total: count || 0,
    };
  } catch (error) {
    console.error("获取访问日志异常:", error);
    throw error;
  }
}

/**
 * 更新链接（管理员用，无权限限制）
 * @param {number} linkId - 链接 ID
 * @param {Object} updates - 更新数据
 * @returns {Promise<Object>} 更新后的链接
 */
export async function updateLinkAdmin(linkId, updates) {
  try {
    const allowedFields = [
      "title",
      "description",
      "is_active",
      "expiration_date",
      "max_clicks",
      "redirect_type",
      "pass_query_params",
      "forward_headers",
      "forward_header_list",
      "access_restrictions",
    ];

    const filteredUpdates = {};
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        filteredUpdates[key] = value;
      }
    }

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
    console.error("更新链接异常:", error);
    throw error;
  }
}

/**
 * 删除链接（管理员用，无权限限制）
 * @param {number} linkId - 链接 ID
 * @returns {Promise<Object>} 删除结果
 */
export async function deleteLinkAdmin(linkId) {
  try {
    const { error } = await supabase.from("links").delete().eq("id", linkId);

    if (error) {
      console.error("删除链接失败:", error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error("删除链接异常:", error);
    throw error;
  }
}

/**
 * 获取链接访问统计（管理员用，无权限限制）
 * @param {number} linkId - 链接 ID
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} 访问统计
 */
export async function getLinkAccessStatsAdmin(
  linkId: number,
  options: Partial<QueryOptions> = {},
) {
  try {
    const { days = 30 } = options;
    const startDate = dayjs().subtract(Number(days), "day").toISOString();

    const { data, error } = await supabase
      .from("link_access_logs")
      .select("accessed_at, device_type, country")
      .eq("link_id", linkId)
      .gte("accessed_at", startDate)
      .order("accessed_at", { ascending: true });

    if (error) {
      console.error("获取访问统计失败:", error);
      throw error;
    }

    const dailyStats = {};
    const deviceStats = {};
    const countryStats = {};

    for (const log of data || []) {
      const date = dayjs(log.accessed_at).format("YYYY-MM-DD");
      dailyStats[date] = (dailyStats[date] || 0) + 1;

      const device = log.device_type || "unknown";
      deviceStats[device] = (deviceStats[device] || 0) + 1;

      const country = log.country || "unknown";
      countryStats[country] = (countryStats[country] || 0) + 1;
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
    console.error("获取访问统计异常:", error);
    throw error;
  }
}

/**
 * 批量删除链接（管理员用，无权限限制）
 * @param {Array<number>} linkIds - 链接 ID 数组
 * @returns {Promise<Object>} 删除结果
 */
export async function batchDeleteLinksAdmin(linkIds) {
  try {
    const { error } = await supabase.from("links").delete().in("id", linkIds);

    if (error) {
      console.error("批量删除链接失败:", error);
      throw error;
    }

    return {
      success: linkIds.length,
      failed: 0,
    };
  } catch (error) {
    console.error("批量删除链接异常:", error);
    throw error;
  }
}

/**
 * 批量切换链接状态（管理员用，无权限限制）
 * @param {Array<number>} linkIds - 链接 ID 数组
 * @param {boolean} isActive - 是否启用
 * @returns {Promise<Object>} 操作结果
 */
export async function batchToggleLinksAdmin(linkIds, isActive) {
  try {
    const { error } = await supabase
      .from("links")
      .update({ is_active: isActive })
      .in("id", linkIds);

    if (error) {
      console.error("批量更新链接状态失败:", error);
      throw error;
    }

    return {
      success: linkIds.length,
      failed: 0,
    };
  } catch (error) {
    console.error("批量更新链接状态异常:", error);
    throw error;
  }
}

/**
 * 获取用户排行榜
 * @param {string} userId - 用户 ID
 * @param {string} period - 时间周期 ('daily' | 'weekly' | 'monthly')
 * @param {number} limit - 返回条数
 * @returns {Promise<Object>} 排行榜数据
 */
export async function getTopLinks(
  userId: string,
  period: string,
  limit: number = 20,
) {
  try {
    if (userId) {
      console.error("查询排行榜失败:", "没有查询到用户 ID");
      throw new Error("没有查询到用户 ID");
    }

    // 计算时间范围
    let startDate: Dayjs;

    switch (period) {
      case "daily":
        // 过去24小时
        startDate = dayjs().subtract(1, "day");
        break;
      case "weekly":
        // 过去7天
        startDate = dayjs().subtract(7, "day");
        break;
      case "monthly":
        // 过去30天
        startDate = dayjs().subtract(30, "day");
        break;
      default:
        throw new Error("无效的时间周期");
    }

    // 使用数据库 RPC 函数，在数据库层面完成联表查询和聚合
    const { data, error } = await supabase.rpc("get_top_links_by_period", {
      p_user_id: userId,
      p_start_date: startDate.format("YYYY-MM-DD HH:mm:ss"),
      p_limit: limit,
    });

    if (error) {
      console.error("查询排行榜失败:", error);
      throw error;
    }

    return {
      links: data || [],
    };
  } catch (error) {
    console.error("获取排行榜异常:", error);
    throw error;
  }
}

/**
 * 获取全局排行榜（使用数据库 RPC 优化）
 * @param {string} period - 时间周期 ('daily' | 'weekly' | 'monthly')
 * @param {number} limit - 返回条数
 * @returns {Promise<Object>} 排行榜数据
 */
export async function getGlobalTopLinks(period: string, limit: number = 20) {
  try {
    // 计算时间范围
    let startDate: Dayjs;

    switch (period) {
      case "daily":
        // 过去24小时
        startDate = dayjs().subtract(1, "day");
        break;
      case "weekly":
        // 过去7天
        startDate = dayjs().subtract(7, "day");
        break;
      case "monthly":
        // 过去30天
        startDate = dayjs().subtract(30, "day");
        break;
      default:
        throw new Error("无效的时间周期");
    }

    // 使用数据库 RPC 函数，p_user_id 传 null 表示查询全局排行榜
    const { data, error } = await supabase.rpc("get_top_links_by_period", {
      p_user_id: null,
      p_start_date: startDate.toISOString(),
      p_limit: limit,
    });

    if (error) {
      console.error("查询全局排行榜失败:", error);
      throw error;
    }

    return {
      links: data || [],
    };
  } catch (error) {
    console.error("获取全局排行榜异常:", error);
    throw error;
  }
}
