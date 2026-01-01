/**
 * 日期时间工具函数
 * 统一使用 dayjs 处理所有日期时间操作
 */
import dayjs from "dayjs";

/**
 * 格式化日期时间
 * @param dateString 日期字符串或时间戳
 * @param format 格式化模板，默认 "YYYY-MM-DD HH:mm:ss"
 * @returns 格式化后的日期字符串
 */
export function formatDate(
  dateString: string | number | Date | null | undefined,
  format: string = "YYYY-MM-DD HH:mm:ss"
): string {
  if (!dateString) return "-";
  return dayjs(dateString).format(format);
}

/**
 * 检查日期是否已过期（是否在当前时间之前）
 * @param dateString 日期字符串
 * @returns 是否已过期
 */
export function isExpired(dateString: string | null | undefined): boolean {
  if (!dateString) return false;
  return dayjs(dateString).isBefore(dayjs());
}

/**
 * 检查日期是否在将来
 * @param dateString 日期字符串
 * @returns 是否在将来
 */
export function isFuture(dateString: string | null | undefined): boolean {
  if (!dateString) return false;
  return dayjs(dateString).isAfter(dayjs());
}

/**
 * 获取当前时间的 ISO 字符串
 * @returns ISO 格式的当前时间
 */
export function now(): string {
  return dayjs().toISOString();
}

/**
 * 计算相对时间（多久之前/之后）
 * @param dateString 日期字符串
 * @returns 相对时间描述
 */
export function timeAgo(dateString: string | null | undefined): string {
  if (!dateString) return "-";
  
  const date = dayjs(dateString);
  const now = dayjs();
  const diffInSeconds = now.diff(date, "second");
  
  if (diffInSeconds < 60) {
    return "刚刚";
  } else if (diffInSeconds < 3600) {
    return `${Math.floor(diffInSeconds / 60)}分钟前`;
  } else if (diffInSeconds < 86400) {
    return `${Math.floor(diffInSeconds / 3600)}小时前`;
  } else if (diffInSeconds < 604800) {
    return `${Math.floor(diffInSeconds / 86400)}天前`;
  } else {
    return formatDate(dateString, "YYYY-MM-DD");
  }
}
