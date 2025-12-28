/**
 * 管理员 API 服务模块
 * 所有管理员专用接口
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
    } else if (data.code === 403) {
      const error = new Error(data.msg || "需要管理员权限");
      error.code = "ADMIN_REQUIRED";
      throw error;
    } else {
      throw new Error(data.msg || "请求失败");
    }
  } catch (error) {
    console.error("Admin API 请求失败:", error);
    throw error;
  }
}

/**
 * 获取全局统计数据（管理员专用）
 * @returns {Promise} - 返回全局统计数据
 */
export async function getGlobalStats() {
  const response = await fetchApi("/api/admin/stats");
  return response.data;
}

/**
 * 获取所有链接列表（管理员专用）
 * @param {Object} options - 查询选项
 * @returns {Promise} - 返回链接列表
 */
export async function getAllLinks(options = {}) {
  const {
    limit = 50,
    offset = 0,
    orderBy = "created_at",
    ascending = false,
    linkId = null,
    keyword = null,
    userId = null,
  } = options;

  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
    orderBy,
    ascending: ascending.toString(),
  });

  // 添加可选的过滤参数
  if (linkId) {
    params.append("linkId", linkId);
  }
  if (keyword) {
    params.append("keyword", keyword);
  }
  if (userId) {
    params.append("userId", userId);
  }

  const response = await fetchApi(`/api/admin/links?${params.toString()}`);
  return response.data;
}

/**
 * 获取单个链接详情（管理员专用）
 * @param {number} linkId - 链接 ID
 * @returns {Promise} - 返回链接详情
 */
export async function getLinkDetail(linkId) {
  const response = await fetchApi(`/api/admin/links/${linkId}`);
  return response.data;
}

/**
 * 获取链接访问日志（管理员专用）
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

  const response = await fetchApi(
    `/api/admin/links/${linkId}/logs?${params.toString()}`,
  );
  return response.data;
}

/**
 * 更新链接配置（管理员专用）
 * @param {number} linkId - 链接 ID
 * @param {Object} updates - 更新数据
 * @returns {Promise} - 返回更新后的链接
 */
export async function updateLink(linkId, updates) {
  const response = await fetchApi(`/api/admin/links/${linkId}`, {
    method: "PUT",
    body: updates,
  });
  return response.data;
}

/**
 * 切换链接启用状态（管理员专用）
 * @param {number} linkId - 链接 ID
 * @param {boolean} isActive - 是否启用
 * @returns {Promise} - 返回更新结果
 */
export async function toggleLinkStatus(linkId, isActive) {
  const response = await fetchApi(`/api/admin/links/${linkId}/toggle`, {
    method: "PATCH",
    body: { is_active: isActive },
  });
  return response.data;
}

/**
 * 删除链接（管理员专用）
 * @param {number} linkId - 链接 ID
 * @returns {Promise}
 */
export async function deleteLink(linkId) {
  return fetchApi(`/api/admin/links/${linkId}`, {
    method: "DELETE",
  });
}

/**
 * 批量删除链接（管理员专用）
 * @param {Array<number>} linkIds - 链接 ID 数组
 * @returns {Promise} - 返回删除结果
 */
export async function batchDeleteLinks(linkIds) {
  return fetchApi("/api/admin/links/batch-delete", {
    method: "POST",
    body: { linkIds },
  });
}

/**
 * 批量切换链接状态（管理员专用）
 * @param {Array<number>} linkIds - 链接 ID 数组
 * @param {boolean} isActive - 是否启用
 * @returns {Promise} - 返回操作结果
 */
export async function batchToggleLinks(linkIds, isActive) {
  return fetchApi("/api/admin/links/batch-toggle", {
    method: "POST",
    body: { linkIds, is_active: isActive },
  });
}

/**
 * 获取所有用户列表（管理员专用）
 * @param {Object} options - 查询选项
 * @returns {Promise} - 返回用户列表
 */
export async function getAllUsers(options = {}) {
  const { page = 1, perPage = 50 } = options;

  const params = new URLSearchParams({
    page: page.toString(),
    perPage: perPage.toString(),
  });

  const response = await fetchApi(`/api/admin/users?${params.toString()}`);
  return response.data;
}

/**
 * 获取用户详细信息（管理员专用）
 * @param {string} userId - 用户 ID
 * @returns {Promise} - 返回用户详情
 */
export async function getUserDetails(userId) {
  const response = await fetchApi(`/api/admin/users/${userId}`);
  return response.data;
}

/**
 * 创建新用户（管理员专用）
 * @param {Object} userData - 用户数据
 * @returns {Promise} - 返回创建结果
 */
export async function createUser(userData) {
  return fetchApi("/api/admin/users", {
    method: "POST",
    body: userData,
  });
}

/**
 * 更新用户信息（管理员专用）
 * @param {string} userId - 用户 ID
 * @param {Object} updates - 更新数据
 * @returns {Promise} - 返回更新结果
 */
export async function updateUser(userId, updates) {
  return fetchApi(`/api/admin/users/${userId}`, {
    method: "PUT",
    body: updates,
  });
}

/**
 * 删除用户（管理员专用）
 * @param {string} userId - 用户 ID
 * @returns {Promise}
 */
export async function deleteUser(userId) {
  return fetchApi(`/api/admin/users/${userId}`, {
    method: "DELETE",
  });
}

/**
 * 重置用户密码（管理员专用）
 * @param {string} userId - 用户 ID
 * @param {string} password - 新密码
 * @returns {Promise}
 */
export async function resetUserPassword(userId, password) {
  return fetchApi(`/api/admin/users/${userId}/reset-password`, {
    method: "POST",
    body: { password },
  });
}

/**
 * 启用/禁用用户（管理员专用）
 * @param {string} userId - 用户 ID
 * @param {boolean} banned - 是否禁用
 * @returns {Promise}
 */
export async function toggleUserStatus(userId, banned) {
  return fetchApi(`/api/admin/users/${userId}/toggle-status`, {
    method: "PATCH",
    body: { banned },
  });
}

/**
 * 获取所有登录日志（管理员专用）
 * @param {Object} options - 查询选项
 * @returns {Promise} - 返回登录日志列表
 */
export async function getAllLoginLogs(options = {}) {
  const {
    limit = 50,
    offset = 0,
    userId = null,
    success = null,
    startDate = null,
    endDate = null,
  } = options;

  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });

  if (userId) params.append("userId", userId);
  if (success !== null) params.append("success", success.toString());
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);

  const response = await fetchApi(`/api/admin/logs/login?${params.toString()}`);
  return response.data;
}

/**
 * 获取登录统计（管理员专用）
 * @param {string} userId - 用户 ID（可选）
 * @returns {Promise} - 返回登录统计
 */
export async function getLoginStats(userId = null) {
  const params = userId ? `?userId=${userId}` : "";
  const response = await fetchApi(`/api/admin/login/stats${params}`);
  return response.data;
}

/**
 * 检查当前用户是否为管理员
 * @returns {Promise<boolean>} - 返回是否为管理员
 */
export async function checkIsAdmin() {
  try {
    const response = await fetchApi("/api/auth/user");
    return response.data?.isAdmin === true;
  } catch (error) {
    console.error("检查管理员状态失败:", error);
    return false;
  }
}

/**
 * 获取用户信息（包含管理员状态）
 * @returns {Promise<Object>} - 返回用户信息
 */
export async function getCurrentUserWithAdminStatus() {
  const response = await fetchApi("/api/auth/user");
  return response.data;
}
