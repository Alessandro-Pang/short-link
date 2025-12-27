<template>
    <div class="min-h-screen bg-gray-50 flex flex-col">
        <!-- Header / Nav -->
        <header
            class="w-full bg-white shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-50"
        >
            <div class="flex items-center gap-2">
                <div
                    class="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-purple-600 cursor-pointer"
                    @click="$router.push('/')"
                >
                    Short Link
                </div>
            </div>
            <div class="flex items-center gap-4">
                <a
                    href="https://github.com/Alessandro-Pang/short-link"
                    target="_blank"
                    class="text-gray-600 hover:text-gray-900 transition-colors flex items-center"
                >
                    <icon-github class="text-xl" />
                </a>
                <template v-if="user">
                    <a-dropdown @select="handleDropdownSelect">
                        <a-button type="text" class="text-gray-700! px-2!">
                            {{ user.email }}
                            <icon-down class="ml-2" />
                        </a-button>
                        <template #content>
                            <a-doption value="dashboard">
                                <template #icon><icon-dashboard /></template>
                                控制台
                            </a-doption>
                            <a-doption value="logout">
                                <template #icon><icon-export /></template>
                                退出登录
                            </a-doption>
                        </template>
                    </a-dropdown>
                </template>
                <template v-else>
                    <a-space>
                        <a-button type="text" @click="$router.push('/login')"
                            >登录</a-button
                        >
                        <a-button
                            type="primary"
                            @click="$router.push('/register')"
                            >注册</a-button
                        >
                    </a-space>
                </template>
            </div>
        </header>

        <!-- Main Content -->
        <main
            class="flex-1 flex flex-col items-center justify-center p-4 w-full"
        >
            <div class="w-full max-w-3xl">
                <!-- Hero Section -->
                <div class="text-center mb-12 mt-8">
                    <h1
                        class="text-4xl md:text-5xl font-bold text-gray-800 mb-6 tracking-tight"
                    >
                        让链接更短，让分享更简单
                    </h1>
                    <p
                        class="text-gray-500 text-lg md:text-xl max-w-2xl mx-auto"
                    >
                        高效、稳定、安全的短链接生成服务，助您轻松管理和追踪每一个链接。
                    </p>
                </div>

                <!-- Main Card -->
                <a-card
                    class="shadow-xl rounded-2xl border-0 overflow-hidden"
                    :body-style="{ padding: '40px' }"
                >
                    <a-space direction="vertical" size="large" class="w-full">
                        <div class="relative">
                            <a-input-search
                                v-model="urlInput"
                                placeholder="请输入需要缩短的链接 (http://, https://)"
                                button-text="生成短链接"
                                search-button
                                size="large"
                                :loading="isLoading"
                                @search="generateShortLink"
                                @press-enter="generateShortLink"
                                allow-clear
                                class="h-12"
                            >
                                <template #prefix>
                                    <icon-link class="text-gray-400" />
                                </template>
                            </a-input-search>
                        </div>

                        <!-- Result Area -->
                        <transition name="fade">
                            <div
                                v-if="currentShortUrl"
                                class="bg-blue-50 p-6 rounded-xl border border-blue-100 mt-4"
                            >
                                <div
                                    class="flex flex-col md:flex-row items-center justify-between gap-4"
                                >
                                    <div
                                        class="flex items-center gap-3 overflow-hidden w-full md:w-auto"
                                    >
                                        <div
                                            class="bg-green-500 p-1.5 rounded-full text-white shrink-0"
                                        >
                                            <icon-check />
                                        </div>
                                        <a
                                            :href="currentShortUrl"
                                            target="_blank"
                                            class="text-lg font-medium text-blue-600 truncate hover:underline block"
                                        >
                                            {{ currentShortUrl }}
                                        </a>
                                    </div>
                                    <a-space class="shrink-0">
                                        <a-button
                                            type="secondary"
                                            size="small"
                                            @click="copyLink"
                                        >
                                            <template #icon
                                                ><icon-copy
                                            /></template>
                                            复制
                                        </a-button>
                                        <a-button
                                            type="secondary"
                                            size="small"
                                            @click="showQRCodeModal"
                                        >
                                            <template #icon
                                                ><icon-qrcode
                                            /></template>
                                            二维码
                                        </a-button>
                                    </a-space>
                                </div>
                            </div>
                        </transition>
                    </a-space>
                </a-card>

                <!-- Login Reminder / Features -->
                <div
                    v-if="!user"
                    class="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                    <div
                        class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:-translate-y-1"
                    >
                        <div
                            class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 text-2xl mb-4"
                        >
                            <icon-dashboard />
                        </div>
                        <h3 class="font-bold text-gray-800 text-lg mb-2">
                            链接管理
                        </h3>
                        <p class="text-gray-500 text-sm leading-relaxed">
                            登录后可查看和管理所有生成的短链接历史，随时修改或删除。
                        </p>
                    </div>
                    <div
                        class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:-translate-y-1"
                    >
                        <div
                            class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 text-2xl mb-4"
                        >
                            <icon-bar-chart />
                        </div>
                        <h3 class="font-bold text-gray-800 text-lg mb-2">
                            访问统计
                        </h3>
                        <p class="text-gray-500 text-sm leading-relaxed">
                            实时监控链接访问数据，包括点击量、来源、设备等详细分析。
                        </p>
                    </div>
                    <div
                        class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:-translate-y-1"
                    >
                        <div
                            class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 text-2xl mb-4"
                        >
                            <icon-clock-circle />
                        </div>
                        <h3 class="font-bold text-gray-800 text-lg mb-2">
                            有效期设置
                        </h3>
                        <p class="text-gray-500 text-sm leading-relaxed">
                            自定义短链接失效时间，灵活控制访问权限，过期自动失效。
                        </p>
                    </div>
                </div>

                <div v-else class="mt-10 text-center">
                    <a-alert
                        type="success"
                        class="inline-block text-left max-w-2xl shadow-sm border-green-200 bg-green-50"
                    >
                        <template #icon
                            ><icon-check-circle-fill class="text-green-500"
                        /></template>
                        您已登录！现在可以前往
                        <a-link
                            @click="$router.push('/dashboard')"
                            class="font-bold"
                            >控制台</a-link
                        >
                        查看详细访问数据和管理您的链接。
                    </a-alert>
                </div>
            </div>
        </main>

        <!-- Footer -->
        <footer
            class="py-8 text-center text-gray-400 text-sm bg-white border-t border-gray-100 mt-auto"
        >
            <div class="mb-2">
                © {{ new Date().getFullYear() }} Short Link Service. All rights
                reserved.
            </div>
            <div>Powered by Vue 3, Arco Design & Tailwind CSS</div>
        </footer>

        <!-- QR Code Modal -->
        <a-modal
            v-model:visible="qrcodeModalVisible"
            title="链接二维码"
            :footer="false"
            :width="300"
        >
            <div class="flex flex-col items-center p-4">
                <canvas
                    ref="qrcodeCanvas"
                    class="rounded-lg shadow-sm border border-gray-100"
                ></canvas>
                <div
                    class="text-center text-gray-500 mt-4 text-sm break-all px-2 bg-gray-50 py-2 rounded w-full"
                >
                    {{ currentShortUrl }}
                </div>
            </div>
        </a-modal>
    </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import {
    IconGithub,
    IconLink,
    IconCopy,
    IconQrcode,
    IconCheck,
    IconDashboard,
    IconBarChart,
    IconClockCircle,
    IconDown,
    IconExport,
    IconCheckCircleFill,
} from "@arco-design/web-vue/es/icon";
import { Message } from "@arco-design/web-vue";
import QRCode from "qrcode";
import { addUrl } from "@/services/api.js";
import { getCurrentUser, signOut } from "@/services/auth.js";
import { validateUrl } from "@/utils/validator.js";

