<template>
    <div
        class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
    >
        <div
            class="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg border border-gray-100"
        >
            <div class="text-center">
                <h2 class="mt-6 text-3xl font-extrabold text-gray-900">注册</h2>
                <p class="mt-2 text-sm text-gray-600">
                    创建账号以管理您的短链接
                </p>
            </div>

            <a-form
                :model="form"
                layout="vertical"
                @submit="handleEmailRegister"
                class="mt-8"
            >
                <a-form-item
                    field="username"
                    label="用户名"
                    :rules="[
                        { required: true, message: '请输入用户名' },
                        {
                            minLength: 3,
                            maxLength: 20,
                            message: '用户名长度为 3-20 个字符',
                        },
                    ]"
                >
                    <a-input
                        v-model="form.username"
                        placeholder="请输入用户名"
                        allow-clear
                        size="large"
                    >
                        <template #prefix>
                            <icon-user />
                        </template>
                    </a-input>
                </a-form-item>

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
                    :rules="[
                        { required: true, message: '请输入密码' },
                        { minLength: 6, message: '密码长度至少 6 个字符' },
                    ]"
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

                <a-form-item
                    field="confirmPassword"
                    label="确认密码"
                    :rules="[
                        { required: true, message: '请再次输入密码' },
                        {
                            validator: (value, cb) => {
                                if (value !== form.password) {
                                    cb('两次输入的密码不一致');
                                } else {
                                    cb();
                                }
                            },
                        },
                    ]"
                >
                    <a-input-password
                        v-model="form.confirmPassword"
                        placeholder="请再次输入密码"
                        allow-clear
                        size="large"
                    >
                        <template #prefix>
                            <icon-lock />
                        </template>
                    </a-input-password>
                </a-form-item>

                <a-button
                    type="primary"
                    html-type="submit"
                    long
                    size="large"
                    :loading="isLoading"
                    class="mt-4"
                >
                    注册
                </a-button>
            </a-form>

            <div class="relative my-6">
                <div class="absolute inset-0 flex items-center">
                    <div class="w-full border-t border-gray-300"></div>
                </div>
                <div class="relative flex justify-center text-sm">
                    <span class="px-2 bg-white text-gray-500">
                        或者使用以下方式注册
                    </span>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
                <a-button
                    long
                    size="large"
                    @click="handleGithubRegister"
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
                    @click="handleGoogleRegister"
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
                    <span class="text-gray-600 text-sm">已有账号？</span>
                    <a-link @click="goToLogin">立即登录</a-link>
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
    IconUser,
    IconEmail,
    IconLock,
} from "@arco-design/web-vue/es/icon";
import {
    signInWithGithub,
    signInWithGoogle,
    signUpWithEmail,
} from "@/services/auth.js";

const router = useRouter();
const isLoading = ref(false);
const form = reactive({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
});

// 处理 GitHub 注册
async function handleGithubRegister() {
    if (isLoading.value) return;
    isLoading.value = true;
    try {
        await signInWithGithub();
    } catch (error) {
        isLoading.value = false;
        Message.error(error.message || "GitHub 注册失败，请稍后再试");
    }
}

// 处理 Google 注册
async function handleGoogleRegister() {
    if (isLoading.value) return;
    isLoading.value = true;
    try {
        await signInWithGoogle();
    } catch (error) {
        isLoading.value = false;
        Message.error(error.message || "Google 注册失败，请稍后再试");
    }
}

// 处理邮箱注册
async function handleEmailRegister({ errors }) {
    if (errors) return;

    isLoading.value = true;

    try {
        await signUpWithEmail(form.email, form.password, {
            username: form.username,
        });

        Message.success("注册成功！请查收邮箱验证邮件");

        setTimeout(() => {
            router.push("/login");
        }, 2000);
    } catch (error) {
        isLoading.value = false;
        if (error.message.includes("User already registered")) {
            Message.error("该邮箱已被注册");
        } else if (
            error.message.includes("Password should be at least 6 characters")
        ) {
            Message.error("密码长度至少 6 个字符");
        } else {
            Message.error(error.message || "注册失败，请稍后再试");
        }
    }
}

function goToLogin() {
    router.push("/login");
}

function goToHome() {
    router.push("/");
}
</script>
