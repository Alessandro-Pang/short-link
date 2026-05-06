<template>
    <div class="profile-container">
        <!-- 左侧：个人信息编辑 -->
        <div class="profile-left">
            <ProfileForm
                ref="formRef"
                :form-data="formData"
                :is-loading="isLoading"
                :is-saving="isSaving"
                v-model:avatar-error="avatarError"
                @save="handleSave"
                @reset="handleReset"
            />
        </div>

        <!-- 右侧：账户信息、绑定、危险操作 -->
        <div class="profile-right space-y-6">
            <!-- 账户统计信息 -->
            <div
                class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
            >
                <div
                    class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                >
                    <h3
                        class="text-lg font-semibold text-gray-800 dark:text-gray-200"
                    >
                        账户信息
                    </h3>
                </div>
                <div class="p-6">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div
                            class="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                            <div
                                class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center"
                            >
                                <icon-calendar
                                    class="text-blue-600 dark:text-blue-400 text-lg"
                                />
                            </div>
                            <div>
                                <div
                                    class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500"
                                >
                                    注册时间
                                </div>
                                <div
                                    class="text-sm font-medium text-gray-800 dark:text-gray-200"
                                >
                                    {{ formatDate(userInfo?.created_at) }}
                                </div>
                            </div>
                        </div>
                        <div
                            class="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                            <div
                                class="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center"
                            >
                                <icon-check-circle
                                    class="text-green-600 dark:text-green-400 text-lg"
                                />
                            </div>
                            <div>
                                <div
                                    class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500"
                                >
                                    账户状态
                                </div>
                                <div
                                    class="text-sm font-medium text-gray-800 dark:text-gray-200"
                                >
                                    正常使用中
                                </div>
                            </div>
                        </div>
                        <div
                            class="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                            <div
                                class="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center"
                            >
                                <icon-user
                                    class="text-purple-600 dark:text-purple-400 text-lg"
                                />
                            </div>
                            <div>
                                <div
                                    class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500"
                                >
                                    用户 ID
                                </div>
                                <div
                                    class="text-sm font-medium text-gray-800 dark:text-gray-200 font-mono"
                                >
                                    {{ userInfo?.id?.slice(0, 8) }}...
                                </div>
                            </div>
                        </div>
                        <div
                            class="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                            <div
                                class="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center"
                            >
                                <icon-lock
                                    class="text-orange-600! dark:text-orange-400! text-lg"
                                />
                            </div>
                            <div>
                                <div
                                    class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500"
                                >
                                    认证方式
                                </div>
                                <div
                                    class="text-sm font-medium text-gray-800 dark:text-gray-200"
                                >
                                    {{ getAuthProvider() }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <AccountBindings
                :bindings="bindings"
                :loading-identities="loadingIdentities"
                :can-unlink="canUnlink"
                :linking="linking"
                :unlinking="unlinking"
                @link-provider="linkProvider"
                @unlink-account="unlinkAccount"
            />

            <DangerZone
                :deleting="deleting"
                @delete-account="confirmDeleteAccount"
            />
        </div>
    </div>
</template>

<script setup>
import { Message, Modal } from "@arco-design/web-vue";
import { IconCalendar, IconCheckCircle, IconLock, IconUser } from "@arco-design/web-vue/es/icon";
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import {
	deleteAccount,
	formatIdentities,
	getUserIdentities,
	linkGithubAccount,
	linkGoogleAccount,
	unlinkIdentity,
} from "@/services/account";
import { useUserStore } from "@/stores";
import { formatDate } from "@/utils/date";
import AccountBindings from "./components/AccountBindings.vue";
import DangerZone from "./components/DangerZone.vue";
import ProfileForm from "./components/ProfileForm.vue";

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

// 计算是否可以解绑（至少保留一种登录方式）
const canUnlink = computed(() => {
	const linkedCount = Object.values(bindings.value).filter((b) => b !== null).length;
	return linkedCount > 1;
});

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

// 确认删除账号
const confirmDeleteAccount = async (reason) => {
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
				await deleteAccount(reason);
				Message.success("账号已删除");

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
/* 响应式两栏布局 */
.profile-container {
    display: grid;
    grid-template-columns: 1fr;
    gap: 24px;
}

/* 桌面端：两栏布局 */
@media (min-width: 1024px) {
    .profile-container {
        grid-template-columns: 1fr 1fr;
        align-items: start;
    }
}

/* 超大屏幕：更宽的左栏 */
@media (min-width: 1280px) {
    .profile-container {
        grid-template-columns: 1.2fr 1fr;
    }
}

.profile-left,
.profile-right {
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