/*
 * @Author: zi.yang
 * @Date: 2025-12-29 00:00:00
 * @LastEditors: zi.yang
 * @LastEditTime: 2025-12-29 00:00:00
 * @Description: 统一的响应工具模块
 * @FilePath: /short-link/api/utils/response.js
 */

import type {
  FastifyReply,
  SuccessResponse,
  ErrorResponse,
  ServiceResult,
  HandleServiceResultOptions,
} from "../types/index.js";

/**
 * 成功响应
 * @param {Object} reply - Fastify reply 对象
 * @param {T} data - 响应数据
 * @param {string} [msg] - 响应消息
 * @param {number} [statusCode] - HTTP 状态码
 * @returns {Object}
 */
export function success<T = unknown>(
  reply: FastifyReply,
  data: T | null = null,
  msg: string = "success",
  statusCode: number = 200,
) {
  return reply.status(statusCode).send({
    code: 200,
    msg,
    data,
  });
}

/**
 * 错误响应
 * @param {Object} reply - Fastify reply 对象
 * @param {string} msg - 错误消息
 * @param {number} [statusCode] - HTTP 状态码
 * @param {unknown} [data] - 附加数据
 * @returns {Object}
 */
export function error(
  reply: FastifyReply,
  msg: string,
  statusCode: number = 400,
  data: unknown = null,
) {
  const response: { code: number; msg: string; data?: unknown } = {
    code: statusCode,
    msg,
  };

  if (data !== null) {
    response.data = data;
  }

  return reply.status(statusCode).send(response);
}

/**
 * 使用预定义错误码响应
 * @param {Object} reply - Fastify reply 对象
 * @param {Object} errorCode - 错误码对象 { code, msg }
 * @param {unknown} [data] - 附加数据
 * @param {string} [customMsg] - 自定义消息（覆盖默认消息）
 * @returns {Object}
 */
export function errorWithCode(
  reply: FastifyReply,
  errorCode: { code: number; msg: string },
  data: unknown = null,
  customMsg: string | null = null,
) {
  const response: { code: number; msg: string; data?: unknown } = {
    code: errorCode.code,
    msg: customMsg || errorCode.msg,
  };

  if (data !== null) {
    response.data = data;
  }

  return reply.status(errorCode.code).send(response);
}

/**
 * 400 Bad Request
 * @param {Object} reply - Fastify reply 对象
 * @param {string} [msg] - 错误消息
 * @param {unknown} [data] - 附加数据
 * @returns {Object}
 */
export function badRequest(
  reply: FastifyReply,
  msg = "请求参数错误",
  data: unknown = null,
) {
  return error(reply, msg, 400, data);
}

/**
 * 401 Unauthorized
 * @param {Object} reply - Fastify reply 对象
 * @param {string} [msg] - 错误消息
 * @returns {Object}
 */
export function unauthorized(reply: FastifyReply, msg = "未授权访问") {
  return error(reply, msg, 401);
}

/**
 * 403 Forbidden
 * @param {Object} reply - Fastify reply 对象
 * @param {string} [msg] - 错误消息
 * @returns {Object}
 */
export function forbidden(reply: FastifyReply, msg = "禁止访问") {
  return error(reply, msg, 403);
}

/**
 * 404 Not Found
 * @param {Object} reply - Fastify reply 对象
 * @param {string} [msg] - 错误消息
 * @returns {Object}
 */
export function notFound(reply: FastifyReply, msg = "资源不存在") {
  return error(reply, msg, 404);
}

/**
 * 409 Conflict
 * @param {Object} reply - Fastify reply 对象
 * @param {string} [msg] - 错误消息
 * @param {unknown} [data] - 附加数据（如冲突的资源信息）
 * @returns {Object}
 */
export function conflict(
  reply: FastifyReply,
  msg = "资源冲突",
  data: unknown = null,
) {
  return error(reply, msg, 409, data);
}

/**
 * 429 Too Many Requests
 * @param {Object} reply - Fastify reply 对象
 * @param {string} [msg] - 错误消息
 * @param {number} [retryAfter] - 重试等待时间（秒）
 * @returns {Object}
 */
export function tooManyRequests(
  reply: FastifyReply,
  msg = "请求过于频繁",
  retryAfter = 60,
) {
  reply.header("Retry-After", retryAfter);
  return error(reply, msg, 429, { retryAfter });
}

