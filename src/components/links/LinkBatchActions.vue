<script setup>
import {
	IconCheck,
	IconClose,
	IconDelete,
} from "@arco-design/web-vue/es/icon";

const props = defineProps({
	selectedCount: {
		type: Number,
		required: true,
	},
	isBatchOperating: {
		type: Boolean,
		default: false,
	},
	themeClass: {
		type: String,
		default: "bg-blue-50 border-blue-100",
	},
	textClass: {
		type: String,
		default: "text-blue-600",
	},
});

const emit = defineEmits([
	"clear-selection",
	"batch-enable",
	"batch-disable",
	"batch-delete",
]);
</script>

<template>
	<div
		class="px-6 py-3 border-b flex items-center justify-between"
		:class="themeClass"
	>
		<div class="flex items-center gap-2 text-gray-600 dark:text-gray-300">
			<span class="font-medium" :class="textClass"
				>已选择 {{ selectedCount }} 项</span
			>
			<a-link @click="emit('clear-selection')" class="text-sm"
				>取消选择</a-link
			>
		</div>
		<div class="flex items-center gap-2">
			<a-popconfirm
				content="确定要启用选中的链接吗？"
				type="info"
				@ok="emit('batch-enable')"
			>
				<a-button
					size="small"
					type="outline"
					status="success"
					:loading="isBatchOperating"
				>
					<template #icon><icon-check /></template>
					批量启用
				</a-button>
			</a-popconfirm>
			<a-popconfirm
				content="确定要禁用选中的链接吗？"
				type="warning"
				@ok="emit('batch-disable')"
			>
				<a-button
					size="small"
					type="outline"
					status="warning"
					:loading="isBatchOperating"
				>
					<template #icon><icon-close /></template>
					批量禁用
				</a-button>
			</a-popconfirm>
			<a-popconfirm
				content="确定要删除选中的链接吗？此操作不可恢复！"
				type="error"
				@ok="emit('batch-delete')"
			>
				<a-button
					size="small"
					type="outline"
					status="danger"
					:loading="isBatchOperating"
				>
					<template #icon><icon-delete /></template>
					批量删除
				</a-button>
			</a-popconfirm>
		</div>
	</div>
</template>
