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
                        <icon-lock class="text-5xl text-white" />
                    </div>
                </div>
                <h1 class="text-4xl font-bold text-white mb-6 tracking-tight">
                    重置密码
                </h1>
                <p
                    class="text-blue-100 text-lg max-w-md mx-auto leading-relaxed"
                >
                    请输入新的登录密码。为保障账户安全，请使用更复杂的密码组合。
                </p>
            </div>
        </div>

        <!-- Right Side - Reset Form -->
        <div class="flex-1 flex items-center justify-center p-4 sm:p-12">
            <div class="w-full max-w-md space-y-8">
                <div class="text-center lg:text-left">
                    <h2 class="text-3xl font-bold text-gray-900 tracking-tight">
                        设置新密码
                    </h2>
                    <p class="mt-2 text-gray-500">
                        你正在通过邮件链接重置密码。设置成功后将跳转至登录页。
                    </p>
                </div>

                <a-alert
                    v-if="hint"
                    :type="hintType"
                    class="shadow-sm border-gray-100"
                >
                    {{ hint }}
                </a-alert>

                <a-form
                    :model="form"
                    layout="vertical"
                    @submit="handleResetPassword"
                    class="mt-8"
                >
                    <a-form-item
                        field="password"
                        label="新密码"
                        :rules="passwordRules"
                    >
                        <a-input-password
                            v-model="form.password"
                            placeholder="请输入新密码"
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
                        label="确认新密码"
                        :rules="[
                            { required: true, message: '请再次输入新密码' },
                            {
                                validator: (value, cb) => {
                                    if (String(value || '') !== form.password) {
                                        cb('两次输入的密码不一致');
                                        return;
                                    }
                                    cb();
                                },
                            },
                        ]"
                    >
                        <a-input-password
                            v-model="form.confirmPassword"
                            placeholder="请再次输入新密码"
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
                        class="rounded-lg! h-12! text-base! font-medium!"
                    >
                        重置密码
                    </a-button>
                </a-form>

                <div class="text-center mt-8">
                    <a-link
                        @click="goToLogin"
                        class="text-gray-500! hover:text-gray-700! text-sm"
                    >
                        <icon-left /> 返回登录
                    </a-link>
                </div>

                <div class="text-xs text-gray-400 leading-relaxed">
                    <div class="font-medium text-gray-500 mb-1">提示</div>
                    <ul class="list-disc pl-5 space-y-1">
                        <li>
                            链接可能有时效性，若提示无效请重新发起找回密码。
                        </li>
                        <li>
                            若你的网站部署域名变更，请确保 Supabase
                            的重定向域名配置正确。
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { onMounted, reactive, ref, computed } from "vue";
import { useRouter } from "vue-router";
import { Message } from "@arco-design/web-vue";
import { IconLock, IconLeft } from "@arco-design/web-vue/es/icon";
import { supabase } from "@/services/supabase";
import { updatePassword } from "@/services/auth";
import { makePasswordRules } from "@/utils/validator";

const router = useRouter();
const isLoading = ref(false);

const form = reactive({
    password: "",
    confirmPassword: "",
});

const hint = ref("");
const hintType = ref("info");

const passwordRules = computed(() =>
    makePasswordRules({
        requiredMessage: "请输入新密码",
    }),
);

/**
 * Supabase 重置密码流程说明（email link）：
 * - 用户点击 resetPasswordForEmail 发送的链接后，会回到站点（redirectTo）
 * - Supabase 会把 token 信息放在 URL hash 中，并由客户端解析建立临时 session
 * - 在该页面里调用 supabase.auth.getSession() / updateUser({password}) 完成重置
 *
 * 注意：本项目使用的是 supabase-js v2。
 */
onMounted(async () => {
    try {
        // 尝试恢复 session（如果用户是从邮件链接进来的，hash 里会包含 token）
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (!data?.session) {
            hintType.value = "warning";
            hint.value =
                "未检测到有效的重置会话。请通过“忘记密码”重新发送重置邮件后再尝试。";
        } else {
            hintType.value = "info";
            hint.value = "已验证重置链接，请设置你的新密码。";
        }
    } catch (e) {
        hintType.value = "warning";
        hint.value =
            e?.message ||
            "无法验证重置链接。请通过“忘记密码”重新发送重置邮件后再尝试。";
    }
});

async function handleResetPassword({ errors }) {
    if (errors) return;

    isLoading.value = true;
    try {
        // 二次兜底：确认两次输入一致
        if (form.password !== form.confirmPassword) {
            Message.error("两次输入的密码不一致");
            isLoading.value = false;
            return;
        }

        // 若未建立 session，则 updatePassword 大概率会失败；这里提前提示
        const { data } = await supabase.auth.getSession();
        if (!data?.session) {
            Message.error(
                "重置链接无效或已过期，请返回登录页重新发起找回密码。",
            );
            isLoading.value = false;
            return;
        }

        await updatePassword(form.password);

        Message.success("密码已更新，请使用新密码登录");
        setTimeout(() => {
            router.push("/login");
        }, 500);
    } catch (error) {
        // 常见错误：Auth session missing / expired
        const msg = String(error?.message || "");
        if (msg.toLowerCase().includes("auth session missing")) {
            Message.error("重置链接已失效，请重新发送重置邮件");
        } else {
            Message.error(error?.message || "重置密码失败，请稍后重试");
        }
    } finally {
        isLoading.value = false;
    }
}

function goToLogin() {
    router.push("/login");
}
</script>
