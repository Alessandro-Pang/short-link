/**
 * 认证服务模块
 * 基于 Supabase Auth 实现用户认证功能
 */

import dayjs from "dayjs";
import { ApiError } from "./request";
import { supabase } from "./supabase";

/**
 * 使用 GitHub 登录
 * @returns {Promise} 登录结果
 */
export async function signInWithGithub() {
	try {
		const { data, error } = await supabase.auth.signInWithOAuth({
			provider: "github",
			options: {
				redirectTo: `${window.location.origin}/dashboard`,
			},
		});

		if (error) throw error;
		return data;
	} catch (error) {
		throw error;
	}
}

/**
 * 使用 Google 登录
 * @returns {Promise} 登录结果
 */
export async function signInWithGoogle() {
	try {
		const { data, error } = await supabase.auth.signInWithOAuth({
			provider: "google",
			options: {
				redirectTo: `${window.location.origin}/dashboard`,
			},
		});

		if (error) throw error;
		return data;
	} catch (error) {
		throw error;
	}
}

/**
 * 使用邮箱密码登录
 * @param {string} email - 邮箱地址
 * @param {string} password - 密码
 * @returns {Promise} 登录结果
 */
export async function signInWithEmail(email, password) {
	try {
		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		if (error) {
			// 记录登录失败日志
			await recordLoginAttempt(email, false, error.message, "email");
			throw error;
		}

		// 检查用户是否被禁用
		if (data.user) {
			const isBanned = await checkUserBanned(data.user.id);
			if (isBanned) {
				// 退出登录
				await supabase.auth.signOut();
				// 记录失败日志
				await recordLoginAttempt(email, false, "用户已被禁用", "email");
				throw new ApiError("您的账号已被禁用，请联系管理员", "USER_BANNED");
			}

			// 记录登录成功日志
			await recordLoginAttempt(email, true, null, "email");
		}

		return data;
	} catch (error) {
		throw error;
	}
}

/**
 * 检查用户是否被禁用
 * @param {string} userId - 用户 ID
 * @returns {Promise<boolean>} 是否被禁用
 */
async function checkUserBanned(userId) {
	try {
		const response = await fetch("/api/dashboard/user", {
			headers: {
				Authorization: `Bearer ${(await getSession())?.access_token}`,
			},
		});

		if (!response.ok) return false;

		const result = await response.json();
		const user = result.data;

		// 检查是否有 banned_until 字段且未过期
		if (user.banned_until) {
			if (dayjs(user.banned_until).isAfter(dayjs())) {
				return true;
			}
		}

		return false;
	} catch (error) {
		console.error("检查用户禁用状态失败:", error);
		return false;
	}
}

/**
 * 错误消息中英文映射
 */
const ERROR_MESSAGE_MAP = {
	"Invalid login credentials": "邮箱或密码错误",
	"Email not confirmed": "邮箱未验证，请先验证您的邮箱",
	"User already registered": "该邮箱已被注册",
	"User is banned": "用户已被禁用",
	user_banned: "用户已被禁用",
	banned: "用户已被禁用",
};

/**
 * 将英文错误消息转换为中文
 * @param {string} errorMessage - 英文错误消息
 * @returns {string} 中文错误消息
 */
function translateErrorMessage(errorMessage) {
	if (!errorMessage) return null;

	// 检查是否包含关键词
	for (const [key, value] of Object.entries(ERROR_MESSAGE_MAP)) {
		if (errorMessage.includes(key)) {
			return value;
		}
	}

	// 如果没有匹配，返回原始消息
	return errorMessage;
}

/**
 * 记录登录尝试
 * @param {string} email - 邮箱
 * @param {boolean} success - 是否成功
 * @param {string} failureReason - 失败原因（英文）
 * @param {string} loginMethod - 登录方式
 */
export async function recordLoginAttempt(
	email,
	success,
	failureReason = null,
	loginMethod = "email",
) {
	try {
		// 获取客户端信息
		const userAgent = navigator.userAgent;

		// 将失败原因翻译为中文
		const translatedReason = failureReason ? translateErrorMessage(failureReason) : null;

		// 调用后端接口记录日志（不需要等待结果）
		fetch("/api/log-login-attempt", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				email,
				success,
				failure_reason: translatedReason,
				login_method: loginMethod,
				user_agent: userAgent,
			}),
		}).catch((error) => {
			console.error("记录登录日志失败:", error);
		});
	} catch (error) {
		// 不影响登录流程
		console.error("记录登录尝试失败:", error);
	}
}

/**
 * 使用邮箱密码注册
 * @param {string} email - 邮箱地址
 * @param {string} password - 密码
 * @param {Object} metadata - 用户元数据 (可选)
 * @returns {Promise} 注册结果
 */
export async function signUpWithEmail(email, password, metadata = {}) {
	const { data, error } = await supabase.auth.signUp({
		email,
		password,
		options: {
			data: metadata,
			emailRedirectTo: `${window.location.origin}/dashboard`,
		},
	});

	if (error) throw error;

	const user = data?.user;
	const identities = user?.identities;

	const looksLikeAlreadyRegistered =
		// 常见：user 存在但 identities 为空数组
		(Array.isArray(identities) && identities.length === 0) ||
		// 兜底：既没有 user 也没有 session
		(!data?.user && !data?.session);

	if (looksLikeAlreadyRegistered) {
		throw new ApiError("User already registered", "USER_ALREADY_REGISTERED");
	}

	return data;
}

