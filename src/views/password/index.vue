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
        class="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4"
    >
        <!-- 背景装饰 -->
        <div class="fixed inset-0 overflow-hidden pointer-events-none">
            <div
                class="absolute -top-40 -left-40 w-80 h-80 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"
            ></div>
            <div
                class="absolute -bottom-40 -right-40 w-80 h-80 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"
            ></div>
        </div>

        <!-- 密码验证卡片 -->
        <a-card
            class="w-full max-w-md relative z-10 shadow-lg"
            :bordered="true"
            :body-style="{ padding: '48px 32px' }"
        >
            <!-- 图标区域 -->
            <div class="flex justify-center mb-6">
                <div class="relative">
                    <div
                        class="absolute inset-0 bg-blue-100 rounded-full scale-150 opacity-60 blur-xl"
                    ></div>
                    <a-avatar
                        :size="80"
                        class="bg-gradient-to-br from-blue-50 to-white relative z-10"
                    >
                        <icon-lock class="text-4xl text-blue-600" />
                    </a-avatar>
                </div>
            </div>

            <!-- 标题和说明 -->
            <div class="text-center mb-8">
                <h1 class="text-2xl font-bold text-gray-900 mb-2">
                    访问受密码保护
                </h1>
                <p class="text-sm text-gray-500 leading-relaxed">
                    此短链接需要密码才能访问，请输入正确的密码继续
                </p>
            </div>

            <!-- 密码表单 -->
            <a-form
                ref="formRef"
                :model="formData"
                layout="vertical"
                @submit="handleSubmit"
            >
                <a-form-item
                    field="password"
                    label="访问密码"
                    :rules="[{ required: true, message: '请输入密码' }]"
                    :validate-status="errorMessage ? 'error' : undefined"
                    :help="errorMessage"
                >
                    <a-input-password
                        v-model="formData.password"
                        placeholder="请输入访问密码"
                        allow-clear
                        size="large"
                        autofocus
                        @input="clearError"
                        @press-enter="handleSubmit"
                        class="rounded-lg!"
                    >
                        <template #prefix>
                            <icon-lock class="text-gray-400" />
                        </template>
                    </a-input-password>
                </a-form-item>

                <a-button
                    type="primary"
                    html-type="submit"
                    long
                    size="large"
                    :loading="loading"
                    class="rounded-lg! h-12! text-base! font-medium!"
                >
                    <template #icon>
                        <icon-check-circle v-if="!loading" />
                    </template>
                    {{ loading ? "验证中..." : "验证并访问" }}
                </a-button>
            </a-form>

            <!-- 帮助信息 -->
            <a-divider class="!my-6" />

            <div class="text-center">
                <a-typography-text type="secondary" class="text-xs">
                    <icon-info-circle class="mr-1" />
                    请联系链接创建者获取访问密码
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
import { ref, reactive, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Message } from "@arco-design/web-vue";
import {
    IconLock,
    IconCheckCircle,
    IconInfoCircle,
    IconLeft,
} from "@arco-design/web-vue/es/icon";

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
        const response = await fetch(
            `/api/verify-password/${shortCode.value}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ password: pwd }),
            },
        ).then((res) => res.json());
        if (response.code === 200) {
            // 密码正确，显示成功提示
            Message.success("密码验证成功，正在跳转...");
            // 延迟跳转，让用户看到成功提示
            setTimeout(() => {
                window.location.href = response.data.url;
            }, 500);
        } else {
            errorMessage.value = response.msg || "密码错误，请重试";
            formData.password = "";
        }
    } catch (error: any) {
        console.error("密码验证失败:", error);

        if (error.response?.status === 401) {
            errorMessage.value = "密码错误，请重试";
        } else if (error.response?.status === 404) {
            errorMessage.value = "短链接不存在";
            Message.error("短链接不存在");
            setTimeout(() => {
                router.push("/");
            }, 1500);
        } else if (error.response?.msg) {
            errorMessage.value = error.response.msg;
        } else {
            errorMessage.value = "验证失败，请稍后重试";
            Message.error("验证失败，请稍后重试");
        }

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
