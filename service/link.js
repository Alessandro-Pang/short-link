/*
 * @Author: zi.yang
 * @Date: 2024-12-11 19:47:42
 * @LastEditors: zi.yang
 * @LastEditTime: 2025-12-27 21:00:00
 * @Description: 短链接服务 - 集成 Supabase
 * @FilePath: /short-link/service/link.js
 */
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

/**
 * 生成短链接哈希
 * @param {string} url - 原始 URL
 * @returns {string} 哈希值
 */
function generatorHash(url) {
  const md5 = crypto.createHash("md5");
  const hex = md5.update(url + Date.now()).digest("hex");
  return hex.slice(8, 24).substring(0, 6);
}

/**
 * 通过短链接哈希获取原始 URL
 * @param {string} short - 短链接哈希
 * @returns {Promise} 链接信息
 */
export async function getUrl(short) {
  try {
    const { data, error } = await supabase
      .from("links")
      .select("*")
      .eq("short", short)
      .eq("is_active", true)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { data: null, error: { message: "短链接不存在" } };
      }
      return { data: null, error };
    }

    // 检查是否过期
    if (data.expiration_date && new Date(data.expiration_date) < new Date()) {
      return { data: null, error: { message: "链接已过期" } };
    }

    // 检查点击次数限制
    if (data.max_clicks && data.click_count >= data.max_clicks) {
      return { data: null, error: { message: "链接已达到最大点击次数" } };
    }

    return { data, error: null };
  } catch (error) {
    console.error("获取短链接失败:", error);
    return { data: null, error };
  }
}

/**
 * 创建短链接
 * @param {string} link - 原始链接
 * @param {string|null} userId - 用户 ID（可选）
 * @returns {Promise} 创建结果
 */
export async function addUrl(link, userId = null) {
  try {
    // 生成短链接哈希
    const short = generatorHash(link);

    // 检查是否已存在
    const { data: existing } = await supabase
      .from("links")
      .select("*")
      .eq("short", short)
      .maybeSingle();

    if (existing) {
      // 如果已存在相同哈希，重新生成
      return addUrl(link, userId);
    }

    // 插入新链接
    const { data, error } = await supabase
      .from("links")
      .insert([
        {
          link,
          short,
          user_id: userId,
          is_active: true,
          click_count: 0,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("创建短链接失败:", error);
      // 如果是唯一性冲突，重试
      if (error.code === "23505") {
        return addUrl(link, userId);
      }
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error("创建短链接异常:", error);
    return { data: null, error };
  }
}

/**
 * 记录链接访问
 * @param {number} linkId - 链接 ID
 * @param {Object} accessInfo - 访问信息
 * @returns {Promise}
 */
export async function logAccess(linkId, accessInfo) {
  try {
    await supabase.from("link_access_logs").insert([
      {
        link_id: linkId,
        ip_address: accessInfo.ip_address,
        user_agent: accessInfo.user_agent,
        referrer: accessInfo.referrer,
      },
    ]);

    // 触发器会自动更新 click_count
  } catch (error) {
    console.error("记录访问日志失败:", error);
    // 不抛出错误，因为日志记录失败不应影响重定向
  }
}
