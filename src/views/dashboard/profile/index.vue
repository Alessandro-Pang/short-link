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

        <!-- 账号绑定管理 -->
        <div
            class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
        >
            <div class="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h3 class="text-lg font-semibold text-gray-800">账号绑定</h3>
                <p class="text-sm text-gray-500 mt-1">
                    绑定多个登录方式，方便随时登录
                </p>
            </div>

            <a-spin :loading="loadingIdentities" class="w-full">
                <div class="p-6">
                    <div class="space-y-3 max-w-2xl">
                        <!-- 邮箱绑定 -->
                        <div
                            class="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                        >
                            <div class="flex items-center gap-3">
                                <div
                                    class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center"
                                >
                                    <icon-email class="text-gray-600 text-lg" />
                                </div>
                                <div>
                                    <div class="font-medium text-gray-800">
                                        邮箱账号
                                    </div>
                                    <div
                                        v-if="bindings.email"
                                        class="text-sm text-gray-500"
                                    >
                                        {{ bindings.email.email }}
                                    </div>
                                    <div v-else class="text-sm text-gray-400">
                                        未绑定
                                    </div>
                                </div>
                            </div>
                            <a-tag
                                v-if="bindings.email"
                                color="green"
                                size="small"
                            >
                                已绑定
                            </a-tag>
                            <a-tag v-else color="gray" size="small">
                                未绑定
                            </a-tag>
                        </div>

                        <!-- GitHub 绑定 -->
                        <div
                            class="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                        >
                            <div class="flex items-center gap-3">
                                <div
                                    class="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="white"
                                    >
                                        <path
                                            d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <div class="font-medium text-gray-800">
                                        GitHub 账号
                                    </div>
                                    <div
                                        v-if="bindings.github"
                                        class="text-sm text-gray-500"
                                    >
                                        {{
                                            bindings.github.email ||
                                            "GitHub 用户"
                                        }}
                                    </div>
                                    <div v-else class="text-sm text-gray-400">
                                        未绑定
                                    </div>
                                </div>
                            </div>
                            <div class="flex items-center gap-2">
                                <a-tag
                                    v-if="bindings.github"
                                    color="green"
                                    size="small"
                                >
                                    已绑定
                                </a-tag>
                                <a-button
                                    v-if="!bindings.github"
                                    type="primary"
                                    size="small"
                                    :loading="linking === 'github'"
                                    @click="linkProvider('github')"
                                >
                                    绑定
                                </a-button>
                                <a-button
                                    v-else
                                    size="small"
                                    status="danger"
                                    :disabled="
                                        !canUnlink || unlinking === 'github'
                                    "
                                    :loading="unlinking === 'github'"
                                    @click="unlinkAccount('github')"
                                >
                                    解绑
                                </a-button>
                            </div>
                        </div>

                        <!-- Google 绑定 -->
                        <div
                            class="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                        >
                            <div class="flex items-center gap-3">
                                <div
                                    class="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                            fill="#4285F4"
                                        />
                                        <path
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                            fill="#34A853"
                                        />
                                        <path
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                            fill="#FBBC05"
                                        />
                                        <path
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                            fill="#EA4335"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <div class="font-medium text-gray-800">
                                        Google 账号
                                    </div>
                                    <div
                                        v-if="bindings.google"
                                        class="text-sm text-gray-500"
                                    >
                                        {{
                                            bindings.google.email ||
                                            "Google 用户"
                                        }}
                                    </div>
                                    <div v-else class="text-sm text-gray-400">
                                        未绑定
                                    </div>
                                </div>
                            </div>
                            <div class="flex items-center gap-2">
                                <a-tag
                                    v-if="bindings.google"
                                    color="green"
                                    size="small"
                                >
                                    已绑定
                                </a-tag>
                                <a-button
                                    v-if="!bindings.google"
                                    type="primary"
                                    size="small"
                                    :loading="linking === 'google'"
                                    @click="linkProvider('google')"
                                >
                                    绑定
                                </a-button>
                                <a-button
                                    v-else
                                    size="small"
                                    status="danger"
                                    :disabled="
                                        !canUnlink || unlinking === 'google'
                                    "
                                    :loading="unlinking === 'google'"
                                    @click="unlinkAccount('google')"
                                >
                                    解绑
                                </a-button>
                            </div>
                        </div>

                        <!-- 提示信息 -->
                        <div
                            v-if="!canUnlink"
                            class="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg"
                        >
                            <div class="flex items-start gap-2">
                                <icon-info-circle
                                    class="text-orange-500 mt-0.5 shrink-0"
                                />
                                <div class="text-sm text-orange-700">
                                    至少需要保留一种登录方式，请先绑定其他方式后再解绑。
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </a-spin>
        </div>

        <!-- 危险操作区域 -->
        <div
            class="bg-red-50 rounded-xl shadow-sm border border-red-200 overflow-hidden"
        >
            <div class="px-6 py-4 border-b border-red-200 bg-red-100">
                <h3 class="text-lg font-semibold text-red-800">危险操作</h3>
                <p class="text-sm text-red-600 mt-1">
                    以下操作不可逆，请谨慎执行
                </p>
            </div>
            <div class="p-6">
                <div class="max-w-2xl">
                    <div class="flex items-start justify-between">
                        <div>
                            <h4 class="font-medium text-gray-800">删除账号</h4>
                            <p class="text-sm text-gray-500 mt-1">
                                永久删除你的账号及所有相关数据，此操作不可恢复
                            </p>
                        </div>
                        <a-button
                            status="danger"
                            :loading="deleting"
                            @click="showDeleteConfirm"
                        >
                            删除账号
                        </a-button>
                    </div>
                </div>
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
import { ref, reactive, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { Message, Modal } from "@arco-design/web-vue";
import {
    IconEmail,
    IconUser,
    IconImage,
    IconSave,
    IconRefresh,
    IconCalendar,
    IconCheckCircle,
    IconLock,
    IconInfoCircle,
    IconExclamationCircle,
} from "@arco-design/web-vue/es/icon";
import { useUserStore } from "@/stores";
import {
    getUserIdentities,
    linkGithubAccount,
    linkGoogleAccount,
    unlinkIdentity,
    deleteAccount,
    formatIdentities,
} from "@/services/account.js";

const router = useRouter();
const userStore = useUserStore();

// State
const isSaving = ref(false);
const formRef = ref(null);
const avatarError = ref(false);

// 从 store 获取用户信息
const userInfo = computed(() => userStore.user);
const isLoading = computed(() => userStore.isLoading);

// 账号绑定相关状态
const loadingIdentities = ref(false);
const identities = ref([]);
const bindings = ref({
    email: null,
    github: null,
    google: null,
});
const linking = ref(null);
const unlinking = ref(null);
const deleting = ref(false);
const deleteModalVisible = ref(false);
const deleteReason = ref("");

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

// 计算是否可以解绑（至少保留一种登录方式）
const canUnlink = computed(() => {
    const linkedCount = Object.values(bindings.value).filter(
        (b) => b !== null,
    ).length;
    return linkedCount > 1;
});

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

// 同步 store 中的用户信息到表单
const syncUserToForm = () => {
    if (userStore.user) {
        formData.email = userStore.userEmail || "";
        formData.name = userStore.userName || "";
        formData.bio = userStore.userBio || "";
        formData.avatar_url = userStore.userAvatar || "";

        // 备份原始数据
        originalData.name = formData.name;
        originalData.bio = formData.bio;
        originalData.avatar_url = formData.avatar_url;
    }
};

// 监听 store 中用户信息变化，同步到表单
watch(
    () => userStore.user,
    (newUser) => {
        if (newUser) {
            syncUserToForm();
        }
    },
    { immediate: true },
);

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

        // 使用 store 更新用户资料（会自动更新 store 状态并触发事件）
        await userStore.updateProfile(updates);
        Message.success("个人信息更新成功");

        // 更新备份数据
        originalData.name = formData.name;
        originalData.bio = formData.bio;
        originalData.avatar_url = formData.avatar_url;
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

// 加载身份绑定列表
const loadIdentities = async () => {
    try {
        loadingIdentities.value = true;
        identities.value = await getUserIdentities();
        bindings.value = formatIdentities(identities.value);
    } catch (error) {
        console.error("加载身份绑定失败:", error);
        Message.error("加载绑定信息失败");
    } finally {
        loadingIdentities.value = false;
    }
};

// 绑定第三方账号（GitHub/Google）
const linkProvider = async (provider) => {
    try {
        linking.value = provider;
        if (provider === "github") {
            await linkGithubAccount();
        } else if (provider === "google") {
            await linkGoogleAccount();
        }
        // OAuth 会跳转，不需要在这里处理
    } catch (error) {
        console.error(`绑定 ${provider} 失败:`, error);
        Message.error(`绑定失败: ${error.message}`);
        linking.value = null;
    }
};

// 解绑账号
const unlinkAccount = async (provider) => {
    if (!canUnlink.value) {
        Message.warning("至少需要保留一种登录方式");
        return;
    }

    Modal.confirm({
        title: "确认解绑",
        content: `确定要解绑 ${provider} 账号吗？`,
        onOk: async () => {
            try {
                unlinking.value = provider;
                await unlinkIdentity(provider);
                Message.success(`${provider} 账号解绑成功！`);
                await loadIdentities();
            } catch (error) {
                console.error(`解绑 ${provider} 失败:`, error);
                Message.error(`解绑失败: ${error.message}`);
            } finally {
                unlinking.value = null;
            }
        },
    });
};

// 显示删除账号确认
const showDeleteConfirm = () => {
    deleteModalVisible.value = true;
    deleteReason.value = "";
};

// 确认删除账号
const confirmDeleteAccount = async () => {
    Modal.confirm({
        title: "最后确认",
        content: "真的要删除账号吗？此操作不可逆！",
        okText: "确认删除",
        cancelText: "取消",
        okButtonProps: {
            status: "danger",
        },
        onOk: async () => {
            try {
                deleting.value = true;
                await deleteAccount(deleteReason.value);
                Message.success("账号已删除");
                deleteModalVisible.value = false;

                // 等待一下再登出和跳转
                setTimeout(async () => {
                    await userStore.logout();
                    router.push("/");
                }, 1000);
            } catch (error) {
                console.error("删除账号失败:", error);
                Message.error(`删除失败: ${error.message}`);
                deleting.value = false;
            }
        },
    });
};

// 组件挂载时加载数据
onMounted(async () => {
    // 确保用户信息已加载（使用缓存，不会重复请求）
    await userStore.initialize();
    // 同步到表单
    syncUserToForm();
    // 加载身份绑定信息
    loadIdentities();
});

// 暴露刷新方法给父组件
defineExpose({
    refresh: async () => {
        await userStore.refreshUser();
        syncUserToForm();
    },
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
