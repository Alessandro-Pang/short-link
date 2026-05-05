import dayjs from "dayjs";
import { processPasswordUpdate } from "../utils/security.js";

const LINK_UPDATABLE_FIELDS = [
	"title",
	"description",
	"is_active",
	"expiration_date",
	"max_clicks",
	"redirect_type",
	"pass_query_params",
	"forward_headers",
	"forward_header_list",
	"access_restrictions",
	"password",
] as const;

export function filterLinkUpdates(updates: Record<string, unknown>): Record<string, unknown> {
	const filtered: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(updates)) {
		if (
			LINK_UPDATABLE_FIELDS.includes(key as (typeof LINK_UPDATABLE_FIELDS)[number]) &&
			value !== undefined
		) {
			if (key === "password") {
				const passwordHash = processPasswordUpdate(value);
				if (passwordHash !== undefined) {
					filtered.password_hash = passwordHash;
				}
			} else {
				filtered[key] = value;
			}
		}
	}
	return filtered;
}

interface AccessLog {
	accessed_at: string;
	device_type?: string | null;
	country?: string | null;
}

export function aggregateAccessStats(logs: AccessLog[]) {
	const dailyStats: Record<string, number> = {};
	const deviceStats: Record<string, number> = {};
	const countryStats: Record<string, number> = {};

	for (const log of logs) {
		const date = dayjs(log.accessed_at).format("YYYY-MM-DD");
		dailyStats[date] = (dailyStats[date] || 0) + 1;

		const device = log.device_type || "unknown";
		deviceStats[device] = (deviceStats[device] || 0) + 1;

		const country = log.country || "unknown";
		countryStats[country] = (countryStats[country] || 0) + 1;
	}

	return {
		daily: Object.entries(dailyStats).map(([date, count]) => ({ date, count })),
		devices: Object.entries(deviceStats).map(([device, count]) => ({ device, count })),
		countries: Object.entries(countryStats).map(([country, count]) => ({ country, count })),
		total: logs.length,
	};
}
