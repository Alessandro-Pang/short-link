/**
 * 统一请求模块
 * 提供公共的 fetchApi 函数，供各个 API 服务模块使用
 */

import { getSession } from "./auth.js";

/**
 * 错误码映射
 */
const ERROR_CODE_MAP: Record<number, string> = {
  400: "请求参数错误",
  401: "未授权访问",
  403: "禁止访问",
  404: "资源不存在",
  409: "资源冲突",
  429: "请求过于频繁",
  500: "服务器内部错误",
  503: "服务暂时不可用",
};

/**
 * 自定义 API 错误类
 */
export class ApiError extends Error {
  code: number;
  data: any;

  constructor(message: string, code: number, data: any = null) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.data = data;
  }
}

export interface FetchApiOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  auth?: boolean;
  throwOnError?: boolean;
}

/**
 * 通用 API 请求函数
 */
export async function fetchApi(
  url: string,
  {
    method = "GET",
    body,
    headers = {},
    auth = true,
    throwOnError = true,
  }: FetchApiOptions = {},
): Promise<any> {
  try {
    // 准备请求头
    const requestHeaders = { ...headers };

    // 如果需要认证，获取当前 session 并添加到请求头
    if (auth) {
      const session = await getSession();
      if (session?.access_token) {
        requestHeaders["Authorization"] = `Bearer ${session.access_token}`;
      }
    }

    // 构建请求选项
    const fetchOptions = {
      method,
      headers: requestHeaders,
    };

    // 如果有请求体，添加 Content-Type 和序列化 body
    if (body !== undefined && body !== null) {
      requestHeaders["Content-Type"] = "application/json;charset=utf-8";
      fetchOptions.headers = requestHeaders;
      fetchOptions.body = JSON.stringify(body);
    }

    // 发送请求
    const response = await fetch(url, fetchOptions);

    // 解析响应
    let data;
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      data = await response.json();
    } else {
      // 非 JSON 响应
      const text = await response.text();
      data = { code: response.status, msg: text };
    }

    // 处理成功响应
    if (data.code === 200 || data.code === 201) {
      return data;
    }

    // 处理错误响应
    if (throwOnError) {
      const errorMessage = data.msg || ERROR_CODE_MAP[data.code] || "请求失败";
      const error = new ApiError(errorMessage, data.code, data.data);

      // 特殊错误码处理
      if (data.code === 409) {
        error.code = "DUPLICATE_LINK";
        error.existingLink = data.data;
      } else if (data.code === 403) {
        error.code = "FORBIDDEN";
      } else if (data.code === 401) {
        error.code = "UNAUTHORIZED";
      } else if (data.code === 429) {
        error.code = "RATE_LIMITED";
        error.retryAfter = data.retryAfter || data.data?.retryAfter;
      }

      throw error;
    }

    return data;
  } catch (error) {
    // 如果已经是 ApiError，直接抛出
    if (error instanceof ApiError) {
      throw error;
    }

    // 网络错误或其他错误
    console.error("API 请求失败:", error);

    if (throwOnError) {
      throw new ApiError(
        error.message || "网络请求失败",
        "NETWORK_ERROR",
        null,
      );
    }

    return {
      code: "NETWORK_ERROR",
      msg: error.message || "网络请求失败",
      data: null,
    };
  }
}

/**
 * GET 请求快捷方法
 * @param {string} url - API 端点
 * @param {Object} options - 请求选项
 * @returns {Promise<Object>}
 */
export function get(url, options = {}) {
  return fetchApi(url, { ...options, method: "GET" });
}

/**
 * POST 请求快捷方法
 * @param {string} url - API 端点
 * @param {Object} body - 请求体
 * @param {Object} options - 请求选项
 * @returns {Promise<Object>}
 */
export function post(url, body, options = {}) {
  return fetchApi(url, { ...options, method: "POST", body });
}

/**
 * PUT 请求快捷方法
 * @param {string} url - API 端点
 * @param {Object} body - 请求体
 * @param {Object} options - 请求选项
 * @returns {Promise<Object>}
 */
export function put(url, body, options = {}) {
  return fetchApi(url, { ...options, method: "PUT", body });
}

/**
 * PATCH 请求快捷方法
 * @param {string} url - API 端点
 * @param {Object} body - 请求体
 * @param {Object} options - 请求选项
 * @returns {Promise<Object>}
 */
export function patch(url, body, options = {}) {
  return fetchApi(url, { ...options, method: "PATCH", body });
}

/**
 * DELETE 请求快捷方法
 * @param {string} url - API 端点
 * @param {Object} options - 请求选项
 * @returns {Promise<Object>}
 */
export function del(url, options = {}) {
  return fetchApi(url, { ...options, method: "DELETE" });
}

/**
 * 构建带查询参数的 URL
 * @param {string} baseUrl - 基础 URL
 * @param {Object} params - 查询参数对象
 * @returns {string} 完整 URL
 */
export function buildUrl(baseUrl, params = {}) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

export default {
  fetchApi,
  get,
  post,
  put,
  patch,
  del,
  buildUrl,
  ApiError,
};
