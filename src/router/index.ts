/*
 * @Author: zi.yang
 * @Date: 2025-06-10 00:20:19
 * @LastEditors: zi.yang
 * @LastEditTime: 2025-12-27 20:00:00
 * @Description: 路由配置和认证守卫
 * @FilePath: /short-link/src/router/index
 */
import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import { getSession } from "@/services/auth";

import DashboardPage from "@/views/dashboard/index.vue";
import HomePage from "@/views/home/index.vue";
import LoginPage from "@/views/login/index.vue";
import RegisterPage from "@/views/register/index.vue";

/**
 * 路由元数据说明：
 * - requiresAuth: 是否需要登录
 * - redirectIfAuthenticated: 已登录时重定向
 * - requiresAdmin: 是否需要管理员权限
 * - title: 菜单/页面标题
 * - icon: 图标名称（对应 @arco-design/web-vue/es/icon）
 * - showInMenu: 是否在侧边栏菜单中显示
 * - menuGroup: 菜单分组 ('main' | 'user' | 'admin')
 * - menuOrder: 菜单排序（数字越小越靠前）
 */

const routes: RouteRecordRaw[] = [
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
		path: "/error",
		name: "error",
		component: () => import("@/views/error/index.vue"),
		meta: { requiresAuth: false },
	},
	{
		path: "/password-verify/:hash",
		name: "password-verify",
		component: () => import("@/views/password/index.vue"),
		meta: { requiresAuth: false },
	},
	{
		path: "/dashboard",
		name: "dashboard",
		component: DashboardPage,
		meta: { requiresAuth: true },
		redirect: "/dashboard/stats",
		children: [
			// 主菜单组
			{
				path: "stats",
				name: "dashboard-stats",
				component: () => import("@/views/dashboard/stats/index.vue"),
				meta: {
					requiresAuth: true,
					title: "数据概览",
					icon: "IconBarChart",
					showInMenu: true,
					menuGroup: "main",
					menuOrder: 1,
				},
			},
			{
				path: "links",
				name: "dashboard-links",
				component: () => import("@/views/dashboard/links/index.vue"),
				meta: {
					requiresAuth: true,
					title: "链接管理",
					icon: "IconLink",
					showInMenu: true,
					menuGroup: "main",
					menuOrder: 2,
				},
			},
			// 用户菜单组
			{
				path: "profile",
				name: "dashboard-profile",
				component: () => import("@/views/dashboard/profile/index.vue"),
				meta: {
					requiresAuth: true,
					title: "个人信息",
					icon: "IconUser",
					showInMenu: true,
					menuGroup: "user",
					menuOrder: 1,
				},
			},
			// 管理员菜单组
			{
				path: "admin/stats",
				name: "admin-stats",
				component: () => import("@/views/dashboard/admin/stats.vue"),
				meta: {
					requiresAuth: true,
					requiresAdmin: true,
					title: "全局统计",
					icon: "IconDashboard",
					showInMenu: true,
					menuGroup: "admin",
					menuOrder: 1,
				},
			},
			{
				path: "admin/links",
				name: "admin-links",
				component: () => import("@/views/dashboard/admin/links.vue"),
				meta: {
					requiresAuth: true,
					requiresAdmin: true,
					title: "所有链接",
					icon: "IconApps",
					showInMenu: true,
					menuGroup: "admin",
					menuOrder: 2,
				},
			},
			{
				path: "admin/users",
				name: "admin-users",
				component: () => import("@/views/dashboard/admin/users.vue"),
				meta: {
					requiresAuth: true,
					requiresAdmin: true,
					title: "用户管理",
					icon: "IconUser",
					showInMenu: true,
					menuGroup: "admin",
					menuOrder: 3,
				},
			},
			{
				path: "admin/login-logs",
				name: "admin-login-logs",
				component: () => import("@/views/dashboard/admin/login-logs.vue"),
				meta: {
					requiresAuth: true,
					requiresAdmin: true,
					title: "登录日志",
					icon: "IconHistory",
					showInMenu: true,
					menuGroup: "admin",
					menuOrder: 4,
				},
			},
		],
	},
];

const router = createRouter({
	history: createWebHistory(),
	routes,
});

/**
 * 获取 dashboard 子路由（用于生成菜单）
 * @param {boolean} isAdmin - 是否为管理员
 * @returns {Object} 按菜单组分类的路由
 */
export function getDashboardMenuRoutes(isAdmin = false) {
	const dashboardRoute = routes.find((r) => r.name === "dashboard");
	if (!dashboardRoute?.children) return { main: [], user: [], admin: [] };

	const menuRoutes = dashboardRoute.children
		.filter((route) => {
			// 过滤出需要显示在菜单中的路由
			if (!route.meta?.showInMenu) return false;
			// 如果需要管理员权限但用户不是管理员，则不显示
			if (route.meta?.requiresAdmin && !isAdmin) return false;
			return true;
		})
		.map((route) => ({
			key: route.name,
			path: `/dashboard/${route.path}`,
			title: route.meta?.title || route.name,
			icon: route.meta?.icon,
			menuGroup: route.meta?.menuGroup || "main",
			menuOrder: route.meta?.menuOrder || 99,
			isAdmin: !!route.meta?.requiresAdmin,
		}));

	// 按组分类并排序
	const grouped: Record<string, typeof menuRoutes> = {
		main: [],
		user: [],
		admin: [],
	};

	for (const route of menuRoutes) {
		const group = route.menuGroup as string;
		if (grouped[group]) {
			grouped[group].push(route);
		}
	}

	// 每个组内按 menuOrder 排序
	for (const group of Object.keys(grouped)) {
		grouped[group].sort((a, b) => (a.menuOrder as number) - (b.menuOrder as number));
	}

	return grouped;
}

/**
 * 根据路由名称获取页面标题
 * @param {string} routeName - 路由名称
 * @returns {string} 页面标题
 */
export function getRouteTitle(routeName) {
	const dashboardRoute = routes.find((r) => r.name === "dashboard");
	const childRoute = dashboardRoute?.children?.find((r) => r.name === routeName);
	return childRoute?.meta?.title || "控制台";
}

// 全局路由守卫 - 认证保护
router.beforeEach(async (to, from, next) => {
	// 检查路由是否需要认证
	const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);

	// 检查路由是否需要在已认证时重定向
	const redirectIfAuthenticated = to.matched.some((record) => record.meta.redirectIfAuthenticated);

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
