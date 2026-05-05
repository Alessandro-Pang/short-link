import dayjs from "dayjs";
import type { Link, LinkAccessLog } from "../../types/database.schema.js";
import supabase from "../database/client.js";
import type { QueryOptions } from "../types/index.js";
import { aggregateAccessStats, filterLinkUpdates } from "./link-helpers.js";

/**
 * 获取全局统计数据（管理员用，使用数据库聚合优化）
 * @returns {Promise<Object>} 全局统计
 */
export async function getGlobalStats() {
	try {
		// 查询 1：获取链接基本统计
		const { data: links, error: linksError } = await supabase
			.from("links")
			.select("click_count, user_id, created_at");

		if (linksError) {
			console.error("查询全局链接统计失败:", linksError);
			return {
				total_links: 0,
				total_clicks: 0,
				weekly_new_links: 0,
				avg_clicks_per_link: 0,
				total_users: 0,
				anonymous_links: 0,
			};
		}

		const totalLinks = links?.length || 0;
		const totalClicks = links?.reduce((sum, link) => sum + (link.click_count || 0), 0) || 0;

		// 计算最近一周新建的链接
		const oneWeekAgo = dayjs().subtract(7, "day");
		const weeklyNewLinks =
			links?.filter((link) => dayjs(link.created_at).isAfter(oneWeekAgo)).length || 0;

		const avgClicksPerLink = totalLinks > 0 ? (totalClicks / totalLinks).toFixed(2) : "0";

		// 统计独立用户数
		const userIds = new Set(links?.map((l) => l.user_id).filter(Boolean));
		const anonymousLinks = links?.filter((l) => !l.user_id).length || 0;

		return {
			total_links: totalLinks,
			total_clicks: totalClicks,
			weekly_new_links: weeklyNewLinks,
			avg_clicks_per_link: parseFloat(avgClicksPerLink),
			total_users: userIds.size,
			anonymous_links: anonymousLinks,
		};
	} catch (error) {
		console.error("获取全局统计失败:", error);
		throw error;
	}
}

/**
 * 获取所有链接列表（管理员用）
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} 链接列表和总数
 */
export async function getAllLinks(options: Partial<QueryOptions> = {}): Promise<{
	links: Link[];
	total: number;
}> {
	try {
		const {
			limit = 10,
			offset = 0,
			orderBy = "created_at",
			ascending = false,
			linkId = null,
			keyword = null,
			userId = null,
		} = options;

		let query = supabase.from("links").select("*", { count: "exact" });

		// 过滤条件
		if (linkId) {
			query = query.eq("id", linkId);
		}
		if (userId) {
			query = query.eq("user_id", userId);
		}
		if (keyword) {
			query = query.or(`link.ilike.%${keyword}%,title.ilike.%${keyword}%`);
		}

		// 排序
		query = query.order(orderBy, { ascending });

		// 分页
		query = query.range(offset, offset + limit - 1);

		const { data, error, count } = await query;

		if (error) {
			console.error("获取所有链接列表失败:", error);
			throw error;
		}

		return {
			links: data || [],
			total: count || 0,
		};
	} catch (error) {
		console.error("获取所有链接列表异常:", error);
		throw error;
	}
}

/**
 * 获取链接详情（管理员用，无权限限制）
 * @param {number} linkId - 链接 ID
 * @returns {Promise<Object|null>} 链接详情
 */
export async function getLinkDetailAdmin(linkId: number): Promise<Link | null> {
	try {
		const { data, error } = await supabase.from("links").select("*").eq("id", linkId).single();

		if (error) {
			if (error.code === "PGRST116") {
				return null;
			}
			console.error("获取链接详情失败:", error);
			throw error;
		}

		return data;
	} catch (error) {
		console.error("获取链接详情异常:", error);
		throw error;
	}
}

/**
 * 获取链接访问日志（管理员用，无权限限制）
 * @param {number} linkId - 链接 ID
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} 访问日志
 */
export async function getLinkAccessLogsAdmin(
	linkId: number,
	options: Partial<QueryOptions> = {},
): Promise<{
	logs: LinkAccessLog[];
	total: number;
}> {
	try {
		const { limit = 50, offset = 0 } = options;

		const { data, error, count } = await supabase
			.from("link_access_logs")
			.select("*", { count: "exact" })
			.eq("link_id", linkId)
			.order("accessed_at", { ascending: false })
			.range(offset, offset + limit - 1);

		if (error) {
			console.error("获取访问日志失败:", error);
			throw error;
		}

		return {
			logs: data || [],
			total: count || 0,
		};
	} catch (error) {
		console.error("获取访问日志异常:", error);
		throw error;
	}
}

