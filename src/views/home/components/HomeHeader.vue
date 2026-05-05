<template>
    <header
        class="w-full bg-white/95 dark:bg-gray-800/95 backdrop-blur supports-[backdrop-filter]:bg-white/75 dark:supports-[backdrop-filter]:bg-gray-800/75 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-50"
    >
        <div
            class="mx-auto w-full max-w-7xl px-4 sm:px-6 py-3 flex justify-between items-center"
        >
            <div class="flex items-center gap-3 min-w-0">
                <div
                    class="cursor-pointer flex items-center"
                    @click="$router.push('/')"
                >
                    <img
                        src="@/assets/images/logo-simple.svg"
                        alt="Short Link Logo"
                        class="h-8 w-8"
                    />
                </div>
                <span
                    class="hidden sm:inline-flex items-center rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-0.5 text-xs text-gray-500 dark:text-gray-400"
                >
                    企业级短链服务
                </span>
            </div>

            <div class="flex items-center gap-3 sm:gap-4">
                <a
                    href="https://github.com/Alessandro-Pang/short-link"
                    target="_blank"
                    class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors flex items-center"
                    aria-label="GitHub"
                >
                    <icon-github class="text-xl" />
                </a>

                <ThemeToggle />

                <a-divider direction="vertical" />

                <template v-if="userStore.isAuthenticated">
                    <a-dropdown @select="handleDropdownSelect">
                        <div
                            class="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1.5 rounded-full transition-colors"
                        >
                            <a-avatar
                                :size="32"
                                :image-url="userStore.userAvatar"
                                class="bg-blue-600"
                            >
                                <template v-if="!userStore.userAvatar">
                                    {{ userStore.userInitial }}
                                </template>
                            </a-avatar>
                            <span
                                class="hidden sm:inline-block max-w-[120px] md:max-w-[160px] truncate text-gray-700 font-medium text-sm"
                            >
                                {{ userStore.userDisplayName }}
                            </span>
                            <icon-down class="text-gray-400 text-sm" />
                        </div>
                        <template #content>
                            <a-doption value="dashboard">
                                <template #icon
                                    ><icon-dashboard
                                /></template>
                                控制台
                            </a-doption>
                            <a-doption value="profile">
                                <template #icon><icon-user /></template>
                                个人信息
                            </a-doption>
                            <a-doption value="logout">
                                <template #icon><icon-export /></template>
                                退出登录
                            </a-doption>
                        </template>
                    </a-dropdown>
                </template>

                <template v-else>
                    <a-space>
                        <a-button
                            type="text"
                            @click="$router.push('/login')"
                            >登录</a-button
                        >
                        <a-button
                            type="primary"
                            @click="$router.push('/register')"
                            >注册</a-button
                        >
                    </a-space>
                </template>
            </div>
        </div>
    </header>
</template>

<script setup>
import { Message } from "@arco-design/web-vue";
import {
    IconDashboard,
    IconDown,
    IconExport,
    IconGithub,
    IconUser,
} from "@arco-design/web-vue/es/icon";
import { useRouter } from "vue-router";
import ThemeToggle from "@/components/ThemeToggle.vue";
import { useUserStore } from "@/stores";

const router = useRouter();
const userStore = useUserStore();

const handleDropdownSelect = async (value) => {
    if (value === "logout") {
        try {
            await userStore.logout();
            Message.success("已退出登录");
        } catch (error) {
            Message.error("退出登录失败");
        }
    } else if (value === "dashboard") {
        router.push("/dashboard");
    } else if (value === "profile") {
        router.push("/dashboard/profile");
    }
};
</script>
