<script setup>
import { Message, Modal } from "@arco-design/web-vue";
import {
	IconCalendar,
	IconDelete,
	IconEdit,
	IconEmail,
	IconLock,
	IconPlus,
	IconRefresh,
	IconSafe,
	IconUnlock,
	IconUser,
	IconUserAdd,
} from "@arco-design/web-vue/es/icon";
import { computed, onMounted, ref } from "vue";
import {
	createUser,
	deleteUser,
	getAllUsers,
	getUserDetails,
	resetUserPassword,
	toggleUserStatus,
	updateUser,
} from "@/services/admin";
import { formatDate } from "@/utils/date";

// State
const isLoading = ref(false);
const users = ref([]);
const pagination = ref({
	current: 1,
	pageSize: 20,
});
const total = ref(0);

// 创建用户对话框
const createModalVisible = ref(false);
const createForm = ref({
	email: "",
	password: "",
	name: "",
});

// 重置密码对话框
const resetPasswordModalVisible = ref(false);
const resetPasswordForm = ref({
	userId: "",
	userEmail: "",
	password: "",
});

// 加载用户列表
const loadUsers = async () => {
	isLoading.value = true;
	try {
		const result = await getAllUsers({
			page: pagination.value.current,
			perPage: pagination.value.pageSize,
		});

		users.value = result?.users || [];
		total.value = result?.total || 0;
	} catch (error) {
		console.error("加载用户列表失败:", error);
		Message.error(error.message || "加载用户列表失败");
	} finally {
		isLoading.value = false;
	}
};

// 获取用户状态
const getUserStatus = (user) => {
	if (user.banned_until) {
		const bannedUntil = new Date(user.banned_until);
		if (bannedUntil > new Date()) {
			return { text: "已禁用", color: "red", banned: true };
		}
	}
	return { text: "正常", color: "green", banned: false };
};

// 获取邮箱验证状态
const getEmailVerifiedStatus = (user) => {
	return user.email_confirmed_at ? "已验证" : "未验证";
};

// 获取用户角色
const getUserRole = (user) => {
	if (user?.is_admin) {
		return { text: "管理员", color: "orange", isAdmin: true };
	}
	return { text: "普通用户", color: "blue", isAdmin: false };
};

// 获取登录方式
const getAuthProvider = (user) => {
	if (user.app_metadata?.providers) {
		const providers = {
			email: "邮箱",
			github: "GitHub",
			google: "Google",
		};
		return user.app_metadata.providers.map((provider) => providers[provider] || provider);
	}
	return ["邮箱"];
};

// 创建用户
const handleCreateUser = async () => {
	if (!createForm.value.email || !createForm.value.password) {
		Message.warning("邮箱和密码不能为空");
		return;
	}

	try {
		await createUser({
			email: createForm.value.email,
			password: createForm.value.password,
			user_metadata: {
				name: createForm.value.name || createForm.value.email.split("@")[0],
			},
		});

		Message.success("用户创建成功");
		createModalVisible.value = false;
		createForm.value = { email: "", password: "", name: "" };
		loadUsers();
	} catch (error) {
		Message.error(error.message || "创建用户失败");
	}
};

// 删除用户
const handleDeleteUser = (user) => {
	Modal.warning({
		title: "删除用户",
		content: `确定要删除用户 ${user.email} 吗？此操作不可恢复！`,
		okText: "确定删除",
		cancelText: "取消",
		onOk: async () => {
			try {
				await deleteUser(user.id);
				Message.success("用户已删除");
				loadUsers();
			} catch (error) {
				Message.error(error.message || "删除用户失败");
			}
		},
	});
};

// 打开重置密码对话框
const openResetPasswordModal = (user) => {
	resetPasswordForm.value = {
		userId: user.id,
		userEmail: user.email,
		password: "",
	};
	resetPasswordModalVisible.value = true;
};

