<template>
    <div class="app-container">
        <router-view />
    </div>
</template>

<script setup>
import { onMounted, onUnmounted } from "vue";
import { Message } from "@arco-design/web-vue";
import { useRouter } from "vue-router";

const router = useRouter();

// 监听认证错误事件
const handleAuthError = (event) => {
    const error = event.detail?.error;
    if (error) {
        if (error.code === "USER_BANNED") {
            Message.error({
                content:
                    error.message || "您的账号已被管理员禁用，请联系管理员",
                duration: 5000,
            });
            // 跳转到登录页
            setTimeout(() => {
                router.push("/login");
            }, 1000);
        }
    }
};

onMounted(() => {
    window.addEventListener("auth-error", handleAuthError);
});

onUnmounted(() => {
    window.removeEventListener("auth-error", handleAuthError);
});
</script>

<style>
/*
  这里不要做全局 reset（例如 * { margin/padding }、box-sizing、body 字体等），
  避免与 Tailwind 的 Preflight/Utilities 以及 Arco 的全局样式发生冲突，
  导致组件间距、字体、行高等出现"错乱"。
*/

.app-container {
    min-height: 100%;
    width: 100%;
}
</style>
