<template>
    <div
        class="bg-red-50 dark:bg-red-900/20 rounded-xl shadow-sm border border-red-200 dark:border-red-900/30 overflow-hidden"
    >
        <div
            class="px-6 py-4 border-b border-red-200 dark:border-red-900/30 bg-red-100 dark:bg-red-900/30"
        >
            <h3
                class="text-lg font-semibold text-red-800 dark:text-red-400"
            >
                危险操作
            </h3>
            <p class="text-sm text-red-600 dark:text-red-400 mt-1">
                以下操作不可逆，请谨慎执行
            </p>
        </div>
        <div class="p-6">
            <div class="flex items-start justify-between gap-4">
                <div class="flex-1">
                    <h4
                        class="font-medium text-gray-800 dark:text-gray-200"
                    >
                        删除账号
                    </h4>
                    <p
                        class="text-sm text-gray-500 dark:text-gray-400 mt-1"
                    >
                        永久删除你的账号及所有相关数据，此操作不可恢复
                    </p>
                </div>
                <a-button
                    status="danger"
                    :loading="deleting"
                    @click="showDeleteConfirm"
                    class="shrink-0"
                >
                    删除账号
                </a-button>
            </div>
        </div>

        <!-- 删除账号确认模态框 -->
        <a-modal
            v-model:visible="deleteModalVisible"
            title="删除账号"
            :width="500"
            @ok="confirmDeleteAccount"
            @cancel="deleteModalVisible = false"
        >
            <template #title>
                <div class="flex items-center gap-2">
                    <icon-exclamation-circle class="text-red-500" />
                    <span>删除账号</span>
                </div>
            </template>
            <div class="space-y-4">
                <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p class="text-sm text-red-700 font-medium">
                        警告：此操作将永久删除你的账号及所有相关数据，包括：
                    </p>
                    <ul
                        class="mt-2 text-sm text-red-600 list-disc list-inside space-y-1"
                    >
                        <li>所有创建的短链接</li>
                        <li>访问统计数据</li>
                        <li>账号绑定信息</li>
                        <li>个人资料</li>
                    </ul>
                    <p class="mt-3 text-sm text-red-700 font-medium">
                        此操作不可逆，确定要继续吗？
                    </p>
                </div>
                <a-form-item label="删除原因（可选）">
                    <a-textarea
                        v-model="deleteReason"
                        placeholder="请告诉我们删除账号的原因（可选）"
                        :rows="3"
                        :max-length="200"
                        show-word-limit
                    />
                </a-form-item>
            </div>
        </a-modal>
    </div>
</template>

<script setup>
import { IconExclamationCircle } from "@arco-design/web-vue/es/icon";
import { ref } from "vue";

const props = defineProps({
	deleting: {
		type: Boolean,
		default: false,
	},
});

const emit = defineEmits(["delete-account"]);

const deleteModalVisible = ref(false);
const deleteReason = ref("");

const showDeleteConfirm = () => {
	deleteModalVisible.value = true;
	deleteReason.value = "";
};

const confirmDeleteAccount = () => {
	emit("delete-account", deleteReason.value);
};
</script>