// 重置密码
const handleResetPassword = async () => {
	if (!resetPasswordForm.value.password) {
		Message.warning("密码不能为空");
		return;
	}

	if (resetPasswordForm.value.password.length < 6) {
		Message.warning("密码长度至少为 6 位");
		return;
	}

	try {
		await resetUserPassword(resetPasswordForm.value.userId, resetPasswordForm.value.password);

		Message.success("密码重置成功");
		resetPasswordModalVisible.value = false;
		resetPasswordForm.value = { userId: "", userEmail: "", password: "" };
	} catch (error) {
		Message.error(error.message || "密码重置失败");
	}
};

// 切换用户状态
const handleToggleStatus = async (user) => {
	const status = getUserStatus(user);
	const action = status.banned ? "启用" : "禁用";

	Modal.confirm({
		title: `${action}用户`,
		content: `确定要${action}用户 ${user.email} 吗？`,
		okText: `确定${action}`,
		cancelText: "取消",
		onOk: async () => {
			try {
				await toggleUserStatus(user.id, !status.banned);
				Message.success(`用户已${action}`);
				loadUsers();
			} catch (error) {
				Message.error(error.message || `${action}用户失败`);
			}
		},
	});
};

// 设置/取消管理员
const handleToggleAdmin = async (user) => {
	const role = getUserRole(user);
	const action = role.isAdmin ? "取消管理员" : "设为管理员";

	Modal.confirm({
		title: action,
		content: `确定要${action} ${user.email} 吗？`,
		okText: `确定${action}`,
		cancelText: "取消",
		onOk: async () => {
			try {
				await updateUser(user.id, {
					is_admin: !role.isAdmin,
				});
				Message.success(`已${action}`);
				loadUsers();
			} catch (error) {
				Message.error(error.message || `${action}失败`);
			}
		},
	});
};

// 分页
const handlePageChange = (page) => {
	pagination.value.current = page;
	loadUsers();
};

onMounted(() => {
	loadUsers();
});

// 暴露刷新方法
defineExpose({
	refresh: loadUsers,
});
</script>

