<template>
    <div class="space-y-6">
        <!-- 个人信息卡片 -->
        <div
            class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
        >
            <div
                class="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between"
            >
                <div>
                    <h3 class="text-lg font-semibold text-gray-800">
                        个人信息
                    </h3>
                    <p class="text-sm text-gray-500 mt-1">
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
                        class="max-w-2xl"
                    >
                        <!-- 邮箱（只读） -->
                        <a-form-item label="邮箱地址">
                            <a-input
                                v-model="formData.email"
                                disabled
                                class="bg-gray-50!"
                            >
                                <template #prefix>
                                    <icon-email class="text-gray-400" />
                                </template>
                                <template #suffix>
                                    <a-tag color="blue" size="small"
                                        >已验证</a-tag
                                    >
                                </template>
                            </a-input>
                            <template #extra>
                                <span class="text-xs text-gray-400">
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
                                    <icon-user class="text-gray-400" />
                                </template>
                            </a-input>
                            <template #extra>
                                <span class="text-xs text-gray-400">
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
                                    <icon-image class="text-gray-400" />
                                </template>
                            </a-input>
                            <template #extra>
                                <span class="text-xs text-gray-400">
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
                                    @click="handleSave"
                                >
                                    <template #icon><icon-save /></template>
                                    保存修改
                                </a-button>
                                <a-button @click="handleReset">
                                    <template #icon><icon-refresh /></template>
                                    重置
                                </a-button>
                            </div>
                        </a-form-item>
                    </a-form>
                </div>
            </a-spin>
        </div>

        <!-- 账户统计信息 -->
        <div
            class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
        >
            <div class="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h3 class="text-lg font-semibold text-gray-800">账户信息</h3>
            </div>
            <div class="p-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                        class="flex items-center gap-3 p-4 bg-gray-50 rounded-lg"
                    >
                        <div
                            class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"
                        >
                            <icon-calendar class="text-blue-600 text-lg" />
                        </div>
                        <div>
                            <div class="text-xs text-gray-500">注册时间</div>
                            <div class="text-sm font-medium text-gray-800">
                                {{ formatDate(userInfo?.created_at) }}
                            </div>
                        </div>
                    </div>
                    <div
                        class="flex items-center gap-3 p-4 bg-gray-50 rounded-lg"
                    >
                        <div
                            class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"
                        >
                            <icon-check-circle class="text-green-600 text-lg" />
                        </div>
                        <div>
                            <div class="text-xs text-gray-500">账户状态</div>
                            <div class="text-sm font-medium text-gray-800">
                                正常使用中
                            </div>
                        </div>
                    </div>
                    <div
                        class="flex items-center gap-3 p-4 bg-gray-50 rounded-lg"
                    >
                        <div
                            class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center"
                        >
                            <icon-user class="text-purple-600 text-lg" />
                        </div>
                        <div>
                            <div class="text-xs text-gray-500">用户 ID</div>
                            <div
                                class="text-sm font-medium text-gray-800 font-mono"
                            >
                                {{ userInfo?.id?.slice(0, 8) }}...
                            </div>
                        </div>
                    </div>
                    <div
                        class="flex items-center gap-3 p-4 bg-gray-50 rounded-lg"
                    >
                        <div
                            class="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center"
                        >
                            <icon-lock class="text-orange-600 text-lg" />
                        </div>
                        <div>
                            <div class="text-xs text-gray-500">认证方式</div>
                            <div class="text-sm font-medium text-gray-800">
                                {{ getAuthProvider() }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { Message } from "@arco-design/web-vue";
import {
    IconEmail,
    IconUser,
    IconImage,
    IconSave,
    IconRefresh,
    IconCalendar,
    IconCheckCircle,
    IconLock,
} from "@arco-design/web-vue/es/icon";
import { getCurrentUser, updateUserProfile } from "@/services/auth.js";

// State
const isLoading = ref(false);
const isSaving = ref(false);
const formRef = ref(null);
const userInfo = ref(null);
const avatarError = ref(false);

// 表单数据
const formData = reactive({
    email: "",
    name: "",
    bio: "",
    avatar_url: "",
});

// 原始数据备份（用于重置）
const originalData = reactive({
    name: "",
    bio: "",
    avatar_url: "",
});

// 表单验证规则
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

// 格式化日期
const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
};

// 获取认证方式
const getAuthProvider = () => {
    if (!userInfo.value?.app_metadata?.provider) return "邮箱密码";
    const provider = userInfo.value.app_metadata.provider;
    const providerMap = {
        email: "邮箱密码",
        google: "Google",
        github: "GitHub",
    };
    return providerMap[provider] || provider;
};

// 头像加载错误处理
const handleAvatarError = () => {
    avatarError.value = true;
};

// 加载用户信息
const loadUserInfo = async () => {
    isLoading.value = true;
    try {
        const user = await getCurrentUser();
        if (!user) {
            Message.error("获取用户信息失败");
            return;
        }

        userInfo.value = user;
        formData.email = user.email || "";
        formData.name = user.user_metadata?.name || "";
        formData.bio = user.user_metadata?.bio || "";
        formData.avatar_url = user.user_metadata?.avatar_url || "";

        // 备份原始数据
        originalData.name = formData.name;
        originalData.bio = formData.bio;
        originalData.avatar_url = formData.avatar_url;
    } catch (error) {
        console.error("加载用户信息失败:", error);
        Message.error("加载用户信息失败");
    } finally {
        isLoading.value = false;
    }
};

// 保存修改
const handleSave = async () => {
    try {
        const valid = await formRef.value?.validate();
        if (valid) return;

        isSaving.value = true;
        avatarError.value = false;

        // 构建更新数据
        const updates = {
            name: formData.name || null,
            bio: formData.bio || null,
            avatar_url: formData.avatar_url || null,
        };

        await updateUserProfile(updates);
        Message.success("个人信息更新成功");

        // 更新备份数据
        originalData.name = formData.name;
        originalData.bio = formData.bio;
        originalData.avatar_url = formData.avatar_url;

        // 重新加载用户信息（这会触发 Supabase 更新）
        await loadUserInfo();

        // 触发页面刷新（通过刷新按钮的方式通知父组件）
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent("user-profile-updated"));
        }, 100);
    } catch (error) {
        console.error("更新个人信息失败:", error);
        Message.error(error.message || "更新失败，请重试");
    } finally {
        isSaving.value = false;
    }
};

// 重置表单
const handleReset = () => {
    formData.name = originalData.name;
    formData.bio = originalData.bio;
    formData.avatar_url = originalData.avatar_url;
    avatarError.value = false;
    formRef.value?.clearValidate();
};

// 组件挂载时加载数据
onMounted(() => {
    loadUserInfo();
});

// 暴露刷新方法给父组件
defineExpose({
    refresh: loadUserInfo,
});
</script>

<style scoped>
.w-full {
    width: 100%;
}

:deep(.arco-form-item-label) {
    font-weight: 500;
    color: #4e5969;
}

:deep(.arco-input-wrapper),
:deep(.arco-textarea-wrapper) {
    border-radius: 8px;
}

:deep(.arco-avatar img) {
    object-fit: cover;
}
</style>
