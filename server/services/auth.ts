/*
 * @Author: zi.yang
 * @Date: 2025-12-27
 * @LastEditors: zi.yang
 * @LastEditTime: 2025-01-01 00:00:00
 * @Description: 认证服务 - Supabase Auth 验证（使用配置常量）
 * @FilePath: /short-link/service/auth
 */
import supabase from "../database/client.js";
import { USER_CONFIG } from "../config/index.js";

/**
 * 验证 Supabase JWT Token
 * @param {string} token - JWT token
 * @returns {Promise<Object>} 用户信息
 */
export async function verifyToken(token: string) {
  try {
    // 在服务端使用 service role key 创建的 supabase 客户端
    // 可以直接验证用户的 access token
    const { data, error } = await (supabase.auth as any).getUser(token);

    if (error) {
      throw new Error("Token 验证失败: " + error.message);
    }

    if (!data?.user) {
      throw new Error("无效的 token");
    }

    return data.user;
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
export async function requireAdmin(token: string) {
  const user = await verifyToken(token);
  const adminStatus = await isAdmin(user.id);

  if (!adminStatus) {
    const error: Error & { statusCode?: number; code?: string } = new Error(
      "需要管理员权限",
    );
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
export async function getAllUsers(
  options: Partial<{ page: number; perPage: number }> = {},
) {
  const { page = 1, perPage = 50 } = options;

  try {
    const {
      data: { users },
      error,
    } = await (supabase.auth as any).admin.listUsers({
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
export async function getUserByIdAdmin(userId: string) {
  try {
    const {
      data: { user },
      error,
    } = await (supabase.auth as any).admin.getUserById(userId);

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

/**
 * 获取用户的所有身份绑定（从 Supabase Auth 同步）
 * @param {string} userId - 用户 ID
 * @returns {Promise<Array>} 身份绑定列表
 */
export async function getUserIdentities(userId: string) {
  try {
    // 先从 Supabase Auth 获取真实的身份信息
    const {
      data: { user },
      error: userError,
    } = await (supabase.auth as any).admin.getUserById(userId);

    if (userError) {
      console.error("获取用户信息失败:", userError);
      throw userError;
    }

    // 同步到 user_identities 表
    if (user?.identities) {
      for (const identity of user.identities) {
        await supabase.from("user_identities").upsert(
          {
            user_id: userId,
            provider: identity.provider,
            provider_user_id: identity.id,
            provider_email: identity.identity_data?.email || user.email,
            provider_metadata: identity.identity_data || {},
          },
          {
            onConflict: "user_id,provider",
          },
        );
      }
    }

    // 从 user_identities 表读取
    const { data, error } = await supabase
      .from("user_identities")
      .select("*")
      .eq("user_id", userId)
      .order("linked_at", { ascending: true });

    if (error) {
      console.error("获取身份绑定失败:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("获取身份绑定异常:", error);
    throw error;
  }
}

/**
 * 绑定新的身份认证方式
 * @param {string} userId - 用户 ID
 * @param {string} provider - 认证提供商 (email, github, google)
 * @param {Object} identityData - 身份数据
 * @returns {Promise<Object>} 绑定结果
 */
export async function linkIdentity(
  userId: string,
  provider: string,
  identityData: {
    provider: string;
    provider_user_id: string;
    provider_email?: string;
    provider_metadata?: Record<string, unknown>;
  },
) {
  try {
    const {
      provider_user_id,
      provider_email,
      provider_metadata = {},
    } = identityData;

    // 检查是否已经绑定了该提供商
    const { data: existing } = await supabase
      .from("user_identities")
      .select("id")
      .eq("user_id", userId)
      .eq("provider", provider)
      .single();

    if (existing) {
      throw new Error(`已经绑定了 ${provider} 账号`);
    }

    // 检查该第三方账号是否已被其他用户绑定
    const { data: usedByOther } = await supabase
      .from("user_identities")
      .select("id")
      .eq("provider", provider)
      .eq("provider_user_id", provider_user_id)
      .neq("user_id", userId)
      .single();

    if (usedByOther) {
      throw new Error(`该 ${provider} 账号已被其他用户绑定`);
    }

    // 创建绑定记录
    const { data, error } = await supabase
      .from("user_identities")
      .insert({
        user_id: userId,
        provider,
        provider_user_id,
        provider_email,
        provider_metadata,
      })
      .select()
      .single();

    if (error) {
      console.error("绑定身份失败:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("绑定身份异常:", error);
    throw error;
  }
}

/**
 * 解绑身份认证方式
 * @param {string} userId - 用户 ID
 * @param {string} provider - 认证提供商 (email, github, google)
 * @returns {Promise<Object>} 解绑结果
 */
export async function unlinkIdentity(userId: string, provider: string) {
  try {
    // 检查用户至少保留一种登录方式
    const identities = await getUserIdentities(userId);

    if (identities.length <= 1) {
      throw new Error("至少需要保留一种登录方式");
    }

    // 删除绑定记录
    const { error } = await supabase
      .from("user_identities")
      .delete()
      .eq("user_id", userId)
      .eq("provider", provider);

    if (error) {
      console.error("解绑身份失败:", error);
      throw error;
    }

    return { success: true, message: `已成功解绑 ${provider} 账号` };
  } catch (error) {
    console.error("解绑身份异常:", error);
    throw error;
  }
}

/**
 * 删除用户账号（简化版，直接删除）
 * @param {string} userId - 用户 ID
 * @param {string} reason - 删除原因（可选，仅用于日志）
 * @returns {Promise<Object>} 删除结果
 */
export async function deleteUserAccount(
  userId: string,
  reason: string | null = null,
) {
  try {
    // 使用 Supabase Admin API 删除用户
    // 这会自动触发级联删除（user_identities, user_profiles, links 等）
    const { error } = await (supabase.auth as any).admin.deleteUser(userId);

    if (error) {
      console.error("删除账号失败:", error);
      throw error;
    }

    // 可选：记录删除原因到日志
    if (reason) {
      console.log(`用户 ${userId} 删除账号，原因: ${reason}`);
    }

    return { success: true, message: "账号已成功删除" };
  } catch (error) {
    console.error("删除账号异常:", error);
    throw error;
  }
}

/**
 * 创建新用户（管理员专用）
 * @param {Object} userData - 用户数据
 * @returns {Promise<Object>} 创建结果
 */
export async function createUser(userData: {
  email: string;
  password: string;
  [key: string]: unknown;
}) {
  try {
    const { email, password, user_metadata = {} } = userData;

    if (!email || !password) {
      throw new Error("邮箱和密码是必填项");
    }

    // 创建用户
    const {
      data: { user },
      error,
    } = await (supabase.auth as any).admin.createUser({
      email,
      password,
      email_confirm: true, // 自动确认邮箱
      user_metadata,
    });

    if (error) {
      console.error("创建用户失败:", error);
      throw error;
    }

    return { success: true, user, message: "用户创建成功" };
  } catch (error) {
    console.error("创建用户异常:", error);
    throw error;
  }
}

/**
 * 更新用户信息（管理员专用）
 * @param {string} userId - 用户 ID
 * @param {Object} updates - 更新数据
 * @returns {Promise<Object>} 更新结果
 */
export async function updateUser(
  userId: string,
  updates: {
    email?: string;
    password?: string;
    user_metadata?: Record<string, unknown>;
    [key: string]: unknown;
  },
) {
  try {
    const {
      data: { user },
      error,
    } = await (supabase.auth as any).admin.updateUserById(userId, updates);

    if (error) {
      console.error("更新用户失败:", error);
      throw error;
    }

    // 如果更新了 is_admin 字段，同时更新 user_profiles 表
    const appMetadata = updates.app_metadata as
      | { is_admin?: boolean }
      | undefined;
    if (appMetadata?.is_admin !== undefined) {
      const { error: profileError } = await supabase
        .from("user_profiles")
        .upsert({
          id: userId,
          is_admin: appMetadata.is_admin,
        });

      if (profileError) {
        console.error("更新用户 profile 失败:", profileError);
      }
    }

    return { success: true, user, message: "用户信息更新成功" };
  } catch (error) {
    console.error("更新用户异常:", error);
    throw error;
  }
}

/**
 * 重置用户密码（管理员专用）
 * @param {string} userId - 用户 ID
 * @param {string} newPassword - 新密码
 * @returns {Promise<Object>} 重置结果
 */
export async function resetUserPassword(userId: string, newPassword: string) {
  try {
    if (!newPassword || newPassword.length < 6) {
      throw new Error("密码长度至少为 6 位");
    }

    const {
      data: { user },
      error,
    } = await (supabase.auth as any).admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) {
      console.error("重置密码失败:", error);
      throw error;
    }

    return { success: true, user, message: "密码重置成功" };
  } catch (error) {
    console.error("重置密码异常:", error);
    throw error;
  }
}

/**
 * 启用或禁用用户（管理员专用）
 * @param {string} userId - 用户 ID
 * @param {boolean} banned - 是否禁用
 * @returns {Promise<Object>} 操作结果
 */
export async function toggleUserStatus(userId: string, banned: boolean) {
  try {
    const {
      data: { user },
      error,
    } = await (supabase.auth as any).admin.updateUserById(userId, {
      ban_duration: banned
        ? USER_CONFIG.BAN_DURATION_HOURS
        : USER_CONFIG.BAN_NONE,
    });

    if (error) {
      console.error("切换用户状态失败:", error);
      throw error;
    }

    return {
      success: true,
      user,
      message: banned ? "用户已禁用" : "用户已启用",
    };
  } catch (error) {
    console.error("切换用户状态异常:", error);
    throw error;
  }
}

/**
 * 获取用户详细信息（包含 profile 和统计数据）
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 用户详细信息
 */
export async function getUserDetails(userId: string) {
  try {
    // 获取 Auth 用户信息
    const {
      data: { user },
      error: authError,
    } = await (supabase.auth as any).admin.getUserById(userId);

    if (authError) {
      throw authError;
    }

    // 获取 Profile 信息
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    // 获取用户的链接统计
    const { count: linksCount } = await supabase
      .from("links")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    // 获取总点击次数
    const { data: clickStats } = await supabase
      .from("links")
      .select("click_count")
      .eq("user_id", userId);

    const totalClicks =
      clickStats?.reduce((sum, link) => sum + (link.click_count || 0), 0) || 0;

    return {
      ...user,
      profile,
      stats: {
        linksCount: linksCount || 0,
        totalClicks,
      },
    };
  } catch (error) {
    console.error("获取用户详情失败:", error);
    throw error;
  }
}

/**
 * 绑定用户身份（别名方法，用于向后兼容）
 * @param {string} userId - 用户 ID
 * @param {Object} identityData - 身份数据
 * @returns {Promise<Object>} 绑定结果
 */
export async function bindUserIdentity(
  userId: string,
  identityData: {
    provider: string;
    provider_user_id: string;
    provider_email?: string;
    provider_metadata?: Record<string, unknown>;
  },
) {
  const { provider, provider_user_id, provider_email, provider_metadata } =
    identityData;
  return linkIdentity(userId, provider, {
    provider,
    provider_user_id,
    provider_email,
    provider_metadata,
  });
}

/**
 * 解绑用户身份（别名方法，用于向后兼容）
 * @param {string} userId - 用户 ID
 * @param {string} provider - 认证提供商
 * @returns {Promise<Object>} 解绑结果
 */
export async function unbindUserIdentity(userId: string, provider: string) {
  return unlinkIdentity(userId, provider);
}
