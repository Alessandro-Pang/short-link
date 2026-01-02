import * as linkService from "../services/link";
import * as dashboardService from "../services/dashboard";
import { getClientIp } from "../middlewares/utils";
import { verifyPassword } from "../utils/security";
import { URLSearchParams } from "node:url";
import {
  validateCreateLinkParams,
  validateUpdateLinkParams,
  validateBatchIds,
  validateBoolean,
  validatePagination,
  sanitizeUrl,
} from "../utils/validation";
import {
  success,
  badRequest,
  notFound,
  conflict,
  serverError,
  validationError,
} from "../utils/response";

/**
 * 获取过期时间选项
 */
export async function getExpirationOptions(request, reply) {
  try {
    const result = await linkService.getExpirationOptions();
    return success(reply, result);
  } catch (error) {
    request.log.error("获取过期时间选项失败:", error);
    return serverError(reply, error.message || "服务器错误");
  }
}

/**
 * 创建短链接
 */
export async function createShortLink(request, reply) {
  const { url, options = {} } = request.body || {};
  const inputUrl = url || request.body?.url;
  const userId = request.user?.id || null;

  // 未登录用户不允许使用高级配置
  if (!userId) {
    const hasAdvancedOptions =
      options.title ||
      options.expiration_option_id ||
      options.redirect_type !== 302 ||
      options.max_clicks ||
      options.pass_query_params ||
      options.forward_headers ||
      options.access_restrictions;

    if (hasAdvancedOptions) {
      return reply.status(401).send({
        code: 401,
        msg: "登录后才能使用高级配置功能",
      });
    }
  }

  // 使用统一验证模块验证所有参数
  const validation = validateCreateLinkParams({ url: inputUrl, options });
  const validationErr = validationError(reply, validation);
  if (validationErr) return validationErr;

  // 清理 URL
  const sanitizedUrl = sanitizeUrl(inputUrl);

  try {
    const result = await linkService.addUrl(sanitizedUrl, userId, options);

    if (result.error) {
      if (result.error.code === "DUPLICATE_LINK") {
        return conflict(reply, result.error.message, result.error.existingLink);
      }
      return badRequest(reply, result.error.message || "未知错误");
    }

    return success(reply, {
      ...result.data,
      url: `/u/${result.data.short}`,
    });
  } catch (error) {
    request.log.error("创建短链接失败:", error);
    return serverError(reply, error.message || "服务器错误");
  }
}

/**
 * 短链接重定向
 */
export async function redirectShortLink(request, reply) {
  const urlSearchParams = new URLSearchParams();
  urlSearchParams.append("short", request.params?.hash);
  urlSearchParams.append("title", "链接无效");
  urlSearchParams.append("message", "短链接不存在");

  if (!request.params?.hash) {
    // 浏览器访问重定向到错误页
    const acceptHeader = request.headers.accept || "";
    if (acceptHeader.includes("text/html")) {
      return reply.redirect(`/error?title=${urlSearchParams.toString()}`);
    }
    return reply.status(404).send({
      code: 404,
      msg: "短链接不存在",
    });
  }

  try {
    const visitorInfo = {
      ip: getClientIp(request),
      userAgent: request.headers["user-agent"],
      referrer: request.headers.referer || request.headers.referrer,
      country: request.headers["cf-ipcountry"] || null,
    };

    const result = await linkService.getUrl(request.params.hash, visitorInfo);

    if (!result || result.error) {
      const errorMsg = result?.error?.message || "短链接不存在";

      const acceptHeader = request.headers.accept || "";
      if (acceptHeader.includes("text/html")) {
        urlSearchParams.set("message", errorMsg);
        // 浏览器访问重定向到 Vue 错误页
        return reply.redirect(`/error?${urlSearchParams.toString()}`);
      }

      return notFound(reply, errorMsg);
    }

    const linkData = result?.data;

    // 检查是否需要密码验证
    if (linkData.password_hash) {
      const acceptHeader = request.headers.accept || "";
      if (acceptHeader.includes("text/html")) {
        // 浏览器访问重定向到 Vue 密码验证页
        return reply.redirect(`/password-verify/${request.params.hash}`);
      }
      // API 请求返回需要密码的提示
      return reply.status(403).send({
        code: 403,
        msg: "该链接需要密码才能访问",
        requirePassword: true,
      });
    }

    const accessInfo = {
      ip_address: visitorInfo.ip,
      user_agent: visitorInfo.userAgent,
      referrer: visitorInfo.referrer,
      country: visitorInfo.country,
    };
    await linkService.logAccess(linkData.id, accessInfo);

    let targetUrl = linkData.link;

    if (linkData.pass_query_params) {
      const queryString = request.url.split("?")[1];
      if (queryString) {
        targetUrl = linkService.buildRedirectUrl(targetUrl, queryString, true);
      }
    }

    const redirectType = linkData.redirect_type || 302;
    return reply.status(redirectType).redirect(targetUrl);
  } catch (error) {
    request.log.error("重定向失败:", error);

    const acceptHeader = request.headers.accept || "";
    if (acceptHeader.includes("text/html")) {
      urlSearchParams.set("message", error.message);
      return reply.redirect(`/error?${urlSearchParams.toString()}`);
    }

    return notFound(reply, error.message || "短链接不存在");
  }
}

