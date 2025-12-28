/*
 * @Author: zi.yang
 * @Date: 2025-06-10 00:20:19
 * @LastEditors: zi.yang
 * @LastEditTime: 2025-12-27 20:00:00
 * @Description: 路由配置和认证守卫
 * @FilePath: /short-link/src/router/index.js
 */
import { createRouter, createWebHistory } from "vue-router";
import { getSession } from "@/services/auth.js";

import DashboardPage from "@/views/dashboard/index.vue";
import HomePage from "@/views/home/index.vue";
import LoginPage from "@/views/login/index.vue";
import RegisterPage from "@/views/register/index.vue";

const routes = [
  {
    path: "/",
    name: "home",
    component: HomePage,
    meta: { requiresAuth: false },
  },
  {
    path: "/login",
    name: "login",
    component: LoginPage,
    meta: { requiresAuth: false, redirectIfAuthenticated: true },
  },
  {
    path: "/register",
    name: "register",
    component: RegisterPage,
    meta: { requiresAuth: false, redirectIfAuthenticated: true },
  },
  {
    path: "/forgot-password",
    name: "forgot-password",
    component: () => import("@/views/forgot-password/index.vue"),
    meta: { requiresAuth: false, redirectIfAuthenticated: true },
  },
  {
    path: "/reset-password",
    name: "reset-password",
    component: () => import("@/views/reset-password/index.vue"),
    meta: { requiresAuth: false },
  },
  {
    path: "/dashboard",
    name: "dashboard",
    component: DashboardPage,
    meta: { requiresAuth: true },
    redirect: "/dashboard/stats",
    children: [
      {
        path: "stats",
        name: "dashboard-stats",
        component: () => import("@/views/dashboard/stats/index.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "links",
        name: "dashboard-links",
        component: () => import("@/views/dashboard/links/index.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "profile",
        name: "dashboard-profile",
        component: () => import("@/views/dashboard/profile/index.vue"),
        meta: { requiresAuth: true },
      },
      // 管理员路由
      {
        path: "admin/stats",
        name: "admin-stats",
        component: () => import("@/views/dashboard/admin/stats.vue"),
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: "admin/links",
        name: "admin-links",
        component: () => import("@/views/dashboard/admin/links.vue"),
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: "admin/users",
        name: "admin-users",
        component: () => import("@/views/dashboard/admin/users.vue"),
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: "admin/login-logs",
        name: "admin-login-logs",
        component: () => import("@/views/dashboard/admin/login-logs.vue"),
        meta: { requiresAuth: true, requiresAdmin: true },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 全局路由守卫 - 认证保护
router.beforeEach(async (to, from, next) => {
  // 检查路由是否需要认证
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);

  // 检查路由是否需要在已认证时重定向
  const redirectIfAuthenticated = to.matched.some(
    (record) => record.meta.redirectIfAuthenticated,
  );

  try {
    // 获取当前会话
    const session = await getSession();
    const isAuthenticated = !!session;

    if (requiresAuth && !isAuthenticated) {
      // 需要认证但未登录，重定向到登录页
      next({
        path: "/login",
        query: { redirect: to.fullPath }, // 保存原始路径，登录后可以重定向回来
      });
    } else if (redirectIfAuthenticated && isAuthenticated) {
      // 已登录用户访问登录/注册页，重定向到 dashboard
      next("/dashboard");
    } else {
      // 允许访问
      next();
    }
  } catch (error) {
    console.error("认证检查失败:", error);

    if (requiresAuth) {
      // 如果需要认证但检查失败，重定向到登录页
      next("/login");
    } else {
      // 否则允许访问
      next();
    }
  }
});

export default router;
