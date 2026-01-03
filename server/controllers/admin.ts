/*
 * @Author: zi.yang
 * @Date: 2025-01-01 00:00:00
 * @LastEditors: zi.yang
 * @LastEditTime: 2025-01-01 00:00:00
 * @Description: Admin 控制器 - 管理员专用接口（统一响应格式）
 * @FilePath: /short-link/api/controllers/admin
 */

import * as dashboardService from "../services/dashboard.js";
import * as loginLogService from "../services/log.js";
import * as userManagementService from "../services/user.js";
import { badRequest, notFound, serverError, success, validationError } from "../utils/response.js";
import {
	validateBatchIds,
	validateBoolean,
	validateEmail,
	validatePagination,
	validatePassword,
	validateUpdateLinkParams,
} from "../utils/validation.js";

/**
 * 获取系统统计信息
 */
export async function getSystemStats(request, reply) {
	try {
		const stats = await dashboardService.getGlobalStats();
		return success(reply, stats);
	} catch (error) {
		request.log.error("获取系统统计失败:", error);
		return serverError(reply, "获取系统统计失败");
	}
}

/**
 * 获取管理员统计数据（别名）
 */
export async function getAdminStats(request, reply) {
	return getSystemStats(request, reply);
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
		const paginationErr = validationError(reply, paginationResult);
		if (paginationErr) return paginationErr;

		// 支持两种分页方式：
		// 1. page + pageSize (传统分页)
		// 2. limit + offset (直接偏移)
		const finalLimit = limit ? parseInt(limit) : pageSize ? parseInt(pageSize) : 10;
		const finalOffset =
			offset !== undefined ? parseInt(offset) : page ? (parseInt(page) - 1) * finalLimit : 0;

		// 支持两种排序字段名：sortBy 或 orderBy
		const finalOrderBy = orderBy || sortBy || "created_at";

		// 支持两种排序方向：sortOrder 或 ascending
		const finalAscending =
			ascending !== undefined ? ascending === "true" || ascending === true : sortOrder === "asc";

		const result = await dashboardService.getAllLinks({
			limit: finalLimit,
			offset: finalOffset,
			orderBy: finalOrderBy,
			ascending: finalAscending,
			linkId: linkId ? parseInt(linkId) : null,
			keyword,
			userId,
		});

		return success(reply, result);
	} catch (error) {
		request.log.error("获取链接列表失败:", error);
		return serverError(reply, "获取链接列表失败");
	}
}

/**
 * 获取短链接详情（管理员）
 */
export async function getLinkDetails(request, reply) {
	try {
		const linkId = parseInt(request.params.id);

		if (Number.isNaN(linkId) || linkId < 1) {
			return badRequest(reply, "无效的链接 ID");
		}

		const result = await dashboardService.getLinkDetailAdmin(linkId);

		if (!result) {
			return notFound(reply, "链接不存在");
		}

		return success(reply, result);
	} catch (error) {
		request.log.error("获取链接详情失败:", error);
		return serverError(reply, "获取链接详情失败");
	}
}

/**
 * 获取短链接访问日志（管理员）
 */
export async function getLinkAccessLogs(request, reply) {
	try {
		const linkId = parseInt(request.params.id);

		if (Number.isNaN(linkId) || linkId < 1) {
			return badRequest(reply, "无效的链接 ID");
		}

		const result = await dashboardService.getLinkAccessLogsAdmin(linkId, {
			limit: parseInt(request.query.limit || request.query.pageSize || 50),
			offset: parseInt(request.query.offset || 0),
		});

		return success(reply, result);
	} catch (error) {
		request.log.error("获取访问日志失败:", error);
		return serverError(reply, "获取访问日志失败");
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
			return badRequest(reply, "无效的链接 ID");
		}

		// 使用统一验证模块
		const validationResult = validateUpdateLinkParams(updates);
		const validationErr = validationError(reply, validationResult);
		if (validationErr) return validationErr;

		// 处理 max_clicks 转换
		if (updates.max_clicks !== undefined && updates.max_clicks !== null) {
			updates.max_clicks = parseInt(updates.max_clicks);
		}

		const result = await dashboardService.updateLinkAdmin(linkId, updates);

		return success(reply, result, "链接更新成功");
	} catch (error) {
		request.log.error("更新链接失败:", error);
		return serverError(reply, "更新链接失败");
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
			return badRequest(reply, "无效的链接 ID");
		}

		// 验证 is_active
		const boolResult = validateBoolean(is_active, "is_active");
		const boolErr = validationError(reply, boolResult);
		if (boolErr) return boolErr;

		if (is_active === undefined || is_active === null) {
			return badRequest(reply, "is_active 是必填参数");
		}

		const result = await dashboardService.batchToggleLinksAdmin([linkId], is_active);

		return success(reply, result, "链接状态更新成功");
	} catch (error) {
		request.log.error("更新链接状态失败:", error);
		return serverError(reply, "更新链接状态失败");
	}
}

