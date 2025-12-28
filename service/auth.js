/*
 * @Author: zi.yang
 * @Date: 2025-12-27
 * @Description: 认证服务 - Supabase Auth 验证
 * @FilePath: /short-link/service/auth.js
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

/**
 * 验证 Supabase JWT Token
 * @param {string} token - JWT token
 * @returns {Promise<Object>} 用户信息
 */
export async function verifyToken(token) {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error) {
      throw new Error("Token 验证失败: " + error.message);
    }

    if (!user) {
      throw new Error("无效的 token");
    }

    return user;
  } catch (error) {
    console.error("Token 验证失败:", error);
    throw error;
  }
}

/**
 * 获取用户信息
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 用户信息
 */
export async function getUserById(userId) {
  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("获取用户信息失败:", error);
    return null;
  }
}

/**
 * 检查用户是否为管理员
 * 通过查询 user_profiles 表的 is_admin 字段来判断
 *
 * 设置管理员方法：
 * 1. 确保 user_profiles 表有 is_admin 字段：
 *    ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
 *
 * 2. 在 Supabase Table Editor 中勾选用户的 is_admin 字段
 *    或使用 SQL: UPDATE user_profiles SET is_admin = true WHERE id = '用户的UUID';
 *
 * @param {string} userId - 用户 ID
 * @returns {Promise<boolean>} 是否为管理员
 */
export async function isAdmin(userId) {
  if (!userId) return false;

  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("is_admin")
      .eq("id", userId)
      .single();

    if (error) {
      // PGRST116 表示没有找到记录，不是管理员
      if (error.code === "PGRST116") {
        return false;
      }
      console.error("检查管理员权限失败:", error);
      return false;
    }

    return data?.is_admin === true;
  } catch (error) {
    console.error("检查管理员权限异常:", error);
    return false;
  }
}

/**
 * 验证 Token 并检查管理员权限
 * @param {string} token - JWT token
 * @returns {Promise<Object>} 包含用户信息和管理员状态的对象
 */
export async function verifyTokenWithAdminCheck(token) {
  const user = await verifyToken(token);
  const adminStatus = await isAdmin(user.id);

  return {
    ...user,
    isAdmin: adminStatus,
  };
}

/**
 * 要求管理员权限的验证
 * @param {string} token - JWT token
 * @returns {Promise<Object>} 用户信息（仅管理员可通过）
 * @throws {Error} 非管理员抛出错误
 */
export async function requireAdmin(token) {
  const user = await verifyToken(token);
  const adminStatus = await isAdmin(user.id);

  if (!adminStatus) {
    const error = new Error("需要管理员权限");
    error.code = "ADMIN_REQUIRED";
    throw error;
  }

  return {
    ...user,
    isAdmin: true,
  };
}

/**
 * 获取所有用户列表（仅管理员可用）
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} 用户列表
 */
export async function getAllUsers(options = {}) {
  const { page = 1, perPage = 50 } = options;

  try {
    const {
      data: { users },
      error,
    } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      console.error("获取用户列表失败:", error);
      throw error;
    }

    return users || [];
  } catch (error) {
    console.error("获取用户列表异常:", error);
    throw error;
  }
}

/**
 * 根据用户 ID 获取用户信息（仅管理员可用）
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 用户信息
 */
export async function getUserByIdAdmin(userId) {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.admin.getUserById(userId);

    if (error) {
      console.error("获取用户信息失败:", error);
      throw error;
    }

    return user;
  } catch (error) {
    console.error("获取用户信息异常:", error);
    throw error;
  }
}