/**
 * 500 Internal Server Error
 * @param {Object} reply - Fastify reply 对象
 * @param {string} [msg] - 错误消息
 * @returns {Object}
 */
export function serverError(reply: FastifyReply, msg = "服务器内部错误") {
  return error(reply, msg, 500);
}

/**
 * 503 Service Unavailable
 * @param {Object} reply - Fastify reply 对象
 * @param {string} [msg] - 错误消息
 * @returns {Object}
 */
export function serviceUnavailable(
  reply: FastifyReply,
  msg = "服务暂时不可用",
) {
  return error(reply, msg, 503);
}

/**
 * 分页响应
 * @param {Object} reply - Fastify reply 对象
 * @param {Object} options - 分页选项
 * @param {Array} options.list - 数据列表
 * @param {number} options.total - 总数
 * @param {number} options.page - 当前页
 * @param {number} options.pageSize - 每页数量
 * @param {string} [msg] - 响应消息
 * @returns {Object}
 */
export function paginated<T>(
  reply: FastifyReply,
  options: { list: T[]; total: number; page: number; pageSize: number },
  msg = "success",
) {
  const { list, total, page, pageSize } = options;
  const totalPages = Math.ceil(total / pageSize);

  return reply.status(200).send({
    code: 200,
    msg,
    data: {
      list,
      pagination: {
        total,
        page,
        pageSize,
        totalPages,
        hasMore: page < totalPages,
      },
    },
  });
}

/**
 * 创建响应
 * @param {Object} reply - Fastify reply 对象
 * @param {T} data - 响应数据
 * @param {string} [msg] - 响应消息
 * @returns {Object}
 */
export function created<T = unknown>(
  reply: FastifyReply,
  data: T | null = null,
  msg = "创建成功",
) {
  return success(reply, data, msg, 201);
}

/**
 * 无内容响应
 * @param {Object} reply - Fastify reply 对象
 * @returns {Object}
 */
export function noContent(reply: FastifyReply) {
  return reply.status(204).send();
}

/**
 * 验证错误响应
 * @param {Object} reply - Fastify reply 对象
 * @param {Object} validationResult - 验证结果 { valid, error }
 * @returns {Object|null} 如果验证失败返回错误响应，否则返回 null
 */
export function validationError(
  reply: FastifyReply,
  validationResult: { valid: boolean; error?: string },
) {
  if (!validationResult.valid) {
    return badRequest(reply, validationResult.error);
  }
  return null;
}

/**
 * 处理 Service 层返回的结果
 * @param {Object} reply - Fastify reply 对象
 * @param {Object} result - Service 返回的结果 { data, error }
 * @param {Object} [options] - 选项
 * @param {string} [options.successMsg] - 成功消息
 * @param {number} [options.notFoundCode] - 未找到时的状态码
 * @param {string} [options.notFoundMsg] - 未找到时的消息
 * @returns {Object}
 */
export function handleServiceResult<T>(
  reply: FastifyReply,
  result: ServiceResult<T>,
  options: Partial<HandleServiceResultOptions> = {},
) {
  const {
    successMsg = "success",
    notFoundCode = 404,
    notFoundMsg = "资源不存在",
  } = options;

  if (result.error) {
    const errorMsg =
      typeof result.error === "string"
        ? result.error
        : result.error.message || String(result.error);

    // 根据错误类型返回不同状态码
    if (
      result.error.code === "PGRST116" ||
      errorMsg.includes("不存在") ||
      errorMsg.includes("not found")
    ) {
      return error(reply, notFoundMsg, notFoundCode);
    }

    if (result.error.code === "DUPLICATE_LINK") {
      return conflict(reply, errorMsg, result.error.existingLink);
    }

    if (errorMsg.includes("无权") || errorMsg.includes("access denied")) {
      return forbidden(reply, errorMsg);
    }

    return badRequest(reply, errorMsg);
  }

  if (result.data === null || result.data === undefined) {
    return notFound(reply, notFoundMsg);
  }

  return success(reply, result.data, successMsg);
}

/**
 * 响应工具对象（便于统一导入）
 */
export const Response = {
  success,
  error,
  errorWithCode,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  tooManyRequests,
  serverError,
  serviceUnavailable,
  paginated,
  created,
  noContent,
  validationError,
  handleServiceResult,
};

export default Response;
