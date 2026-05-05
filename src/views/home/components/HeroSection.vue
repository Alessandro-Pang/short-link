<template>
    <section>
        <!-- Hero Section -->
        <div class="text-left mb-8 sm:mb-10">
            <h1
                class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 tracking-tight leading-tight"
            >
                让链接更短，
                <span
                    class="bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400"
                >
                    让分享更简单
                </span>
            </h1>
            <p
                class="mt-4 text-gray-600 dark:text-gray-400 text-base md:text-lg max-w-2xl"
            >
                高效、稳定、安全的短链接生成与管理平台，支持统计分析、有效期与批量管理，适配团队与企业场景。
            </p>

            <div class="mt-6 flex flex-wrap gap-2">
                <span
                    class="inline-flex items-center rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs px-3 py-1"
                    >稳定可用</span
                >
                <span
                    class="inline-flex items-center rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-xs px-3 py-1"
                    >可追踪统计</span
                >
                <span
                    class="inline-flex items-center rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-xs px-3 py-1"
                    >安全可控</span
                >
            </div>
        </div>

        <!-- Main Card -->
        <a-card
            class="rounded-2xl! border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden dark:bg-gray-800"
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
                                <icon-link class="text-gray-400" />
                            </template>
                        </a-input-search>
                        <div class="mt-2 flex items-center justify-between">
                            <span class="text-xs text-gray-400">
                                示例：https://example.com/path?utm_source=...
                            </span>
                            <a-tooltip
                                v-if="!userStore.isAuthenticated"
                                content="登录后可使用高级配置"
                            >
                                <a-button
                                    type="text"
                                    size="mini"
                                    class="text-gray-400!"
                                    disabled
                                >
                                    <template #icon><icon-settings /></template>
                                    高级配置
                                </a-button>
                            </a-tooltip>
                            <a-button
                                v-if="userStore.isAuthenticated"
                                type="text"
                                size="mini"
                                @click="openAdvancedConfig"
                                class="text-blue-500!"
                            >
                                <template #icon><icon-settings /></template>
                                高级配置
                            </a-button>
                        </div>
                    </div>

                    <!-- Result Area -->
                    <transition name="fade">
                        <div
                            v-if="currentShortUrl"
                            class="bg-linear-to-br mt-2 from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/30 dark:via-purple-900/30 dark:to-pink-900/30 p-4 rounded-2xl border-2 border-blue-200 dark:border-blue-700 shadow-lg"
                        >
                            <!-- 成功标题 -->
                            <div class="flex items-center gap-3 mb-2">
                                <div
                                    style="width: 22px; height: 22px"
                                    class="bg-linear-to-br from-green-400 to-green-600 px-[3px] py-[2px] rounded-full text-white shadow-md animate-pulse"
                                >
                                    <icon-check
                                        style="width: 16px; height: 16px"
                                    />
                                </div>
                                <h3
                                    class="text-base font-bold text-gray-800 dark:text-gray-200"
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
                                        class="text-base font-bold text-blue-600! dark:text-blue-400! hover:text-blue-700! dark:hover:text-blue-300! hover:underline! break-all transition-colors"
                                    >
                                        {{ currentShortUrl }}
                                    </a>
                                </div>

                                <!-- 操作按钮 -->
                                <div class="flex flex-wrap gap-2 pt-2">
                                    <a-button
                                        type="primary"
                                        @click="copyLink"
                                        class="flex-1 min-w-[140px] rounded-lg!"
                                    >
                                        <template #icon>
                                            <icon-copy class="text-base" />
                                        </template>
                                        复制链接
                                    </a-button>
                                    <a-button
                                        type="outline"
                                        @click="showQRCodeModal"
                                        class="flex-1 min-w-[140px] rounded-lg!"
                                    >
                                        <template #icon>
                                            <icon-qrcode class="text-base" />
                                        </template>
                                        查看二维码
                                    </a-button>
                                </div>
                            </div>
                        </div>
                    </transition>
                </a-space>
            </div>
        </a-card>

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

        <!-- 高级配置创建链接 -->
        <UnifiedLinkConfigDrawer
            v-model:visible="showAdvancedDrawer"
            mode="home"
            :initial-link="urlInput"
            @confirm="handleAdvancedConfigConfirm"
        />
    </section>
</template>

<script setup>
import { Message, Modal } from "@arco-design/web-vue";
import {
	IconCheck,
	IconCopy,
	IconLink,
	IconQrcode,
	IconSettings,
} from "@arco-design/web-vue/es/icon";
import QRCode from "qrcode";
import { nextTick, ref } from "vue";
import { useRouter } from "vue-router";
import UnifiedLinkConfigDrawer from "@/components/UnifiedLinkConfigDrawer.vue";
import { showSafetyBlockModal } from "@/composables";
import { addUrl } from "@/services/api";
import { useUserStore } from "@/stores";
import { validateUrl } from "@/utils/validator";

const router = useRouter();
const userStore = useUserStore();

const urlInput = ref("");
const currentShortUrl = ref("");
const isLoading = ref(false);
const qrcodeModalVisible = ref(false);
const qrcodeCanvas = ref(null);
const showAdvancedDrawer = ref(false);
const advancedConfig = ref(null);

// 打开高级配置
const openAdvancedConfig = () => {
	const inputUrl = urlInput.value.trim();
	if (!inputUrl) {
		Message.warning("请先输入链接");
		return;
	}

	if (!validateUrl(inputUrl)) {
		Message.error("请输入有效的链接，必须以 http://、https:// 或 #小程序:// 开头");
		return;
	}

	showAdvancedDrawer.value = true;
};

// 高级配置确认回调
const handleAdvancedConfigConfirm = (configData) => {
	advancedConfig.value = configData;
	Message.success("配置已保存，请点击创建短链接按钮完成创建");
};

const generateShortLink = async () => {
	const inputUrl = urlInput.value.trim();
	if (!inputUrl) {
		Message.warning("请输入链接");
		return;
	}

	if (!validateUrl(inputUrl)) {
		Message.error("请输入有效的链接，必须以 http://、https:// 或 #小程序:// 开头");
		return;
	}

	isLoading.value = true;
	currentShortUrl.value = "";

	try {
		// 使用高级配置（如果有）或默认配置
		const config = advancedConfig.value || {};

		const { data } = await addUrl(inputUrl, config);
		if (data?.short) {
			currentShortUrl.value = `${window.location.origin}/u/${data.short}`;
		} else if (data?.url) {
			currentShortUrl.value = window.location.origin + data.url;
		} else {
			throw new Error("生成短链接失败，返回数据格式错误");
		}
		Message.success("短链接生成成功");
		// 清空高级配置
		advancedConfig.value = null;
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
		} else if (error.code === "FORBIDDEN") {
			showSafetyBlockModal({
				url: inputUrl,
				reason: error.message || "该 URL 因安全原因被拒绝",
			});
		} else {
			Message.error({
				content: `生成失败: ${error.message || "未知错误"}`,
				duration: 5000,
			});
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
			(error) => {
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
:deep(.config-drawer .arco-drawer-body) {
    padding: 16px 20px;
    background-color: #fafafa;
}

:deep(.config-drawer .arco-drawer-footer) {
    padding: 12px 20px;
    border-top: 1px solid #e5e6eb;
}
</style>
