<!--
 * @Author: zi.yang
 * @Date: 2026-01-02 00:00:00
 * @LastEditors: zi.yang
 * @LastEditTime: 2026-01-02 00:00:00
 * @Description: 错误页面组件
 * @FilePath: /short-link/src/views/error/index.vue
-->
<template>
    <div class="error-page">
        <div class="bg-blur-top"></div>
        <div class="bg-blur-bottom"></div>

        <div class="card">
            <div class="icon-container">
                <div class="icon-bg"></div>
                <div class="icon-circle">
                    <span class="icon-main">🔗</span>
                </div>
                <div class="icon-badge">
                    <span class="icon-warning">⚠️</span>
                </div>
            </div>

            <h1>{{ title }}</h1>
            <p class="message">{{ message }}</p>

            <div class="button-group">
                <button class="btn btn-secondary" @click="retry">
                    <svg
                        t="1767278309696"
                        viewBox="0 0 1024 1024"
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                    >
                        <path
                            d="M148.4 495.5c1.9-43.2 11.4-85.1 28.1-124.7 18.3-43.3 44.5-82.1 77.9-115.5 33.4-33.4 72.2-59.6 115.5-77.9 44.8-18.9 92.3-28.5 141.4-28.5 49.1 0 96.6 9.6 141.4 28.5 43.3 18.3 82.1 44.5 115.5 77.9 6.2 6.2 12.1 12.5 17.8 19.1l50.4-17.5c-75.7-96.2-193.2-158-325.1-158C283.1 98.9 98 283.9 98 512.2v0.8l50.4-17.5zM874.2 531.3c-2.2 42.3-11.6 83.4-28 122.3-18.3 43.3-44.5 82.1-77.9 115.5-33.4 33.4-72.2 59.6-115.5 77.9-44.8 18.9-92.3 28.5-141.4 28.5-49.1 0-96.6-9.6-141.4-28.5-43.3-18.3-82.1-44.5-115.5-77.9-6.1-6.1-12-12.4-17.6-18.9l-50.5 17.3c75.7 96.2 193.1 158 325 158 227.7 0 412.4-184.1 413.3-411.6l-50.5 17.4z"
                            fill="currentColor"
                        ></path>
                        <path
                            d="M818 564l78.2-100 78.1 100zM49.2 464L128 564l79-100z"
                            fill="currentColor"
                        ></path>
                    </svg>
                    重试
                </button>
                <button class="btn btn-primary" @click="goHome">
                    <svg
                        t="1767278330980"
                        viewBox="0 0 1024 1024"
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                    >
                        <path
                            d="M925.859307 516.069689c-6.916527 0-13.899568-2.099824-19.925818-6.471388L511.999488 224.273926 118.064464 509.5983c-15.208377 11.042497-36.482913 7.627724-47.504944-7.587815-11.015891-15.214517-7.614421-36.489052 7.601118-47.504944l413.886425-299.781644c11.906168-8.636704 27.998681-8.636704 39.904849 0l413.887448 299.781644c15.214517 11.015891 18.615986 32.290427 7.601118 47.504944C946.782849 511.193635 936.397315 516.069689 925.859307 516.069689z"
                            fill="currentColor"
                        ></path>
                        <path
                            d="M827.579957 875.753631 604.764242 875.753631c-18.789948 0-34.017768-15.22782-34.017768-34.016745L570.746474 590.190827 453.212594 590.190827l0 251.545036c0 18.788925-15.22782 34.016745-34.017768 34.016745L196.404694 875.752608c-18.789948 0-34.017768-15.22782-34.017768-34.016745L162.386926 410.853345c0-18.788925 15.22782-34.017768 34.017768-34.017768 18.788925 0 34.017768 15.228843 34.017768 34.017768L230.422462 807.719118l154.753573 0L385.176035 556.173059c0-18.789948 15.22782-34.017768 34.017768-34.017768l185.569416 0c18.788925 0 34.017768 15.226796 34.017768 34.017768L638.780986 807.719118l154.780179 0L793.561166 410.853345c0-18.788925 15.228843-34.017768 34.017768-34.017768s34.017768 15.228843 34.017768 34.017768l0 430.882518C861.598748 860.525811 846.369905 875.753631 827.579957 875.753631z"
                            fill="currentColor"
                        ></path>
                    </svg>
                    返回首页
                </button>
            </div>

            <div class="help-section">
                <p class="help-text">
                    需要帮助?
                    <a
                        class="help-link"
                        href="https://github.com/Alessandro-Pang/short-link/issues"
                        target="_blank"
                    >
                        联系站长
                        <span class="icon-small">↗</span>
                    </a>
                </p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