/**
 * 退出登录
 * @returns {Promise} 退出结果
 */
export async function signOut() {
	const { error } = await supabase.auth.signOut();
	if (error) throw error;
}

/**
 * 获取当前登录用户
 * @returns {Promise} 当前用户信息
 */
export async function getCurrentUser() {
	const {
		data: { user },
		error,
	} = await supabase.auth.getUser();
	if (error) throw error;
	return user;
}

/**
 * 获取当前会话
 * @returns {Promise} 当前会话信息
 */
export async function getSession() {
	const {
		data: { session },
		error,
	} = await supabase.auth.getSession();
	if (error) throw error;
	return session;
}

/**
 * 监听认证状态变化
 * @param {Function} callback - 状态变化回调函数
 * @returns {Object} 订阅对象
 */
export function onAuthStateChange(callback) {
	return supabase.auth.onAuthStateChange(async (event, session) => {
		// 只在真正的登录事件时处理
		// SIGNED_IN: 用户刚刚登录（包括 OAuth 回调）
		if (event === "SIGNED_IN" && session?.user) {
			const user = session.user;
			const loginMethod = user.app_metadata?.provider || "email";

			// 使用更可靠的去重机制
			// 使用 session 的 access_token 的前20个字符作为唯一标识
			// 同一个 session 的 access_token 是固定的
			const sessionId = session.access_token.substring(0, 20);
			const loginEventKey = `login_event_${user.id}_${sessionId}`;

			// 检查是否已经记录过此次登录
			const alreadyLogged = localStorage.getItem(loginEventKey);

			if (!alreadyLogged) {
				// 标记为已记录，防止并发请求导致重复
				localStorage.setItem(loginEventKey, Date.now().toString());

				try {
					// 检查用户是否被禁用
					const response = await fetch("/api/dashboard/user", {
						method: "GET",
						headers: {
							Authorization: `Bearer ${session.access_token}`,
						},
					});

					const result = await response.json();

					if (response.ok && result.code === 200) {
						const userData = result.data;

						// 检查是否被禁用
						if (
							userData.banned ||
							(userData.banned_until && dayjs(userData.banned_until).isAfter(dayjs()))
						) {
							// 记录失败日志
							await recordLoginAttempt(user.email, false, "用户已被禁用", loginMethod);

							// 退出登录
							await supabase.auth.signOut();

							// 通知前端显示错误
							window.dispatchEvent(
								new CustomEvent("auth-error", {
									detail: {
										error: {
											code: "USER_BANNED",
											message: "您的账号已被管理员禁用，请联系管理员",
										},
									},
								}),
							);
							return;
						}

						// 记录成功登录日志
						await recordLoginAttempt(user.email, true, null, loginMethod);

						// 清理超过24小时的旧记录
						cleanupOldLoginEvents();
					} else if (result.code === 403 && result.banned) {
						// 用户被禁用
						await recordLoginAttempt(user.email, false, "用户已被禁用", loginMethod);

						await supabase.auth.signOut();

						window.dispatchEvent(
							new CustomEvent("auth-error", {
								detail: {
									error: {
										code: "USER_BANNED",
										message: "您的账号已被管理员禁用，请联系管理员",
									},
								},
							}),
						);
						return;
					}
				} catch (error) {
					console.error("认证检查失败:", error);
					// 即使检查失败，也记录登录成功（因为 session 已经创建）
					await recordLoginAttempt(user.email, true, null, loginMethod);
				}
			} else {
				console.log(
					"Login already logged for:",
					user.email,
					"at",
					dayjs(parseInt(alreadyLogged)).format("YYYY-MM-DD HH:mm:ss"),
				);
			}
		}

		// 调用原始回调
		if (callback) {
			callback(event, session);
		}
	});
}

/**
 * 清理超过24小时的旧登录事件记录
 */
function cleanupOldLoginEvents() {
	try {
		const now = Date.now();
		const DAY_IN_MS = 24 * 60 * 60 * 1000;

		// 遍历 localStorage 查找登录事件记录
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key && key.startsWith("login_event_")) {
				const timestamp = parseInt(localStorage.getItem(key) || "0", 10);
				if (now - timestamp > DAY_IN_MS) {
					localStorage.removeItem(key);
				}
			}
		}
	} catch (error) {
		console.error("清理旧登录事件记录失败:", error);
	}
}

/**
 * 发送密码重置邮件
 * @param {string} email - 邮箱地址
 * @returns {Promise} 发送结果
 */
export async function resetPassword(email) {
	const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
		redirectTo: `${window.location.origin}/reset-password`,
	});

	if (error) throw error;
	return data;
}

/**
 * 更新用户密码
 * @param {string} newPassword - 新密码
 * @returns {Promise} 更新结果
 */
export async function updatePassword(newPassword) {
	const { data, error } = await supabase.auth.updateUser({
		password: newPassword,
	});

	if (error) throw error;
	return data;
}

/**
 * 更新用户信息
 * @param {Object} updates - 要更新的用户信息
 * @returns {Promise} 更新结果
 */
export async function updateUserProfile(updates) {
	const { data, error } = await supabase.auth.updateUser({
		data: updates,
	});

	if (error) throw error;
	return data;
}
