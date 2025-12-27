/**
 * 认证服务模块
 * 基于 Supabase Auth 实现用户认证功能
 */

import { supabase } from "./supabase";

/**
 * 使用 GitHub 登录
 * @returns {Promise} 登录结果
 */
export async function signInWithGithub() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${window.location.origin}/dashboard`,
    },
  });

  if (error) throw error;
  return data;
}

/**
 * 使用 Google 登录
 * @returns {Promise} 登录结果
 */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/dashboard`,
    },
  });

  if (error) throw error;
  return data;
}

/**
 * 使用邮箱密码登录
 * @param {string} email - 邮箱地址
 * @param {string} password - 密码
 * @returns {Promise} 登录结果
 */
export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
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
    const err = new Error("User already registered");
    err.code = "USER_ALREADY_REGISTERED";
    throw err;
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
  return supabase.auth.onAuthStateChange(callback);
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
