<template>
    <div class="account-bindings-container">
        <div class="header">
            <h1>账号绑定管理</h1>
            <p class="subtitle">管理你的登录方式，绑定多个账号以便随时登录</p>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="loading">
            <div class="spinner"></div>
            <p>加载中...</p>
        </div>

        <!-- 绑定列表 -->
        <div v-else class="bindings-list">
            <!-- 邮箱绑定 -->
            <ProviderCard
                provider="email"
                :binding="bindings.email"
                :canUnlink="canUnlink"
                :isLinking="linking === 'email'"
                :isUnlinking="unlinking === 'email'"
                @link="showEmailBindingDialog"
                @unlink="unlinkProvider('email')"
            />

            <!-- GitHub 绑定 -->
            <ProviderCard
                provider="github"
                :binding="bindings.github"
                :canUnlink="canUnlink"
                :isLinking="linking === 'github'"
                :isUnlinking="unlinking === 'github'"
                @link="linkProvider"
                @unlink="unlinkProvider"
            />

            <!-- Google 绑定 -->
            <ProviderCard
                provider="google"
                :binding="bindings.google"
                :canUnlink="canUnlink"
                :isLinking="linking === 'google'"
                :isUnlinking="unlinking === 'google'"
                @link="linkProvider"
                @unlink="unlinkProvider"
            />
        </div>

        <!-- 危险操作区域 -->
        <div class="danger-zone">
            <h2>危险操作</h2>
            <p class="warning-text">以下操作不可逆，请谨慎操作</p>
            <button
                @click="showDeleteAccountDialog"
                class="btn-delete"
                :disabled="deleting"
            >
                {{ deleting ? "删除中..." : "删除账号" }}
            </button>
        </div>

        <!-- 邮箱绑定对话框 -->
        <div
            v-if="emailDialogVisible"
            class="modal-overlay"
            @click.self="closeEmailDialog"
        >
            <div class="modal-content">
                <h3>绑定邮箱账号</h3>
                <form @submit.prevent="linkEmailAccount">
                    <div class="form-group">
                        <label>邮箱地址</label>
                        <input
                            v-model="emailForm.email"
                            type="email"
                            placeholder="请输入邮箱地址"
                            required
                        />
                    </div>
                    <div class="form-group">
                        <label>密码</label>
                        <input
                            v-model="emailForm.password"
                            type="password"
                            placeholder="请输入密码（至少6位）"
                            required
                            minlength="6"
                        />
                    </div>
                    <div class="modal-actions">
                        <button
                            type="button"
                            @click="closeEmailDialog"
                            class="btn-cancel"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            class="btn-confirm"
                            :disabled="linking === 'email'"
                        >
                            {{ linking === "email" ? "绑定中..." : "确认绑定" }}
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- 删除账号确认对话框 -->
        <div
            v-if="deleteDialogVisible"
            class="modal-overlay"
            @click.self="closeDeleteDialog"
        >
            <div class="modal-content">
                <h3>删除账号</h3>
                <p class="warning-text">
                    <strong>警告：</strong
                    >此操作将永久删除你的账号及所有相关数据，包括：
                </p>
                <ul class="delete-list">
                    <li>所有创建的短链接</li>
                    <li>访问统计数据</li>
                    <li>账号绑定信息</li>
                    <li>个人资料</li>
                </ul>
                <p class="warning-text">此操作不可逆，确定要继续吗？</p>
                <div class="form-group">
                    <label>删除原因（可选）</label>
                    <textarea
                        v-model="deleteReason"
                        placeholder="请告诉我们删除账号的原因（可选）"
                        rows="3"
                    ></textarea>
                </div>
                <div class="modal-actions">
                    <button @click="closeDeleteDialog" class="btn-cancel">
                        取消
                    </button>
                    <button
                        @click="confirmDeleteAccount"
                        class="btn-delete"
                        :disabled="deleting"
                    >
                        {{ deleting ? "删除中..." : "确认删除" }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { Message, Modal } from "@arco-design/web-vue";
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { formatDate } from "@/utils/date";
import {
	deleteAccount,
	formatIdentities,
	getUserIdentities,
	handleOAuthLinkCallback,
	linkEmailAccount as linkEmail,
	linkGithubAccount,
	linkGoogleAccount,
	unlinkIdentity,
} from "../../services/account";
import ProviderCard from "./components/ProviderCard.vue";

const router = useRouter();
const route = useRoute();

const loading = ref(true);
const identities = ref([]);
const bindings = ref({
	email: null,
	github: null,
	google: null,
});

const linking = ref(null);
const unlinking = ref(null);
const deleting = ref(false);

const emailDialogVisible = ref(false);
const emailForm = ref({
	email: "",
	password: "",
});

const deleteDialogVisible = ref(false);
const deleteReason = ref("");

const canUnlink = computed(() => {
	const linkedCount = Object.values(bindings.value).filter((b) => b !== null).length;
	return linkedCount > 1;
});

const loadIdentities = async () => {
	try {
		loading.value = true;
		identities.value = await getUserIdentities();
		bindings.value = formatIdentities(identities.value);
	} catch (error) {
		console.error("加载身份绑定失败:", error);
		Message.error(`加载失败: ${error.message}`);
	} finally {
		loading.value = false;
	}
};

const showEmailBindingDialog = () => {
	emailDialogVisible.value = true;
};

const closeEmailDialog = () => {
	emailDialogVisible.value = false;
	emailForm.value = { email: "", password: "" };
};

const linkEmailAccount = async () => {
	try {
		linking.value = "email";
		await linkEmail(emailForm.value.email, emailForm.value.password);
		Message.success("邮箱绑定成功");
		closeEmailDialog();
		await loadIdentities();
	} catch (error) {
		console.error("绑定邮箱失败:", error);
		Message.error(`绑定失败: ${error.message}`);
	} finally {
		linking.value = null;
	}
};

const linkProvider = async (provider) => {
	try {
		linking.value = provider;
		if (provider === "github") {
			await linkGithubAccount();
		} else if (provider === "google") {
			await linkGoogleAccount();
		}
	} catch (error) {
		console.error(`绑定 ${provider} 失败:`, error);
		Message.error(`绑定失败: ${error.message}`);
		linking.value = null;
	}
};

const unlinkProvider = async (provider) => {
	if (!canUnlink.value) {
		Message.warning("至少需要保留一种登录方式");
		return;
	}

	Modal.confirm({
		title: "确认解绑",
		content: `确定要解绑 ${provider} 账号吗？`,
		okText: "确认解绑",
		cancelText: "取消",
		onOk: async () => {
			try {
				unlinking.value = provider;
				await unlinkIdentity(provider);
				Message.success(`${provider} 账号解绑成功`);
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

const showDeleteAccountDialog = () => {
	deleteDialogVisible.value = true;
};

const closeDeleteDialog = () => {
	deleteDialogVisible.value = false;
	deleteReason.value = "";
};

const confirmDeleteAccount = async () => {
	Modal.confirm({
		title: "最后确认",
		content: "真的要删除账号吗？此操作不可逆！",
		okText: "确认删除",
		cancelText: "取消",
		okButtonProps: { status: "danger" },
		onOk: async () => {
			try {
				deleting.value = true;
				await deleteAccount(deleteReason.value);
				Message.success("账号已删除，感谢你的使用");
				router.push("/");
			} catch (error) {
				console.error("删除账号失败:", error);
				Message.error(`删除失败: ${error.message}`);
				deleting.value = false;
			}
		},
	});
};

const handleOAuthCallback = async () => {
	const linkProviderParam = route.query.link;
	if (linkProviderParam && (linkProviderParam === "github" || linkProviderParam === "google")) {
		try {
			await handleOAuthLinkCallback(linkProviderParam);
			Message.success(`${linkProviderParam} 账号绑定成功`);
			router.replace({ query: {} });
			await loadIdentities();
		} catch (error) {
			console.error(`处理 ${linkProviderParam} 绑定回调失败:`, error);
			Message.error(`绑定失败: ${error.message}`);
		}
	}
};

onMounted(async () => {
	await loadIdentities();
	await handleOAuthCallback();
});
</script>

<style scoped>
.account-bindings-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
}

.header {
    margin-bottom: 2rem;
}

.header h1 {
    font-size: 2rem;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 0.5rem;
}

.subtitle {
    color: #666;
    font-size: 1rem;
}

.loading {
    text-align: center;
    padding: 3rem;
}

.spinner {
    border: 3px solid #f3f3f3;
    border-top: 3px solid #3498db;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.bindings-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 3rem;
}

.danger-zone {
    padding: 1.5rem;
    border: 2px solid #fee2e2;
    border-radius: 8px;
    background: #fef2f2;
}

.danger-zone h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #dc2626;
    margin-bottom: 0.5rem;
}

.warning-text {
    color: #dc2626;
    font-size: 0.875rem;
    margin-bottom: 1rem;
}

.btn-delete,
.btn-confirm,
.btn-cancel {
    padding: 0.5rem 1.5rem;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    outline: none;
}

.btn-delete {
    background: #dc2626;
    color: white;
}

.btn-delete:hover:not(:disabled) {
    background: #b91c1c;
}

.btn-delete:disabled,
.btn-confirm:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-content {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
}

.modal-content h3 {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
    color: #1a1a1a;
}

.form-group {
    margin-bottom: 1.5rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #374151;
}

.form-group input,
.form-group textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 1rem;
    transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus {
    outline: none;
    border-color: #3b82f6;
}

.delete-list {
    margin: 1rem 0;
    padding-left: 1.5rem;
    color: #666;
}

.delete-list li {
    margin-bottom: 0.5rem;
}

.modal-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 1.5rem;
}

.btn-confirm {
    background: #3b82f6;
    color: white;
}

.btn-confirm:hover:not(:disabled) {
    background: #2563eb;
}

.btn-cancel {
    background: #f3f4f6;
    color: #6b7280;
}

.btn-cancel:hover {
    background: #e5e7eb;
    color: #374151;
}
</style>
