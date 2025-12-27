<template>
    <div class="register-wrapper">
        <div class="register-card">
            <h1 class="register-title">注册</h1>
            <p class="register-subtitle">创建账号以管理您的短链接</p>

            <!-- Email 注册表单 -->
            <form class="register-form" @submit.prevent="handleEmailRegister">
                <div class="form-group">
                    <label for="username">用户名</label>
                    <input
                        type="text"
                        id="username"
                        v-model="username"
                        placeholder="请输入用户名"
                        required
                        minlength="3"
                        maxlength="20"
                    />
                    <span class="form-hint">用户名长度为 3-20 个字符</span>
                </div>

                <div class="form-group">
                    <label for="email">邮箱</label>
                    <input
                        type="email"
                        id="email"
                        v-model="email"
                        placeholder="请输入邮箱"
                        required
                    />
                </div>

                <div class="form-group">
                    <label for="password">密码</label>
                    <input
                        type="password"
                        id="password"
                        v-model="password"
                        placeholder="请输入密码"
                        required
                        minlength="6"
                    />
                    <span class="form-hint">密码长度至少 6 个字符</span>
                </div>

                <div class="form-group">
                    <label for="confirmPassword">确认密码</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        v-model="confirmPassword"
                        placeholder="请再次输入密码"
                        required
                    />
                </div>

                <div class="form-actions">
                    <button
                        type="submit"
                        class="register-button"
                        :disabled="isLoading"
                    >
                        <LoadingSpinner v-if="isLoading" :active="true" />
                        <span v-else>注册</span>
                    </button>
                </div>
            </form>

            <!-- OAuth 注册按钮 -->
            <div class="oauth-buttons">
                <button
                    type="button"
                    class="oauth-button github"
                    @click="handleGithubRegister"
                    :disabled="isLoading"
                >
                    <svg
                        viewBox="0 0 24 24"
                        width="20"
                        height="20"
                        fill="currentColor"
                    >
                        <path
                            d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
                        />
                    </svg>
                    <span> GitHub </span>
                </button>

                <button
                    type="button"
                    class="oauth-button google"
                    @click="handleGoogleRegister"
                    :disabled="isLoading"
                >
                    <svg viewBox="0 0 24 24" width="20" height="20">
                        <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                    </svg>
                    <span> Google </span>
                </button>
            </div>

            <div class="register-footer">
                <p>
                    已有账号？ <a href="#" @click.prevent="goToLogin">登录</a>
                </p>
                <p><a href="#" @click.prevent="goToHome">返回首页</a></p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import LoadingSpinner from "@/components/base/LoadingSpinner.vue";
import { showError, showMessage } from "@/utils/message.js";
import {
    signInWithGithub,
    signInWithGoogle,
    signUpWithEmail,
} from "@/services/auth.js";

// 响应式状态
const username = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const isLoading = ref(false);

// 路由
const router = useRouter();

// 处理 GitHub 注册
async function handleGithubRegister() {
    if (isLoading.value) return;

    isLoading.value = true;
    try {
        await signInWithGithub();
        // OAuth 会自动重定向，无需手动处理
    } catch (error) {
        isLoading.value = false;
        console.error("GitHub 注册失败:", error);
        showError(error.message || "GitHub 注册失败，请稍后再试");
    }
}

// 处理 Google 注册
async function handleGoogleRegister() {
    if (isLoading.value) return;

    isLoading.value = true;
    try {
        await signInWithGoogle();
        // OAuth 会自动重定向，无需手动处理
    } catch (error) {
        isLoading.value = false;
        console.error("Google 注册失败:", error);
        showError(error.message || "Google 注册失败，请稍后再试");
    }
}