/**
 * 更新链接（管理员用，无权限限制）
 * @param {number} linkId - 链接 ID
 * @param {Object} updates - 更新数据
 * @returns {Promise<Object>} 更新后的链接
 */
export async function updateLinkAdmin(
	linkId: number,
	updates: Record<string, unknown>,
): Promise<Link> {
	try {
		const filteredUpdates = filterLinkUpdates(updates);

		const { data, error } = await supabase
			.from("links")
			.update(filteredUpdates)
			.eq("id", linkId)
			.select()
			.maybeSingle();

		if (error) {
			console.error("更新链接失败:", error);
			throw error;
		}

		return data;
	} catch (error) {
		console.error("更新链接异常:", error);
		throw error;
	}
}

/**
 * 删除链接（管理员用，无权限限制）
 * @param {number} linkId - 链接 ID
 * @returns {Promise<Object>} 删除结果
 */
export async function deleteLinkAdmin(linkId: number): Promise<{ success: boolean }> {
	try {
		const { error } = await supabase.from("links").delete().eq("id", linkId);

		if (error) {
			console.error("删除链接失败:", error);
			throw error;
		}

		return { success: true };
	} catch (error) {
		console.error("删除链接异常:", error);
		throw error;
	}
}

/**
 * 获取链接访问统计（管理员用，无权限限制）
 * @param {number} linkId - 链接 ID
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} 访问统计
 */
export async function getLinkAccessStatsAdmin(linkId: number, options: Partial<QueryOptions> = {}) {
	try {
		const { days = 30 } = options;
		const startDate = dayjs().subtract(Number(days), "day").toISOString();

		const { data, error } = await supabase
			.from("link_access_logs")
			.select("accessed_at, device_type, country")
			.eq("link_id", linkId)
			.gte("accessed_at", startDate)
			.order("accessed_at", { ascending: true });

		if (error) {
			console.error("获取访问统计失败:", error);
			throw error;
		}

		return aggregateAccessStats(data || []);
	} catch (error) {
		console.error("获取访问统计异常:", error);
		throw error;
	}
}

/**
 * 批量删除链接（管理员用，无权限限制）
 * @param {Array<number>} linkIds - 链接 ID 数组
 * @returns {Promise<Object>} 删除结果
 */
export async function batchDeleteLinksAdmin(linkIds: number[]): Promise<{
	success: number;
	failed: number;
}> {
	try {
		const { error } = await supabase.from("links").delete().in("id", linkIds);

		if (error) {
			console.error("批量删除链接失败:", error);
			throw error;
		}

		return {
			success: linkIds.length,
			failed: 0,
		};
	} catch (error) {
		console.error("批量删除链接异常:", error);
		throw error;
	}
}

/**
 * 批量切换链接状态（管理员用，无权限限制）
 * @param {Array<number>} linkIds - 链接 ID 数组
 * @param {boolean} isActive - 是否启用
 * @returns {Promise<Object>} 操作结果
 */
export async function batchToggleLinksAdmin(
	linkIds: number[],
	isActive: boolean,
): Promise<{
	success: number;
	failed: number;
}> {
	try {
		const { error } = await supabase
			.from("links")
			.update({ is_active: isActive })
			.in("id", linkIds);

		if (error) {
			console.error("批量更新链接状态失败:", error);
			throw error;
		}

		return {
			success: linkIds.length,
			failed: 0,
		};
	} catch (error) {
		console.error("批量更新链接状态异常:", error);
		throw error;
	}
}

/**
 * 获取访问日志（管理员用，支持按链接ID和时间范围过滤）
 */
export async function getAccessLogs(options: {
	limit?: number;
	offset?: number;
	linkId?: number | null;
	startDate?: string | null;
	endDate?: string | null;
}): Promise<{ logs: LinkAccessLog[]; total: number }> {
	const { limit = 50, offset = 0, linkId = null, startDate = null, endDate = null } = options;

	let query = supabase
		.from("link_access_logs")
		.select("*", { count: "exact" })
		.order("accessed_at", { ascending: false })
		.range(offset, offset + limit - 1);

	if (linkId) {
		query = query.eq("link_id", linkId);
	}

	if (startDate) {
		query = query.gte("accessed_at", startDate);
	}

	if (endDate) {
		query = query.lte("accessed_at", endDate);
	}

	const { data, error, count } = await query;

	if (error) {
		console.error("获取访问日志失败:", error);
		throw error;
	}

	return {
		logs: data || [],
		total: count || 0,
	};
}
