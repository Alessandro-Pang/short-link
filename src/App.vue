<template>
    <div class="app-container">
        <router-view />
    </div>
</template>

<script setup>
import { onMounted, onUnmounted } from "vue";
import { Message } from "@arco-design/web-vue";
import { useRouter } from "vue-router";
import { recordLoginAttempt, onAuthStateChange } from "@/services/auth.js";
import { supabase } from "@/services/supabase.js";

const router = useRouter();

// 认证状态监听器（用于清理）
let authListener = null;

// 监听认证错误事件
const handleAuthError = async (event) => {
    const { user, error } = event.detail || {};
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

// 检查 OAuth 回调中的错误（在 URL hash 或 query 中）
async function checkOAuthCallback() {
    // Supabase 可能会把错误放在 URL hash 或 query 中
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const queryParams = new URLSearchParams(window.location.search);

    const error = hashParams.get("error") || queryParams.get("error");
    const errorCode =
        hashParams.get("error_code") || queryParams.get("error_code");
    const errorDescription =
        hashParams.get("error_description") ||
        queryParams.get("error_description");

    if (error) {
        let errorMessage = "登录失败";
        let shouldRecordLog = false;
        let loginMethod = "oauth";

        // 判断是否是用户被禁用
        if (
            errorCode === "user_banned" ||
            errorDescription?.toLowerCase().includes("banned")
        ) {
            errorMessage = "您的账号已被管理员禁用，请联系管理员";
            shouldRecordLog = true;
        } else if (error === "access_denied") {
            // 用户拒绝授权，不是被禁用
            if (!errorDescription?.toLowerCase().includes("banned")) {
                errorMessage = "您拒绝了授权请求";
                shouldRecordLog = false;
            } else {
                errorMessage = "您的账号已被管理员禁用，请联系管理员";
                shouldRecordLog = true;
            }
        } else {
            errorMessage = errorDescription || `登录失败: ${error}`;
        }

        // 尝试获取用户邮箱来记录日志
        if (shouldRecordLog) {
            try {
                // 尝试从 Supabase session 中获取用户信息
                const {
                    data: { session },
                } = await supabase.auth.getSession();
                const email =
                    session?.user?.email ||
                    sessionStorage.getItem("oauth_email") ||
                    "unknown";

                // 记录失败日志
                await recordLoginAttempt(
                    email,
                    false,
                    "用户已被禁用",
                    loginMethod,
                );
            } catch (err) {
                console.error("记录登录日志失败:", err);
            }
        }

        // 显示错误提示
        Message.error({
            content: errorMessage,
            duration: 5000,
        });

        // 清理 URL 中的错误参数并跳转到登录页
        setTimeout(() => {
            router.push("/login");
        }, 1000);
    }
}

onMounted(() => {
    // 设置认证状态监听器（用于记录第三方登录）
    authListener = onAuthStateChange((event, session) => {
        console.log(
            "App.vue - Auth state changed:",
            event,
            session?.user?.email,
        );
        // onAuthStateChange 内部已经处理了登录记录逻辑
        // 这里不需要额外处理，只是确保监听器被设置
    });

    window.addEventListener("auth-error", handleAuthError);
    checkOAuthCallback();
});

onUnmounted(() => {
    window.removeEventListener("auth-error", handleAuthError);

    // 清理认证监听器
    if (authListener && authListener.data && authListener.data.subscription) {
        authListener.data.subscription.unsubscribe();
    }
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