<template>
    <div class="space-y-6">
        <div
            class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-orange-100 dark:border-gray-700 overflow-hidden pb-4"
        >
            <div
                class="px-6 py-4 border-b border-orange-100 dark:border-orange-900/30 flex justify-between items-center bg-orange-50 dark:bg-gray-800"
            >
                <div class="flex items-center gap-2">
                    <h3
                        class="text-lg font-semibold text-gray-800 dark:text-gray-200"
                    >
                        用户管理
                    </h3>
                    <a-tag color="orange">{{ total }} 个用户</a-tag>
                </div>
                <div class="flex gap-2">
                    <a-button type="outline" @click="loadUsers">
                        <template #icon><icon-refresh /></template>
                        刷新
                    </a-button>
                    <a-button type="primary" @click="createModalVisible = true">
                        <template #icon><icon-plus /></template>
                        创建用户
                    </a-button>
                </div>
            </div>

            <a-spin :loading="isLoading" class="w-full">
                <a-table
                    :data="users"
                    :pagination="{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: total,
                        showTotal: true,
                        showJumper: true,
                    }"
                    :bordered="{ wrapper: false, cell: false }"
                    :hoverable="true"
                    @page-change="handlePageChange"
                    :scroll="{ x: 1800, maxHeight: 'calc(100vh - 250px)' }"
                >
                    <template #columns>
                        <a-table-column
                            title="用户信息"
                            data-index="email"
                            :width="200"
                            fixed="left"
                        >
                            <template #cell="{ record }">
                                <div class="py-2">
                                    <div class="flex items-center gap-3 mb-2">
                                        <a-avatar
                                            :size="40"
                                            class="bg-blue-500 shrink-0"
                                        >
                                            {{ record.email[0].toUpperCase() }}
                                        </a-avatar>
                                        <div class="flex flex-col">
                                            <div
                                                class="flex items-center gap-2"
                                            >
                                                <span
                                                    class="font-medium text-gray-800 dark:text-gray-400"
                                                >
                                                    {{
                                                        record.user_metadata
                                                            ?.name ||
                                                        record.email.split(
                                                            "@",
                                                        )[0]
                                                    }}
                                                </span>
                                                <a-tag
                                                    :color="
                                                        getUserRole(record)
                                                            .color
                                                    "
                                                    size="mini"
                                                >
                                                    {{
                                                        getUserRole(record).text
                                                    }}
                                                </a-tag>
                                            </div>
                                            <span
                                                class="text-xs text-gray-400 flex items-center gap-1 mt-1"
                                            >
                                                <icon-email class="text-xs" />
                                                {{ record.email }}
                                            </span>
                                        </div>
                                    </div>
                                    <div class="flex gap-2 flex-wrap">
                                        <a-tag
                                            v-for="provider of getAuthProvider(
                                                record,
                                            )"
                                            size="mini"
                                            color="arcoblue"
                                        >
                                            {{ provider }}
                                        </a-tag>
                                        <a-tag
                                            size="mini"
                                            :color="
                                                record.email_confirmed_at
                                                    ? 'green'
                                                    : 'gray'
                                            "
                                        >
                                            {{ getEmailVerifiedStatus(record) }}
                                        </a-tag>
                                    </div>
                                </div>
                            </template>
                        </a-table-column>

                        <a-table-column
                            title="用户 ID"
                            data-index="id"
                            :width="160"
                        >
                            <template #cell="{ record }">
                                <a-typography-text
                                    copyable
                                    :copy-text="record.id"
                                    class="text-gray-500 text-xs font-mono"
                                >
                                    {{ record.id.substring(0, 20) }}...
                                </a-typography-text>
                            </template>
                        </a-table-column>

                        <a-table-column
                            title="账号状态"
                            data-index="status"
                            :width="100"
                            align="center"
                        >
                            <template #cell="{ record }">
                                <a-tag
                                    :color="getUserStatus(record).color"
                                    size="small"
                                >
                                    {{ getUserStatus(record).text }}
                                </a-tag>
                            </template>
                        </a-table-column>

                        <a-table-column
                            title="登录信息"
                            data-index="login_info"
                            :width="170"
                        >
                            <template #cell="{ record }">
                                <div class="flex flex-col gap-1">
                                    <div class="text-xs text-gray-600">
                                        <span class="text-gray-400"
                                            >登录次数：</span
                                        >
                                        <span class="font-medium">{{
                                            record.sign_in_count || 0
                                        }}</span>
                                    </div>
                                    <div class="text-xs text-gray-600">
                                        <span class="text-gray-400"
                                            >最后登录：</span
                                        >
                                        <span>{{
                                            record.last_sign_in_at
                                                ? formatDate(
                                                      record.last_sign_in_at,
                                                  )
                                                : "-"
                                        }}</span>
                                    </div>
                                    <div
                                        v-if="record.last_sign_in_at"
                                        class="text-xs text-gray-400 font-mono"
                                    >
                                        IP: {{ record.last_sign_in_ip || "-" }}
                                    </div>
                                </div>
                            </template>
                        </a-table-column>

                        <a-table-column
                            title="手机号"
                            data-index="phone"
                            :width="140"
                        >
                            <template #cell="{ record }">
                                <span class="text-gray-600 text-sm">
                                    {{ record.phone || "-" }}
                                </span>
                            </template>
                        </a-table-column>

                        <a-table-column
                            title="创建时间"
                            data-index="created_at"
                            :width="160"
                        >
                            <template #cell="{ record }">
                                <span
                                    class="text-gray-500 text-sm flex items-center gap-1"
                                >
                                    <icon-calendar class="text-xs" />
                                    {{ formatDate(record.created_at) }}
                                </span>
                            </template>
                        </a-table-column>

                        <a-table-column
                            title="更新时间"
                            data-index="updated_at"
                            :width="160"
                        >
                            <template #cell="{ record }">
                                <span class="text-gray-500 text-sm">
                                    {{ formatDate(record.updated_at) }}
                                </span>
                            </template>
                        </a-table-column>

                        <a-table-column
                            title="操作"
                            :width="150"
                            align="center"
                            fixed="right"
                        >
                            <template #cell="{ record }">
                                <a-space>
                                    <a-tooltip
                                        :content="
                                            getUserRole(record).isAdmin
                                                ? '取消管理员'
                                                : '设为管理员'
                                        "
                                    >
                                        <a-button
                                            size="small"
                                            :type="
                                                getUserRole(record).isAdmin
                                                    ? 'primary'
                                                    : 'outline'
                                            "
                                            status="warning"
                                            @click="handleToggleAdmin(record)"
                                        >
                                            <template #icon>
                                                <icon-safe
                                                    v-if="
                                                        getUserRole(record)
                                                            .isAdmin
                                                    "
                                                />
                                                <icon-user-add v-else />
                                            </template>
                                        </a-button>
                                    </a-tooltip>

                                    <a-tooltip content="重置密码">
                                        <a-button
                                            size="small"
                                            type="outline"
                                            @click="
                                                openResetPasswordModal(record)
                                            "
                                        >
                                            <template #icon
                                                ><icon-lock
                                            /></template>
                                        </a-button>
                                    </a-tooltip>

                                    <a-tooltip
                                        :content="
                                            getUserStatus(record).banned
                                                ? '启用用户'
                                                : '禁用用户'
                                        "
                                    >
                                        <a-button
                                            size="small"
                                            type="outline"
                                            :status="
                                                getUserStatus(record).banned
                                                    ? 'success'
                                                    : 'warning'
                                            "
                                            @click="handleToggleStatus(record)"
                                        >
                                            <template #icon>
                                                <icon-unlock
                                                    v-if="
                                                        getUserStatus(record)
                                                            .banned
                                                    "
                                                />
                                                <icon-lock v-else />
                                            </template>
                                        </a-button>
                                    </a-tooltip>

                                    <a-popconfirm
                                        content="确定要删除此用户吗？"
                                        type="warning"
                                        @ok="handleDeleteUser(record)"
                                    >
                                        <a-tooltip content="删除用户">
                                            <a-button
                                                size="small"
                                                type="outline"
                                                status="danger"
                                            >
                                                <template #icon
                                                    ><icon-delete
                                                /></template>
                                            </a-button>
                                        </a-tooltip>
                                    </a-popconfirm>
                                </a-space>
                            </template>
                        </a-table-column>
                    </template>

                    <template #empty>
                        <div class="py-8 text-center text-gray-400">
                            <div class="text-4xl mb-2">👥</div>
                            <div>暂无用户</div>
                        </div>
                    </template>
                </a-table>
            </a-spin>
        </div>

        <!-- 创建用户对话框 -->
        <a-modal
            v-model:visible="createModalVisible"
            title="创建新用户"
            @ok="handleCreateUser"
            @cancel="createForm = { email: '', password: '', name: '' }"
            :width="500"
        >
            <a-form :model="createForm" layout="vertical">
                <a-form-item label="邮箱" required>
                    <a-input
                        v-model="createForm.email"
                        placeholder="请输入用户邮箱"
                        type="email"
                    />
                </a-form-item>
                <a-form-item label="密码" required>
                    <a-input-password
                        v-model="createForm.password"
                        placeholder="请输入密码（至少6位）"
                    />
                </a-form-item>
                <a-form-item label="姓名">
                    <a-input
                        v-model="createForm.name"
                        placeholder="请输入用户姓名（可选）"
                    />
                </a-form-item>
            </a-form>
        </a-modal>

        <!-- 重置密码对话框 -->
        <a-modal
            v-model:visible="resetPasswordModalVisible"
            title="重置用户密码"
            @ok="handleResetPassword"
            @cancel="
                resetPasswordForm = { userId: '', userEmail: '', password: '' }
            "
            :width="500"
        >
            <a-form :model="resetPasswordForm" layout="vertical">
                <a-form-item label="用户邮箱">
                    <a-input
                        v-model="resetPasswordForm.userEmail"
                        disabled
                        class="bg-gray-50"
                    />
                </a-form-item>
                <a-form-item label="新密码" required>
                    <a-input-password
                        v-model="resetPasswordForm.password"
                        placeholder="请输入新密码（至少6位）"
                    />
                </a-form-item>
            </a-form>
        </a-modal>
    </div>
</template>

<style scoped>
::v-deep(.arco-table-pagination) {
    margin-right: 10px;
}
</style>