/**
 * 删除短链接（管理员）
 */
export async function deleteLink(request, reply) {
	try {
		const linkId = parseInt(request.params.id);

		if (Number.isNaN(linkId) || linkId < 1) {
			return badRequest(reply, "无效的链接 ID");
		}

		await dashboardService.deleteLinkAdmin(linkId);

		return success(reply, null, "链接删除成功");
	} catch (error) {
		request.log.error("删除链接失败:", error);
		return serverError(reply, "删除链接失败");
	}
}

/**
 * 批量删除短链接（管理员）
 */
export async function batchDeleteLinks(request, reply) {
	try {
		const { linkIds } = request.body;

		// 验证 linkIds
		const idsResult = validateBatchIds(linkIds);
		const idsErr = validationError(reply, idsResult);
		if (idsErr) return idsErr;

		const result = await dashboardService.batchDeleteLinksAdmin(linkIds);

		return success(reply, result, "批量删除成功");
	} catch (error) {
		request.log.error("批量删除链接失败:", error);
		return serverError(reply, "批量删除失败");
	}
}

/**
 * 批量更新短链接状态（管理员）
 */
export async function batchUpdateLinkStatus(request, reply) {
	try {
		const { linkIds, is_active } = request.body;

		// 验证 linkIds
		const idsResult = validateBatchIds(linkIds);
		const idsErr = validationError(reply, idsResult);
		if (idsErr) return idsErr;

		// 验证 is_active
		const boolResult = validateBoolean(is_active, "is_active");
		const boolErr = validationError(reply, boolResult);
		if (boolErr) return boolErr;

		if (is_active === undefined || is_active === null) {
			return badRequest(reply, "is_active 是必填参数");
		}

		const result = await dashboardService.batchToggleLinksAdmin(linkIds, is_active);

		const action = is_active ? "启用" : "禁用";
		return success(reply, result, `批量${action}成功`);
	} catch (error) {
		request.log.error("批量更新链接状态失败:", error);
		return serverError(reply, "批量更新状态失败");
	}
}

/**
 * 获取所有用户列表（管理员）
 */
export async function getAllUsers(request, reply) {
	try {
		const { page = 1, perPage = 50 } = request.query;

		// 验证分页参数
		const paginationResult = validatePagination({ page, pageSize: perPage });
		const paginationErr = validationError(reply, paginationResult);
		if (paginationErr) return paginationErr;

		const result = await userManagementService.getAllUsers({
			page: parseInt(page),
			perPage: parseInt(perPage),
		});

		return success(reply, result);
	} catch (error) {
		request.log.error("获取用户列表失败:", error);
		return serverError(reply, "获取用户列表失败");
	}
}

/**
 * 获取用户详情（管理员）
 */
export async function getUserDetails(request, reply) {
	try {
		const userId = request.params.id;

		if (!userId) {
			return badRequest(reply, "无效的用户 ID");
		}

		const result = await userManagementService.getUserDetails(userId);

		if (!result) {
			return notFound(reply, "用户不存在");
		}

		return success(reply, result);
	} catch (error) {
		request.log.error("获取用户详情失败:", error);
		return serverError(reply, "获取用户详情失败");
	}
}

/**
 * 创建新用户（管理员）
 */
export async function createUser(request, reply) {
	try {
		const { email, password } = request.body;

		// 验证邮箱
		const emailResult = validateEmail(email);
		const emailErr = validationError(reply, emailResult);
		if (emailErr) return emailErr;

		// 验证密码
		const passwordResult = validatePassword(password);
		const passwordErr = validationError(reply, passwordResult);
		if (passwordErr) return passwordErr;

		const result = await userManagementService.createUser({ email, password });

		return success(reply, result, "用户创建成功");
	} catch (error) {
		request.log.error("创建用户失败:", error);
		return serverError(reply, error.message || "创建用户失败");
	}
}

/**
 * 更新用户信息（管理员）
 */
export async function updateUser(request, reply) {
	try {
		const userId = request.params.id;
		const updates = request.body;

		if (!userId) {
			return badRequest(reply, "无效的用户 ID");
		}

		const result = await userManagementService.updateUser(userId, updates);

		return success(reply, result, "用户信息更新成功");
	} catch (error) {
		request.log.error("更新用户信息失败:", error);
		return serverError(reply, error.message || "更新用户信息失败");
	}
}

/**
 * 删除用户（管理员）
 */
