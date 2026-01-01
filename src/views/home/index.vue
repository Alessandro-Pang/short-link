<template>
    <div class="min-h-screen bg-gray-50 flex flex-col">
        <!-- Header / Nav -->
        <header
            class="w-full bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/75 border-b border-gray-100 sticky top-0 z-50"
        >
            <div
                class="mx-auto w-full max-w-7xl px-4 sm:px-6 py-3 flex justify-between items-center"
            >
                <div class="flex items-center gap-3 min-w-0">
                    <div
                        class="text-xl font-semibold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-purple-600 cursor-pointer truncate"
                        @click="$router.push('/')"
                    >
                        Short Link
                    </div>
                    <span
                        class="hidden sm:inline-flex items-center rounded-full border border-gray-200 bg-white px-2 py-0.5 text-xs text-gray-500"
                    >
                        企业级短链服务
                    </span>
                </div>

                <div class="flex items-center gap-3 sm:gap-4">
                    <a
                        href="https://github.com/Alessandro-Pang/short-link"
                        target="_blank"
                        class="text-gray-600 hover:text-gray-900 transition-colors flex items-center"
                        aria-label="GitHub"
                    >
                        <icon-github class="text-xl" />
                    </a>

                    <a-divider direction="vertical" />

                    <template v-if="userStore.isAuthenticated">
                        <a-dropdown @select="handleDropdownSelect">
                            <div
                                class="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1.5 rounded-full transition-colors"
                            >
                                <a-avatar
                                    :size="32"
                                    :image-url="userStore.userAvatar"
                                    class="bg-blue-600"
                                >
                                    <template v-if="!userStore.userAvatar">
                                        {{ userStore.userInitial }}
                                    </template>
                                </a-avatar>
                                <span
                                    class="hidden sm:inline-block max-w-[120px] md:max-w-[160px] truncate text-gray-700 font-medium text-sm"
                                >
                                    {{ userStore.userDisplayName }}
                                </span>
                                <icon-down class="text-gray-400 text-sm" />
                            </div>
                            <template #content>
                                <a-doption value="dashboard">
                                    <template #icon
                                        ><icon-dashboard
                                    /></template>
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
                            <a-button
                                type="text"
                                @click="$router.push('/login')"
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
            </div>
        </header>

        <!-- Main Content -->
        <main class="flex-1 w-full">
            <div class="mx-auto w-full max-w-7xl px-4 sm:px-6 py-10 sm:py-14">
                <div
                    class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start"
                >
                    <!-- Left: Hero + Input -->
                    <section class="lg:col-span-7">
                        <!-- Hero Section -->
                        <div class="text-left mb-8 sm:mb-10">
                            <h1
                                class="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight leading-tight"
                            >
                                让链接更短，
                                <span
                                    class="bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-purple-600"
                                >
                                    让分享更简单
                                </span>
                            </h1>
                            <p
                                class="mt-4 text-gray-600 text-base md:text-lg max-w-2xl"
                            >
                                高效、稳定、安全的短链接生成与管理平台，支持统计分析、有效期与批量管理，适配团队与企业场景。
                            </p>

                            <div class="mt-6 flex flex-wrap gap-2">
                                <span
                                    class="inline-flex items-center rounded-full bg-gray-900 text-white text-xs px-3 py-1"
                                    >稳定可用</span
                                >
                                <span
                                    class="inline-flex items-center rounded-full bg-white border border-gray-200 text-gray-700 text-xs px-3 py-1"
                                    >可追踪统计</span
                                >
                                <span
                                    class="inline-flex items-center rounded-full bg-white border border-gray-200 text-gray-700 text-xs px-3 py-1"
                                    >安全可控</span
                                >
                            </div>
                        </div>

                        <!-- Main Card -->
                        <a-card
                            class="rounded-2xl! border border-gray-100 shadow-sm overflow-hidden"
                            :body-style="{ padding: '0' }"
                        >
                            <div class="p-6 sm:p-8">
                                <a-space direction="vertical" class="w-full">
                                    <div class="relative">
                                        <a-input-search
                                            v-model="urlInput"
                                            placeholder="粘贴原始链接（支持 http:// / https://）"
                                            button-text="生成短链接"
                                            search-button
                                            size="large"
                                            :loading="isLoading"
                                            @search="generateShortLink"
                                            @press-enter="generateShortLink"
                                            allow-clear
                                            class="h-14 sort-link-input"
                                            :buttonProps="{
                                                class: 'mr-2!',
                                            }"
                                        >
                                            <template #prefix>
                                                <icon-link
                                                    class="text-gray-400"
                                                />
                                            </template>
                                        </a-input-search>
                                        <div
                                            class="mt-2 flex items-center justify-between"
                                        >
                                            <span class="text-xs text-gray-400">
                                                示例：https://example.com/path?utm_source=...
                                            </span>
                                            <a-tooltip
                                                v-if="
                                                    !userStore.isAuthenticated
                                                "
                                                content="登录后可使用高级配置"
                                            >
                                                <a-button
                                                    type="text"
                                                    size="mini"
                                                    class="text-gray-400!"
                                                    disabled
                                                >
                                                    <template #icon
                                                        ><icon-settings
                                                    /></template>
                                                    高级配置
                                                </a-button>
                                            </a-tooltip>
                                            <a-button
                                                v-if="userStore.isAuthenticated"
                                                type="text"
                                                size="mini"
                                                @click="showConfigDrawer = true"
                                                class="text-blue-500!"
                                            >
                                                <template #icon
                                                    ><icon-settings
                                                /></template>
                                                高级配置
                                            </a-button>
                                        </div>
                                    </div>

                                    <!-- Result Area -->
                                    <transition name="fade">
                                        <div
                                            v-if="currentShortUrl"
                                            class="bg-linear-to-br mt-2 from-blue-50 via-purple-50 to-pink-50 p-4 rounded-2xl border-2 border-blue-200 shadow-lg"
                                        >
                                            <!-- 成功标题 -->
                                            <div
                                                class="flex items-center gap-3 mb-2"
                                            >
                                                <div
                                                    style="
                                                        width: 22px;
                                                        height: 22px;
                                                    "
                                                    class="bg-linear-to-br from-green-400 to-green-600 px-[3px] py-[2px] rounded-full text-white shadow-md animate-pulse"
                                                >
                                                    <icon-check
                                                        style="
                                                            width: 16px;
                                                            height: 16px;
                                                        "
                                                    />
                                                </div>
                                                <h3
                                                    class="text-base font-bold text-gray-800"
                                                >
                                                    短链接地址
                                                </h3>
                                            </div>

                                            <!-- 短链接展示区 -->
                                            <div class="flex flex-col gap-3">
                                                <!-- 链接地址 -->
                                                <div>
                                                    <a
                                                        :href="currentShortUrl"
                                                        target="_blank"
                                                        class="text-base font-bold text-blue-600! hover:text-blue-700! hover:underline! break-all transition-colors"
                                                    >
                                                        {{ currentShortUrl }}
                                                    </a>
                                                </div>

                                                <!-- 操作按钮 -->
                                                <div
                                                    class="flex flex-wrap gap-2 pt-2"
                                                >
                                                    <a-button
                                                        type="primary"
                                                        @click="copyLink"
                                                        class="flex-1 min-w-[140px] rounded-lg!"
                                                    >
                                                        <template #icon>
                                                            <icon-copy
                                                                class="text-base"
                                                            />
                                                        </template>
                                                        复制链接
                                                    </a-button>
                                                    <a-button
                                                        type="outline"
                                                        @click="showQRCodeModal"
                                                        class="flex-1 min-w-[140px] rounded-lg!"
                                                    >
                                                        <template #icon>
                                                            <icon-qrcode
                                                                class="text-base"
                                                            />
                                                        </template>
                                                        查看二维码
                                                    </a-button>
                                                </div>
                                            </div>

                                            <!-- 显示配置摘要（仅登录用户可见） -->
                                            <div
                                                v-if="
                                                    userStore.isAuthenticated &&
                                                    hasAdvancedConfig
                                                "
                                                class="mt-4 bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-white/80"
                                            >
                                                <div
                                                    class="flex items-start gap-2"
                                                >
                                                    <icon-settings
                                                        class="text-gray-500 mt-0.5 shrink-0"
                                                    />
                                                    <div class="flex-1">
                                                        <span
                                                            class="text-sm font-semibold text-gray-700 block mb-2"
                                                        >
                                                            已应用高级配置
                                                        </span>
                                                        <div
                                                            class="flex flex-wrap gap-2"
                                                        >
                                                            <a-tag
                                                                v-if="
                                                                    linkConfig.redirect_type !==
                                                                    302
                                                                "
                                                                color="arcoblue"
                                                                size="medium"
                                                            >
                                                                {{
                                                                    redirectTypeLabel
                                                                }}
                                                            </a-tag>
                                                            <a-tag
                                                                v-if="
                                                                    linkConfig.expiration_option_id ||
                                                                    linkConfig.expiration_date
                                                                "
                                                                color="orange"
                                                                size="medium"
                                                            >
                                                                <icon-clock-circle
                                                                    class="mr-1"
                                                                />有效期限制
                                                            </a-tag>
                                                            <a-tag
                                                                v-if="
                                                                    linkConfig.max_clicks
                                                                "
                                                                color="green"
                                                                size="medium"
                                                            >
                                                                <icon-thunderbolt
                                                                    class="mr-1"
                                                                />{{
                                                                    linkConfig.max_clicks
                                                                }}次点击限制
                                                            </a-tag>
                                                            <a-tag
                                                                v-if="
                                                                    linkConfig.pass_query_params
                                                                "
                                                                color="purple"
                                                                size="medium"
                                                            >
                                                                参数透传
                                                            </a-tag>
                                                            <a-tag
                                                                v-if="
                                                                    linkConfig.forward_headers
                                                                "
                                                                color="cyan"
                                                                size="medium"
                                                            >
                                                                Header转发
                                                            </a-tag>
                                                            <a-tag
                                                                v-if="
                                                                    hasAccessRestrictions
                                                                "
                                                                color="red"
                                                                size="medium"
                                                            >
                                                                <icon-safe
                                                                    class="mr-1"
                                                                />访问限制
                                                            </a-tag>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </transition>
                                </a-space>
                            </div>
                        </a-card>
                    </section>

                    <!-- Right: Enterprise value props -->
                    <aside class="lg:col-span-5">
                        <div
                            class="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 sm:p-8"
                        >
                            <div class="flex items-start justify-between gap-3">
                                <div>
                                    <div class="text-sm text-gray-500">
                                        企业级能力
                                    </div>
                                    <div
                                        class="mt-1 text-xl font-semibold text-gray-900 tracking-tight"
                                    >
                                        更稳定、更可控的短链平台
                                    </div>
                                </div>
                                <div
                                    class="hidden sm:flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-600"
                                >
                                    SLA Ready
                                </div>
                            </div>

                            <div class="mt-6 space-y-4">
                                <div class="flex gap-3">
                                    <div
                                        class="mt-0.5 w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"
                                    >
                                        <icon-dashboard />
                                    </div>
                                    <div>
                                        <div
                                            class="font-semibold text-gray-900"
                                        >
                                            统一管理与审计
                                        </div>
                                        <div
                                            class="mt-1 text-sm text-gray-600 leading-relaxed"
                                        >
                                            在控制台集中管理短链、备注、分组与状态，便于团队协作与审计追踪。
                                        </div>
                                    </div>
                                </div>

                                <div class="flex gap-3">
                                    <div
                                        class="mt-0.5 w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0"
                                    >
                                        <icon-bar-chart />
                                    </div>
                                    <div>
                                        <div
                                            class="font-semibold text-gray-900"
                                        >
                                            数据统计与洞察
                                        </div>
                                        <div
                                            class="mt-1 text-sm text-gray-600 leading-relaxed"
                                        >
                                            监控点击量与趋势，帮助你评估投放效果，快速定位高价值渠道与内容。
                                        </div>
                                    </div>
                                </div>

                                <div class="flex gap-3">
                                    <div
                                        class="mt-0.5 w-9 h-9 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0"
                                    >
                                        <icon-clock-circle />
                                    </div>
                                    <div>
                                        <div
                                            class="font-semibold text-gray-900"
                                        >
                                            安全策略与有效期
                                        </div>
                                        <div
                                            class="mt-1 text-sm text-gray-600 leading-relaxed"
                                        >
                                            支持短链有效期管理与风险控制，降低长期暴露带来的安全隐患。
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="mt-8 flex flex-col sm:flex-row gap-3">
                                <a-button
                                    type="primary"
                                    long
                                    class="h-11! rounded-lg! font-medium!"
                                    @click="$router.push('/dashboard')"
                                >
                                    进入控制台
                                </a-button>
                                <a-button
                                    type="secondary"
                                    long
                                    class="h-11! rounded-lg! font-medium!"
                                    @click="
                                        () => {
                                            if (user) {
                                                $router.push(
                                                    '/dashboard/links',
                                                );
                                            } else {
                                                $router.push('/login');
                                            }
                                        }
                                    "
                                >
                                    查看我的链接
                                </a-button>
                            </div>

                            <div class="mt-4 text-xs text-gray-400">
                                提示：登录后可查看历史记录、统计分析并管理你的短链接资产。
                            </div>
                        </div>
                    </aside>
                </div>

                <!-- Login Reminder / Features -->
                <div class="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
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
            </div>
        </main>

        <!-- Footer -->
        <footer class="mt-10 border-t border-gray-100 bg-white">
            <div
                class="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 text-sm text-gray-500"
            >
                <div
                    class="flex flex-col sm:flex-row items-center justify-between gap-3"
                >
                    <div>
                        © {{ new Date().getFullYear() }} Short Link Service.
                        All rights reserved.
                    </div>
                    <div class="text-gray-400">
                        Powered by Vue 3, Arco Design & Tailwind CSS
                    </div>
                </div>
            </div>
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

        <!-- 高级配置抽屉 -->
        <a-drawer
            v-model:visible="showConfigDrawer"
            title="高级配置"
            :width="420"
            placement="right"
            :footer="true"
            class="config-drawer"
        >
            <div class="drawer-content">
                <LinkConfigForm v-model="linkConfig" />
            </div>
            <template #footer>
                <div class="drawer-footer">
                    <a-button @click="resetConfig">重置配置</a-button>
                    <a-button type="primary" @click="showConfigDrawer = false">
                        确定
                    </a-button>
                </div>
            </template>
        </a-drawer>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import { Modal } from "@arco-design/web-vue";
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
    IconSettings,
    IconThunderbolt,
    IconSafe,
} from "@arco-design/web-vue/es/icon";
import { Message } from "@arco-design/web-vue";
import QRCode from "qrcode";
import { addUrl, REDIRECT_TYPE_OPTIONS } from "@/services/api";
import { validateUrl } from "@/utils/validator";
import LinkConfigForm from "@/components/LinkConfigForm.vue";
import { useUserStore } from "@/stores";

