/*
 * @Author: zi.yang
 * @Date: 2025-12-28
 * @LastEditors: zi.yang
 * @LastEditTime: 2025-01-01 00:00:00
 * @Description: 用户管理服务（管理员专用）
 * @FilePath: /short-link/service/user-management.js
 */
import supabase from "./db.js";

/**
 * 获取所有用户列表（管理员专用）
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} 用户列表
 */
export async function getAllUsers(options = {}) {
  try {
    const { page = 1, perPage = 50 } = options;

    // 从 auth.users 获取用户列表
    const { data: authData, error: authError } =
      await supabase.auth.admin.listUsers({
        page,
        perPage,
      });

    if (authError) {
      console.error("获取用户列表失败:", authError);
      throw authError;
    }

    // 获取用户的 profile 信息
    const userIds = authData.users.map((u) => u.id);
    const { data: profiles, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .in("id", userIds);

    if (profileError && profileError.code !== "PGRST116") {
      console.error("获取用户 profiles 失败:", profileError);
    }

    // 合并用户数据
    const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);
    const users = authData.users.map((user) => {
      const profile = profileMap.get(user.id) || {};
      // Supabase 中用户被封禁时，banned_until 字段会有值
      const isBanned = user.banned_until
        ? new Date(user.banned_until) > new Date()
        : false;

      // 移除用不到的敏感信息
      if (user.identities) {
        user.identities = undefined;
      }
      return {
        banned: isBanned,
        ...user,
        ...profile,
        is_admin: profile.is_admin === true,
      };
    });

    return {
      users,
      total: authData.users.length,
      page,
      perPage,
    };
  } catch (error) {
    console.error("获取所有用户列表失败:", error);
    throw error;
  }
}

/**
 * 获取用户详细信息（管理员专用）
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 用户详情
 */
export async function getUserDetails(userId) {
  try {
    // 从 auth.users 获取用户基本信息
    const { data: authData, error: authError } =
      await supabase.auth.admin.getUserById(userId);

    if (authError) {
      console.error("获取用户信息失败:", authError);
      throw authError;
    }

    // 获取 profile 信息
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      console.error("获取用户 profile 失败:", profileError);
    }

    // 获取用户的链接统计
    const { data: links, error: linksError } = await supabase
      .from("links")
      .select("id, click_count")
      .eq("user_id", userId);

    if (linksError) {
      console.error("获取用户链接统计失败:", linksError);
    }

    const linkCount = links?.length || 0;
    const totalClicks =
      links?.reduce((sum, l) => sum + (l.click_count || 0), 0) || 0;

    // Supabase 中用户被封禁时，banned_until 字段会有值
    const isBanned = authData.user.banned_until
      ? new Date(authData.user.banned_until) > new Date()
      : false;

    return {
      id: authData.user.id,
      email: authData.user.email,
      created_at: authData.user.created_at,
      last_sign_in_at: authData.user.last_sign_in_at,
      banned: isBanned,
      banned_until: authData.user.banned_until,
      ...(profile || {}), // 先展开 profile
      is_admin: profile?.is_admin === true, // 明确设置 is_admin，确保是布尔值
      stats: {
        total_links: linkCount,
        total_clicks: totalClicks,
      },
    };
  } catch (error) {
    console.error("获取用户详情失败:", error);
    throw error;
  }
}

/**
 * 创建新用户（管理员专用）
 * @param {Object} userData - 用户数据
 * @returns {Promise<Object>} 创建结果
 */
export async function createUser(userData) {
  try {
    const { email, password } = userData;

    if (!email || !password) {
      throw new Error("邮箱和密码不能为空");
    }

    // 创建用户
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      console.error("创建用户失败:", error);
      throw error;
    }

    return {
      id: data.user.id,
      email: data.user.email,
      created_at: data.user.created_at,
    };
  } catch (error) {
    console.error("创建用户失败:", error);
    throw error;
  }
}

/**
 * 更新用户信息（管理员专用）
 * @param {string} userId - 用户 ID
 * @param {Object} updates - 更新数据
 * @returns {Promise<Object>} 更新结果
 */
export async function updateUser(userId, updates) {
  try {
    const allowedAuthFields = ["email", "password"];
    const allowedProfileFields = ["is_admin"];

    // 分离 auth 字段和 profile 字段
    const authUpdates = {};
    const profileUpdates = {};

    for (const [key, value] of Object.entries(updates)) {
      if (allowedAuthFields.includes(key) && value !== undefined) {
        authUpdates[key] = value;
      } else if (allowedProfileFields.includes(key) && value !== undefined) {
        profileUpdates[key] = value;
      }
    }

    // 更新 auth 信息
    if (Object.keys(authUpdates).length > 0) {
      const { error: authError } = await supabase.auth.admin.updateUserById(
        userId,
        authUpdates,
      );

      if (authError) {
        console.error("更新用户 auth 信息失败:", authError);
        throw authError;
      }
    }

    // 更新 profile 信息
    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileError } = await supabase
        .from("user_profiles")
        .upsert({ id: userId, ...profileUpdates });

      if (profileError) {
        console.error("更新用户 profile 失败:", profileError);
        throw profileError;
      }
    }

    return { success: true };
  } catch (error) {
    console.error("更新用户信息失败:", error);
    throw error;
  }
}

/**
 * 删除用户（管理员专用）
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 删除结果
 */
export async function deleteUser(userId) {
  try {
    // 删除用户（这会级联删除相关数据）
    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      console.error("删除用户失败:", error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error("删除用户失败:", error);
    throw error;
  }
}

/**
 * 重置用户密码（管理员专用）
 * @param {string} userId - 用户 ID
 * @param {string} password - 新密码
 * @returns {Promise<Object>} 重置结果
 */
export async function resetPassword(userId, password) {
  try {
    if (!password) {
      throw new Error("密码不能为空");
    }

    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password,
    });

    if (error) {
      console.error("重置密码失败:", error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error("重置密码失败:", error);
    throw error;
  }
}

/**
 * 切换用户封禁状态（管理员专用）
 * @param {string} userId - 用户 ID
 * @param {boolean} banned - 是否封禁
 * @returns {Promise<Object>} 更新结果
 */
export async function toggleBanStatus(userId, banned) {
  try {
    if (typeof banned !== "boolean") {
      throw new Error("banned 必须是布尔值");
    }

    const { error } = await supabase.auth.admin.updateUserById(userId, {
      ban_duration: banned ? "876000h" : "none", // 100年 或 none
    });

    if (error) {
      console.error("更新用户封禁状态失败:", error);
      throw error;
    }

    return { success: true, banned };
  } catch (error) {
    console.error("更新用户封禁状态失败:", error);
    throw error;
  }
}
