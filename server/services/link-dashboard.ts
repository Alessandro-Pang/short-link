import dayjs from "dayjs";
import type { Link, LinkAccessLog } from "../../types/database.schema.js";
import supabase from "../database/client.js";
import type { QueryOptions } from "../types/index.js";
import { aggregateAccessStats, filterLinkUpdates } from "./link-helpers.js";

/**
 * 获取用户统计数据（使用数据库聚合查询优化）
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 统计数据
 */
export async function getUserStats(userId: string): Promise<{
	total_links: number;
	total_clicks: number;
	weekly_new_links: number;
	avg_clicks_per_link: number;
}> {
	try {
		// 使用数据库聚合查询，避免拉取所有数据到内存
		// 查询 1：获取总链接数和总点击数
		const { data: statsData, error: statsError } = await supabase
			.from("links")
			.select("click_count")
			.eq("user_id", userId);

		if (statsError) {
			console.error("查询用户统计失败:", statsError);
			throw statsError;
		}

		// 如果没有数据，返回默认值
		if (!statsData || statsData.length === 0) {
			return {
				total_links: 0,
				total_clicks: 0,
				weekly_new_links: 0,
				avg_clicks_per_link: 0,
			};
		}

		// 计算总数（这个查询已经很轻量，只返回 click_count）
		const totalLinks = statsData.length;
		const totalClicks = statsData.reduce((sum, link) => sum + (link.click_count || 0), 0);

		// 查询 2：获取最近一周新建的链接数（使用数据库过滤）
		const oneWeekAgo = dayjs().subtract(7, "day").toISOString();

		const { count: weeklyNewLinks, error: weeklyError } = await supabase
			.from("links")
			.select("id", { count: "exact", head: true })
			.eq("user_id", userId)
			.gte("created_at", oneWeekAgo);

		if (weeklyError) {
			console.error("查询周新增链接失败:", weeklyError);
		}

		const avgClicksPerLink = totalLinks > 0 ? (totalClicks / totalLinks).toFixed(2) : "0";

		return {
			total_links: totalLinks,
			total_clicks: totalClicks,
			weekly_new_links: weeklyNewLinks || 0,
			avg_clicks_per_link: parseFloat(avgClicksPerLink),
		};
	} catch (error) {
		console.error("获取用户统计失败:", error);
		throw error;
	}
}

/**
 * 获取用户链接列表
 * @param {string} userId - 用户 ID
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} 链接列表和总数
 */
export async function getUserLinks(
	userId: string,
	options: Partial<QueryOptions> = {},
): Promise<{
	links: Link[];
	total: number;
}> {
	try {
		const { limit = 10, offset = 0, sortBy = "created_at", sortOrder = "desc" } = options;

		// 构建查询
		let query = supabase.from("links").select("*", { count: "exact" }).eq("user_id", userId);

		// 排序
		const ascending = sortOrder === "asc";
		query = query.order(sortBy, { ascending });

		// 分页
		query = query.range(offset, offset + limit - 1);

		const { data, error, count } = await query;

		if (error) {
			console.error("获取用户链接列表失败:", error);
			throw error;
		}

		return {
			links: data || [],
			total: count || 0,
		};
	} catch (error) {
		console.error("获取用户链接列表异常:", error);
		throw error;
	}
}

/**
 * 获取单个链接详情
 * @param {number} linkId - 链接 ID
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object|null>} 链接详情
 */
