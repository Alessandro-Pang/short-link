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
                    加入 Short Link
                </h1>
                <p
                    class="text-blue-100 text-lg max-w-md mx-auto leading-relaxed"
                >
                    立即注册，开始体验高效的短链接管理服务，让分享变得更简单。
                </p>
            </div>
        </div>

        <!-- Right Side - Register Form -->
        <div class="flex-1 flex items-center justify-center p-4 sm:p-12">
            <div class="w-full max-w-md space-y-8">
                <div class="text-center lg:text-left">
                    <h2 class="text-3xl font-bold text-gray-900 tracking-tight">
                        创建账号
                    </h2>
                    <p class="mt-2 text-gray-500">填写以下信息以开始使用</p>
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
                            class="rounded-lg!"
                        >
                            <template #prefix>
                                <icon-user class="text-gray-400" />
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
                        :rules="passwordRules"
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
                        :loading="isLoading"
                        class="rounded-lg! h-12! text-base! font-medium! mt-2"
                    >
                        注册
                    </a-button>
                </a-form>

                <div class="relative my-8">
                    <div class="absolute inset-0 flex items-center">
                        <div class="w-full border-t border-gray-200"></div>
                    </div>
                    <div class="relative flex justify-center text-sm">
                        <span class="px-4 bg-white text-gray-500">
                            或者使用以下方式注册
                        </span>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <button
                        type="button"
                        class="flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 cursor-pointer"
                        @click="handleGithubRegister"
                        :disabled="isLoading"
                    >
                        <icon-github class="text-xl" />
                        <span class="text-gray-700 font-medium">GitHub</span>
                    </button>
                    <button
                        type="button"
                        class="flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 cursor-pointer"
                        @click="handleGoogleRegister"
                        :disabled="isLoading"
                    >
                        <icon-google class="text-xl" />
                        <span class="text-gray-700 font-medium">Google</span>
                    </button>
                </div>

                <div class="text-center mt-8">
                    <p class="text-gray-600">
                        已有账号？
                        <a-link
                            @click="goToLogin"
                            class="font-bold! cursor-pointer"
                            >立即登录</a-link
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
import { computed, ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { Message } from "@arco-design/web-vue";
import {
    IconGithub,
    IconGoogle,
    IconUser,
    IconEmail,
    IconLock,
    IconLink,
    IconLeft,
} from "@arco-design/web-vue/es/icon";
import {
    signInWithGithub,
    signInWithGoogle,
    signUpWithEmail,
} from "@/services/auth.js";
import { makePasswordRules } from "@/utils/validator.js";

const router = useRouter();
const isLoading = ref(false);
const form = reactive({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
});

const passwordRules = computed(() =>
    makePasswordRules({
        getUsername: () => form.username,
        getEmail: () => form.email,
        requiredMessage: "请输入密码",
    }),
);

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