const router = useRouter();
const userStore = useUserStore();

const urlInput = ref("");
const currentShortUrl = ref("");
const isLoading = ref(false);
const qrcodeModalVisible = ref(false);
const qrcodeCanvas = ref(null);
const showConfigDrawer = ref(false);

// 链接配置 - 使用 ref 而不是 reactive，以便正确接收子组件的更新
const linkConfig = ref({
    title: "",
    expiration_option_id: null,
    expiration_date: null,
    redirect_type: 302,
    max_clicks: null,
    pass_query_params: false,
    forward_headers: false,
    forward_header_list: [],
    access_restrictions: null,
});

// 计算是否有高级配置
const hasAdvancedConfig = computed(() => {
    const config = linkConfig.value;
    return (
        config.redirect_type !== 302 ||
        config.expiration_option_id ||
        config.expiration_date ||
        config.max_clicks ||
        config.pass_query_params ||
        config.forward_headers ||
        hasAccessRestrictions.value
    );
});

// 计算是否有访问限制
const hasAccessRestrictions = computed(() => {
    const config = linkConfig.value;
    if (!config.access_restrictions) return false;
    const r = config.access_restrictions;
    return (
        (r.ip_whitelist && r.ip_whitelist.length > 0) ||
        (r.ip_blacklist && r.ip_blacklist.length > 0) ||
        (r.allowed_devices && r.allowed_devices.length > 0) ||
        (r.allowed_referrers && r.allowed_referrers.length > 0) ||
        (r.blocked_referrers && r.blocked_referrers.length > 0) ||
        (r.allowed_countries && r.allowed_countries.length > 0)
    );
});

