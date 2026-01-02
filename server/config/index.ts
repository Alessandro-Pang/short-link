/*
 * @Author: zi.yang
 * @Date: 2025-01-01 00:00:00
 * @LastEditors: zi.yang
 * @LastEditTime: 2025-12-29 00:00:00
 * @Description: 配置管理模块 - 集中管理所有配置常量
 * @FilePath: /short-link/server/config/index.ts
 */

/**
 * 环境变量
 */
export const ENV = {
  NODE_ENV: process.env.NODE_ENV || "development",
  IS_PRODUCTION: process.env.NODE_ENV !== "development",
  IS_DEVELOPMENT: process.env.NODE_ENV === "development",
  PORT: Number.parseInt(process.env.PORT ?? "3000", 10),
} as const;

const ALLOWED_ORIGINS =
  process.env.ALLOWED_ORIGINS?.split(",").filter(Boolean) || [];

/**
 * CORS 配置
 */
export const CORS_CONFIG = {
  // 允许的域名列表
  ALLOWED_ORIGINS: ENV.IS_PRODUCTION
    ? ALLOWED_ORIGINS
    : [
        ...ALLOWED_ORIGINS,
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
      ],
  // 允许的请求方法
  METHODS: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"] as const,
  // 允许的请求头
  ALLOWED_HEADERS: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
  ] as const,
  // 暴露给客户端的响应头
  EXPOSED_HEADERS: [
    "X-RateLimit-Limit",
    "X-RateLimit-Remaining",
    "X-RateLimit-Reset",
  ] as const,
  // 预检请求缓存时间（秒）
  MAX_AGE: 86400,
  // 是否允许携带凭证
  CREDENTIALS: true,
} as const;

/**
 * 速率限制配置
 */
export const RATE_LIMIT_CONFIG = {
  // 全局速率限制
  GLOBAL: {
    MAX: 100,
    TIME_WINDOW: "1 minute" as const,
  },
  // 创建短链接接口限制
  CREATE_LINK: {
    MAX: 10,
    TIME_WINDOW: "1 minute" as const,
  },
  // 登录接口限制
  LOGIN: {
    MAX: 5,
    TIME_WINDOW: "1 minute" as const,
  },
  // 管理员接口限制
  ADMIN: {
    MAX: 50,
    TIME_WINDOW: "1 minute" as const,
  },
  // Dashboard 接口限制
  DASHBOARD: {
    MAX: 100,
    TIME_WINDOW: "1 minute" as const,
  },
  // 批量操作限制
  BATCH: {
    MAX: 20,
    TIME_WINDOW: "1 minute" as const,
  },
  // 写操作限制
  WRITE: {
    MAX: 30,
    TIME_WINDOW: "1 minute" as const,
  },
  // 重定向接口限制（更宽松）
  REDIRECT: {
    MAX: 200,
    TIME_WINDOW: "1 minute" as const,
  },
  // 是否添加响应头
  ADD_HEADERS: true,
  // 是否添加 Retry-After 头
  ADD_RETRY_AFTER_HEADER: true,
} as const;

/**
 * 缓存配置（秒）
 */
export const CACHE_CONFIG = {
  // 过期时间选项缓存时间
  EXPIRATION_OPTIONS_TTL: 300, // 5 分钟
  // 用户信息缓存时间
  USER_INFO_TTL: 60, // 1 分钟
  // 管理员状态缓存时间
  ADMIN_STATUS_TTL: 60, // 1 分钟
  // 热门短链接缓存时间
  HOT_LINKS_TTL: 60, // 1 分钟
  // 统计数据缓存时间
  STATS_TTL: 30, // 30 秒
  // 全局缓存默认 TTL
  DEFAULT_TTL: 300, // 5 分钟
  // 最大缓存条目数
  MAX_SIZE: 10000,
  // 清理间隔（毫秒）
  CLEANUP_INTERVAL: 60000, // 1 分钟
} as const;

/**
 * 短链接配置
 */
export const LINK_CONFIG = {
  // 短链接哈希长度
  HASH_LENGTH: 6,
  // 最大哈希生成重试次数
  MAX_HASH_RETRIES: 10,
  // 有效的重定向类型
  VALID_REDIRECT_TYPES: [301, 302, 307, 308] as const,
  // 默认重定向类型
  DEFAULT_REDIRECT_TYPE: 302,
  // 有效的设备类型
  VALID_DEVICE_TYPES: ["mobile", "tablet", "desktop"] as const,
  // 最大点击数上限
  MAX_CLICKS_LIMIT: 1000000000, // 10亿
} as const;

/**
 * 验证限制配置
 */
