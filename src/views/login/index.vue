<template>
    <AuthLayout
        branding-title="Short Link Service"
        branding-description="专业的短链接生成与管理平台，提供详细的数据分析和稳定的访问服务。"
    >
        <div class="text-center lg:text-left">
            <h2 class="text-3xl font-bold text-gray-900 tracking-tight">
                欢迎回来
            </h2>
            <p class="mt-2 text-gray-500">请输入您的账号信息以登录控制台</p>
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
                :loading="userStore.isLoading"
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

        <SocialAuthButtons
            :loading="userStore.isLoading"
            @github-login="handleGithubLogin"
            @google-login="handleGoogleLogin"
        />

        <div class="text-center mt-8">
            <p class="text-gray-600">
                还没有账号？
                <a-link @click="goToRegister" class="font-bold! cursor-pointer"
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
    </AuthLayout>
</template>

<script setup lang="ts">
import { Message } from "@arco-design/web-vue";
import { IconEmail, IconLeft, IconLock } from "@arco-design/web-vue/es/icon";
import { onMounted, onUnmounted, reactive } from "vue";
import { useRouter } from "vue-router";
import AuthLayout from "@/components/AuthLayout.vue";
import SocialAuthButtons from "@/components/base/SocialAuthButtons.vue";
import { useUserStore } from "@/stores";

const router = useRouter();
const userStore = useUserStore();

const form = reactive({
	email: "",
	password: "",
});

// 处理认证错误事件（用于第三方登录被禁用提示）
function handleAuthError(event: any) {
	const { error } = event.detail;
	if (error?.code === "USER_BANNED") {
		Message.error({
			content: error.message || "您的账号已被管理员禁用，请联系管理员",
			duration: 5000,
		});
	}
}

// 检查 URL 中的 OAuth 错误参数
function checkOAuthError() {
	const urlParams = new URLSearchParams(window.location.search);
	const error = urlParams.get("error");
	const errorCode = urlParams.get("error_code");
	const errorDescription = urlParams.get("error_description");

	if (error) {
		let errorMessage = "登录失败";

		if (errorCode === "user_banned" || errorDescription?.includes("banned")) {
			errorMessage = "您的账号已被管理员禁用，请联系管理员";

			// 记录失败日志（尝试从其他 URL 参数获取邮箱）
			const email = urlParams.get("email") || sessionStorage.getItem("oauth_email");
			if (email) {
				import("@/services/auth").then(({ recordLoginAttempt }) => {
					recordLoginAttempt(email, false, "用户已被禁用", "oauth");
				});
			}
		} else if (error === "access_denied") {
			errorMessage = "您拒绝了授权请求";
		} else {
			errorMessage = errorDescription || `登录失败: ${error}`;
		}

		Message.error({
			content: errorMessage,
			duration: 5000,
		});

		// 清理 URL 中的错误参数
		const cleanUrl = window.location.pathname;
		window.history.replaceState({}, document.title, cleanUrl);
	}
}

// 组件挂载时添加事件监听和检查 URL 错误
onMounted(() => {
	window.addEventListener("auth-error", handleAuthError);
	checkOAuthError();
});

// 组件卸载时移除事件监听
onUnmounted(() => {
	window.removeEventListener("auth-error", handleAuthError);
});

// 处理 GitHub 登录
async function handleGithubLogin() {
	if (userStore.isLoading) return;
	try {
		await userStore.loginWithGithub();
	} catch (error: any) {
		Message.error(error.message || "GitHub 登录失败，请稍后再试");
	}
}

// 处理 Google 登录
async function handleGoogleLogin() {
	if (userStore.isLoading) return;
	try {
		await userStore.loginWithGoogle();
	} catch (error: any) {
		Message.error(error.message || "Google 登录失败，请稍后再试");
	}
}

// 处理邮箱登录
async function handleEmailLogin({ errors }: any) {
	if (errors) return;

	try {
		await userStore.loginWithEmail(form.email, form.password);
		Message.success("登录成功！");
		setTimeout(() => {
			router.push("/dashboard");
		}, 500);
	} catch (error: any) {
		console.error("登录错误:", error);

		// 处理不同的错误情况
		if (error.code === "USER_BANNED") {
			// 用户被禁用的特殊提示
			Message.error({
				content: "您的账号已被管理员禁用，如有疑问请联系管理员",
				duration: 5000,
			});
		} else if (error.message.includes("Invalid login credentials")) {
			Message.error("邮箱或密码错误");
		} else if (error.message.includes("Email not confirmed")) {
			Message.error("请先验证您的邮箱");
		} else if (error.message.includes("禁用")) {
			// 兜底处理所有包含"禁用"的错误消息
			Message.error({
				content: error.message,
				duration: 5000,
			});
		} else {
			Message.error(error.message || "登录失败，请稍后再试");
		}
	}
}

function handleForgotPassword() {
	router.push("/forgot-password");
}

function goToRegister() {
	router.push("/register");
}

function goToHome() {
	router.push("/");
}
</script>

<style scoped>
.text-3xl {
    font-size: 30px;
}

.font-bold {
    font-weight: 700;
}

.text-gray-900 {
    color: #1d2129;
}

.tracking-tight {
    letter-spacing: -0.025em;
}

.mt-2 {
    margin-top: 8px;
}

.mt-4 {
    margin-top: 16px;
}

.mt-8 {
    margin-top: 32px;
}

.mb-6 {
    margin-bottom: 24px;
}

.my-8 {
    margin-top: 32px;
    margin-bottom: 32px;
}

.text-gray-500 {
    color: #86909c;
}

.text-gray-600 {
    color: #4e5969;
}

.text-gray-400 {
    color: #86909c;
}

.text-sm {
    font-size: 14px;
}

.text-base {
    font-size: 16px;
}

.font-medium {
    font-weight: 500;
}

.text-center {
    text-align: center;
}

.flex {
    display: flex;
}

.items-center {
    align-items: center;
}

.justify-between {
    justify-content: space-between;
}

.justify-center {
    justify-content: center;
}

.relative {
    position: relative;
}

.absolute {
    position: absolute;
}

.inset-0 {
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
}

.w-full {
    width: 100%;
}

.border-t {
    border-top-width: 1px;
}

.border-gray-200 {
    border-color: #e5e6eb;
}

.px-4 {
    padding-left: 16px;
    padding-right: 16px;
}

.bg-white {
    background-color: white;
}

.cursor-pointer {
    cursor: pointer;
}

@media (min-width: 1024px) {
    .lg\:text-left {
        text-align: left;
    }
}
</style>
