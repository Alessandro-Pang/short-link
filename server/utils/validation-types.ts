/*
 * @Author: zi.yang
 * @Date: 2025-12-29 00:00:00
 * @LastEditors: zi.yang
 * @LastEditTime: 2025-12-29 00:00:00
 * @Description: 验证模块共享类型和常量
 * @FilePath: /short-link/api/utils/validation-types
 */

/**
 * 验证配置常量
 */
export const VALIDATION_LIMITS = {
	URL_MAX_LENGTH: 2048,
	URL_MIN_LENGTH: 10,
	TITLE_MAX_LENGTH: 200,
	DESCRIPTION_MAX_LENGTH: 1000,
	SHORT_HASH_LENGTH: 6,
	SHORT_HASH_MAX_LENGTH: 20,
	IP_MAX_LENGTH: 45, // IPv6 最大长度
	USER_AGENT_MAX_LENGTH: 1024,
	REFERRER_MAX_LENGTH: 2048,
	EMAIL_MAX_LENGTH: 254,
	PASSWORD_MIN_LENGTH: 8,
	PASSWORD_MAX_LENGTH: 128,
	BATCH_OPERATION_MAX_ITEMS: 100,
};

/**
 * 验证结果对象
 */
export interface ValidationResult {
	valid: boolean;
	error: string | null;
}

/**
 * 创建验证结果
 * @param {boolean} valid
 * @param {string|null} error
 * @returns {ValidationResult}
 */
export function result(valid: boolean, error: string | null = null): ValidationResult {
	return { valid, error };
}
