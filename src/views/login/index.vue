<template>
    <div class="min-h-screen flex bg-white">
        <!-- Left Side - Branding -->
        <div
            class="hidden lg:flex lg:w-1/2 bg-linear-to-br from-blue-600 to-purple-700 relative overflow-hidden items-center justify-center"
        >
            <!-- Abstract Background Shapes -->
            <div
                class="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none"
            >
                <div
                    class="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full bg-white blur-3xl"
                ></div>
                <div
                    class="absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full bg-white blur-3xl"
                ></div>
            </div>

            <div class="relative z-10 text-center px-12">
                <div class="mb-8 flex justify-center">
                    <div
                        class="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center"
                    >
                        <icon-link class="text-5xl text-white" />
                    </div>
                </div>
                <h1 class="text-4xl font-bold text-white mb-6 tracking-tight">
                    Short Link Service
                </h1>
                <p
                    class="text-blue-100 text-lg max-w-md mx-auto leading-relaxed"
                >
                    专业的短链接生成与管理平台，提供详细的数据分析和稳定的访问服务。
                </p>
            </div>
        </div>

        <!-- Right Side - Login Form -->
        <div class="flex-1 flex items-center justify-center p-4 sm:p-12">
            <div class="w-full max-w-md space-y-8">
                <div class="text-center lg:text-left">
                    <h2 class="text-3xl font-bold text-gray-900 tracking-tight">
                        欢迎回来
                    </h2>
                    <p class="mt-2 text-gray-500">
                        请输入您的账号信息以登录控制台
                    </p>
                </div>

                <a-form
                    :model="form"
                    layout="vertical"
                    @submit="handleEmailLogin"
                    class="mt-8"
                >
                    <a-form-item
                        field="email"
                        label="邮箱"
                        :rules="[
                            { required: true, message: '请输入邮箱' },
                            { type: 'email', message: '请输入有效的邮箱地址' },
                        ]"
                    >
                        <a-input
                            v-model="form.email"
                            placeholder="name@example.com"
                            allow-clear
                            size="large"
                            class="rounded-lg!"
                        >
                            <template #prefix>
                                <icon-email class="text-gray-400" />
                            </template>
                        </a-input>
                    </a-form-item>

                    <a-form-item
                        field="password"
                        label="密码"
                        :rules="[{ required: true, message: '请输入密码' }]"
                    >
                        <a-input-password
                            v-model="form.password"
                            placeholder="请输入密码"
                            allow-clear
                            size="large"
                            class="rounded-lg!"
                        >
                            <template #prefix>
                                <icon-lock class="text-gray-400" />
                            </template>
                        </a-input-password>
                    </a-form-item>

                    <div class="flex items-center justify-between mb-6">
                        <a-checkbox>记住我</a-checkbox>
                        <a-link
                            @click="handleForgotPassword"
                            class="text-sm font-medium"
                            >忘记密码?</a-link
                        >
                    </div>

                    <a-button
                        type="primary"
                        html-type="submit"
                        long
                        size="large"
                        :loading="isLoading"
                        class="rounded-lg! h-12! text-base! font-medium!"
                    >
                        登录
                    </a-button>
                </a-form>

                <div class="relative my-8">
                    <div class="absolute inset-0 flex items-center">
                        <div class="w-full border-t border-gray-200"></div>
                    </div>
                    <div class="relative flex justify-center text-sm">
                        <span class="px-4 bg-white text-gray-500">
                            第三方账号登录
                        </span>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <button
                        type="button"
                        class="flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 cursor-pointer"
                        @click="handleGithubLogin"
                        :disabled="isLoading"
                    >
                        <icon-github class="text-xl" />
                        <span class="text-gray-700 font-medium">GitHub</span>
                    </button>
                    <button
                        type="button"
                        class="flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 cursor-pointer"
                        @click="handleGoogleLogin"
                        :disabled="isLoading"
                    >
                        <icon-google class="text-xl" />
                        <span class="text-gray-700 font-medium">Google</span>
                    </button>
                </div>

                <div class="text-center mt-8">
                    <p class="text-gray-600">
                        还没有账号？
                        <a-link
                            @click="goToRegister"
                            class="font-bold! cursor-pointer"
                            >立即注册</a-link
                        >
                    </p>
                    <div class="mt-4">
                        <a-link
                            @click="goToHome"
                            class="text-gray-400! hover:text-gray-600! text-sm"
                        >
                            <icon-left /> 返回首页
                        </a-link>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { Message } from "@arco-design/web-vue";
import {
    IconGithub,
    IconGoogle,
    IconEmail,
    IconLock,
    IconLink,
    IconLeft,
} from "@arco-design/web-vue/es/icon";
import {
    signInWithGithub,
    signInWithGoogle,
    signInWithEmail,
} from "@/services/auth.js";

const router = useRouter();
const isLoading = ref(false);
const form = reactive({
    email: "",
    password: "",
});

// 处理 GitHub 登录
async function handleGithubLogin() {
    if (isLoading.value) return;
    isLoading.value = true;
    try {
        await signInWithGithub();
    } catch (error) {
        isLoading.value = false;
        Message.error(error.message || "GitHub 登录失败，请稍后再试");
    }
}

// 处理 Google 登录
async function handleGoogleLogin() {
    if (isLoading.value) return;
    isLoading.value = true;
    try {
        await signInWithGoogle();
    } catch (error) {
        isLoading.value = false;
        Message.error(error.message || "Google 登录失败，请稍后再试");
    }
}

// 处理邮箱登录
async function handleEmailLogin({ errors }) {
    if (errors) return;

    isLoading.value = true;
    try {
        await signInWithEmail(form.email, form.password);
        Message.success("登录成功！");
        setTimeout(() => {
            router.push("/dashboard");
        }, 500);
    } catch (error) {
        isLoading.value = false;
        if (error.message.includes("Invalid login credentials")) {
            Message.error("邮箱或密码错误");
        } else if (error.message.includes("Email not confirmed")) {
            Message.error("请先验证您的邮箱");
        } else {
            Message.error(error.message || "登录失败，请稍后再试");
        }
    }
}

function handleForgotPassword() {
    Message.info("密码重置功能即将上线");
}

function goToRegister() {
    router.push("/register");
}

function goToHome() {
    router.push("/");
}
</script>
