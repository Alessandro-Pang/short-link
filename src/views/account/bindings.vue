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
            <div class="binding-card">
                <div class="binding-icon">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <rect x="3" y="5" width="18" height="14" rx="2" />
                        <path d="M3 7l9 6 9-6" />
                    </svg>
                </div>
                <div class="binding-info">
                    <h3>邮箱账号</h3>
                    <p v-if="bindings.email">
                        已绑定: {{ bindings.email.email }}
                        <span class="linked-time"
                            >绑定于
                            {{ formatDate(bindings.email.linkedAt) }}</span
                        >
                    </p>
                    <p v-else class="not-linked">未绑定</p>
                </div>
                <div class="binding-actions">
                    <button
                        v-if="!bindings.email"
                        @click="showEmailBindingDialog"
                        class="btn-link"
                    >
                        绑定
                    </button>
                    <button
                        v-else
                        @click="unlinkProvider('email')"
                        class="btn-unlink"
                        :disabled="!canUnlink || unlinking === 'email'"
                    >
                        {{ unlinking === "email" ? "解绑中..." : "解绑" }}
                    </button>
                </div>
            </div>

            <!-- GitHub 绑定 -->
            <div class="binding-card">
                <div class="binding-icon github">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                    >
                        <path
                            d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
                        />
                    </svg>
                </div>
                <div class="binding-info">
                    <h3>GitHub 账号</h3>
                    <p v-if="bindings.github">
                        已绑定:
                        {{
                            bindings.github.email ||
                            bindings.github.metadata?.user_name ||
                            "GitHub 用户"
                        }}
                        <span class="linked-time"
                            >绑定于
                            {{ formatDate(bindings.github.linkedAt) }}</span
                        >
                    </p>
                    <p v-else class="not-linked">未绑定</p>
                </div>
                <div class="binding-actions">
                    <button
                        v-if="!bindings.github"
                        @click="linkProvider('github')"
                        class="btn-link"
                        :disabled="linking === 'github'"
                    >
                        {{ linking === "github" ? "绑定中..." : "绑定" }}
                    </button>
                    <button
                        v-else
                        @click="unlinkProvider('github')"
                        class="btn-unlink"
                        :disabled="!canUnlink || unlinking === 'github'"
                    >
                        {{ unlinking === "github" ? "解绑中..." : "解绑" }}
                    </button>
                </div>
            </div>

            <!-- Google 绑定 -->
            <div class="binding-card">
                <div class="binding-icon google">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="currentColor"
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
                <div class="binding-info">
                    <h3>Google 账号</h3>
                    <p v-if="bindings.google">
                        已绑定: {{ bindings.google.email || "Google 用户" }}
                        <span class="linked-time"
                            >绑定于
                            {{ formatDate(bindings.google.linkedAt) }}</span
                        >
                    </p>
                    <p v-else class="not-linked">未绑定</p>
                </div>
                <div class="binding-actions">
                    <button
                        v-if="!bindings.google"
                        @click="linkProvider('google')"
                        class="btn-link"
                        :disabled="linking === 'google'"
                    >
                        {{ linking === "google" ? "绑定中..." : "绑定" }}
                    </button>
                    <button
                        v-else
                        @click="unlinkProvider('google')"
                        class="btn-unlink"
                        :disabled="!canUnlink || unlinking === 'google'"
                    >
                        {{ unlinking === "google" ? "解绑中..." : "解绑" }}
                    </button>
                </div>
            </div>
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

<script>
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import {
    getUserIdentities,
    linkEmailAccount as linkEmail,
    linkGithubAccount,
    linkGoogleAccount,
    unlinkIdentity as unlinkProvider,
    deleteAccount,
    formatIdentities,
    handleOAuthLinkCallback,
} from "../../services/account.js";

