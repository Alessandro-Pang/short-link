<template>
    <a-layout class="h-screen bg-gray-50">
        <a-layout-sider
            breakpoint="lg"
            :width="240"
            collapsible
            :collapsed="collapsed"
            @collapse="onCollapse"
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
                        <icon-link v-if="collapsed" />
                        <icon-dashboard v-else />
                    </div>
                    <span
                        v-if="!collapsed"
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
                            <a-avatar :size="32" class="bg-blue-600">{{
                                userEmail?.[0]?.toUpperCase()
                            }}</a-avatar>
                            <div class="hidden sm:flex flex-col items-start">
                                <span
                                    class="text-sm font-medium text-gray-700 leading-none"
                                    >{{ userEmail?.split("@")[0] }}</span
                                >
                                <span
                                    class="text-xs text-gray-400 leading-none mt-1"
                                    >Pro Plan</span
                                >
                            </div>
                            <icon-down class="text-gray-400 text-xs ml-1" />
                        </div>
                        <template #content>
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
                    <router-view ref="childViewRef" />
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
    IconBarChart,
    IconLink,
    IconRefresh,
    IconDown,
    IconHome,
    IconExport,
    IconDashboard,
} from "@arco-design/web-vue/es/icon";
import { getCurrentUser, signOut } from "@/services/auth.js";

const router = useRouter();
const route = useRoute();

// State
const collapsed = ref(false);
const userEmail = ref("");
const childViewRef = ref(null);

// Computed
const currentRoute = computed(() => {
    const path = route.path;
    if (path.includes("/links")) return "links";
    return "stats";
});

const currentTitle = computed(() => {
    return currentRoute.value === "stats" ? "数据概览" : "链接管理";
});

// Methods
const onCollapse = (val) => {
    collapsed.value = val;
};

const handleMenuClick = (key) => {
    if (key === "stats") {
        router.push("/dashboard/stats");
    } else if (key === "links") {
        router.push("/dashboard/links");
    }
};

const goToHome = () => {
    router.push("/");
};

const handleUserDropdown = async (value) => {
    if (value === "home") {
        goToHome();
    } else if (value === "logout") {
        try {
            await signOut();
            Message.success("已退出登录");
            router.push("/login");
        } catch (error) {
            Message.error("退出登录失败");
        }
    }
};

const handleRefresh = () => {
    // 调用子组件的刷新方法
    if (childViewRef.value?.refresh) {
        childViewRef.value.refresh();
    }
};

const loadUserInfo = async () => {
    try {
        const user = await getCurrentUser();
        if (!user) {
            router.push("/login");
            return;
        }
        userEmail.value = user.email;
    } catch (error) {
        console.error("获取用户信息失败:", error);
        router.push("/login");
    }
};

onMounted(() => {
    loadUserInfo();
});
</script>
