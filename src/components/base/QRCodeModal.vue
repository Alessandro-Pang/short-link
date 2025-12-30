<template>
    <a-modal
        v-model:visible="visible"
        title="链接二维码"
        :footer="false"
        :width="340"
        modal-class="rounded-xl!"
        @cancel="handleClose"
    >
        <div class="flex flex-col items-center p-4">
            <div
                class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6"
            >
                <canvas ref="canvasRef" class="block"></canvas>
            </div>
            <div class="w-full">
                <div class="text-xs text-gray-400 mb-2 text-center">
                    短链接地址
                </div>
                <div
                    class="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg border border-gray-100"
                >
                    <span
                        class="text-gray-700 text-sm truncate mr-4 font-medium flex-1"
                    >
                        {{ currentUrl }}
                    </span>
                    <a-link @click="copyUrl" class="shrink-0">复制</a-link>
                </div>
            </div>
            <a-button
                type="primary"
                long
                class="mt-4! rounded-lg!"
                @click="handleClose"
            >
                完成
            </a-button>
        </div>
    </a-modal>
</template>

<script setup lang="ts">
import { Message } from "@arco-design/web-vue";
import { useQRCode } from "@/composables/useQRCode";

const { visible, currentUrl, canvasRef, hide } = useQRCode();

const handleClose = () => {
    hide();
};

const copyUrl = async () => {
    if (!currentUrl.value) return;
    try {
        await navigator.clipboard.writeText(currentUrl.value);
        Message.success("链接已复制到剪贴板");
    } catch (error) {
        Message.error("复制失败，请手动复制");
    }
};

// 暴露给父组件使用
defineExpose({
    visible,
    currentUrl,
    canvasRef,
});
</script>

<style scoped>
.flex {
    display: flex;
}

.flex-col {
    flex-direction: column;
}

.flex-1 {
    flex: 1;
}

.items-center {
    align-items: center;
}

.shrink-0 {
    flex-shrink: 0;
}

.justify-between {
    justify-content: space-between;
}

.p-4 {
    padding: 16px;
}

.bg-white {
    background-color: white;
}

.rounded-xl {
    border-radius: 12px;
}

.shadow-sm {
    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
}

.border {
    border-width: 1px;
}

.border-gray-100 {
    border-color: #f2f3f5;
}

.mb-6 {
    margin-bottom: 24px;
}

.mb-2 {
    margin-bottom: 8px;
}

.mr-4 {
    margin-right: 16px;
}

.w-full {
    width: 100%;
}

.text-xs {
    font-size: 12px;
}

.text-sm {
    font-size: 14px;
}

.text-gray-400 {
    color: #86909c;
}

.text-gray-700 {
    color: #4e5969;
}

.text-center {
    text-align: center;
}

.truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.bg-gray-50 {
    background-color: #f7f8fa;
}

.px-4 {
    padding-left: 16px;
    padding-right: 16px;
}

.py-3 {
    padding-top: 12px;
    padding-bottom: 12px;
}

.rounded-lg {
    border-radius: 8px;
}

.font-medium {
    font-weight: 500;
}

.block {
    display: block;
}
</style>
