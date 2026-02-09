/**
 * 消息提示工具
 * 使用 Arco Design 的 Message 统一全局提示能力
 *
 * 注意：
 * - 该工具只依赖 Arco 的 Message，不再依赖 autolog 或 window 对象
 * - type 入参兼容历史的 "warn" 写法，并映射到 Arco 的 "warning"
 */

import { Message } from "@arco-design/web-vue";

/**
 * 显示消息提示
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型 (success, error, info, warning, warn)
 * @param {number} duration - 显示时长(毫秒)
 */
export function showMessage(message, type = "info", duration = 3000) {
	const content = typeof message === "string" ? message : String(message);

	const normalizedType = type === "warn" ? "warning" : type;

	switch (normalizedType) {
		case "success":
			Message.success({ content, duration });
			break;
		case "error":
			Message.error({ content, duration });
			break;
		case "warning":
			Message.warning({ content, duration });
			break;
		default:
			Message.info({ content, duration });
			break;
	}
}

/**
 * 成功消息
 * @param {string} message - 消息内容
 * @param {number} duration - 显示时长(毫秒)
 */
export function showSuccess(message, duration = 3000) {
	showMessage(message, "success", duration);
}

/**
 * 错误消息
 * @param {string} message - 消息内容
 * @param {number} duration - 显示时长(毫秒)
 */
export function showError(message, duration = 3000) {
	showMessage(message, "error", duration);
}

/**
 * 信息消息
 * @param {string} message - 消息内容
 * @param {number} duration - 显示时长(毫秒)
 */
export function showInfo(message, duration = 3000) {
	showMessage(message, "info", duration);
}

/**
 * 警告消息
 * @param {string} message - 消息内容
 * @param {number} duration - 显示时长(毫秒)
 */
export function showWarning(message, duration = 3000) {
	showMessage(message, "warning", duration);
}

export default {
	showMessage,
	showSuccess,
	showError,
	showInfo,
	showWarning,
};
