/*
 * @Author: zi.yang
 * @Date: 2025-12-28
 * @Description: 账号绑定管理服务
 * @FilePath: /short-link/src/services/account.js
 */
import { fetchApi } from "./request.js";
import { supabase } from "./supabase.js";

/**
 * 获取当前用户的所有身份绑定
 * @returns {Promise<Array>} 身份绑定列表
 */
export async function getUserIdentities() {
  try {
    const response = await fetchApi("/api/dashboard/user/identities", {
      method: "GET",
    });

    if (response.code !== 200) {
      throw new Error(response.msg || "获取身份绑定失败");
    }

    return response.data;
  } catch (error) {
    console.error("获取身份绑定失败:", error);
    throw error;
  }
}

/**
 * 绑定邮箱账号
 * @param {string} email - 邮箱地址
 * @param {string} password - 邮箱密码
 * @returns {Promise<Object>} 绑定结果
 */
export async function linkEmailAccount(email, password) {
  try {
    // 使用 Supabase 更新邮箱
    const {
      data: { user },
      error,
    } = await supabase.auth.updateUser({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    // 调用后端 API 创建绑定记录
    const response = await fetchApi("/api/dashboard/user/identities", {
      method: "POST",
      body: {
        provider: "email",
        provider_user_id: user.id,
        provider_email: email,
      },
    });

    if (response.code !== 200) {
      throw new Error(response.msg || "绑定邮箱失败");
    }

    return response.data;
  } catch (error) {
    console.error("绑定邮箱失败:", error);
    throw error;
  }
}

/**
 * 绑定 GitHub 账号
 * @returns {Promise<Object>} 绑定结果
 */
export async function linkGithubAccount() {
  try {
    // 保存当前路径，用于绑定后返回
    sessionStorage.setItem(
      "oauth_redirect_after_link",
      window.location.pathname,
    );

    // 启动 OAuth 流程（不使用 linkIdentity，而是直接 OAuth 登录）
    // 用户授权后，后端会自动检测并创建绑定记录
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/dashboard/profile`,
        skipBrowserRedirect: false,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error("绑定 GitHub 失败:", error);
    throw error;
  }
}

/**
 * 绑定 Google 账号
 * @returns {Promise<Object>} 绑定结果
 */
export async function linkGoogleAccount() {
  try {
    // 保存当前路径，用于绑定后返回
    sessionStorage.setItem(
      "oauth_redirect_after_link",
      window.location.pathname,
    );

    // 启动 OAuth 流程
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard/profile`,
        skipBrowserRedirect: false,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error("绑定 Google 失败:", error);
    throw error;
  }
}

/**
 * 处理 OAuth 绑定回调
 * @param {string} provider - 提供商（github/google）
 * @returns {Promise<Object>} 绑定结果
 */
export async function handleOAuthLinkCallback(provider) {
  try {
    // 获取当前会话（包含新绑定的身份信息）
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      throw new Error("无法获取会话信息");
    }

    // 从 session 中提取 OAuth 信息
    const user = session.user;
    const identities = user.identities || [];
    const targetIdentity = identities.find((id) => id.provider === provider);

    if (!targetIdentity) {
      throw new Error(`未找到 ${provider} 身份信息`);
    }

    // 调用后端 API 创建绑定记录
    const response = await fetchApi("/api/dashboard/user/identities", {
      method: "POST",
      body: {
        provider,
        provider_user_id: targetIdentity.id,
        provider_email: targetIdentity.email || user.email,
        provider_metadata: targetIdentity.identity_data || {},
      },
    });

    if (response.code !== 200) {
      throw new Error(response.msg || "绑定失败");
    }

    return response.data;
  } catch (error) {
    console.error("处理 OAuth 绑定回调失败:", error);
    throw error;
  }
}

/**
 * 解绑身份认证方式
 * @param {string} provider - 认证提供商（email/github/google）
 * @returns {Promise<Object>} 解绑结果
 */
export async function unlinkIdentity(provider) {
  try {
    const response = await fetchApi(
      `/api/dashboard/user/identities/${provider}`,
      {
        method: "DELETE",
      },
    );

    if (response.code !== 200) {
      throw new Error(response.msg || "解绑失败");
    }

    // 如果是 OAuth 提供商，还需要调用 Supabase 解绑
    if (provider === "github" || provider === "google") {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const identity = user.identities?.find(
          (id) => id.provider === provider,
        );
        if (identity) {
          await supabase.auth.unlinkIdentity(identity);
        }
      }
    }

    return response.data;
  } catch (error) {
    console.error("解绑身份失败:", error);
    throw error;
  }
}

/**
 * 删除用户账号
 * @param {string} reason - 删除原因（可选）
 * @returns {Promise<Object>} 删除结果
 */
export async function deleteAccount(reason = null) {
  try {
    const response = await fetchApi("/api/dashboard/user/account", {
      method: "DELETE",
      body: { reason },
    });

    if (response.code !== 200) {
      throw new Error(response.msg || "删除账号失败");
    }

    // 删除成功后，登出用户
    await supabase.auth.signOut();

    return response.data;
  } catch (error) {
    console.error("删除账号失败:", error);
    throw error;
  }
}

/**
 * 获取身份绑定的显示信息
 * @param {Array} identities - 身份绑定列表
 * @returns {Object} 格式化后的绑定信息
 */
export function formatIdentities(identities) {
  const result = {
    email: null,
    github: null,
    google: null,
  };

  identities.forEach((identity) => {
    result[identity.provider] = {
      linked: true,
      email: identity.provider_email,
      linkedAt: identity.linked_at,
      metadata: identity.provider_metadata,
    };
  });

  return result;
}
