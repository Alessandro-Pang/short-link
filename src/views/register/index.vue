<template>
    <AuthLayout
        branding-title="加入 Short Link"
        branding-description="立即注册，开始体验高效的短链接管理服务，让分享变得更简单。"
    >
        <div class="text-center lg:text-left">
            <h2 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                创建账号
            </h2>
            <p class="mt-2 text-gray-500 dark:text-gray-400">填写以下信息以开始使用</p>
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
                        <icon-user class="text-gray-400 dark:text-gray-500" />
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
                        <icon-email class="text-gray-400 dark:text-gray-500" />
                    </template>
                </a-input>
            </a-form-item>

            <a-form-item field="password" label="密码" :rules="passwordRules">
                <a-input-password
                    v-model="form.password"
                    placeholder="请输入密码"
                    allow-clear
                    size="large"
                    class="rounded-lg!"
                >
                    <template #prefix>
                        <icon-lock class="text-gray-400 dark:text-gray-500" />
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
                        <icon-lock class="text-gray-400 dark:text-gray-500" />
                    </template>
                </a-input-password>
            </a-form-item>

            <a-button
                type="primary"
                html-type="submit"
                long
                size="large"
                :loading="userStore.isLoading"
                class="rounded-lg! h-12! text-base! font-medium! mt-2"
            >
                注册
            </a-button>
        </a-form>

        <div class="relative my-8">
            <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div class="relative flex justify-center text-sm">
                <span class="px-4 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                    或者使用以下方式注册
                </span>
            </div>
        </div>

        <SocialAuthButtons
            :loading="userStore.isLoading"
            @github-login="handleGithubRegister"
            @google-login="handleGoogleRegister"
        />

        <div class="text-center mt-8">
            <p class="text-gray-600 dark:text-gray-400">
                已有账号？
                <a-link @click="goToLogin" class="font-bold! cursor-pointer"
                    >立即登录</a-link
                >
            </p>
            <div class="mt-4">
                <a-link
                    @click="goToHome"
                    class="text-gray-400! hover:text-gray-600! dark:text-gray-500! dark:hover:text-gray-300! text-sm"
                >
                    <icon-left /> 返回首页
                </a-link>
            </div>
        </div>
    </AuthLayout>
</template>

<script setup lang="ts">
import { Message } from "@arco-design/web-vue";
import { IconEmail, IconLeft, IconLock, IconUser } from "@arco-design/web-vue/es/icon";
import { computed, reactive } from "vue";
import { useRouter } from "vue-router";
import AuthLayout from "@/components/AuthLayout.vue";
import SocialAuthButtons from "@/components/base/SocialAuthButtons.vue";
import { useUserStore } from "@/stores";
import { makePasswordRules } from "@/utils/validator";

const router = useRouter();
const userStore = useUserStore();

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
	if (userStore.isLoading) return;
	try {
		await userStore.loginWithGithub();
	} catch (error: any) {
		Message.error(error.message || "GitHub 注册失败，请稍后再试");
	}
}

// 处理 Google 注册
async function handleGoogleRegister() {
	if (userStore.isLoading) return;
	try {
		await userStore.loginWithGoogle();
	} catch (error: any) {
		Message.error(error.message || "Google 注册失败，请稍后再试");
	}
}

// 处理邮箱注册
async function handleEmailRegister({ errors }: any) {
	if (errors) return;

	try {
		await userStore.registerWithEmail(form.email, form.password, {
			name: form.username,
		});

		Message.success("注册成功！请查收邮箱验证邮件");

		setTimeout(() => {
			router.push("/login");
		}, 2000);
	} catch (error: any) {
		if (error.message.includes("User already registered")) {
			Message.error("该邮箱已被注册");
		} else if (error.message.includes("Password should be at least 6 characters")) {
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
