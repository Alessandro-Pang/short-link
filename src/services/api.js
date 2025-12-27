/**
 * API 服务模块
 * 所有请求都通过 Fastify 后端 API
 */

import { getSession } from "./auth.js";

/**
 * 通用 API 请求函数
 * @param {string} url - API 端点
 * @param {Object} options - 请求选项
 * @returns {Promise} - 返回请求结果的 Promise
 */
async function fetchApi(url, { method = "GET", body, headers = {} } = {}) {
  try {
    // 获取当前 session，如果存在则添加到请求头
    const session = await getSession();
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json;charset=utf-8",
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (data.code === 200) {
      return data;
    } else {
      throw new Error(data.msg || "请求失败");
    }
  } catch (error) {
    console.error("API 请求失败:", error);
    throw error;
  }
}

/**
 * 添加 URL 生成短链接
 * @param {string} url - 要缩短的 URL
 * @returns {Promise} - 返回包含短链接的 Promise
 */
export async function addUrl(url) {
  return fetchApi("/api/addUrl", {
    method: "POST",
    body: { url },
  });
}

/**
 * 获取 URL 信息
 * @param {string} shortCode - 短链接代码
 * @returns {Promise} - 返回包含原始 URL 的 Promise
 */
export async function getUrl(shortCode) {
  return fetchApi(`/api/getUrl/${shortCode}`);
}

/**
 * 获取用户统计数据
 * @returns {Promise} - 返回统计数据
 */
export async function getDashboardStats() {
  return fetchApi("/api/dashboard/stats");
}

/**
 * 获取用户链接列表
 * @param {Object} options - 查询选项
 * @returns {Promise} - 返回链接列表
 */
export async function getDashboardLinks(options = {}) {
  const {
    limit = 50,
    offset = 0,
    orderBy = "created_at",
    ascending = false,
  } = options;

  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
    orderBy,
    ascending: ascending.toString(),
  });

  return fetchApi(`/api/dashboard/links?${params.toString()}`);
}

/**
 * 获取链接访问日志
 * @param {number} linkId - 链接 ID
 * @param {Object} options - 查询选项
 * @returns {Promise} - 返回访问日志
 */
export async function getLinkAccessLogs(linkId, options = {}) {
  const { limit = 50, offset = 0 } = options;

  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });

  return fetchApi(`/api/dashboard/links/${linkId}/logs?${params.toString()}`);
}

/**
 * 更新链接
 * @param {number} linkId - 链接 ID
 * @param {Object} updates - 更新数据
 * @returns {Promise} - 返回更新后的链接
 */
export async function updateLink(linkId, updates) {
  return fetchApi(`/api/dashboard/links/${linkId}`, {
    method: "PUT",
    body: updates,
  });
}

/**
 * 删除链接
 * @param {number} linkId - 链接 ID
 * @returns {Promise}
 */
export async function deleteLink(linkId) {
  return fetchApi(`/api/dashboard/links/${linkId}`, {
    method: "DELETE",
  });
}

/**
 * 验证当前用户
 * @returns {Promise} - 返回用户信息
 */
export async function verifyUser() {
  return fetchApi("/api/auth/user");
}
