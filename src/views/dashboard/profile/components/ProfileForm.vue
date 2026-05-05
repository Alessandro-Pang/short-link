<template>
    <div
        class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
    >
        <div
            class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-between"
        >
            <div>
                <h3
                    class="text-lg font-semibold text-gray-800 dark:text-gray-200"
                >
                    个人信息
                </h3>
                <p
                    class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1"
                >
                    管理您的账户信息和偏好设置
                </p>
            </div>
        </div>

        <a-spin :loading="isLoading" class="w-full">
            <div class="p-6">
                <a-form
                    ref="formRef"
                    :model="formData"
                    :rules="rules"
                    layout="vertical"
                    size="large"
                >
                    <!-- 邮箱（只读） -->
                    <a-form-item label="邮箱地址">
                        <a-input v-model="formData.email" disabled>
                            <template #prefix>
                                <icon-email
                                    class="text-gray-400 dark:text-gray-500"
                                />
                            </template>
                            <template #suffix>
                                <a-tag color="blue" size="small"
                                    >已验证</a-tag
                                >
                            </template>
                        </a-input>
                        <template #extra>
                            <span
                                class="text-xs text-gray-400 dark:text-gray-500"
                            >
                                邮箱地址无法修改
                            </span>
                        </template>
                    </a-form-item>

                    <!-- 用户名 -->
                    <a-form-item
                        label="用户名"
                        field="name"
                        :rules="[
                            {
                                maxLength: 50,
                                message: '用户名不能超过50个字符',
                            },
                        ]"
                    >
                        <a-input
                            v-model="formData.name"
                            placeholder="请输入您的用户名"
                            allow-clear
                            :max-length="50"
                            show-word-limit
                        >
                            <template #prefix>
                                <icon-user
                                    class="text-gray-400 dark:text-gray-500"
                                />
                            </template>
                        </a-input>
                        <template #extra>
                            <span
                                class="text-xs text-gray-400 dark:text-gray-500"
                            >
                                未设置用户名时将显示邮箱前缀
                            </span>
                        </template>
                    </a-form-item>

                    <!-- 个人简介 -->
                    <a-form-item
                        label="个人简介"
                        field="bio"
                        :rules="[
                            {
                                maxLength: 200,
                                message: '个人简介不能超过200个字符',
                            },
                        ]"
                    >
                        <a-textarea
                            v-model="formData.bio"
                            placeholder="介绍一下自己吧"
                            :auto-size="{ minRows: 3, maxRows: 6 }"
                            :max-length="200"
                            show-word-limit
                            allow-clear
                        />
                    </a-form-item>

                    <!-- 头像 URL -->
                    <a-form-item
                        label="头像链接"
                        field="avatar_url"
                        :rules="[
                            {
                                validator: validateUrl,
                            },
                        ]"
                    >
                        <a-input
                            v-model="formData.avatar_url"
                            placeholder="https://example.com/avatar.jpg"
                            allow-clear
                        >
                            <template #prefix>
                                <icon-image
                                    class="text-gray-400 dark:text-gray-500"
                                />
                            </template>
                        </a-input>
                        <template #extra>
                            <span
                                class="text-xs text-gray-400 dark:text-gray-500"
                            >
                                输入图片链接地址，支持 https:// 协议
                            </span>
                        </template>
                    </a-form-item>

                    <!-- 头像预览 -->
                    <a-form-item
                        v-if="formData.avatar_url"
                        label="头像预览"
                    >
                        <div class="flex items-center gap-4">
                            <a-avatar
                                :size="64"
                                :image-url="formData.avatar_url"
                                class="shadow-sm"
                            >
                                <img
                                    alt="avatar"
                                    :src="formData.avatar_url"
                                    @error="handleAvatarError"
                                />
                            </a-avatar>
                            <span
                                v-if="avatarError"
                                class="text-sm text-red-500"
                            >
                                头像加载失败，请检查链接是否有效
                            </span>
                        </div>
                    </a-form-item>

                    <!-- 按钮组 -->
                    <a-form-item>
                        <div class="flex gap-3">
                            <a-button
                                type="primary"
                                :loading="isSaving"
                                @click="$emit('save')"
                            >
                                <template #icon><icon-save /></template>
                                保存修改
                            </a-button>
                            <a-button @click="$emit('reset')">
                                <template #icon
                                    ><icon-refresh
                                /></template>
                                重置
                            </a-button>
                        </div>
                    </a-form-item>
                </a-form>
            </div>
        </a-spin>
    </div>
</template>

<script setup>
import {
	IconEmail,
	IconImage,
	IconRefresh,
	IconSave,
	IconUser,
} from "@arco-design/web-vue/es/icon";
import { ref } from "vue";

const props = defineProps({
	formData: {
		type: Object,
		required: true,
	},
	isLoading: {
		type: Boolean,
		default: false,
	},
	isSaving: {
		type: Boolean,
		default: false,
	},
	avatarError: {
		type: Boolean,
		default: false,
	},
});

const emit = defineEmits(["save", "reset", "update:avatarError"]);

const formRef = ref(null);
const rules = {};

// URL 验证
const validateUrl = (value, callback) => {
	if (!value) {
		callback();
		return;
	}
	try {
		const url = new URL(value);
		if (url.protocol !== "https:") {
			callback("头像链接必须使用 https:// 协议");
		} else {
			callback();
		}
	} catch {
		callback("请输入有效的 URL 地址");
	}
};

// 头像加载错误处理
const handleAvatarError = () => {
	emit("update:avatarError", true);
};

defineExpose({
	validate: () => formRef.value?.validate(),
	clearValidate: () => formRef.value?.clearValidate(),
});
</script>