export async function getLinkDetail(linkId: number, userId: string): Promise<Link | null> {
	try {
		const { data, error } = await supabase
			.from("links")
			.select("*")
			.eq("id", linkId)
			.eq("user_id", userId)
			.single();

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
 * 获取链接访问日志
 * @param {number} linkId - 链接 ID
 * @param {string} userId - 用户 ID
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} 访问日志
 */
export async function getLinkAccessLogs(
	linkId: number,
	userId: string,
	options: Partial<QueryOptions> = {},
): Promise<{
	logs: LinkAccessLog[];
	total: number;
}> {
	try {
		const { limit = 50, offset = 0 } = options;

		// 先验证链接所有权
		const { data: link } = await supabase
			.from("links")
			.select("id")
			.eq("id", linkId)
			.eq("user_id", userId)
			.single();

		if (!link) {
			throw new Error("无权访问此链接的日志");
		}

		// 获取日志
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
 * 更新链接
 * @param {number} linkId - 链接 ID
 * @param {string} userId - 用户 ID
 * @param {Object} updates - 更新数据
 * @returns {Promise<Object>} 更新后的链接
 */
export async function updateLink(
	linkId: number,
	userId: string,
	updates: Record<string, unknown>,
): Promise<Link> {
	try {
		// 先验证链接所有权
		const { data: link, error: checkError } = await supabase
			.from("links")
			.select("id")
			.eq("id", linkId)
			.eq("user_id", userId)
			.single();

		if (checkError || !link) {
			throw new Error("链接不存在或无权访问");
		}

		// 过滤更新字段
		const filteredUpdates = filterLinkUpdates(updates);

		// 执行更新
		const { data, error } = await supabase
			.from("links")
			.update(filteredUpdates)
			.eq("id", linkId)
			.eq("user_id", userId)
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
 * 删除链接
 * @param {number} linkId - 链接 ID
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 删除结果
 */
export async function deleteLink(
	linkId: number,
	userId: string,
): Promise<{ success?: boolean; error?: { message: string } }> {
	try {
		// 先验证链接所有权
		const { data: link, error: checkError } = await supabase
			.from("links")
			.select("id")
			.eq("id", linkId)
			.eq("user_id", userId)
			.single();

		if (checkError || !link) {
			return { error: { message: "链接不存在或无权访问" } };
		}

		// 执行删除
		const { error } = await supabase.from("links").delete().eq("id", linkId).eq("user_id", userId);

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
 * 批量删除链接
 * @param {Array<number>} linkIds - 链接 ID 数组
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 删除结果
 */
export async function batchDeleteLinks(
	linkIds: number[],
	userId: string,
): Promise<{
	success: number;
	failed: number;
}> {
	try {
		// 先查询属于该用户的链接
		const { data: links, error: queryError } = await supabase
			.from("links")
			.select("id")
			.eq("user_id", userId)
			.in("id", linkIds);

		if (queryError) {
			console.error("查询链接失败:", queryError);
			throw queryError;
		}

		if (!links || links.length === 0) {
			return {
				success: 0,
				failed: linkIds.length,
			};
		}

		// 只删除属于该用户的链接
		const userLinkIds = links.map((l) => l.id);

		const { error } = await supabase
			.from("links")
			.delete()
			.eq("user_id", userId)
			.in("id", userLinkIds);

		if (error) {
			console.error("批量删除链接失败:", error);
			throw error;
		}

		return {
			success: userLinkIds.length,
			failed: linkIds.length - userLinkIds.length,
		};
	} catch (error) {
		console.error("批量删除链接异常:", error);
		throw error;
	}
}

/**
 * 批量切换链接状态
 * @param {Array<number>} linkIds - 链接 ID 数组
 * @param {string} userId - 用户 ID
 * @param {boolean} isActive - 是否启用
 * @returns {Promise<Object>} 操作结果
 */
export async function batchToggleLinks(
	linkIds: number[],
	userId: string,
	isActive: boolean,
): Promise<{
	success: number;
	failed: number;
}> {
	try {
		// 先查询属于该用户的链接
		const { data: links, error: queryError } = await supabase
			.from("links")
			.select("id")
			.eq("user_id", userId)
			.in("id", linkIds);

		if (queryError) {
			console.error("查询链接失败:", queryError);
			throw queryError;
		}

		if (!links || links.length === 0) {
			return {
				success: 0,
				failed: linkIds.length,
			};
		}

		// 只更新属于该用户的链接
		const userLinkIds = links.map((l) => l.id);

		const { error } = await supabase
			.from("links")
			.update({ is_active: isActive })
			.eq("user_id", userId)
			.in("id", userLinkIds);

		if (error) {
			console.error("批量更新链接状态失败:", error);
			throw error;
		}

		return {
			success: userLinkIds.length,
			failed: linkIds.length - userLinkIds.length,
		};
	} catch (error) {
		console.error("批量更新链接状态异常:", error);
		throw error;
	}
}

/**
 * 获取链接访问统计（按日期聚合）
 * @param {number} linkId - 链接 ID
 * @param {string} userId - 用户 ID
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} 访问统计
 */
export async function getLinkAccessStats(
	linkId: number,
	userId: string,
	options: Partial<QueryOptions> = {},
) {
	try {
		// 先验证链接所有权
		const { data: link } = await supabase
			.from("links")
			.select("id")
			.eq("id", linkId)
			.eq("user_id", userId)
			.single();

		if (!link) {
			throw new Error("无权访问此链接的统计");
		}

		const { days = 30 } = options;
		const startDate = dayjs().subtract(Number(days), "day").toISOString();

		// 获取访问日志
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