// 获取重定向类型标签
const redirectTypeLabel = computed(() => {
    const option = REDIRECT_TYPE_OPTIONS.find(
        (o) => o.value === linkConfig.value.redirect_type,
    );
    return option ? option.label : "302 临时重定向";
});

// 重置配置
const resetConfig = () => {
    linkConfig.value = {
        title: "",
        expiration_option_id: null,
        expiration_date: null,
        redirect_type: 302,
        max_clicks: null,
        pass_query_params: false,
        forward_headers: false,
        forward_header_list: [],
        access_restrictions: null,
    };
};

onMounted(async () => {
    // 初始化用户状态（使用缓存，避免重复请求）
    await userStore.initialize();
});

const handleDropdownSelect = async (value) => {
    if (value === "logout") {
        try {
            await userStore.logout();
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
        // 构建配置选项 - 仅登录用户可使用高级配置
        const options = {};

        if (userStore.isAuthenticated) {
            const config = linkConfig.value;

            if (config.title) {
                options.title = config.title;
            }
            // 有效期：优先使用预设选项，其次使用自定义时间
            if (config.expiration_option_id) {
                options.expiration_option_id = config.expiration_option_id;
            } else if (config.expiration_date) {
                options.expiration_date = config.expiration_date;
            }
            // 始终传递 redirect_type
            options.redirect_type = config.redirect_type || 302;

            // 修复：使用更严格的判断，允许数字 0 以外的值
            if (
                config.max_clicks !== null &&
                config.max_clicks !== undefined &&
                config.max_clicks !== "" &&
                config.max_clicks > 0
            ) {
                options.max_clicks = parseInt(config.max_clicks, 10);
            }
            if (config.pass_query_params) {
                options.pass_query_params = true;
            }
            if (config.forward_headers) {
                options.forward_headers = true;
                if (config.forward_header_list?.length > 0) {
                    options.forward_header_list = config.forward_header_list;
                }
            }
            if (hasAccessRestrictions.value && config.access_restrictions) {
                options.access_restrictions = config.access_restrictions;
            }
        }

        const { data } = await addUrl(inputUrl, options);
        if (data && data.short) {
            currentShortUrl.value = `${window.location.origin}/u/${data.short}`;
        } else if (data && data.url) {
            currentShortUrl.value = window.location.origin + data.url;
        } else {
            throw new Error("生成短链接失败，返回数据格式错误");
        }
        Message.success("短链接生成成功");
    } catch (error) {
        // 处理重复链接的特殊错误
        if (error.code === "DUPLICATE_LINK" && error.existingLink) {
            const existingLinkId = error.existingLink.id;
            Modal.confirm({
                title: "链接已存在",
                content: "您已创建过该链接的短链接，是否前往控制台管理？",
                okText: "前往控制台",
                cancelText: "取消",
                onOk: () => {
                    router.push({
                        path: "/dashboard/links",
                        query: { linkId: existingLinkId },
                    });
                },
            });
        } else {
            Message.error(`生成失败: ${error.message || "未知错误"}`);
        }
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
/* 淡入淡出动画 */
.fade-enter-active {
    animation: slideInDown 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.fade-leave-active {
    animation: slideOutUp 0.3s ease-out;
}

@keyframes slideInDown {
    from {
        opacity: 0;
        transform: translateY(-30px) scale(0.95);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

@keyframes slideOutUp {
    from {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
    to {
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
    }
}

/* 抽屉样式 */
.drawer-content {
    padding: 4px 8px;
}

.drawer-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

:deep(.config-drawer .arco-drawer-body) {
    padding: 16px 20px;
    background-color: #fafafa;
}

:deep(.config-drawer .arco-drawer-footer) {
    padding: 12px 20px;
    border-top: 1px solid #e5e6eb;
}
</style>
