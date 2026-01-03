import dayjs from "dayjs";
import { getClientIp } from "../middlewares/utils.js";
import * as authService from "../services/auth.js";
import * as loginLogService from "../services/log.js";

/**
 * 验证 Token
 */
export async function validateToken(request, reply) {
	try {
		const { token } = request.body;
		if (!token) {
			return reply.status(400).send({
				code: 400,
				msg: "缺少 token",
			});
		}

		const user = await authService.verifyToken(token);
		return reply.send({
			code: 200,
			msg: "success",
			data: { user, valid: !!user },
		});
	} catch (error) {
		return reply.status(401).send({
			code: 401,
			msg: error.message,
		});
	}
}

/**
 * 记录登录尝试
 */
export async function logLoginAttempt(request, reply) {
	try {
		const { email, success, failure_reason, login_method, user_agent } = request.body;

		if (!email) {
			return reply.status(400).send({
				code: 400,
				msg: "Email is required",
			});
		}

		let userId = null;
		if (success) {
			const authHeader = request.headers.authorization;
			if (authHeader?.startsWith("Bearer ")) {
				try {
					const token = authHeader.substring(7);
					const user = await authService.verifyToken(token);
					if (user?.id) {
						userId = user.id;
					}
				} catch (err) {
					request.log.warn("Failed to extract user from token:", err.message);
				}
			}
		}

		const ipAddress = getClientIp(request);

		await loginLogService.recordLoginAttempt({
			user_id: userId,
			email,
			ip_address: ipAddress,
			user_agent: user_agent || request.headers["user-agent"],
			success: success || false,
			failure_reason: failure_reason || null,
			login_method: login_method || "unknown",
		});

		return reply.send({
			code: 200,
			msg: "Login attempt recorded",
		});
	} catch (error) {
		request.log.error(error);
		return reply.status(500).send({
			code: 500,
			msg: "Failed to record login attempt",
		});
	}
}

/**
 * 获取当前用户信息
 */
export async function getCurrentUser(request, reply) {
	try {
		const authHeader = request.headers.authorization;
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return reply.status(401).send({
				code: 401,
				msg: "缺少或无效的授权头",
			});
		}

		const token = authHeader.substring(7);
		const user = await authService.verifyToken(token);

		if (!user || !user.id) {
			return reply.status(401).send({
				code: 401,
				msg: "无效的令牌",
			});
		}

		// 获取用户详细信息（从 user_profiles 表）
		const userProfile = await authService.getUserById(user.id);

		// 如果 user_profiles 没有数据，使用 auth user 数据
		const userData = userProfile || {
			id: user.id,
			email: user.email,
			is_admin: false,
			banned: false,
		};

		const isBanned = userData.banned || false;

		// 只在用户被禁用时记录（用于安全审计）
		// 正常的 API 调用不应记录为登录日志
		if (isBanned) {
			const ipAddress = getClientIp(request);
			try {
				await loginLogService.recordLoginAttempt({
					user_id: user.id,
					email: user.email,
					ip_address: ipAddress,
					user_agent: request.headers["user-agent"],
					success: false,
					failure_reason: "用户已被禁用",
					login_method: "jwt",
				});
			} catch (logError) {
				request.log.warn("Failed to log banned user attempt:", logError);
			}

			return reply.status(403).send({
				code: 403,
				msg: "您的账号已被禁用",
				banned: true,
			});
		}

		return reply.send({
			code: 200,
			msg: "成功获取用户数据",
			data: {
				// 前端使用的驼峰命名
				isAdmin: userData.is_admin || false,
				...user,
				...userData,
			},
		});
	} catch (error) {
		request.log.error("getCurrentUser error:", error);
		return reply.status(500).send({
			code: 500,
			msg: error.message || "获取用户数据失败",
			data: {
				status: "error",
				timestamp: dayjs().toISOString(),
			},
		});
	}
}
