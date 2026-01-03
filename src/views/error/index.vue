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
        class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex flex-col items-center justify-center p-4 relative overflow-hidden"
    >
        <!-- 背景装饰 - 更优雅的渐变球 -->
        <div class="fixed inset-0 overflow-hidden pointer-events-none">
            <div
                class="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-red-100 to-orange-100 rounded-full opacity-20 blur-3xl animate-float"
            ></div>
            <div
                class="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-pink-100 to-red-100 rounded-full opacity-20 blur-3xl animate-float-delayed"
            ></div>
            <div
                class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-orange-50 to-red-50 rounded-full opacity-10 blur-2xl"
            ></div>
        </div>

        <!-- 错误卡片 -->
        <a-card
            class="w-full max-w-lg relative z-10 border-0 shadow-2xl backdrop-blur-sm bg-white/80"
            :bordered="false"
            :body-style="{ padding: '56px 40px' }"
        >
            <!-- 图标区域 - 全新设计 -->
            <div class="flex justify-center mb-8">
                <div class="relative group">
                    <!-- 外层光晕圈 -->
                    <div
                        class="absolute inset-0 bg-gradient-to-br from-red-400 to-orange-400 rounded-full opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500 scale-150"
                    ></div>

                    <!-- 中层旋转圈 -->
                    <div
                        class="absolute inset-0 flex items-center justify-center"
                    >
                        <div
                            class="w-32 h-32 rounded-full border-2 border-dashed border-red-200 animate-spin-slow"
                        ></div>
                    </div>

                    <!-- 主图标容器 -->
                    <div
                        class="relative w-28 h-28 rounded-3xl bg-gradient-to-br from-red-50 via-orange-50 to-red-100 flex items-center justify-center shadow-xl transform transition-transform duration-300 group-hover:scale-105"
                    >
                        <!-- 内部装饰圈 -->
                        <div
                            class="absolute inset-3 rounded-2xl bg-white/50 backdrop-blur-sm"
                        ></div>

                        <!-- 链接图标 -->
                        <div class="relative z-10">
                            <icon-link
                                :style="{ fontSize: '64px', color: '#fb2c36' }"
                            />
                        </div>

                        <!-- 警告徽章  -->
                        <div
                            class="absolute -bottom-3 -right-3 w-14 h-14 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl shadow-lg flex items-center justify-center transform rotate-12 animate-bounce-subtle"
                        >
                            <icon-exclamation-circle-fill
                                :style="{ fontSize: '28px', color: '#fff' }"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <!-- 标题和消息 -->
            <div class="text-center mb-10">
                <h1
                    class="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3"
                >
                    {{ title }}
                </h1>
                <p
                    class="text-base text-gray-600 leading-relaxed max-w-sm mx-auto"
                >
                    {{ message }}
                </p>
            </div>

            <!-- 操作按钮 -->
            <a-space direction="vertical" :size="16" fill class="mb-8">
                <a-button
                    type="primary"
                    long
                    size="large"
                    @click="goHome"
                    class="!h-12 !text-base !font-medium !rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                    <template #icon>
                        <icon-home :style="{ fontSize: '18px' }" />
                    </template>
                    返回首页
                </a-button>
                <a-button
                    long
                    size="large"
                    @click="retry"
                    class="!h-12 !text-base !font-medium !rounded-xl !border-2 hover:!border-gray-400 transition-all duration-300"
                >
                    <template #icon>
                        <icon-refresh :style="{ fontSize: '18px' }" />
                    </template>
                    重新尝试
                </a-button>
            </a-space>

            <!-- 帮助信息 -->
            <div class="pt-6 border-t border-gray-100">
                <div class="text-center">
                    <a-typography-text type="secondary" class="text-sm">
                        遇到问题？
                        <a-link
                            href="https://github.com/Alessandro-Pang/short-link/issues"
                            target="_blank"
                            class="font-medium inline-flex items-center gap-1 hover:gap-2 transition-all"
                        >
                            联系站长
                            <icon-launch :style="{ fontSize: '14px' }" />
                        </a-link>
                    </a-typography-text>
                </div>
            </div>
        </a-card>

        <!-- 底部返回链接 -->
        <div class="mt-8 relative z-10">
            <a-link
                @click="goHome"
                class="text-gray-500 hover:text-gray-700 inline-flex items-center gap-2 text-sm font-medium transition-colors"
            >
                <icon-left :style="{ fontSize: '16px' }" />
                返回首页
            </a-link>
        </div>
    </div>
</template>

<script setup lang="ts">
import {
	IconExclamationCircleFill,
	IconHome,
	IconLaunch,
	IconLeft,
	IconLink,
	IconRefresh,
} from "@arco-design/web-vue/es/icon";
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

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
	window.location.replace(`/u/${route.query.short}`);
};

const goHome = () => {
	router.push("/");
};
</script>

<style scoped>
@keyframes float {
    0%,
    100% {
        transform: translate(0, 0) scale(1);
    }
    33% {
        transform: translate(30px, -30px) scale(1.05);
    }
    66% {
        transform: translate(-20px, 20px) scale(0.95);
    }
}

@keyframes float-delayed {
    0%,
    100% {
        transform: translate(0, 0) scale(1);
    }
    33% {
        transform: translate(-30px, 30px) scale(1.05);
    }
    66% {
        transform: translate(20px, -20px) scale(0.95);
    }
}

@keyframes spin-slow {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

@keyframes bounce-subtle {
    0%,
    100% {
        transform: rotate(12deg) translateY(0);
    }
    50% {
        transform: rotate(12deg) translateY(-4px);
    }
}

.animate-float {
    animation: float 20s ease-in-out infinite;
}

.animate-float-delayed {
    animation: float-delayed 25s ease-in-out infinite;
}

.animate-spin-slow {
    animation: spin-slow 20s linear infinite;
}

.animate-bounce-subtle {
    animation: bounce-subtle 2s ease-in-out infinite;
}
</style>
