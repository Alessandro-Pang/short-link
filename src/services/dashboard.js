/**
 * Dashboard 数据服务模块
 * 所有请求都通过后端 API
 */

import {
  getDashboardStats,
  getDashboardLinks,
  getLinkDetail,
  updateLink,
  deleteLink,
  toggleLinkStatus,
  getLinkAccessLogs,
} from "./api.js";

/**
 * 获取用户的链接统计数据
 * @returns {Promise} 统计数据
 */
export async function getUserLinkStats() {
  try {
    const response = await getDashboardStats();
    return response.data;
  } catch (error) {
    console.error("获取用户统计失败:", error);
    // 返回默认值
    return {
      total_links: 0,
      total_clicks: 0,
      weekly_new_links: 0,
      avg_clicks_per_link: 0,
    };
  }
}

/**
 * 获取用户的短链接列表
 * @param {Object} options - 查询选项
 * @returns {Promise} 链接列表
 */
export async function getUserLinks(options = {}) {
  try {
    const response = await getDashboardLinks(options);
    return response.data;
  } catch (error) {
    console.error("获取用户链接列表失败:", error);
    return { links: [], total: 0 };
  }
}

/**
 * 获取单个链接详情
 * @param {number} linkId - 链接 ID
 * @returns {Promise} 链接详情
 */
export async function getLinkDetailById(linkId) {
  try {
    const response = await getLinkDetail(linkId);
    return response.data;
  } catch (error) {
    console.error("获取链接详情失败:", error);
    throw error;
  }
}

/**
 * 更新链接配置
 * @param {number} linkId - 链接 ID
 * @param {Object} updates - 更新数据
 * @returns {Promise} 更新结果
 */
export async function updateLinkConfig(linkId, updates) {
  try {
    const response = await updateLink(linkId, updates);
    return response.data;
  } catch (error) {
    console.error("更新链接失败:", error);
    throw error;
  }
}

/**
 * 删除链接
 * @param {number} linkId - 链接 ID
 * @returns {Promise}
 */
export async function removeLinkById(linkId) {
  try {
    await deleteLink(linkId);
    return true;
  } catch (error) {
    console.error("删除链接失败:", error);
    throw error;
  }
}

/**
 * 切换链接启用状态
 * @param {number} linkId - 链接 ID
 * @param {boolean} isActive - 是否启用
 * @returns {Promise} 更新结果
 */
export async function toggleLink(linkId, isActive) {
  try {
    const response = await toggleLinkStatus(linkId, isActive);
    return response.data;
  } catch (error) {
    console.error("切换链接状态失败:", error);
    throw error;
  }
}

/**
 * 获取链接访问日志
 * @param {number} linkId - 链接 ID
 * @param {Object} options - 查询选项
 * @returns {Promise} 访问日志列表
 */
export async function getLinkLogs(linkId, options = {}) {
  try {
    const response = await getLinkAccessLogs(linkId, options);
    return response.data;
  } catch (error) {
    console.error("获取访问日志失败:", error);
    return { logs: [], total: 0 };
  }
}

/**
 * 格式化链接状态
 * @param {Object} link - 链接对象
 * @returns {Object} 状态信息
 */
export function formatLinkStatus(link) {
  if (!link.is_active) {
    return { status: "disabled", label: "已禁用", color: "red" };
  }

  if (link.expiration_date && new Date(link.expiration_date) < new Date()) {
    return { status: "expired", label: "已过期", color: "orange" };
  }

  if (link.max_clicks && link.click_count >= link.max_clicks) {
    return { status: "limit_reached", label: "已达上限", color: "yellow" };
  }

  return { status: "active", label: "运行中", color: "green" };
}

/**
 * 检查链接是否有高级配置
 * @param {Object} link - 链接对象
 * @returns {boolean}
 */
export function hasAdvancedConfig(link) {
  return (
    (link.redirect_type && link.redirect_type !== 302) ||
    link.expiration_date ||
    link.max_clicks ||
    link.pass_query_params ||
    link.forward_headers ||
    (link.access_restrictions &&
      Object.keys(link.access_restrictions).length > 0)
  );
}

/**
 * 获取链接配置摘要
 * @param {Object} link - 链接对象
 * @returns {Array} 配置摘要列表
 */
export function getConfigSummary(link) {
  const summary = [];

  if (link.redirect_type && link.redirect_type !== 302) {
    summary.push({
      type: "redirect",
      label: `${link.redirect_type} 重定向`,
      color: "arcoblue",
    });
  }

  if (link.expiration_date) {
    const isExpired = new Date(link.expiration_date) < new Date();
    summary.push({
      type: "expiration",
      label: isExpired ? "已过期" : "有时效",
      color: isExpired ? "red" : "orange",
    });
  }

  if (link.max_clicks) {
    summary.push({
      type: "max_clicks",
      label: `${link.click_count}/${link.max_clicks}次`,
      color: "green",
    });
  }

  if (link.pass_query_params) {
    summary.push({
      type: "query_params",
      label: "参数透传",
      color: "purple",
    });
  }

  if (link.forward_headers) {
    summary.push({
      type: "headers",
      label: "Header转发",
      color: "cyan",
    });
  }

  if (
    link.access_restrictions &&
    Object.keys(link.access_restrictions).length > 0
  ) {
    summary.push({
      type: "restrictions",
      label: "访问限制",
      color: "red",
    });
  }

  return summary;
}