/**
 * 验证短链接密码
 */
export async function verifyLinkPassword(request, reply) {
  const { hash } = request.params;
  const { password } = request.body || {};

  if (!hash) {
    return badRequest(reply, "短链接代码不能为空");
  }

  if (!password || typeof password !== "string") {
    return badRequest(reply, "密码不能为空");
  }

  try {
    const visitorInfo = {
      ip: getClientIp(request),
      userAgent: request.headers["user-agent"],
      referrer: request.headers.referer || request.headers.referrer,
      country: request.headers["cf-ipcountry"] || null,
    };

    const result = await linkService.getUrl(hash, visitorInfo);

    if (!result || result.error) {
      return notFound(reply, result?.error?.message || "短链接不存在");
    }

    const linkData = result?.data;

    // 检查链接是否设置了密码
    if (!linkData.password_hash) {
      return badRequest(reply, "该链接未设置密码保护");
    }

    // 验证密码
    if (!verifyPassword(password, linkData.password_hash)) {
      return reply.status(401).send({
        code: 401,
        msg: "密码错误",
      });
    }

    // 密码正确，记录访问并返回目标链接
    const accessInfo = {
      ip_address: visitorInfo.ip,
      user_agent: visitorInfo.userAgent,
      referrer: visitorInfo.referrer,
      country: visitorInfo.country,
    };
    await linkService.logAccess(linkData.id, accessInfo);

    let targetUrl = linkData.link;

    // 处理参数透传
    if (linkData.pass_query_params) {
      const queryString = request.url.split("?")[1];
      if (queryString) {
        targetUrl = linkService.buildRedirectUrl(targetUrl, queryString, true);
      }
    }

    return success(reply, {
      url: targetUrl,
      redirectType: linkData.redirect_type || 302,
    });
  } catch (error) {
    request.log.error("验证密码失败:", error);
    return serverError(reply, "验证失败，请稍后重试");
  }
}

/**
 * 获取用户的短链接统计
 */
export async function getUserStats(request, reply) {
  try {
    const stats = await dashboardService.getUserStats(request.user.id);
    return success(reply, stats);
  } catch (error) {
    request.log.error(error);
    return serverError(reply, "获取统计数据失败");
  }
}

/**
 * 获取用户的短链接列表
 */
export async function getUserLinks(request, reply) {
  try {
    const {
      page = 1,
      pageSize = 10,
      sortBy = "created_at",
      sortOrder = "desc",
    } = request.query;

    // 验证分页参数
    const paginationValidation = validatePagination({ page, pageSize });
    const paginationErr = validationError(reply, paginationValidation);
    if (paginationErr) return paginationErr;

    const result = await dashboardService.getUserLinks(request.user.id, {
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize),
      sortBy,
      sortOrder,
    });

    return success(reply, result);
  } catch (error) {
    request.log.error(error);
    return serverError(reply, "获取链接列表失败");
  }
}

/**
 * 获取单个短链接详情
 */
export async function getLinkDetails(request, reply) {
  try {
    const linkId = parseInt(request.params.id);

    if (Number.isNaN(linkId) || linkId < 1) {
      return reply.status(400).send({
        code: 400,
        msg: "无效的链接 ID",
      });
    }

    const result = await dashboardService.getLinkDetail(
      linkId,
      request.user.id,
    );

    if (!result) {
      return notFound(reply, "链接不存在或无权访问");
    }

    return success(reply, result);
  } catch (error) {
    request.log.error(error);
    return serverError(reply, "获取链接详情失败");
  }
}

/**
 * 获取短链接访问记录
 */
export async function getLinkAccessLogs(request, reply) {
  try {
    const linkId = parseInt(request.params.id);

    if (Number.isNaN(linkId) || linkId < 1) {
      return badRequest(reply, "无效的链接 ID");
    }

    const result = await dashboardService.getLinkAccessLogs(
      linkId,
      request.user.id,
      {
        limit: parseInt(request.query.pageSize || 50),
        offset: parseInt(request.query.offset || 0),
      },
    );

    return success(reply, result);
  } catch (error) {
    request.log.error(error);
    return serverError(reply, "获取访问日志失败");
  }
}

