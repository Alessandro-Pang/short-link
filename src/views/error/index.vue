<!--
 * @Author: zi.yang
 * @Date: 2026-01-02 00:00:00
 * @LastEditors: zi.yang
 * @LastEditTime: 2026-01-02 00:00:00
 * @Description: 错误页面组件
 * @FilePath: /short-link/src/views/error/index.vue
-->
<template>
    <div
        class="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4"
    >
        <!-- 背景装饰 -->
        <div class="fixed inset-0 overflow-hidden pointer-events-none">
            <div
                class="absolute -top-40 -left-40 w-80 h-80 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"
            ></div>
            <div
                class="absolute -bottom-40 -right-40 w-80 h-80 bg-red-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"
            ></div>
        </div>

        <!-- 错误卡片 -->
        <a-card
            class="w-full max-w-md relative z-10 shadow-lg"
            :bordered="true"
            :body-style="{ padding: '48px 32px' }"
        >
            <!-- 图标区域 -->
            <div class="flex justify-center mb-6">
                <div class="relative">
                    <div
                        class="absolute inset-0 bg-red-100 rounded-full scale-150 opacity-60 blur-xl"
                    ></div>
                    <a-avatar
                        :size="96"
                        class="bg-gradient-to-br from-red-50 to-white relative z-10"
                    >
                        <div class="relative">
                            <icon-link class="text-5xl text-red-500" />
                            <div
                                class="absolute -bottom-1 -right-1 bg-white rounded-full p-1.5 shadow-md"
                            >
                                <icon-exclamation-circle-fill
                                    class="text-xl text-orange-500"
                                />
                            </div>
                        </div>
                    </a-avatar>
                </div>
            </div>

            <!-- 标题和消息 -->
            <div class="text-center mb-8">
                <h1 class="text-2xl font-bold text-gray-900 mb-2">
                    {{ title }}
                </h1>
                <p class="text-gray-500 leading-relaxed">
                    {{ message }}
                </p>
            </div>

            <!-- 操作按钮 -->
            <a-space direction="vertical" :size="12" fill>
                <a-button type="primary" long size="large" @click="goHome">
                    <template #icon>
                        <icon-home />
                    </template>
                    返回首页
                </a-button>
                <a-button long size="large" @click="retry">
                    <template #icon>
                        <icon-refresh />
                    </template>
                    重试
                </a-button>
            </a-space>

            <!-- 帮助信息 -->
            <a-divider class="!my-6" />

            <div class="text-center">
                <a-typography-text type="secondary" class="text-xs">
                    需要帮助？
                    <a-link
                        href="https://github.com/Alessandro-Pang/short-link/issues"
                        target="_blank"
                        class="font-medium"
                    >
                        联系站长
                        <icon-launch class="ml-0.5" />
                    </a-link>
                </a-typography-text>
            </div>
        </a-card>

        <!-- 底部返回链接 -->
        <div class="mt-6 relative z-10">
            <a-link @click="goHome" class="text-gray-400 hover:text-gray-600">
                <icon-left class="mr-1" />
                返回首页
            </a-link>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
    IconLink,
    IconExclamationCircleFill,
    IconHome,
    IconRefresh,
    IconLaunch,
    IconLeft,
} from "@arco-design/web-vue/es/icon";

const route = useRoute();
const router = useRouter();

const title = ref("链接无效");
const message = ref("短链接不存在");

onMounted(() => {
    // 从 query 参数获取错误信息
    if (route.query.title) {
        title.value = route.query.title as string;
    }
    if (route.query.message) {
        message.value = route.query.message as string;
    }
});

const retry = () => {
    window.location.reload();
};

const goHome = () => {
    router.push("/");
};
</script>

<style scoped>
@keyframes blob {
    0% {
        transform: translate(0px, 0px) scale(1);
    }
    33% {
        transform: translate(30px, -50px) scale(1.1);
    }
    66% {
        transform: translate(-20px, 20px) scale(0.9);
    }
    100% {
        transform: translate(0px, 0px) scale(1);
    }
}

.animate-blob {
    animation: blob 7s infinite;
}

.animation-delay-2000 {
    animation-delay: 2s;
}
</style>
