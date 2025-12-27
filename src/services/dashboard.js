/**
 * Dashboard 数据服务模块
 * 所有请求都通过后端 API
 */

import { getDashboardStats, getDashboardLinks } from "./api.js";

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