// 处理邮箱注册
async function handleEmailRegister() {
    // 验证表单
    if (
        !username.value ||
        !email.value ||
        !password.value ||
        !confirmPassword.value
    ) {
        showError("请填写所有字段");
        return;
    }

    if (username.value.length < 3 || username.value.length > 20) {
        showError("用户名长度为 3-20 个字符");
        return;
    }

    if (password.value.length < 6) {
        showError("密码长度至少 6 个字符");
        return;
    }

    if (password.value !== confirmPassword.value) {
        showError("两次输入的密码不一致");
        return;
    }

    isLoading.value = true;

    try {
        const { user, session } = await signUpWithEmail(
            email.value,
            password.value,
            { username: username.value },
        );

        showMessage("注册成功！请查收邮箱验证邮件", "success");

        // 注册成功后跳转到登录页面
        setTimeout(() => {
            router.push("/login");
        }, 2000);
    } catch (error) {
        isLoading.value = false;
        console.error("邮箱注册失败:", error);

        // 处理不同类型的错误
        if (error.message.includes("User already registered")) {
            showError("该邮箱已被注册");
        } else if (
            error.message.includes("Password should be at least 6 characters")
        ) {
            showError("密码长度至少 6 个字符");
        } else {
            showError(error.message || "注册失败，请稍后再试");
        }
    }
}

// 跳转到登录页面
function goToLogin() {
    router.push("/login");
}

// 跳转到首页
function goToHome() {
    router.push("/");
}
</script>

<style scoped>
.register-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #f5f7fa, #c3cfe2);
    padding: 20px;
}

.register-card {
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
    width: 100%;
    max-width: 450px;
    padding: 40px;
    text-align: center;
    position: relative;
    overflow: hidden;
}

.register-card::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 6px;
    background: linear-gradient(90deg, #4776e6, #8e54e9);
}

.register-title {
    font-size: 28px;
    font-weight: 700;
    color: #2d3436;
    margin-bottom: 8px;
}

.register-subtitle {
    color: #636e72;
    margin-bottom: 30px;
    font-size: 14px;
}

.oauth-buttons {
    display: flex;
    gap: 12px;
    margin-top: 24px;
}

.oauth-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #e0e0e0;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    background-color: #fff;
}

.oauth-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.oauth-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.oauth-button.github {
    color: #24292e;
    border-color: #24292e;
}

.oauth-button.github:hover:not(:disabled) {
    background-color: #24292e;
    color: #fff;
}

.oauth-button.google {
    color: #4285f4;
    border-color: #4285f4;
}

.oauth-button.google:hover:not(:disabled) {
    background-color: #4285f4;
    color: #fff;
}

.oauth-button.google:hover:not(:disabled) svg path {
    fill: #fff;
}

.divider {
    position: relative;
    text-align: center;
    margin: 24px 0;
}

.divider::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background-color: #e0e0e0;
}

.divider span {
    position: relative;
    background-color: #fff;
    padding: 0 16px;
    color: #636e72;
    font-size: 13px;
}

.register-form {
    text-align: left;
}

.form-group {
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    color: #2d3436;
    font-weight: 600;
}

.form-group input {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #e0e0e0;
    border-radius: 12px;
    font-size: 16px;
    transition: all 0.3s ease;
    background-color: #f9f9f9;
}

.form-group input:focus {
    outline: none;
    border-color: #6c5ce7;
    box-shadow: 0 0 0 4px rgba(108, 92, 231, 0.15);
    background-color: #fff;
}

.form-hint {
    display: block;
    margin-top: 4px;
    font-size: 12px;
    color: #636e72;
}

.form-actions {
    margin-top: 24px;
}

.register-button {
    width: 100%;
    padding: 14px;
    background: linear-gradient(90deg, #4776e6, #8e54e9);
    color: #fff;
    border: none;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 10px rgba(108, 92, 231, 0.2);
    display: flex;
    justify-content: center;
    align-items: center;
}

.register-button:not(:disabled):hover {
    background: linear-gradient(90deg, #3d68d8, #7c48d5);
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(108, 92, 231, 0.3);
}

.register-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.register-footer {
    margin-top: 24px;
    font-size: 14px;
    color: #636e72;
}

.register-footer a {
    color: #6c5ce7;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.2s ease;
}

.register-footer a:hover {
    text-decoration: underline;
    color: #4834d4;
}

.register-footer p {
    margin: 8px 0;
}
</style>
