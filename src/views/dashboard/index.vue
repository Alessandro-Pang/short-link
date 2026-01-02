<template>
    <a-layout class="h-screen bg-gray-50 dark:bg-gray-900">
        <a-layout-sider
            breakpoint="lg"
            collapsible
            :collapsed="uiStore.sidebarCollapsed"
            @collapse="uiStore.setSidebarCollapsed"
            class="bg-white! dark:bg-gray-800! border-r border-gray-100 dark:border-gray-700"
        >
            <div
                class="h-16 flex items-center justify-center border-b border-gray-50 dark:border-gray-700"
            >
                <div
                    class="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 cursor-pointer flex items-center gap-2 transition-all duration-300 hover:opacity-80"
                    @click="goToHome"
                >
                    <div
                        class="w-8 h-8 bg-linear-to-br from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500 rounded-lg flex items-center justify-center text-white shadow-md shrink-0"
                    >
                        <icon-link v-if="uiStore.sidebarCollapsed" />
                        <icon-dashboard v-else />
                    </div>
                    <span
                        v-if="!uiStore.sidebarCollapsed"
                        class="tracking-tight text-gray-800! dark:text-gray-200! font-bold"
                        >Short Link</span
                    >
                </div>
            </div>

            <!-- 使用 SidebarMenu 组件 -->
            <SidebarMenu
                :is-admin="userStore.isAdmin"
                :collapsed="uiStore.sidebarCollapsed"
            />
        </a-layout-sider>

        <a-layout class="flex flex-col h-screen overflow-hidden">
            <a-layout-header
                class="h-16 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-6 flex justify-between items-center z-10 shrink-0"
            >
                <div class="flex items-center gap-4">
                    <h2
                        class="text-lg font-semibold text-gray-800 dark:text-gray-200"
                    >
                        {{ currentTitle }}
                    </h2>
                    <a-tag v-if="isAdminRoute" color="orange" size="small">
                        <template #icon><icon-lock /></template>
                        管理员模式
                    </a-tag>
                </div>
                <div class="flex items-center gap-4">
                    <ThemeToggle />
                    <a-tooltip content="刷新数据">
                        <a-button
                            shape="circle"
                            type="text"
                            size="small"
                            @click="handleRefresh"
                            class="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            <template #icon><icon-refresh /></template>
                        </a-button>
                    </a-tooltip>
                    <div
                        class="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1"
                    ></div>
                    <a-dropdown @select="handleUserDropdown">
                        <div
                            class="flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 px-3 py-1.5 rounded-full transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-600"
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
                                    class="text-sm font-medium text-gray-700 dark:text-gray-300 leading-none"
                                    >{{ userStore.userDisplayName }}</span
                                >
                                <span
                                    class="text-xs leading-none mt-1"
                                    :class="
                                        userStore.isAdmin
                                            ? 'text-orange-500 dark:text-orange-400'
                                            : 'text-gray-400 dark:text-gray-500'
                                    "
                                    >{{
                                        userStore.isAdmin
                                            ? "管理员"
                                            : "Pro Plan"
                                    }}</span
                                >
                            </div>
                            <icon-down
                                class="text-gray-400 dark:text-gray-500 text-xs ml-1"
                            />
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

            <a-layout-content
                class="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6"
            >
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
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { Message } from "@arco-design/web-vue";
import {
    IconLink,
    IconRefresh,
    IconDown,
    IconHome,
    IconExport,
    IconDashboard,
    IconLock,
    IconUser,
} from "@arco-design/web-vue/es/icon";
import { useUserStore, useUiStore } from "@/stores";
import { getRouteTitle } from "@/router";
import SidebarMenu from "./components/SidebarMenu.vue";
import ThemeToggle from "@/components/ThemeToggle.vue";

const router = useRouter();
const route = useRoute();

// Stores
const userStore = useUserStore();
const uiStore = useUiStore();

// Refs
const childViewRef = ref(null);

// Computed
const isAdminRoute = computed(() => {
    return route.path.includes("/admin");
});

const currentTitle = computed(() => {
    return getRouteTitle(route.name);
});

// Methods
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
    if (route.name === "dashboard-profile") {
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