export async function deleteUser(request, reply) {
	try {
		const userId = request.params.id;

		if (!userId) {
			return badRequest(reply, "无效的用户 ID");
		}

		await userManagementService.deleteUser(userId);

		return success(reply, null, "用户删除成功");
	} catch (error) {
		request.log.error("删除用户失败:", error);
		return serverError(reply, error.message || "删除用户失败");
	}
}

/**
 * 重置用户密码（管理员）
 */
export async function resetPassword(request, reply) {
	try {
		const userId = request.params.id;
		const { password } = request.body;

		if (!userId) {
			return badRequest(reply, "无效的用户 ID");
		}

		// 验证密码
		const passwordResult = validatePassword(password);
		const passwordErr = validationError(reply, passwordResult);
		if (passwordErr) return passwordErr;

		await userManagementService.resetPassword(userId, password);

		return success(reply, null, "密码重置成功");
	} catch (error) {
		request.log.error("重置密码失败:", error);
		return serverError(reply, error.message || "重置密码失败");
	}
}

/**
 * 切换用户封禁状态（管理员）
 */
export async function toggleBanStatus(request, reply) {
	try {
		const userId = request.params.id;
		const { banned } = request.body;

		if (!userId) {
			return badRequest(reply, "无效的用户 ID");
		}

		// 验证 banned
		const boolResult = validateBoolean(banned, "banned");
		const boolErr = validationError(reply, boolResult);
		if (boolErr) return boolErr;

		if (banned === undefined || banned === null) {
			return badRequest(reply, "banned 是必填参数");
		}

		const result = await userManagementService.toggleBanStatus(userId, banned);

		return success(reply, result, banned ? "用户已禁用" : "用户已启用");
	} catch (error) {
		request.log.error("切换用户封禁状态失败:", error);
		return serverError(reply, error.message || "操作失败");
	}
}

/**
 * 获取登录日志（管理员）
 */
export async function getLoginLogs(request, reply) {
	try {
		const {
			limit = 50,
			offset = 0,
			userId = null,
			success: successFilter = null,
			startDate = null,
			endDate = null,
		} = request.query;

		const parsedLimit = parseInt(limit);
		const parsedOffset = parseInt(offset);

		if (Number.isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
			return badRequest(reply, "limit 必须是 1-100 之间的整数");
		}

		if (Number.isNaN(parsedOffset) || parsedOffset < 0) {
			return badRequest(reply, "offset 必须是非负整数");
		}

		const result = await loginLogService.getAllLoginLogs({
			limit: parsedLimit,
			offset: parsedOffset,
			userId,
			success: successFilter === null ? null : successFilter === "true",
			startDate,
			endDate,
		});

		return success(reply, result);
	} catch (error) {
		request.log.error("获取登录日志失败:", error);
		return serverError(reply, "获取登录日志失败");
	}
}

/**
 * 获取访问日志（管理员）
 */
export async function getAccessLogs(request, reply) {
	try {
		const {
			limit = 50,
			offset = 0,
			linkId = null,
			startDate = null,
			endDate = null,
		} = request.query;

		const parsedLimit = parseInt(limit);
		const parsedOffset = parseInt(offset);

		if (Number.isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
			return badRequest(reply, "limit 必须是 1-100 之间的整数");
		}

		if (Number.isNaN(parsedOffset) || parsedOffset < 0) {
			return badRequest(reply, "offset 必须是非负整数");
		}

		// 构建查询
		let query = (await import("../database/client")).default
			.from("link_access_logs")
			.select("*", { count: "exact" })
			.order("accessed_at", { ascending: false })
			.range(parsedOffset, parsedOffset + parsedLimit - 1);

		if (linkId) {
			query = query.eq("link_id", parseInt(linkId));
		}

		if (startDate) {
			query = query.gte("accessed_at", startDate);
		}

		if (endDate) {
			query = query.lte("accessed_at", endDate);
		}

		const { data, error, count } = await query;

		if (error) {
			throw error;
		}

		return success(reply, {
			logs: data || [],
			total: count || 0,
		});
	} catch (error) {
		request.log.error("获取访问日志失败:", error);
		return serverError(reply, "获取访问日志失败");
	}
}

/**
 * 获取登录统计（管理员）
 */
export async function getLoginStats(request, reply) {
	try {
		const { userId = null } = request.query;

		const stats = await loginLogService.getLoginStats(userId);

		return success(reply, stats);
	} catch (error) {
		request.log.error("获取登录统计失败:", error);
		return serverError(reply, "获取登录统计失败");
	}
}

/**
 * 获取全局排行榜（管理员）
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

		const result = await dashboardService.getGlobalTopLinks(period, limit);

		return success(reply, result);
	} catch (error) {
		request.log.error("获取全局排行榜失败:", error);
		return serverError(reply, "获取全局排行榜失败");
	}
}
