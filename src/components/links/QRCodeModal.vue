<script setup>
import { Message } from "@arco-design/web-vue";
import QRCode from "qrcode";
import { nextTick, ref, watch } from "vue";

const props = defineProps({
	visible: {
		type: Boolean,
		required: true,
	},
	url: {
		type: String,
		required: true,
	},
});

const emit = defineEmits(["update:visible"]);

const qrcodeCanvas = ref(null);

const copyLink = async (short) => {
	const url = short.startsWith("http") ? short : `${window.location.origin}/u/${short}`;
	try {
		await navigator.clipboard.writeText(url);
		Message.success("链接已复制到剪贴板");
	} catch (error) {
		Message.error("复制失败，请手动复制");
	}
};

const handleClose = () => {
	emit("update:visible", false);
};

watch(
	() => props.visible,
	async (newVal) => {
		if (newVal && props.url) {
			await nextTick();
			if (qrcodeCanvas.value) {
				QRCode.toCanvas(
					qrcodeCanvas.value,
					props.url,
					{ width: 200, margin: 1 },
					(error) => {
						if (error) console.error(error);
					},
				);
			}
		}
	},
);
</script>

<template>
	<a-modal
		:visible="visible"
		@update:visible="(val) => emit('update:visible', val)"
		title="链接二维码"
		:footer="false"
		:width="340"
		modal-class="rounded-xl!"
	>
		<div class="flex flex-col items-center">
			<div
				class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6"
			>
				<canvas ref="qrcodeCanvas" class="block"></canvas>
			</div>
			<div class="w-full">
				<div class="text-xs text-gray-400 mb-2 text-center">短链接地址</div>
				<div
					class="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg border border-gray-100"
				>
					<span
						style="width: calc(100% - 40px)"
						class="text-gray-700 text-sm truncate mr-4 font-medium"
						>{{ url }}</span
					>
					<a-link
						class="w-[38px]! px-0!"
						@click="copyLink(url.split('/u/').pop())"
						>复制</a-link
					>
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
