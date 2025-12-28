import * as linkService from "../../service/link.js";
import * as dashboardService from "../../service/dashboard.js";
import { getClientIp, buildForwardHeaders } from "../middlewares/utils.js";

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

  if (!inputUrl) {
    return reply.status(400).send({
      code: 400,
      msg: "URL 是必填参数",
    });
  }

  // 验证URL格式
  const urlPattern = /^(https?:\/\/|#小程序:\/\/).+/;
  if (!urlPattern.test(inputUrl)) {
    return reply.status(400).send({
      code: 400,
      msg: "URL 格式不正确，必须以 http://、https:// 或 #小程序:// 开头",
    });
  }

  // 验证重定向类型
  if (
    options.redirect_type &&
    ![301, 302, 307, 308].includes(options.redirect_type)
  ) {
    return reply.status(400).send({
      code: 400,
      msg: "重定向类型必须是 301、302、307 或 308",
    });
  }

  // 验证最大点击次数
  if (options.max_clicks !== undefined && options.max_clicks !== null) {
    const maxClicks = parseInt(options.max_clicks);
    if (isNaN(maxClicks) || maxClicks < 1) {
      return reply.status(400).send({
        code: 400,
        msg: "最大点击次数必须是大于0的整数",
      });
    }
    options.max_clicks = maxClicks;
  }

  // 验证访问限制配置
  if (options.access_restrictions) {
    const restrictions = options.access_restrictions;

    if (
      restrictions.ip_whitelist &&
      !Array.isArray(restrictions.ip_whitelist)
    ) {
      return reply.status(400).send({
        code: 400,
        msg: "IP 白名单必须是数组格式",
      });
    }
    if (
      restrictions.ip_blacklist &&
      !Array.isArray(restrictions.ip_blacklist)
    ) {
      return reply.status(400).send({
        code: 400,
        msg: "IP 黑名单必须是数组格式",
      });
    }

    if (restrictions.allowed_devices) {
      if (!Array.isArray(restrictions.allowed_devices)) {
        return reply.status(400).send({
          code: 400,
          msg: "允许的设备类型必须是数组格式",
        });
      }
      const validDevices = ["mobile", "tablet", "desktop"];
      for (const device of restrictions.allowed_devices) {
        if (!validDevices.includes(device)) {
          return reply.status(400).send({
            code: 400,
            msg: `无效的设备类型: ${device}，有效值为: ${validDevices.join(", ")}`,
          });
        }
      }
    }
  }

  try {
    const result = await linkService.addUrl(inputUrl, userId, options);

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
        return reply.status(404).type("text/html").send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>链接无效</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f5f5f5; }
    .container { text-align: center; padding: 40px; background: white; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 400px; }
    h1 { color: #e74c3c; margin-bottom: 16px; }
    p { color: #666; margin-bottom: 24px; }
    a { color: #3498db; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <h1>😕 链接无效</h1>
    <p>${errorMsg}</p>
    <a href="/">返回首页</a>
  </div>
</body>
</html>
        `);
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

    if (
      updates.redirect_type &&
      ![301, 302, 307, 308].includes(updates.redirect_type)
    ) {
      return reply.status(400).send({
        code: 400,
        msg: "重定向类型必须是 301、302、307 或 308",
      });
    }

    if (updates.max_clicks !== undefined && updates.max_clicks !== null) {
      const maxClicks = parseInt(updates.max_clicks);
      if (isNaN(maxClicks) || maxClicks < 1) {
        return reply.status(400).send({
          code: 400,
          msg: "最大点击次数必须是大于0的整数",
        });
      }
      updates.max_clicks = maxClicks;
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

    if (typeof is_active !== "boolean") {
      return reply.status(400).send({
        code: 400,
        msg: "is_active must be a boolean",
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

    if (!Array.isArray(linkIds) || linkIds.length === 0) {
      return reply.status(400).send({
        code: 400,
        msg: "linkIds must be a non-empty array",
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

    if (!Array.isArray(linkIds) || linkIds.length === 0) {
      return reply.status(400).send({
        code: 400,
        msg: "linkIds must be a non-empty array",
      });
    }

    if (typeof is_active !== "boolean") {
      return reply.status(400).send({
        code: 400,
        msg: "is_active must be a boolean",
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