export const VALIDATION_LIMITS = {
  // URL 相关
  URL_MAX_LENGTH: 2048,
  URL_MIN_LENGTH: 10,
  // 文本相关
  TITLE_MAX_LENGTH: 200,
  DESCRIPTION_MAX_LENGTH: 1000,
  // 短链接哈希
  SHORT_HASH_MIN_LENGTH: 4,
  SHORT_HASH_MAX_LENGTH: 16,
  // 网络相关
  IP_MAX_LENGTH: 45, // IPv6 最大长度
  USER_AGENT_MAX_LENGTH: 1024,
  REFERRER_MAX_LENGTH: 2048,
  // 用户认证
  EMAIL_MAX_LENGTH: 254,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  // 批量操作
  BATCH_OPERATION_MAX_ITEMS: 100,
  IP_LIST_MAX_ITEMS: 100,
  // 分页
  PAGE_SIZE_MIN: 1,
  PAGE_SIZE_MAX: 100,
  PAGE_SIZE_DEFAULT: 10,
} as const;

/**
 * 用户管理配置
 */
export const USER_CONFIG = {
  // 用户禁用时长（小时）- 100年
  BAN_DURATION_HOURS: "876000h" as const,
  // 禁用解除标识
  BAN_NONE: "none" as const,
  // 登录日志保留天数
  LOGIN_LOG_RETENTION_DAYS: 90,
  // 失败登录尝试告警阈值
  FAILED_LOGIN_ALERT_THRESHOLD: 3,
  // 失败登录监控时间窗口（小时）
  FAILED_LOGIN_WINDOW_HOURS: 24,
} as const;

/**
 * 安全配置
 */
export const SECURITY_CONFIG = {
  // 危险端口列表（SSRF 保护）
  DANGEROUS_PORTS: [
    22, 23, 25, 110, 143, 445, 3306, 5432, 6379, 27017,
  ] as const,
  // 禁止的协议
  BLOCKED_PROTOCOLS: [
    "javascript",
    "vbscript",
    "data",
    "file",
    "ftp",
    "mailto",
    "tel",
  ] as const,
  // 云服务元数据端点
  BLOCKED_HOSTNAMES: [
    "metadata.google.internal",
    "metadata.goog",
    "169.254.169.254",
    "metadata.azure.com",
    "100.100.100.200",
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "[::1]",
  ] as const,
} as const;

interface ErrorCode {
  code: number;
  msg: string;
}

/**
 * 错误码定义
 */
export const ERROR_CODES: Record<string, ErrorCode> = {
  // 通用错误
  SUCCESS: { code: 200, msg: "success" },
  CREATED: { code: 201, msg: "Created" },
  BAD_REQUEST: { code: 400, msg: "Bad Request" },
  UNAUTHORIZED: { code: 401, msg: "Unauthorized" },
  FORBIDDEN: { code: 403, msg: "Forbidden" },
  NOT_FOUND: { code: 404, msg: "Not Found" },
  CONFLICT: { code: 409, msg: "Conflict" },
  GONE: { code: 410, msg: "Gone" },
  RATE_LIMITED: { code: 429, msg: "Too Many Requests" },
  INTERNAL_ERROR: { code: 500, msg: "Internal Server Error" },
  SERVICE_UNAVAILABLE: { code: 503, msg: "Service Unavailable" },

  // 业务错误
  INVALID_URL: { code: 400, msg: "URL 格式不正确" },
  INVALID_PARAMS: { code: 400, msg: "请求参数错误" },
  INVALID_TOKEN: { code: 401, msg: "无效的 Token" },
  TOKEN_EXPIRED: { code: 401, msg: "Token 已过期" },
  ADMIN_REQUIRED: { code: 403, msg: "需要管理员权限" },
  USER_BANNED: { code: 403, msg: "用户已被禁用" },
  ACCESS_DENIED: { code: 403, msg: "访问被拒绝" },
  LINK_NOT_FOUND: { code: 404, msg: "短链接不存在" },
  USER_NOT_FOUND: { code: 404, msg: "用户不存在" },
  DUPLICATE_LINK: { code: 409, msg: "您已创建过该链接的短链接" },
  LINK_EXPIRED: { code: 410, msg: "链接已过期" },
  LINK_DISABLED: { code: 410, msg: "链接已被禁用" },
  LINK_MAX_CLICKS: { code: 410, msg: "链接已达到最大访问次数" },
  SSRF_BLOCKED: { code: 400, msg: "不允许使用内网地址或私有 IP" },
};

/**
 * 日志级别
 */
export const LOG_LEVELS = {
  DEBUG: "debug",
  INFO: "info",
  WARN: "warn",
  ERROR: "error",
  FATAL: "fatal",
} as const;

/**
 * API 版本
 */
export const API_VERSION = "1.0.0";

/**
 * 获取完整配置
 */
export function getConfig() {
  return {
    env: ENV,
    cors: CORS_CONFIG,
    rateLimit: RATE_LIMIT_CONFIG,
    cache: CACHE_CONFIG,
    link: LINK_CONFIG,
    validation: VALIDATION_LIMITS,
    user: USER_CONFIG,
    security: SECURITY_CONFIG,
    errorCodes: ERROR_CODES,
    logLevels: LOG_LEVELS,
    apiVersion: API_VERSION,
  };
}

export default getConfig();
