<template>
    <a-layout class="h-screen bg-gray-50">
        <a-layout-sider
            breakpoint="lg"
            :width="240"
            collapsible
            :collapsed="uiStore.sidebarCollapsed"
            @collapse="uiStore.setSidebarCollapsed"
            class="bg-white! shadow-sm z-20 border-r border-gray-100"
        >
            <div
                class="h-16 flex items-center justify-center border-b border-gray-50"
            >
                <div
                    class="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-purple-600 cursor-pointer flex items-center gap-2 transition-all duration-300 hover:opacity-80"
                    @click="goToHome"
                >
                    <div
                        class="w-8 h-8 bg-linear-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white shadow-md shrink-0"
                    >
                        <icon-link v-if="uiStore.sidebarCollapsed" />
                        <icon-dashboard v-else />
                    </div>
                    <span
                        v-if="!uiStore.sidebarCollapsed"
                        class="tracking-tight text-gray-800! font-bold"
                        >Short Link</span
                    >
                </div>
            </div>
            <a-menu
                :selected-keys="[currentRoute]"
                @menu-item-click="handleMenuClick"
                class="mt-4 px-2"
            >
                <a-menu-item key="stats" class="rounded-lg! mb-1">
                    <template #icon><icon-bar-chart /></template>
                    数据概览
                </a-menu-item>
                <a-menu-item key="links" class="rounded-lg! mb-1">
                    <template #icon><icon-link /></template>
                    链接管理
                </a-menu-item>

                <a-divider class="my-3!" />

                <a-menu-item key="profile" class="rounded-lg! mb-1">
                    <template #icon><icon-user /></template>
                    个人信息
                </a-menu-item>

                <!-- 管理员菜单 -->
                <template v-if="userStore.isAdmin">
                    <a-divider class="my-3!" />
                    <div
                        v-if="!uiStore.sidebarCollapsed"
                        class="px-3 py-2 text-xs text-gray-400 uppercase tracking-wider"
                    >
                        管理员
                    </div>
                    <a-menu-item key="admin-stats" class="rounded-lg! mb-1">
                        <template #icon
                            ><icon-dashboard class="text-orange-500"
                        /></template>
                        <span class="text-orange-600">全局统计</span>
                    </a-menu-item>
                    <a-menu-item key="admin-links" class="rounded-lg! mb-1">
                        <template #icon
                            ><icon-apps class="text-orange-500"
                        /></template>
                        <span class="text-orange-600">所有链接</span>
                    </a-menu-item>
                    <a-menu-item key="admin-users" class="rounded-lg! mb-1">
                        <template #icon
                            ><icon-user class="text-orange-500"
                        /></template>
                        <span class="text-orange-600">用户管理</span>
                    </a-menu-item>
                    <a-menu-item
                        key="admin-login-logs"
                        class="rounded-lg! mb-1"
                    >
                        <template #icon
                            ><icon-history class="text-orange-500"
                        /></template>
                        <span class="text-orange-600">登录日志</span>
                    </a-menu-item>
                </template>
            </a-menu>
        </a-layout-sider>

        <a-layout class="flex flex-col h-screen overflow-hidden">
            <a-layout-header
                class="h-16 bg-white border-b border-gray-100 px-6 flex justify-between items-center z-10 shrink-0"
            >
                <div class="flex items-center gap-4">
                    <h2 class="text-lg font-semibold text-gray-800">
                        {{ currentTitle }}
                    </h2>
                    <a-tag v-if="isAdminRoute" color="orange" size="small">
                        <template #icon><icon-lock /></template>
                        管理员模式
                    </a-tag>
                </div>
                <div class="flex items-center gap-4">
                    <a-tooltip content="刷新数据">
                        <a-button
                            shape="circle"
                            type="text"
                            size="small"
                            @click="handleRefresh"
                            class="text-gray-500 hover:bg-gray-100"
                        >
                            <template #icon><icon-refresh /></template>
                        </a-button>
                    </a-tooltip>
                    <div class="h-6 w-px bg-gray-200 mx-1"></div>
                    <a-dropdown @select="handleUserDropdown">
                        <div
                            class="flex items-center gap-3 cursor-pointer hover:bg-gray-50 px-3 py-1.5 rounded-full transition-colors border border-transparent hover:border-gray-100"
                        >
                            <a-avatar
                                :size="32"
                                :image-url="userStore.userAvatar"
                                :class="
                                    userStore.isAdmin
                                        ? 'bg-orange-500'
                                        : 'bg-blue-600'
                                "
                            >
                                <template v-if="!userStore.userAvatar">
                                    {{ userStore.userInitial }}
                                </template>
                            </a-avatar>
                            <div class="hidden sm:flex flex-col items-start">
                                <span
                                    class="text-sm font-medium text-gray-700 leading-none"
                                    >{{ userStore.userDisplayName }}</span
                                >
                                <span
                                    class="text-xs leading-none mt-1"
                                    :class="
                                        userStore.isAdmin
                                            ? 'text-orange-500'
                                            : 'text-gray-400'
                                    "
                                    >{{
                                        userStore.isAdmin
                                            ? "管理员"
                                            : "Pro Plan"
                                    }}</span
                                >
                            </div>
                            <icon-down class="text-gray-400 text-xs ml-1" />
                        </div>
                        <template #content>
                            <a-doption value="profile">
                                <template #icon><icon-user /></template>
                                个人信息
                            </a-doption>
                            <a-doption value="home">
                                <template #icon><icon-home /></template>
                                返回首页
                            </a-doption>
                            <a-doption value="logout">
                                <template #icon><icon-export /></template>
                                退出登录
                            </a-doption>
                        </template>
                    </a-dropdown>
                </div>
            </a-layout-header>

            <a-layout-content class="flex-1 overflow-y-auto bg-gray-50 p-6">
                <div class="max-w-7xl mx-auto">
                    <router-view
                        ref="childViewRef"
                        :is-admin="userStore.isAdmin"
                    />
                </div>
            </a-layout-content>
        </a-layout>
    </a-layout>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRouter, useRoute } from "vue-router";