const router = useRouter();
const user = ref(null);
const urlInput = ref("");
const currentShortUrl = ref("");
const isLoading = ref(false);
const qrcodeModalVisible = ref(false);
const qrcodeCanvas = ref(null);

onMounted(async () => {
    try {
        user.value = await getCurrentUser();
    } catch (e) {
        // 用户未登录，忽略错误
        console.log("User not logged in");
    }
});

const handleDropdownSelect = async (value) => {
    if (value === "logout") {
        try {
            await signOut();
            user.value = null;
            Message.success("已退出登录");
        } catch (error) {
            Message.error("退出登录失败");
        }
    } else if (value === "dashboard") {
        router.push("/dashboard");
    }
};

const generateShortLink = async () => {
    const inputUrl = urlInput.value.trim();
    if (!inputUrl) {
        Message.warning("请输入链接");
        return;
    }

    if (!validateUrl(inputUrl)) {
        Message.error(
            "请输入有效的链接，必须以 http://、https:// 或 #小程序:// 开头",
        );
        return;
    }

    isLoading.value = true;
    currentShortUrl.value = "";

    try {
        const data = await addUrl(inputUrl);
        currentShortUrl.value = window.location.origin + data.url;
        Message.success("短链接生成成功");
    } catch (error) {
        Message.error(`生成失败: ${error.message || "未知错误"}`);
    } finally {
        isLoading.value = false;
    }
};

const copyLink = async () => {
    if (!currentShortUrl.value) return;
    try {
        await navigator.clipboard.writeText(currentShortUrl.value);
        Message.success("链接已复制到剪贴板");
    } catch (err) {
        Message.error("复制失败，请手动复制");
    }
};

const showQRCodeModal = async () => {
    if (!currentShortUrl.value) return;
    qrcodeModalVisible.value = true;
    await nextTick();
    if (qrcodeCanvas.value) {
        QRCode.toCanvas(
            qrcodeCanvas.value,
            currentShortUrl.value,
            { width: 200, margin: 1 },
            function (error) {
                if (error) console.error(error);
            },
        );
    }
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition:
        opacity 0.3s ease,
        transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}
</style>