export default {
    name: "AccountBindings",
    setup() {
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

        // 计算是否可以解绑（至少保留一种登录方式）
        const canUnlink = computed(() => {
            const linkedCount = Object.values(bindings.value).filter(
                (b) => b !== null,
            ).length;
            return linkedCount > 1;
        });

        // 加载身份绑定列表
        const loadIdentities = async () => {
            try {
                loading.value = true;
                identities.value = await getUserIdentities();
                bindings.value = formatIdentities(identities.value);
            } catch (error) {
                console.error("加载身份绑定失败:", error);
                alert("加载失败: " + error.message);
            } finally {
                loading.value = false;
            }
        };

        // 显示邮箱绑定对话框
        const showEmailBindingDialog = () => {
            emailDialogVisible.value = true;
        };

        // 关闭邮箱绑定对话框
        const closeEmailDialog = () => {
            emailDialogVisible.value = false;
            emailForm.value = { email: "", password: "" };
        };

        // 绑定邮箱账号
        const linkEmailAccount = async () => {
            try {
                linking.value = "email";
                await linkEmail(
                    emailForm.value.email,
                    emailForm.value.password,
                );
                alert("邮箱绑定成功！");
                closeEmailDialog();
                await loadIdentities();
            } catch (error) {
                console.error("绑定邮箱失败:", error);
                alert("绑定失败: " + error.message);
            } finally {
                linking.value = null;
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
                alert(`绑定失败: ${error.message}`);
                linking.value = null;
            }
        };

        // 解绑账号
        const unlinkAccount = async (provider) => {
            if (!canUnlink.value) {
                alert("至少需要保留一种登录方式");
                return;
            }

            if (!confirm(`确定要解绑 ${provider} 账号吗？`)) {
                return;
            }

            try {
                unlinking.value = provider;
                await unlinkProvider(provider);
                alert(`${provider} 账号解绑成功！`);
                await loadIdentities();
            } catch (error) {
                console.error(`解绑 ${provider} 失败:`, error);
                alert(`解绑失败: ${error.message}`);
            } finally {
                unlinking.value = null;
            }
        };

        // 显示删除账号对话框
        const showDeleteAccountDialog = () => {
            deleteDialogVisible.value = true;
        };

        // 关闭删除账号对话框
        const closeDeleteDialog = () => {
            deleteDialogVisible.value = false;
            deleteReason.value = "";
        };

        // 确认删除账号
        const confirmDeleteAccount = async () => {
            if (!confirm("最后确认：真的要删除账号吗？此操作不可逆！")) {
                return;
            }

            try {
                deleting.value = true;
                await deleteAccount(deleteReason.value);
                alert("账号已删除，感谢你的使用！");
                router.push("/");
            } catch (error) {
                console.error("删除账号失败:", error);
                alert(`删除失败: ${error.message}`);
                deleting.value = false;
            }
        };

        // 格式化日期
        const formatDate = (dateString) => {
            if (!dateString) return "";
            const date = new Date(dateString);
            return date.toLocaleDateString("zh-CN", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });
        };

        // 处理 OAuth 绑定回调
        const handleOAuthCallback = async () => {
            const linkProvider = route.query.link;
            if (
                linkProvider &&
                (linkProvider === "github" || linkProvider === "google")
            ) {
                try {
                    await handleOAuthLinkCallback(linkProvider);
                    alert(`${linkProvider} 账号绑定成功！`);
                    // 清除 URL 参数
                    router.replace({ query: {} });
                    await loadIdentities();
                } catch (error) {
                    console.error(`处理 ${linkProvider} 绑定回调失败:`, error);
                    alert(`绑定失败: ${error.message}`);
                }
            }
        };

        onMounted(async () => {
            await loadIdentities();
            await handleOAuthCallback();
        });

        return {
            loading,
            bindings,
            linking,
            unlinking,
            deleting,
            canUnlink,
            emailDialogVisible,
            emailForm,
            deleteDialogVisible,
            deleteReason,
            showEmailBindingDialog,
            closeEmailDialog,
            linkEmailAccount,
            linkProvider,
            unlinkProvider: unlinkAccount,
            showDeleteAccountDialog,
            closeDeleteDialog,
            confirmDeleteAccount,
            formatDate,
        };
    },
};
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
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

.bindings-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 3rem;
}

.binding-card {
    display: flex;
    align-items: center;
    padding: 1.5rem;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: white;
    transition: all 0.2s;
}

.binding-card:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.binding-icon {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f3f4f6;
    color: #6b7280;
    margin-right: 1rem;
    flex-shrink: 0;
}

.binding-icon.github {
    background: #24292e;
    color: white;
}

.binding-icon.google {
    background: white;
    border: 1px solid #e5e7eb;
}

.binding-info {
    flex: 1;
}

.binding-info h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 0.25rem;
}

.binding-info p {
    color: #666;
    font-size: 0.875rem;
}

.not-linked {
    color: #999 !important;
}

.linked-time {
    color: #999;
    font-size: 0.75rem;
    margin-left: 0.5rem;
}

.binding-actions {
    flex-shrink: 0;
}

.btn-link,
.btn-unlink,
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

.btn-link {
    background: #3b82f6;
    color: white;
}

.btn-link:hover:not(:disabled) {
    background: #2563eb;
}

.btn-unlink {
    background: #f3f4f6;
    color: #6b7280;
}

.btn-unlink:hover:not(:disabled) {
    background: #e5e7eb;
    color: #374151;
}

.btn-link:disabled,
.btn-unlink:disabled,
.btn-delete:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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

.btn-delete {
    background: #dc2626;
    color: white;
}

.btn-delete:hover:not(:disabled) {
    background: #b91c1c;
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
