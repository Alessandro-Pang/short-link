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
                    找回密码
                </h1>
                <p
                    class="text-blue-100 text-lg max-w-md mx-auto leading-relaxed"
                >
                    输入你注册时的邮箱，我们会发送一封重置密码邮件。打开邮件中的链接即可设置新密码。
                </p>
            </div>
        </div>

        <!-- Right Side - Form -->
        <div class="flex-1 flex items-center justify-center p-4 sm:p-12">
            <div class="w-full max-w-md space-y-8">
                <div class="text-center lg:text-left">
                    <h2 class="text-3xl font-bold text-gray-900 tracking-tight">
                        重置你的密码
                    </h2>
                    <p class="mt-2 text-gray-500">
                        我们将向该邮箱发送重置密码链接
                    </p>
                </div>

                <a-alert
                    v-if="sent"
                    type="success"
                    class="shadow-sm border-green-200 bg-green-50"
                >
                    <template #icon
                        ><icon-check-circle-fill class="text-green-500"
                    /></template>
                    已发送重置邮件（如未收到，请检查垃圾箱或稍后重试）。
                </a-alert>

                <a-form
                    :model="form"
                    layout="vertical"
                    @submit="handleSendResetEmail"
                    class="mt-6"
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
                            :disabled="isLoading"
                        >
                            <template #prefix>
                                <icon-email class="text-gray-400" />
                            </template>
                        </a-input>
                    </a-form-item>

                    <a-button
                        type="primary"
                        html-type="submit"
                        long
                        size="large"
                        :loading="isLoading"
                        class="rounded-lg! h-12! text-base! font-medium!"
                    >
                        发送重置邮件
                    </a-button>
                </a-form>

                <div class="text-center mt-8">
                    <div class="flex items-center justify-center gap-3">
                        <a-link
                            @click="goToLogin"
                            class="text-gray-500! hover:text-gray-700! text-sm"
                        >
                            <icon-left /> 返回登录
                        </a-link>
                        <span class="text-gray-300">|</span>
                        <a-link
                            @click="goToHome"
                            class="text-gray-500! hover:text-gray-700! text-sm"
                        >
                            返回首页
                        </a-link>
                    </div>
                    <div class="mt-4 text-xs text-gray-400 leading-relaxed">
                        安全提示：如果你不确定邮箱是否已注册，我们仍会提示“已发送”，以避免账号枚举风险。
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { Message } from "@arco-design/web-vue";
import { IconCheckCircleFill, IconEmail, IconLeft, IconLock } from "@arco-design/web-vue/es/icon";
import { reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { resetPassword } from "@/services/auth";

const router = useRouter();
const route = useRoute();

const isLoading = ref(false);
const sent = ref(false);

const form = reactive({
	email: typeof route.query.email === "string" ? route.query.email : "",
});

async function handleSendResetEmail({ errors }) {
	if (errors) return;
	if (isLoading.value) return;

	const email = String(form.email || "").trim();
	if (!email) return;

	isLoading.value = true;
	sent.value = false;

	try {
		await resetPassword(email);

		// 这里建议对用户始终返回“已发送”，避免账号枚举（即使邮箱未注册）
		sent.value = true;
		Message.success("已发送重置邮件，请检查收件箱");
	} catch (error) {
		// Supabase 可能会返回频率限制等错误
		const msg = error?.message || "发送失败，请稍后再试";
		Message.error(msg);
	} finally {
		isLoading.value = false;
	}
}

function goToLogin() {
	router.push("/login");
}

function goToHome() {
	router.push("/");
}
</script>
