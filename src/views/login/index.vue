<template>
    <div
        class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
    >
        <div
            class="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg border border-gray-100"
        >
            <div class="text-center">
                <h2 class="mt-6 text-3xl font-extrabold text-gray-900">登录</h2>
                <p class="mt-2 text-sm text-gray-600">登录以管理您的短链接</p>
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
                        placeholder="请输入邮箱"
                        allow-clear
                        size="large"
                    >
                        <template #prefix>
                            <icon-email />
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
                    >
                        <template #prefix>
                            <icon-lock />
                        </template>
                    </a-input-password>
                </a-form-item>

                <div class="flex items-center justify-end mb-6">
                    <a-link @click="handleForgotPassword" class="text-sm"
                        >忘记密码?</a-link
                    >
                </div>

                <a-button
                    type="primary"
                    html-type="submit"
                    long
                    size="large"
                    :loading="isLoading"
                >
                    登录
                </a-button>
            </a-form>

            <div class="relative my-6">
                <div class="absolute inset-0 flex items-center">
                    <div class="w-full border-t border-gray-300"></div>
                </div>
                <div class="relative flex justify-center text-sm">
                    <span class="px-2 bg-white text-gray-500">
                        或者使用以下方式登录
                    </span>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
                <a-button
                    long
                    size="large"
                    @click="handleGithubLogin"
                    :loading="isLoading"
                >
                    <template #icon>
                        <icon-github />
                    </template>
                    GitHub
                </a-button>
                <a-button
                    long
                    size="large"
                    @click="handleGoogleLogin"
                    :loading="isLoading"
                >
                    <template #icon>
                        <icon-google />
                    </template>
                    Google
                </a-button>
            </div>

            <div class="text-center mt-6 space-y-2">
                <div>
                    <span class="text-gray-600 text-sm">还没有账号？</span>
                    <a-link @click="goToRegister">立即注册</a-link>
                </div>
                <div>
                    <a-link
                        @click="goToHome"
                        class="text-gray-500! hover:text-gray-700! text-sm"
                        >返回首页</a-link
                    >
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
