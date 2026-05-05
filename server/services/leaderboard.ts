import dayjs from "dayjs";
import supabase from "../database/client.js";

type LeaderboardPeriod = "daily" | "weekly" | "monthly";

const PERIOD_DAYS: Record<LeaderboardPeriod, number> = {
	daily: 1,
	weekly: 7,
	monthly: 30,
};

function getStartDate(period: string): string {
	const days = PERIOD_DAYS[period as LeaderboardPeriod];
	if (!days) {
		throw new Error("无效的时间周期");
	}
	return dayjs().subtract(days, "day").toISOString();
}

/**
 * 获取用户排行榜
 */
export async function getTopLinks(userId: string, period: string, limit: number = 20) {
	try {
		if (!userId) {
			console.error("查询排行榜失败:", "没有查询到用户 ID");
			throw new Error("没有查询到用户 ID");
		}

		const { data, error } = await supabase.rpc("get_top_links_by_period", {
			p_user_id: userId,
			p_start_date: getStartDate(period),
			p_limit: limit,
		});

		if (error) {
			console.error("查询排行榜失败:", error);
			throw error;
		}

		return { links: data || [] };
	} catch (error) {
		console.error("获取排行榜异常:", error);
		throw error;
	}
}

/**
 * 获取全局排行榜
 */
export async function getGlobalTopLinks(period: string, limit: number = 20) {
	try {
		const { data, error } = await supabase.rpc("get_top_links_by_period", {
			p_user_id: null,
			p_start_date: getStartDate(period),
			p_limit: limit,
		});

		if (error) {
			console.error("查询全局排行榜失败:", error);
			throw error;
		}

		return { links: data || [] };
	} catch (error) {
		console.error("获取全局排行榜异常:", error);
		throw error;
	}
}
