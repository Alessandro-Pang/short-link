import type { FastifyRequest } from "fastify";

/**
 * 获取客户端 IP 地址
 */
export function getClientIp(request: FastifyRequest): string | undefined {
	const xRealIp = request.headers["x-real-ip"] as string | undefined;
	const xForwardedFor = request.headers["x-forwarded-for"] as string | undefined;
	return xRealIp || xForwardedFor?.split(",")[0] || request.ip || request.socket.remoteAddress;
}

/**
 * 构建转发请求的 headers
 */
export function buildForwardHeaders(
	request: FastifyRequest,
	headerList: string[] = [],
): Record<string, string> {
	const headers: Record<string, string> = {
		"User-Agent": (request.headers["user-agent"] as string) || "Unknown",
	};

	const lowerName = (name: string) => name.toLowerCase();

	if (headerList && headerList.length > 0) {
		headerList.forEach((name) => {
			const lowerCaseName = lowerName(name);
			const val = request.headers[lowerCaseName];
			if (val) {
				headers[name] = val as string;
			}
		});
	} else {
		// 默认转发的 headers
		["x-real-ip", "x-forwarded-for", "x-forwarded-proto"].forEach((name) => {
			const val = request.headers[lowerName(name)];
			if (val) {
				headers[name] = val as string;
			}
		});
	}

	return headers;
}