const title = ref("链接无效");
const message = ref("短链接不存在");

onMounted(() => {
    // 从 query 参数获取错误信息
    if (route.query.title) {
        title.value = decodeURIComponent(route.query.title.toString());
    }
    if (route.query.message) {
        message.value = decodeURIComponent(route.query.message.toString());
    }
});

const retry = () => {
    window.location.replace(`/u/${route.query.short}`);
};

const goHome = () => {
    router.push("/");
};
</script>

<style scoped>
.error-page {
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
    background: rgba(239, 68, 68, 0.05);
    border-radius: 50%;
    filter: blur(120px);
    transform: translate(33%, 33%);
    pointer-events: none;
}

.card {
    max-width: 480px;
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

@media (min-width: 768px) {
    .card {
        padding: 3rem;
    }
}

.icon-container {
    margin-bottom: 2rem;
    position: relative;
}

.icon-bg {
    position: absolute;
    inset: 0;
    background: rgb(var(--danger-1));
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
    width: 6rem;
    height: 6rem;
    border-radius: 50%;
    background: linear-gradient(
        to bottom right,
        rgb(var(--danger-1)),
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
    font-size: 3rem;
    line-height: 1;
}

.icon-badge {
    position: absolute;
    bottom: -0.25rem;
    right: -0.25rem;
    z-index: 20;
    background: var(--color-bg-2);
    border-radius: 50%;
    padding: 0.375rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    border: 1px solid rgb(var(--danger-1));
}

.icon-warning {
    font-size: 1.25rem;
    line-height: 1;
}

h1 {
    font-size: 1.875rem;
    font-weight: 700;
    color: var(--color-text-1);
    margin-bottom: 1rem;
    letter-spacing: -0.025em;
}

.message {
    color: var(--color-text-3);
    margin-bottom: 2.5rem;
    line-height: 1.625;
    font-size: 1rem;
}

.button-group {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
    justify-content: center;
}

@media (min-width: 640px) {
    .button-group {
        flex-direction: row;
    }
}

.btn {
    flex: 1;
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
}

.btn svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
}

.btn-secondary {
    border: 1px solid var(--color-border-2);
    background: transparent;
    color: var(--color-text-1);
}

.btn-secondary:hover {
    background: var(--color-fill-1);
}

.btn-primary {
    background: rgb(var(--primary-6));
    color: white;
    box-shadow: 0 10px 15px -3px rgba(22, 93, 255, 0.2);
}

.btn-primary:hover {
    background: rgb(var(--primary-5));
    box-shadow: 0 10px 15px -3px rgba(22, 93, 255, 0.4);
    transform: translateY(-2px);
}

.help-section {
    margin-top: 2.5rem;
    padding-top: 1.5rem;
    border-top: 1px dashed var(--color-border-2);
    width: 100%;
}

.help-text {
    font-size: 0.75rem;
    color: var(--color-text-3);
}

.help-link {
    color: rgb(var(--primary-6));
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    transition: color 0.2s;
    text-decoration: none;
}

.help-link:hover {
    color: rgb(var(--primary-5));
    text-decoration: underline;
    text-decoration-color: rgba(22, 93, 255, 0.3);
    text-underline-offset: 4px;
}

.icon-small {
    font-size: 0.875rem;
    margin-left: 0.125rem;
}
</style>