/**
 * 更新短链接
 */
export async function updateLink(request, reply) {
  try {
    const linkId = parseInt(request.params.id);
    const updates = request.body;

    if (Number.isNaN(linkId) || linkId < 1) {
      return badRequest(reply, "无效的链接 ID");
    }

    // 使用统一验证模块
    const validationResult = validateUpdateLinkParams(updates);
    if (!validationResult.valid) {
      return reply.status(400).send({
        code: 400,
        msg: validationResult.error,
      });
    }

    // 处理 max_clicks 转换
    if (updates.max_clicks !== undefined && updates.max_clicks !== null) {
      updates.max_clicks = parseInt(updates.max_clicks);
    }

    const result = await dashboardService.updateLink(
      linkId,
      request.user.id,
      updates,
    );

    return success(reply, result, "链接更新成功");
  } catch (error) {
    request.log.error(error);
    return serverError(reply, "更新链接失败");
  }
}

/**
 * 切换短链接激活状态
 */
export async function toggleLinkStatus(request, reply) {
  try {
    const linkId = parseInt(request.params.id);
    const { is_active } = request.body;

    if (Number.isNaN(linkId) || linkId < 1) {
      return badRequest(reply, "无效的链接 ID");
    }

    const boolValidation = validateBoolean(is_active, "is_active");
    const boolErr = validationError(reply, boolValidation);
    if (boolErr) return boolErr;

    if (is_active === undefined || is_active === null) {
      return badRequest(reply, "is_active 是必填参数");
    }

    const result = await dashboardService.batchToggleLinks(
      [linkId],
      request.user.id,
      is_active,
    );

    return success(reply, result, "链接状态更新成功");
  } catch (error) {
    request.log.error(error);
    return serverError(reply, "更新链接状态失败");
  }
}

/**
 * 删除短链接
 */
export async function deleteLink(request, reply) {
  try {
    const linkId = parseInt(request.params.id);

    if (Number.isNaN(linkId) || linkId < 1) {
      return badRequest(reply, "无效的链接 ID");
    }

    const result = await dashboardService.deleteLink(linkId, request.user.id);

    if (!result || result.error) {
      return notFound(reply, "链接不存在或无权访问");
    }

    return success(reply, null, "链接删除成功");
  } catch (error) {
    request.log.error(error);
    return serverError(reply, "删除链接失败");
  }
}

/**
 * 批量删除短链接
 */
export async function batchDeleteLinks(request, reply) {
  try {
    const { linkIds } = request.body;

    // 使用统一验证
    const idsResult = validateBatchIds(linkIds);
    if (!idsResult.valid) {
      return reply.status(400).send({
        code: 400,
        msg: idsResult.error,
      });
    }

    const result = await dashboardService.batchDeleteLinks(
      linkIds,
      request.user.id,
    );

    return success(reply, result, "批量删除成功");
  } catch (error) {
    request.log.error(error);
    return serverError(reply, "批量删除失败");
  }
}

/**
 * 批量更新短链接状态
 */
export async function batchUpdateLinkStatus(request, reply) {
  try {
    const { linkIds, is_active } = request.body;

    // 使用统一验证
    const idsValidation = validateBatchIds(linkIds);
    const idsErr = validationError(reply, idsValidation);
    if (idsErr) return idsErr;

    const boolResult = validateBoolean(is_active, "is_active");
    if (!boolResult.valid) {
      return reply.status(400).send({
        code: 400,
        msg: boolResult.error,
      });
    }

    if (is_active === undefined || is_active === null) {
      return reply.status(400).send({
        code: 400,
        msg: "is_active 是必填参数",
      });
    }

    const result = await dashboardService.batchToggleLinks(
      linkIds,
      request.user.id,
      is_active,
    );

    const action = is_active ? "启用" : "禁用";
    return success(reply, result, `批量${action}成功`);
  } catch (error) {
    request.log.error(error);
    return serverError(reply, "批量更新状态失败");
  }
}

/**
 * 获取排行榜
 */
export async function getTopLinks(request, reply) {
  try {
    const period = request.query.period || "daily";
    const limit = parseInt(request.query.limit || 20);

    // 验证 period 参数
    if (!["daily", "weekly", "monthly"].includes(period)) {
      return badRequest(reply, "无效的周期参数，仅支持 daily, weekly, monthly");
    }

    // 验证 limit 参数
    if (Number.isNaN(limit) || limit < 1 || limit > 100) {
      return badRequest(reply, "limit 必须是 1-100 之间的数字");
    }

    const result = await dashboardService.getTopLinks(
      request.user.id,
      period,
      limit,
    );

    return success(reply, result);
  } catch (error) {
    request.log.error(error);
    return serverError(reply, "获取排行榜失败");
  }
}
