/**
 * 用户状态管理
 * 管理用户认证状态、用户信息和管理员权限
 * 统一维护用户信息，避免重复请求
 */

import { defineStore } from "pinia";

/**
 * 用户缓存配置
 */
const USER_CACHE_CONFIG = {
  // 缓存有效期（毫秒）- 5分钟
  CACHE_DURATION: 5 * 60 * 1000,
  // 初始化检查间隔（毫秒）
  INIT_CHECK_INTERVAL: 50,
};
import { ref, computed } from "vue";
import {
  getCurrentUser,
  signOut as authSignOut,
  signInWithEmail,
  signInWithGithub,
  signInWithGoogle,
  signUpWithEmail,
  updateUserProfile as authUpdateUserProfile,
  onAuthStateChange,
} from "@/services/auth";
import { getCurrentUserWithAdminStatus } from "@/services/admin";

export const useUserStore = defineStore("user", () => {
  // ==================== State ====================

  // 用户对象
  const user = ref(null);

  // 管理员状态
  const isAdmin = ref(false);

  // 加载状态
  const isLoading = ref(false);

  // 是否已认证
  const isAuthenticated = ref(false);

  // 认证错误信息
  const authError = ref(null);

  // 是否已初始化（避免重复初始化请求）
  const isInitialized = ref(false);

  // 是否正在初始化中
  const isInitializing = ref(false);

  // 上次获取用户信息的时间戳
  const lastFetchTime = ref(null);

  // ==================== Getters ====================

  // 用户邮箱
  const userEmail = computed(() => user.value?.email || "");

  // 用户名
  const userName = computed(() => user.value?.user_metadata?.name || "");

  // 用户头像
  const userAvatar = computed(
    () => user.value?.user_metadata?.avatar_url || "",
  );

  // 用户简介
  const userBio = computed(() => user.value?.user_metadata?.bio || "");

  // 显示名称
  const userDisplayName = computed(() => {
    return userName.value || userEmail.value?.split("@")[0] || "";
  });

  // 用户名首字母
  const userInitial = computed(() => {
    return (userName.value || userEmail.value)?.[0]?.toUpperCase() || "";
  });

  // 用户元数据
  const userMetadata = computed(() => user.value?.user_metadata || {});

  // 应用元数据
  const appMetadata = computed(() => user.value?.app_metadata || {});

  // 认证提供商
  const authProvider = computed(() => {
    const provider = appMetadata.value?.provider;
    const providerMap = {
      email: "邮箱密码",
      google: "Google",
      github: "GitHub",
    };
    return providerMap[provider] || provider || "邮箱密码";
  });

  // 用户创建时间
  const userCreatedAt = computed(() => user.value?.created_at || null);

  // 缓存是否有效
  const isCacheValid = computed(() => {
    if (!lastFetchTime.value) return false;
    return Date.now() - lastFetchTime.value < USER_CACHE_CONFIG.CACHE_DURATION;
  });

  // ==================== Actions ====================

  /**
   * 初始化用户状态
   * 从 Supabase 获取当前用户信息
   * 支持强制刷新
   * @param {boolean} force - 是否强制刷新（忽略缓存）
   */
  async function initialize(force = false) {
    // 如果已经在初始化中，等待完成
    if (isInitializing.value) {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!isInitializing.value) {
            clearInterval(checkInterval);
            resolve();
          }
        }, USER_CACHE_CONFIG.INIT_CHECK_INTERVAL);
      });
    }

    // 如果已初始化且缓存有效且不是强制刷新，直接返回
    if (isInitialized.value && isCacheValid.value && !force) {
      return;
    }

    isInitializing.value = true;
    isLoading.value = true;
    authError.value = null;

    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        user.value = currentUser;
        isAuthenticated.value = true;
        lastFetchTime.value = Date.now();

        // 获取管理员状态
        await fetchAdminStatus();
      } else {
        resetState();
      }
      isInitialized.value = true;
    } catch (error) {
      console.error("初始化用户状态失败:", error);
      authError.value = error.message;
      resetState();
    } finally {
      isLoading.value = false;
      isInitializing.value = false;
    }
  }

  /**
   * 获取管理员状态
   */
  async function fetchAdminStatus() {
    try {
      const userWithAdmin = await getCurrentUserWithAdminStatus();
      isAdmin.value = userWithAdmin?.isAdmin === true;
    } catch (error) {
      console.error("获取管理员状态失败:", error);
      isAdmin.value = false;
    }
  }

  /**
   * 邮箱密码登录
   */
  async function loginWithEmail(email, password) {
    isLoading.value = true;
    authError.value = null;

    try {
      const data = await signInWithEmail(email, password);
      user.value = data.user;
      isAuthenticated.value = true;
      isInitialized.value = true;
      lastFetchTime.value = Date.now();
      await fetchAdminStatus();
      return data;
    } catch (error) {
      authError.value = error.message;
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * GitHub 登录
   */
  async function loginWithGithub() {
    isLoading.value = true;
    authError.value = null;

    try {
      const data = await signInWithGithub();
      return data;
    } catch (error) {
      authError.value = error.message;
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Google 登录
   */
  async function loginWithGoogle() {
    isLoading.value = true;
    authError.value = null;

    try {
      const data = await signInWithGoogle();
      return data;
    } catch (error) {
      authError.value = error.message;
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 邮箱注册
   */
  async function registerWithEmail(email, password, metadata = {}) {
    isLoading.value = true;
    authError.value = null;

    try {
      const data = await signUpWithEmail(email, password, metadata);
      return data;
    } catch (error) {
      authError.value = error.message;
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 退出登录
   */
  async function logout() {
    isLoading.value = true;
    authError.value = null;

    try {
      await authSignOut();
      resetState();
    } catch (error) {
      authError.value = error.message;
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 更新用户资料
   * @param {Object} updates - 要更新的用户信息
   */
  async function updateProfile(updates) {
    isLoading.value = true;
    authError.value = null;

    try {
      const data = await authUpdateUserProfile(updates);

      // 更新本地状态
      if (user.value) {
        user.value = {
          ...user.value,
          user_metadata: {
            ...user.value.user_metadata,
            ...updates,
          },
        };
      }

      // 更新缓存时间
      lastFetchTime.value = Date.now();

      // 触发全局更新事件（用于其他组件监听）
      window.dispatchEvent(new CustomEvent("user-profile-updated"));

      return data;
    } catch (error) {
      authError.value = error.message;
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 刷新用户信息（强制从服务器获取）
   */
  async function refreshUser() {
    // 强制刷新，忽略缓存
    await initialize(true);
  }

  /**
   * 重置状态
   */
  function resetState() {
    user.value = null;
    isAdmin.value = false;
    isAuthenticated.value = false;
    isInitialized.value = false;
    lastFetchTime.value = null;
  }

  /**
   * 设置认证状态变化监听
   * @param {Function} callback - 状态变化回调函数
   */
  function setupAuthListener(callback) {
    return onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        user.value = session.user;
        isAuthenticated.value = true;
        isInitialized.value = true;
        lastFetchTime.value = Date.now();
        fetchAdminStatus();
      } else if (event === "SIGNED_OUT") {
        resetState();
      } else if (event === "USER_UPDATED" && session?.user) {
        user.value = session.user;
        lastFetchTime.value = Date.now();
      }

      if (callback) {
        callback(event, session);
      }
    });
  }

  /**
   * 清除错误
   */
  function clearError() {
    authError.value = null;
  }

  /**
   * 使缓存失效（下次获取时会重新请求）
   */
  function invalidateCache() {
    lastFetchTime.value = null;
  }

  return {
    // State
    user,
    isAdmin,
    isLoading,
    isAuthenticated,
    authError,
    isInitialized,
    isInitializing,
    lastFetchTime,

    // Getters
    userEmail,
    userName,
    userAvatar,
    userBio,
    userDisplayName,
    userInitial,
    userMetadata,
    appMetadata,
    authProvider,
    userCreatedAt,
    isCacheValid,

    // Actions
    initialize,
    fetchAdminStatus,
    loginWithEmail,
    loginWithGithub,
    loginWithGoogle,
    registerWithEmail,
    logout,
    updateProfile,
    refreshUser,
    resetState,
    setupAuthListener,
    clearError,
    invalidateCache,
  };
});