import { Message } from "@arco-design/web-vue";
import {
    IconBarChart,
    IconLink,
    IconRefresh,
    IconDown,
    IconHome,
    IconExport,
    IconDashboard,
    IconApps,
    IconLock,
    IconUser,
    IconHistory,
} from "@arco-design/web-vue/es/icon";
import { useUserStore, useUiStore } from "@/stores";

const router = useRouter();
const route = useRoute();

// Stores
const userStore = useUserStore();
const uiStore = useUiStore();

// Refs
const childViewRef = ref(null);

// Computed
const currentRoute = computed(() => {
    const path = route.path;
    if (path.includes("/admin/login-logs")) return "admin-login-logs";
    if (path.includes("/admin/users")) return "admin-users";
    if (path.includes("/admin/links")) return "admin-links";
    if (path.includes("/admin/stats")) return "admin-stats";
    if (path.includes("/profile")) return "profile";
    if (path.includes("/links")) return "links";
    return "stats";
});

const isAdminRoute = computed(() => {
    return route.path.includes("/admin");
});

const currentTitle = computed(() => {
    const routeKey = currentRoute.value;
    const titles = {
        stats: "数据概览",
        links: "链接管理",
        profile: "个人信息",
        "admin-stats": "全局统计",
        "admin-links": "所有链接",
        "admin-users": "用户管理",
        "admin-login-logs": "登录日志",
    };
    return titles[routeKey] || "控制台";
});

// Methods
const handleMenuClick = (key) => {
    const routes = {
        stats: "/dashboard/stats",
        links: "/dashboard/links",
        profile: "/dashboard/profile",
        "admin-stats": "/dashboard/admin/stats",
        "admin-links": "/dashboard/admin/links",
        "admin-users": "/dashboard/admin/users",
        "admin-login-logs": "/dashboard/admin/login-logs",
    };
    if (routes[key]) {
        router.push(routes[key]);
    }
};

const goToHome = () => {
    router.push("/");
};

const handleUserDropdown = async (value) => {
    if (value === "profile") {
        router.push("/dashboard/profile");
    } else if (value === "home") {
        goToHome();
    } else if (value === "logout") {
        try {
            await userStore.logout();
            Message.success("已退出登录");
            router.push("/login");
        } catch (error) {
            Message.error("退出登录失败");
        }
    }
};

const handleRefresh = () => {
    // 如果在 profile 页面，也刷新用户信息
    if (currentRoute.value === "profile") {
        userStore.refreshUser();
    }
    // 调用子组件的刷新方法
    if (childViewRef.value?.refresh) {
        childViewRef.value.refresh();
    }
};

onMounted(async () => {
    // 初始化用户状态（会自动使用缓存，避免重复请求）
    await userStore.initialize();
    if (!userStore.isAuthenticated) {
        router.push("/login");
    }
});
</script>
