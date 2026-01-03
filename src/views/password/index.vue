<!--
 * @Author: zi.yang
 * @Date: 2026-01-02 00:00:00
 * @LastEditors: zi.yang
 * @LastEditTime: 2026-01-02 00:00:00
 * @Description: 密码验证页面组件
 * @FilePath: /short-link/src/views/password/index.vue
-->
<template>
    <div
        class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col items-center justify-center p-4 relative overflow-hidden"
    >
        <!-- 背景装饰 - 优雅的渐变球 -->
        <div class="fixed inset-0 overflow-hidden pointer-events-none">
            <div
                class="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full opacity-20 blur-3xl animate-float"
            ></div>
            <div
                class="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full opacity-20 blur-3xl animate-float-delayed"
            ></div>
            <div
                class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-full opacity-10 blur-2xl"
            ></div>
        </div>

        <!-- 密码验证卡片 -->
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
                        class="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-full opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500 scale-150"
                    ></div>

                    <!-- 中层旋转圈 -->
                    <div
                        class="absolute inset-0 flex items-center justify-center"
                    >
                        <div
                            class="w-28 h-28 rounded-full border-2 border-dashed border-blue-200 animate-spin-slow"
                        ></div>
                    </div>

                    <!-- 主图标容器 -->
                    <div
                        class="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 flex items-center justify-center shadow-xl transform transition-transform duration-300 group-hover:scale-105"
                    >
                        <!-- 内部装饰圈 -->
                        <div
                            class="absolute inset-3 rounded-2xl bg-white/50 backdrop-blur-sm"
                        ></div>

                        <!-- 锁图标 -->
                        <div
                            class="relative z-10 transform group-hover:scale-110 transition-transform duration-300"
                        >
                            <icon-lock
                                :style="{ fontSize: '56px', color: '#155dfc' }"
                            />
                        </div>

                        <!-- 装饰性光点 -->
                        <div
                            class="absolute top-3 right-3 w-2 h-2 bg-blue-400 rounded-full animate-ping"
                        ></div>
                        <div
                            class="absolute bottom-3 left-3 w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse"
                        ></div>
                    </div>
                </div>
            </div>

            <!-- 标题和说明 -->
            <div class="text-center mb-10">
                <h1
                    class="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3"
                >
                    访问受密码保护
                </h1>
                <p
                    class="text-base text-gray-600 leading-relaxed max-w-sm mx-auto"
                >
                    此短链接需要密码才能访问，请输入正确的密码继续
                </p>
            </div>

            <!-- 密码表单 -->
            <a-form
                ref="formRef"
                :model="formData"
                layout="vertical"
                @submit="handleSubmit"
                class="mb-8"
            >
                <a-form-item
                    field="password"
                    :rules="[{ required: true, message: '请输入密码' }]"
                    :validate-status="errorMessage ? 'error' : undefined"
                    :help="errorMessage"
                    class="mb-6"
                >
                    <template #label>
                        <span class="text-base font-medium text-gray-700"
                            >访问密码</span
                        >
                    </template>
                    <a-input-password
                        v-model="formData.password"
                        placeholder="请输入访问密码"
                        allow-clear
                        size="large"
                        autofocus
                        @input="clearError"
                        @press-enter="handleSubmit"
                        class="!h-12 !rounded-xl !text-base"
                    >
                        <template #prefix>
                            <icon-lock
                                class="text-gray-400"
                                :style="{ fontSize: '18px' }"
                            />
                        </template>
                    </a-input-password>
                </a-form-item>

                <a-button
                    type="primary"
                    html-type="submit"
                    long
                    size="large"
                    :loading="loading"
                    class="!h-12 !text-base !font-medium !rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                    <template #icon v-if="!loading">
                        <icon-check-circle :style="{ fontSize: '18px' }" />
                    </template>
                    {{ loading ? "验证中..." : "验证并访问" }}
                </a-button>
            </a-form>

            <!-- 帮助信息 -->
            <div class="pt-6 border-t border-gray-100">
                <div class="text-center space-y-3">
                    <div
                        class="flex items-center justify-center gap-2 text-sm text-gray-500"
                    >
                        <icon-info-circle
                            :style="{ fontSize: '16px' }"
                            class="text-blue-500"
                        />
                        <span>请联系链接创建者获取访问密码</span>
                    </div>

                    <div
                        class="flex items-center justify-center gap-4 text-xs text-gray-400"
                    >
                        <div class="flex items-center gap-1">
                            <div
                                class="w-2 h-2 bg-green-500 rounded-full animate-pulse"
                            ></div>
                            <span>安全加密</span>
                        </div>
                        <div class="w-px h-3 bg-gray-300"></div>
                        <div class="flex items-center gap-1">
                            <icon-lock :style="{ fontSize: '12px' }" />
                            <span>隐私保护</span>
                        </div>
                    </div>
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
import { Message } from "@arco-design/web-vue";
import { IconCheckCircle, IconInfoCircle, IconLeft, IconLock } from "@arco-design/web-vue/es/icon";
import { onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

const formRef = ref();
const formData = reactive({
	password: "",
});
const errorMessage = ref("");
const loading = ref(false);
const shortCode = ref("");

onMounted(() => {
	// 从路由参数获取短链接代码
	shortCode.value = route.params.hash as string;

	if (!shortCode.value) {
		Message.error("短链接代码无效");
		router.push("/");
	}
});

const clearError = () => {
	errorMessage.value = "";
};

const handleSubmit = async (data?: any) => {
	// 如果是表单验证失败
	if (data?.errors) {
		return;
	}

	const pwd = formData.password.trim();

	if (!pwd) {
		errorMessage.value = "请输入密码";
		return;
	}

	loading.value = true;
	errorMessage.value = "";

	try {
		const response = await fetch(`/api/verify-password/${shortCode.value}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ password: pwd }),
		});

		const result = await response.json();

		if (response.ok && result.code === 200) {
			// 密码正确，显示成功提示
			Message.success("密码验证成功，正在跳转...");

			// 延迟跳转，让用户看到成功提示
			setTimeout(() => {
				window.location.href = result.data.url;
			}, 500);
		} else {
			errorMessage.value = result.msg || "密码错误，请重试";
			formData.password = "";
		}
	} catch (error: any) {
		console.error("密码验证失败:", error);
		errorMessage.value = "验证失败，请稍后重试";
		Message.error("验证失败，请稍后重试");
		formData.password = "";
	} finally {
		loading.value = false;
	}
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

.animate-float {
    animation: float 20s ease-in-out infinite;
}

.animate-float-delayed {
    animation: float-delayed 25s ease-in-out infinite;
}

.animate-spin-slow {
    animation: spin-slow 20s linear infinite;
}
</style>
