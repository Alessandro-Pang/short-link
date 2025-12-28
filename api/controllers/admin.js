import * as dashboardService from "../../service/dashboard.js";
import * as userManagementService from "../../service/user-management.js";
import * as loginLogService from "../../service/login-log.js";
import {
  validateUpdateLinkParams,
  validateBatchIds,
  validateBoolean,
  validatePagination,
  validateEmail,
  validatePassword,
} from "../utils/validation.js";

/**
 * 获取系统统计信息
 */
export async function getSystemStats(request, reply) {
  try {
    const stats = await dashboardService.getGlobalStats();
    return reply.send({
      code: 200,
      msg: "success",
      data: stats,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      code: 500,
      msg: "Failed to retrieve system statistics",
    });
  }
}

/**
 * 获取所有短链接（管理员）
 */
export async function getAllLinks(request, reply) {
  try {
    const {
      page,
      pageSize,
      limit,
      offset,
      sortBy = "created_at",
      orderBy,
      sortOrder = "desc",
      ascending,
      linkId = null,
      keyword = null,
      userId = null,
    } = request.query;

    // 验证分页参数
    const paginationResult = validatePagination({ page, pageSize });
    if (!paginationResult.valid) {
      return reply.status(400).send({
        code: 400,
        msg: paginationResult.error,
      });
    }

    // 支持两种分页方式：
    // 1. page + pageSize (传统分页)
    // 2. limit + offset (直接偏移)
    const finalLimit = limit
      ? parseInt(limit)
      : pageSize
        ? parseInt(pageSize)
        : 10;
    const finalOffset =
      offset !== undefined
        ? parseInt(offset)
        : page
          ? (parseInt(page) - 1) * finalLimit
          : 0;

    // 支持两种排序字段名：sortBy 或 orderBy
    const finalOrderBy = orderBy || sortBy || "created_at";

    // 支持两种排序方向：sortOrder 或 ascending
    const finalAscending =
      ascending !== undefined
        ? ascending === "true" || ascending === true
        : sortOrder === "asc";

    const result = await dashboardService.getAllLinks({
      limit: finalLimit,
      offset: finalOffset,
      orderBy: finalOrderBy,
      ascending: finalAscending,
      linkId: linkId ? parseInt(linkId) : null,
      keyword,
      userId,
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
 * 获取短链接详情（管理员）
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

    const result = await dashboardService.getLinkDetailAdmin(linkId);

    if (!result) {
      return reply.status(404).send({
        code: 404,
        msg: "Link not found",
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
 * 获取短链接访问日志（管理员）
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

    const result = await dashboardService.getLinkAccessLogsAdmin(linkId, {
      limit: parseInt(request.query.pageSize || 50),
      offset: parseInt(request.query.offset || 0),
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
      msg: "Failed to retrieve access logs",
    });
  }
}

/**
 * 更新短链接（管理员）
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

    const result = await dashboardService.updateLinkAdmin(linkId, updates);

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
 * 切换短链接状态（管理员）
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

    const result = await dashboardService.batchToggleLinksAdmin(
      [linkId],
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
 * 删除短链接（管理员）
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

    const result = await dashboardService.deleteLinkAdmin(linkId);

    if (!result || result.error) {
      return reply.status(404).send({
        code: 404,
        msg: "Link not found",
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
 * 批量删除短链接（管理员）
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

    const result = await dashboardService.batchDeleteLinksAdmin(linkIds);

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
 * 批量更新短链接状态（管理员）
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

    const result = await dashboardService.batchToggleLinksAdmin(
      linkIds,
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

/**
 * 获取所有用户列表
 */
export async function getAllUsers(request, reply) {
  try {
    const { page = 1, perPage = 50 } = request.query;

    // 验证分页参数
    const paginationResult = validatePagination({ page, pageSize: perPage });
    if (!paginationResult.valid) {
      return reply.status(400).send({
        code: 400,
        msg: paginationResult.error,
      });
    }

    const result = await userManagementService.getAllUsers({
      page: parseInt(page),
      perPage: parseInt(perPage),
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
      msg: "Failed to retrieve users",
    });
  }
}

/**
 * 获取用户详情
 */
export async function getUserDetails(request, reply) {
  try {
    const userId = request.params.id;

    if (!userId || typeof userId !== "string") {
      return reply.status(400).send({
        code: 400,
        msg: "无效的用户 ID",
      });
    }

    const result = await userManagementService.getUserDetails(userId);

    return reply.send({
      code: 200,
      msg: "success",
      data: result,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      code: 500,
      msg: "Failed to retrieve user details",
    });
  }
}

/**
 * 创建新用户
 */
export async function createUser(request, reply) {
  try {
    const { email, password } = request.body;

    // 验证邮箱
    const emailResult = validateEmail(email);
    if (!emailResult.valid) {
      return reply.status(400).send({
        code: 400,
        msg: emailResult.error,
      });
    }

    // 验证密码
    const passwordResult = validatePassword(password);
    if (!passwordResult.valid) {
      return reply.status(400).send({
        code: 400,
        msg: passwordResult.error,
      });
    }

    const result = await userManagementService.createUser({ email, password });

    return reply.send({
      code: 200,
      msg: "User created successfully",
      data: result,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      code: 500,
      msg: "Failed to create user",
    });
  }
}

/**
 * 更新用户信息
 */
export async function updateUser(request, reply) {
  try {
    const userId = request.params.id;
    const updates = request.body;

    if (!userId || typeof userId !== "string") {
      return reply.status(400).send({
        code: 400,
        msg: "无效的用户 ID",
      });
    }

    const result = await userManagementService.updateUser(userId, updates);

    return reply.send({
      code: 200,
      msg: "User updated successfully",
      data: result,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      code: 500,
      msg: "Failed to update user",
    });
  }
}

/**
 * 删除用户
 */
export async function deleteUser(request, reply) {
  try {
    const userId = request.params.id;

    if (!userId || typeof userId !== "string") {
      return reply.status(400).send({
        code: 400,
        msg: "无效的用户 ID",
      });
    }

    await userManagementService.deleteUser(userId);

    return reply.send({
      code: 200,
      msg: "User deleted successfully",
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      code: 500,
      msg: "Failed to delete user",
    });
  }
}

/**
 * 重置用户密码
 */
export async function resetPassword(request, reply) {
  try {
    const userId = request.params.id;
    const { password } = request.body;

    if (!userId || typeof userId !== "string") {
      return reply.status(400).send({
        code: 400,
        msg: "无效的用户 ID",
      });
    }

    // 验证密码
    const passwordResult = validatePassword(password);
    if (!passwordResult.valid) {
      return reply.status(400).send({
        code: 400,
        msg: passwordResult.error,
      });
    }

    await userManagementService.resetPassword(userId, password);

    return reply.send({
      code: 200,
      msg: "Password reset successfully",
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      code: 500,
      msg: "Failed to reset password",
    });
  }
}

/**
 * 切换用户封禁状态
 */
export async function toggleBanStatus(request, reply) {
  try {
    const userId = request.params.id;
    const { banned } = request.body;

    if (!userId || typeof userId !== "string") {
      return reply.status(400).send({
        code: 400,
        msg: "无效的用户 ID",
      });
    }

    const boolResult = validateBoolean(banned, "banned");
    if (!boolResult.valid) {
      return reply.status(400).send({
        code: 400,
        msg: boolResult.error,
      });
    }

    if (banned === undefined || banned === null) {
      return reply.status(400).send({
        code: 400,
        msg: "banned 是必填参数",
      });
    }

    const result = await userManagementService.toggleBanStatus(userId, banned);

    return reply.send({
      code: 200,
      msg: "User ban status updated successfully",
      data: result,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      code: 500,
      msg: "Failed to update user ban status",
    });
  }
}

/**
 * 获取登录日志
 */
export async function getLoginLogs(request, reply) {
  try {
    const {
      limit = 50,
      offset = 0,
      userId = null,
      success = null,
      startDate = null,
      endDate = null,
    } = request.query;

    // 验证分页参数
    const parsedLimit = parseInt(limit);
    const parsedOffset = parseInt(offset);

    if (Number.isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      return reply.status(400).send({
        code: 400,
        msg: "limit 必须是 1-100 之间的整数",
      });
    }

    if (Number.isNaN(parsedOffset) || parsedOffset < 0) {
      return reply.status(400).send({
        code: 400,
        msg: "offset 必须是大于等于 0 的整数",
      });
    }

    const result = await loginLogService.getAllLoginLogs({
      limit: parsedLimit,
      offset: parsedOffset,
      userId,
      success: success !== null ? success === "true" : null,
      startDate,
      endDate,
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
      msg: "Failed to retrieve login logs",
    });
  }
}

/**
 * 获取访问日志（全局）
 */
export async function getAccessLogs(request, reply) {
  try {
    const {
      limit = 50,
      offset = 0,
      userId = null,
      success = null,
      startDate = null,
      endDate = null,
    } = request.query;

    // 验证分页参数
    const parsedLimit = parseInt(limit);
    const parsedOffset = parseInt(offset);

    if (Number.isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      return reply.status(400).send({
        code: 400,
        msg: "limit 必须是 1-100 之间的整数",
      });
    }

    if (Number.isNaN(parsedOffset) || parsedOffset < 0) {
      return reply.status(400).send({
        code: 400,
        msg: "offset 必须是大于等于 0 的整数",
      });
    }

    const result = await loginLogService.getAllLoginLogs({
      limit: parsedLimit,
      offset: parsedOffset,
      userId,
      success: success !== null ? success === "true" : null,
      startDate,
      endDate,
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
      msg: "Failed to retrieve access logs",
    });
  }
}

/**
 * 获取管理员统计信息
 */
export async function getAdminStats(request, reply) {
  try {
    const stats = await dashboardService.getGlobalStats();

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
 * 获取登录统计信息
 */
export async function getLoginStats(request, reply) {
  try {
    const { userId = null } = request.query;
    const stats = await loginLogService.getLoginStats(userId);

    return reply.send({
      code: 200,
      msg: "success",
      data: stats,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      code: 500,
      msg: "Failed to retrieve login statistics",
    });
  }
}
