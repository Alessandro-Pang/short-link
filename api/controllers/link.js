import * as linkService from "../../service/link.js";
import * as dashboardService from "../../service/dashboard.js";
import { getClientIp } from "../middlewares/utils.js";
import { generateErrorPageHtml } from "../utils/security.js";
import {
  validateCreateLinkParams,
  validateUpdateLinkParams,
  validateBatchIds,
  validateBoolean,
  validatePagination,
  sanitizeUrl,
} from "../utils/validation.js";

/**
 * 获取过期时间选项
 */
export async function getExpirationOptions(request, reply) {
  try {
    const result = await linkService.getExpirationOptions();
    return reply.send({
      code: 200,
      msg: "success",
      data: result,
    });
  } catch (error) {
    request.log.error("获取过期时间选项失败:", error);
    return reply.status(500).send({
      code: 500,
      msg: error.message || "服务器错误",
    });
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
  const validationResult = validateCreateLinkParams({ url: inputUrl, options });
  if (!validationResult.valid) {
    return reply.status(400).send({
      code: 400,
      msg: validationResult.error,
    });
  }

  // 清理 URL
  const sanitizedUrl = sanitizeUrl(inputUrl);

  try {
    const result = await linkService.addUrl(sanitizedUrl, userId, options);

    if (result.error) {
      if (result.error.code === "DUPLICATE_LINK") {
        return reply.status(409).send({
          code: 409,
          msg: result.error.message,
          existingLink: result.error.existingLink,
        });
      }
      return reply.status(400).send({
        code: 400,
        msg: result.error.message || "未知错误",
      });
    }

    return reply.send({
      code: 200,
      msg: "success",
      url: `/u/${result.data.short}`,
      data: result.data,
    });
  } catch (error) {
    request.log.error("创建短链接失败:", error);
    return reply.status(500).send({
      code: 500,
      msg: error.message || "服务器错误",
    });
  }
}

/**
 * 短链接重定向
 */
export async function redirectShortLink(request, reply) {
  if (!request.params?.hash) {
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
        // 使用安全的 HTML 生成函数防止 XSS
        const safeHtml = generateErrorPageHtml("链接无效", errorMsg, "/");
        return reply.status(404).type("text/html").send(safeHtml);
      }

      return reply.status(404).send({
        code: 404,
        msg: errorMsg,
      });
    }

    const linkData = result?.data;

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
    return reply.status(404).send({
      code: 404,
      msg: error.message || "短链接不存在",
    });
  }
}

/**
 * 获取用户的短链接统计
 */
export async function getUserStats(request, reply) {
  try {
    const stats = await dashboardService.getUserStats(request.user.id);
    return reply.send({
      code: 200,
      msg: "success",
      data: stats,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      code: 500,
      msg: "Failed to retrieve statistics",
    });
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
    const paginationResult = validatePagination({ page, pageSize });
    if (!paginationResult.valid) {
      return reply.status(400).send({
        code: 400,
        msg: paginationResult.error,
      });
    }

    const result = await dashboardService.getUserLinks(request.user.id, {
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize),
      sortBy,
      sortOrder,
    });

    return reply.send({
      code: 200,
      msg: "success",
      data: result,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      code: 500,
      msg: "Failed to retrieve links",
    });
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
      return reply.status(404).send({
        code: 404,
        msg: "Link not found or access denied",
      });
    }

    return reply.send({
      code: 200,
      msg: "success",
      data: result,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      code: 500,
      msg: "Failed to retrieve link details",
    });
  }
}

/**
 * 获取短链接访问记录
 */
export async function getLinkAccessLogs(request, reply) {
  try {
    const linkId = parseInt(request.params.id);

    if (Number.isNaN(linkId) || linkId < 1) {
      return reply.status(400).send({
        code: 400,
        msg: "无效的链接 ID",
      });
    }

    const result = await dashboardService.getLinkAccessLogs(
      linkId,
      request.user.id,
      {
        limit: parseInt(request.query.pageSize || 50),
        offset: parseInt(request.query.offset || 0),
      },
    );

    return reply.send({
      code: 200,
      msg: "success",
      data: result,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      code: 500,
      msg: "Failed to retrieve access logs",
    });
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
      return reply.status(400).send({
        code: 400,
        msg: "无效的链接 ID",
      });
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

    return reply.send({
      code: 200,
      msg: "Link updated successfully",
      data: result,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      code: 500,
      msg: "Failed to update link",
    });
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
      return reply.status(400).send({
        code: 400,
        msg: "无效的链接 ID",
      });
    }

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
      [linkId],
      request.user.id,
      is_active,
    );

    return reply.send({
      code: 200,
      msg: "Link status updated successfully",
      data: result,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      code: 500,
      msg: "Failed to update link status",
    });
  }
}

/**
 * 删除短链接
 */
export async function deleteLink(request, reply) {
  try {
    const linkId = parseInt(request.params.id);

    if (Number.isNaN(linkId) || linkId < 1) {
      return reply.status(400).send({
        code: 400,
        msg: "无效的链接 ID",
      });
    }

    const result = await dashboardService.deleteLink(linkId, request.user.id);

    if (!result || result.error) {
      return reply.status(404).send({
        code: 404,
        msg: "Link not found or access denied",
      });
    }

    return reply.send({
      code: 200,
      msg: "Link deleted successfully",
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      code: 500,
      msg: "Failed to delete link",
    });
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

    return reply.send({
      code: 200,
      msg: "Links deleted successfully",
      data: result,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      code: 500,
      msg: "Failed to delete links",
    });
  }
}

/**
 * 批量更新短链接状态
 */
export async function batchUpdateLinkStatus(request, reply) {
  try {
    const { linkIds, is_active } = request.body;

    // 使用统一验证
    const idsResult = validateBatchIds(linkIds);
    if (!idsResult.valid) {
      return reply.status(400).send({
        code: 400,
        msg: idsResult.error,
      });
    }

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

    const action = is_active ? "activated" : "deactivated";
    return reply.send({
      code: 200,
      msg: `Links ${action} successfully`,
      data: result,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      code: 500,
      msg: "Failed to update link status",
    });
  }
}
