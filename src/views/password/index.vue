<!--
 * @Author: zi.yang
 * @Date: 2026-01-02 00:00:00
 * @LastEditors: zi.yang
 * @LastEditTime: 2026-01-02 00:00:00
 * @Description: 密码验证页面组件
 * @FilePath: /short-link/src/views/password/index.vue
-->
<template>
    <div class="password-page">
        <div class="bg-blur-top"></div>
        <div class="bg-blur-bottom"></div>

        <div class="card">
            <div class="icon-container">
                <div class="icon-bg"></div>
                <div class="icon-circle">
                    <span class="icon-main">🔐</span>
                </div>
            </div>

            <h1>访问受密码保护</h1>
            <p class="description">
                此短链接需要密码才能访问，请输入正确的密码继续
            </p>

            <form class="form-container" @submit.prevent="handleSubmit">
                <div class="form-group">
                    <label for="password">密码</label>
                    <div class="input-wrapper">
                        <input
                            v-model="password"
                            type="password"
                            id="password"
                            name="password"
                            placeholder="请输入访问密码"
                            autocomplete="off"
                            required
                            autofocus
                            @input="clearError"
                        />
                    </div>
                    <div v-if="errorMessage" class="error-message">
                        {{ errorMessage }}
                    </div>
                </div>

                <button
                    type="submit"
                    class="btn btn-primary"
                    :disabled="loading"
                >
                    <span v-if="!loading">验证并访问</span>
                    <span v-else class="loading-wrapper">
                        <span class="loading"></span>
                        验证中...
                    </span>
                </button>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

const password = ref("");
const errorMessage = ref("");
const loading = ref(false);
const shortCode = ref("");

onMounted(() => {
    // 从路由参数获取短链接代码
    shortCode.value = route.params.hash.toString();
});

const clearError = () => {
    errorMessage.value = "";
};

const handleSubmit = async () => {
    const pwd = password.value.trim();

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
            // 密码正确,跳转到目标链接
            window.location.href = response.data.url;
        } else {
            errorMessage.value = response.msg || "密码错误，请重试";
            password.value = "";
        }
    } catch (error: any) {
        if (error.response?.msg) {
            errorMessage.value = error.response.msg;
        } else {
            errorMessage.value = "验证失败，请稍后重试";
        }
        password.value = "";
    } finally {
        loading.value = false;
    }
};
</script>

<style scoped>
.password-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    position: relative;
    overflow: hidden;
    background-color: var(--color-bg-1);
    background-image: radial-gradient(
        var(--color-border-1) 1.5px,
        transparent 1.5px
    );
    background-size: 24px 24px;
}

.bg-blur-top {
    position: absolute;
    top: 0;
    left: 0;
    width: 600px;
    height: 600px;
    background: rgba(59, 130, 246, 0.05);
    border-radius: 50%;
    filter: blur(120px);
    transform: translate(-33%, -33%);
    pointer-events: none;
}

.bg-blur-bottom {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 600px;
    height: 600px;
    background: rgba(139, 92, 246, 0.05);
    border-radius: 50%;
    filter: blur(120px);
    transform: translate(33%, 33%);
    pointer-events: none;
}

.card {
    max-width: 420px;
    width: 100%;
    background: var(--color-bg-2);
    border-radius: 16px;
    box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.08);
    padding: 2.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    border: 1px solid var(--color-border-2);
    position: relative;
    z-index: 10;
    backdrop-filter: blur(16px);
}

.icon-container {
    margin-bottom: 1.5rem;
    position: relative;
}

.icon-bg {
    position: absolute;
    inset: 0;
    background: rgb(var(--primary-1));
    border-radius: 50%;
    transform: scale(1.6);
    opacity: 0.6;
    transition: transform 0.5s ease-out;
}

.icon-container:hover .icon-bg {
    transform: scale(1.7);
}

.icon-circle {
    position: relative;
    width: 5rem;
    height: 5rem;
    border-radius: 50%;
    background: linear-gradient(
        to bottom right,
        rgb(var(--primary-1)),
        var(--color-bg-2)
    );
    display: flex;
    align-items: center;
    justify-content: center;
    border: 4px solid var(--color-bg-2);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    z-index: 10;
}

.icon-main {
    font-size: 2.5rem;
    line-height: 1;
}

h1 {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-text-1);
    margin-bottom: 0.5rem;
    letter-spacing: -0.025em;
}

.description {
    color: var(--color-text-3);
    margin-bottom: 2rem;
    line-height: 1.5;
    font-size: 0.875rem;
}

.form-container {
    width: 100%;
}

.form-group {
    margin-bottom: 1rem;
    text-align: left;
}

label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-1);
    margin-bottom: 0.5rem;
}

.input-wrapper {
    position: relative;
}

input[type="password"] {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid var(--color-border-2);
    border-radius: 8px;
    font-size: 1rem;
    transition: all 0.2s;
    outline: none;
    background: var(--color-bg-2);
    color: var(--color-text-1);
}

input[type="password"]:focus {
    border-color: rgb(var(--primary-6));
    box-shadow: 0 0 0 3px rgba(22, 93, 255, 0.1);
}

.error-message {
    color: rgb(var(--danger-6));
    font-size: 0.875rem;
    margin-top: 0.5rem;
}

.btn {
    width: 100%;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 500;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    outline: none;
    cursor: pointer;
    font-size: 1rem;
    border: none;
    margin-top: 0.5rem;
}

.btn-primary {
    background: rgb(var(--primary-6));
    color: white;
    box-shadow: 0 4px 12px rgba(22, 93, 255, 0.25);
}

.btn-primary:hover:not(:disabled) {
    background: rgb(var(--primary-5));
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(22, 93, 255, 0.35);
}

.btn-primary:active:not(:disabled) {
    transform: translateY(0);
}

.btn-primary:disabled {
    background: var(--color-fill-3);
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}

.loading-wrapper {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.loading {
    display: inline-block;
    width: 1rem;
    height: 1rem;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}
</style>
