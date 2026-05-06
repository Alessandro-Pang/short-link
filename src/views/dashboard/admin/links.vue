<script setup>
import { Message } from "@arco-design/web-vue";
import {
	IconCheck,
	IconClose,
	IconCopy,
	IconDelete,
	IconEdit,
	IconEyeInvisible,
	IconLock,
	IconPlus,
	IconQrcode,
	IconSearch,
	IconUnlock,
	IconUser,
} from "@arco-design/web-vue/es/icon";
import QRCode from "qrcode";
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import LinkBatchActions from "@/components/links/LinkBatchActions.vue";
import PasswordModal from "@/components/links/PasswordModal.vue";
import QRCodeModal from "@/components/links/QRCodeModal.vue";
import UnifiedLinkConfigDrawer from "@/components/UnifiedLinkConfigDrawer.vue";
import {
	batchDeleteLinks,
	batchToggleLinks,
	deleteLink,
	getAllLinks,
	toggleLinkStatus,
	updateLinkPassword,
} from "@/services/admin";
import { formatDate, isExpired } from "@/utils/date";

const router = useRouter();
const route = useRoute();
const origin = window.location.origin;

// State
const isLoading = ref(false);
const links = ref([]);
const total = ref(0);
const searchKeyword = ref("");
const searchInput = ref(""); // 用于输入框的临时值
const filterUserId = ref(null);
const togglingIds = ref([]);
const qrcodeModalVisible = ref(false);
const currentQrUrl = ref("");
const editDrawerVisible = ref(false);
const editingLinkId = ref(null);
const filterLinkId = ref(null);
const passwordModalVisible = ref(false);
const currentPasswordLinkId = ref(null);

// 批量选择相关状态
const selectedRowKeys = ref([]);
const isBatchOperating = ref(false);

// 分页
const pagination = ref({
	current: 1,
	pageSize: 10,
});

// 排序
const sortField = ref("created_at");
const sortOrder = ref("descend"); // 'ascend' | 'descend'

// 计算属性：是否有选中的行
const hasSelected = computed(() => selectedRowKeys.value.length > 0);
const selectedCount = computed(() => selectedRowKeys.value.length);

// 加载数据
const loadData = async () => {
	isLoading.value = true;
	try {
		const result = await getAllLinks({
			limit: pagination.value.pageSize,
			offset: (pagination.value.current - 1) * pagination.value.pageSize,
			orderBy: sortField.value,
			ascending: sortOrder.value === "ascend",
			linkId: filterLinkId.value || null,
			keyword: searchKeyword.value || null,
			userId: filterUserId.value || null,
		});

		links.value = result.links || [];
		total.value = result.total || 0;
		// 清空选择
		selectedRowKeys.value = [];
	} catch (error) {
		console.error("加载链接列表失败:", error);
		Message.error("加载链接列表失败");
	} finally {
		isLoading.value = false;
	}
};

// 从路由参数获取筛选 ID
onMounted(() => {
	if (route.query.linkId) {
		filterLinkId.value = route.query.linkId;
	}
	if (route.query.userId) {
		filterUserId.value = route.query.userId;
	}
	loadData();
});

// 监听路由变化
watch(
	() => route.query,
	(newQuery) => {
		const newLinkId = newQuery.linkId || null;
		const newUserId = newQuery.userId || null;

		if (filterLinkId.value !== newLinkId || filterUserId.value !== newUserId) {
			filterLinkId.value = newLinkId;
			filterUserId.value = newUserId;
			pagination.value.current = 1;
			loadData();
		}
	},
);

// Methods
const goToHome = () => {
	router.push("/");
};

const handleSearch = () => {
	searchKeyword.value = searchInput.value;
	pagination.value.current = 1;
	loadData();
};

const handleClear = () => {
	searchInput.value = "";
	searchKeyword.value = "";
	pagination.value.current = 1;
	loadData();
};

const clearFilter = () => {
	filterLinkId.value = null;
	filterUserId.value = null;
	pagination.value.current = 1;
	// 移除 URL 中的参数
	router.replace({ query: {} });
	loadData();
};

const handlePageChange = (page) => {
	pagination.value.current = page;
	loadData();
};

const handleSortChange = (dataIndex, direction) => {
	if (!direction) {
		// 取消排序，恢复默认
		sortField.value = "created_at";
		sortOrder.value = "descend";
	} else {
		sortField.value = dataIndex;
		sortOrder.value = direction;
	}
	pagination.value.current = 1; // 重置分页
	loadData();
};

const copyLink = async (short) => {
	const url = `${origin}/u/${short}`;
	try {
		await navigator.clipboard.writeText(url);
		Message.success("链接已复制到剪贴板");
	} catch (error) {
		Message.error("复制失败，请手动复制");
	}
};

const showQRCode = async (short) => {
	const url = `${origin}/u/${short}`;
	currentQrUrl.value = url;
	qrcodeModalVisible.value = true;
};

const hasAdvancedConfig = (record) => {
	return (
		(record.redirect_type && record.redirect_type !== 302) ||
		record.expiration_date ||
		record.max_clicks ||
		record.pass_query_params ||
		record.forward_headers ||
		(record.access_restrictions && Object.keys(record.access_restrictions).length > 0)
	);
};

// Toggle link status
const handleToggleStatus = async (record, newValue) => {
	togglingIds.value.push(record.id);
	try {
		await toggleLinkStatus(record.id, newValue);
		Message.success(newValue ? "链接已启用" : "链接已禁用");
	} catch (error) {
		// Revert the change
		record.is_active = !newValue;
		Message.error(error.message || "操作失败");
	} finally {
		togglingIds.value = togglingIds.value.filter((id) => id !== record.id);
	}
};

// Delete link
const handleDeleteLink = async (linkId) => {
	try {
		await deleteLink(linkId);
		Message.success("链接已删除");
		// 重新加载数据
		loadData();
	} catch (error) {
		Message.error(error.message || "删除失败");
	}
};

// Filter by user
const filterByUser = (userId) => {
	if (userId) {
		router.push({ query: { ...route.query, userId } });
	} else {
		const { userId: _, ...restQuery } = route.query;
		router.push({ query: restQuery });
	}
};

// Edit drawer
const openEditDrawer = (record) => {
	editingLinkId.value = record.id;
	editDrawerVisible.value = true;
};

const handleEditSuccess = () => {
	loadData();
};

const handleEditDelete = () => {
	loadData();
};

// 密码管理
const openPasswordModal = (record) => {
	currentPasswordLinkId.value = record.id;
	passwordModalVisible.value = true;
};

const handlePasswordDelete = async (linkId) => {
	try {
		await updateLinkPassword(linkId, null);
		Message.success("密码已删除");
		loadData();
	} catch (error) {
		Message.error(error.message || "删除密码失败");
	}
};

// 清空选择
const clearSelection = () => {
	selectedRowKeys.value = [];
};

// 批量删除
const handleBatchDelete = async () => {
	if (!hasSelected.value) {
		Message.warning("请先选择要删除的链接");
		return;
	}

	isBatchOperating.value = true;
	try {
		const response = await batchDeleteLinks(selectedRowKeys.value);
		Message.success(response.msg || `成功删除 ${response.data.success} 个链接`);
		loadData();
	} catch (error) {
		Message.error(error.message || "批量删除失败");
	} finally {
		isBatchOperating.value = false;
	}
};

// 批量启用
const handleBatchEnable = async () => {
	if (!hasSelected.value) {
		Message.warning("请先选择要启用的链接");
		return;
	}

	isBatchOperating.value = true;
	try {
		const response = await batchToggleLinks(selectedRowKeys.value, true);
		Message.success(response.msg || `成功启用 ${response.data.success} 个链接`);
		loadData();
	} catch (error) {
		Message.error(error.message || "批量启用失败");
	} finally {
		isBatchOperating.value = false;
	}
};

// 批量禁用
const handleBatchDisable = async () => {
	if (!hasSelected.value) {
		Message.warning("请先选择要禁用的链接");
		return;
	}

	isBatchOperating.value = true;
	try {
		const response = await batchToggleLinks(selectedRowKeys.value, false);
		Message.success(response.msg || `成功禁用 ${response.data.success} 个链接`);
		loadData();
	} catch (error) {
		Message.error(error.message || "批量禁用失败");
	} finally {
		isBatchOperating.value = false;
	}
};

// 暴露刷新方法给父组件
defineExpose({
	refresh: loadData,
});
</script>

<template>
    <div class="space-y-6">
        <div
            class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-orange-100 dark:border-gray-700 overflow-hidden pb-3"
        >
            <div
                class="px-6 py-4 border-b border-orange-100 dark:border-orange-900/30 flex justify-between items-center bg-orange-50 dark:bg-gray-800"
            >
                <div class="flex items-center gap-4">
                    <a-input-search
                        v-model="searchInput"
                        placeholder="搜索所有链接..."
                        class="w-64 bg-white! dark:bg-gray-700!"
                        @search="handleSearch"
                        @clear="handleClear"
                        @press-enter="handleSearch"
                        allow-clear
                    >
                        <template #prefix>
                            <icon-search class="text-gray-400" />
                        </template>
                    </a-input-search>
                    <a-tag
                        v-if="filterLinkId"
                        closable
                        color="orange"
                        @close="clearFilter"
                    >
                        筛选指定链接
                    </a-tag>
                    <a-tag
                        v-if="filterUserId"
                        closable
                        color="purple"
                        @close="clearFilter"
                    >
                        筛选指定用户
                    </a-tag>
                    <a-tag
                        v-if="searchKeyword"
                        closable
                        color="green"
                        @close="handleClear"
                    >
                        搜索: {{ searchKeyword }}
                    </a-tag>
                </div>
                <a-button type="primary" @click="goToHome">
                    <template #icon><icon-plus /></template>
                    创建新链接
                </a-button>
            </div>

            <!-- 批量操作栏 -->
            <LinkBatchActions
                v-if="hasSelected"
                :selected-count="selectedCount"
                :is-batch-operating="isBatchOperating"
                theme-class="bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-900/30"
                text-class="text-orange-600"
                @clear-selection="clearSelection"
                @batch-enable="handleBatchEnable"
                @batch-disable="handleBatchDisable"
                @batch-delete="handleBatchDelete"
            />

            <a-spin :loading="isLoading" class="w-full">
                <a-table
                    :data="links"
                    :pagination="{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: total,
                        showTotal: true,
                        showJumper: true,
                    }"
                    :bordered="{ wrapper: false, cell: false }"
                    :hoverable="true"
                    :row-selection="{
                        type: 'checkbox',
                        showCheckedAll: true,
                    }"
                    v-model:selected-keys="selectedRowKeys"
                    row-key="id"
                    @page-change="handlePageChange"
                    @sorter-change="handleSortChange"
                    :scroll="{ maxHeight: 'calc(100vh - 250px)' }"
                >
                    <template #columns>
                        <!-- 创建者列 -->
                        <a-table-column
                            title="创建者"
                            data-index="user_id"
                            :width="100"
                            :sortable="{
                                sortDirections: ['ascend', 'descend'],
                            }"
                        >
                            <template #cell="{ record }">
                                <a-tooltip
                                    :content="
                                        record.user_id
                                            ? `用户 ID: ${record.user_id}`
                                            : '匿名用户'
                                    "
                                >
                                    <a-tag
                                        v-if="record.user_id"
                                        size="small"
                                        color="arcoblue"
                                        class="cursor-pointer"
                                        @click="filterByUser(record.user_id)"
                                    >
                                        <template #icon><icon-user /></template>
                                        用户
                                    </a-tag>
                                    <a-tag v-else size="small" color="gray">
                                        <template #icon
                                            ><icon-eye-invisible
                                        /></template>
                                        匿名
                                    </a-tag>
                                </a-tooltip>
                            </template>
                        </a-table-column>
                        <a-table-column
                            title="名称"
                            data-index="title"
                            :width="120"
                        >
                            <template #cell="{ record }">
                                <div>
                                    {{ record.title || "-" }}
                                </div>
                            </template>
                        </a-table-column>
                        <a-table-column
                            title="链接信息"
                            :width="380"
                            data-index="link"
                        >
                            <template #cell="{ record }">
                                <div class="py-2">
                                    <div class="flex items-center gap-2 mb-1">
                                        <a-link
                                            :href="`${origin}/u/${record.short}`"
                                            target="_blank"
                                            class="font-bold text-blue-600 text-base"
                                            >{{ origin }}/u/{{
                                                record.short
                                            }}</a-link
                                        >
                                        <a-button
                                            size="mini"
                                            type="text"
                                            class="text-gray-400 hover:text-blue-600"
                                            @click="copyLink(record.short)"
                                        >
                                            <template #icon
                                                ><icon-copy
                                            /></template>
                                        </a-button>
                                    </div>
                                    <div
                                        class="text-gray-400 text-sm truncate max-w-md"
                                        :title="record.link"
                                    >
                                        {{ record.link }}
                                    </div>
                                    <!-- 配置标签 -->
                                    <div
                                        v-if="
                                            hasAdvancedConfig(record) ||
                                            record.password
                                        "
                                        class="flex flex-wrap gap-1 mt-2"
                                    >
                                        <a-tag
                                            v-if="record.password_hash"
                                            size="small"
                                            color="orange"
                                        >
                                            <template #icon
                                                ><icon-lock
                                            /></template>
                                            密码保护
                                        </a-tag>
                                        <a-tag
                                            v-if="
                                                record.redirect_type &&
                                                record.redirect_type !== 302
                                            "
                                            size="small"
                                            color="arcoblue"
                                        >
                                            {{ record.redirect_type }}重定向
                                        </a-tag>
                                        <a-tag
                                            v-if="record.expiration_date"
                                            size="small"
                                            :color="
                                                isExpired(
                                                    record.expiration_date,
                                                )
                                                    ? 'red'
                                                    : 'orange'
                                            "
                                        >
                                            {{
                                                isExpired(
                                                    record.expiration_date,
                                                )
                                                    ? "已过期"
                                                    : "有时效"
                                            }}
                                        </a-tag>
                                        <a-tag
                                            v-if="record.max_clicks"
                                            size="small"
                                            color="green"
                                        >
                                            {{ record.click_count }}/{{
                                                record.max_clicks
                                            }}次
                                        </a-tag>
                                        <a-tag
                                            v-if="record.pass_query_params"
                                            size="small"
                                            color="purple"
                                        >
                                            参数透传
                                        </a-tag>
                                        <a-tag
                                            v-if="
                                                record.access_restrictions &&
                                                Object.keys(
                                                    record.access_restrictions,
                                                ).length > 0
                                            "
                                            size="small"
                                            color="red"
                                        >
                                            访问限制
                                        </a-tag>
                                    </div>
                                </div>
                            </template>
                        </a-table-column>
                        <a-table-column
                            title="数据统计"
                            data-index="click_count"
                            :width="120"
                            :sortable="{
                                sortDirections: ['ascend', 'descend'],
                            }"
                        >
                            <template #cell="{ record }">
                                <div class="flex flex-col">
                                    <span
                                        class="text-lg font-bold text-gray-800 dark:text-gray-500"
                                        >{{ record.click_count }}</span
                                    >
                                    <span class="text-xs text-gray-400"
                                        >总点击</span
                                    >
                                </div>
                            </template>
                        </a-table-column>
                        <a-table-column
                            title="状态"
                            data-index="is_active"
                            :width="120"
                        >
                            <template #cell="{ record }">
                                <a-switch
                                    v-model="record.is_active"
                                    :checked-value="true"
                                    :unchecked-value="false"
                                    :loading="togglingIds.includes(record.id)"
                                    @change="
                                        (val) => handleToggleStatus(record, val)
                                    "
                                >
                                    <template #checked>启用</template>
                                    <template #unchecked>禁用</template>
                                </a-switch>
                            </template>
                        </a-table-column>
                        <a-table-column
                            title="创建时间"
                            data-index="created_at"
                            :width="160"
                            :sortable="{
                                sortDirections: ['ascend', 'descend'],
                            }"
                        >
                            <template #cell="{ record }">
                                <span class="text-gray-500">{{
                                    formatDate(record.created_at)
                                }}</span>
                            </template>
                        </a-table-column>
                        <a-table-column
                            title="操作"
                            :width="180"
                            align="center"
                            fixed="right"
                        >
                            <template #cell="{ record }">
                                <a-space>
                                    <a-tooltip content="二维码">
                                        <a-button
                                            size="small"
                                            shape="circle"
                                            class="hover:bg-gray-100"
                                            @click="showQRCode(record.short)"
                                        >
                                            <template #icon
                                                ><icon-qrcode
                                                    class="text-gray-600"
                                            /></template>
                                        </a-button>
                                    </a-tooltip>

                                    <!-- 密码管理按钮 -->
                                    <a-dropdown v-if="record.password_hash">
                                        <a-tooltip content="密码管理">
                                            <a-button
                                                size="small"
                                                shape="circle"
                                                class="hover:bg-orange-50"
                                            >
                                                <template #icon>
                                                    <icon-lock
                                                        class="text-gray-400"
                                                    />
                                                </template>
                                            </a-button>
                                        </a-tooltip>
                                        <template #content>
                                            <a-doption
                                                @click="
                                                    openPasswordModal(record)
                                                "
                                            >
                                                <template #icon
                                                    ><icon-edit
                                                /></template>
                                                修改密码
                                            </a-doption>
                                            <a-doption
                                                @click="
                                                    handlePasswordDelete(
                                                        record.id,
                                                    )
                                                "
                                            >
                                                <template #icon
                                                    ><icon-delete
                                                /></template>
                                                删除密码
                                            </a-doption>
                                        </template>
                                    </a-dropdown>
                                    <a-tooltip v-else content="设置密码">
                                        <a-button
                                            size="small"
                                            shape="circle"
                                            class="hover:bg-gray-100"
                                            @click="openPasswordModal(record)"
                                        >
                                            <template #icon
                                                ><icon-unlock
                                                    class="text-gray-400"
                                            /></template>
                                        </a-button>
                                    </a-tooltip>

                                    <a-tooltip content="编辑">
                                        <a-button
                                            size="small"
                                            shape="circle"
                                            class="hover:bg-gray-100"
                                            @click="openEditDrawer(record)"
                                        >
                                            <template #icon
                                                ><icon-edit
                                                    class="text-gray-600"
                                            /></template>
                                        </a-button>
                                    </a-tooltip>
                                    <a-popconfirm
                                        content="确定要删除这个链接吗？"
                                        type="warning"
                                        @ok="handleDeleteLink(record.id)"
                                    >
                                        <a-tooltip content="删除">
                                            <a-button
                                                size="small"
                                                shape="circle"
                                                class="hover:bg-red-50"
                                            >
                                                <template #icon
                                                    ><icon-delete
                                                        class="text-red-500"
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
                            <div class="text-4xl mb-2">📭</div>
                            <div
                                v-if="
                                    filterLinkId ||
                                    searchKeyword ||
                                    filterUserId
                                "
                            >
                                没有找到匹配的链接
                            </div>
                            <div v-else>暂无链接</div>
                        </div>
                    </template>
                </a-table>
            </a-spin>
        </div>

        <!-- QR Code Modal -->
        <QRCodeModal
            v-model:visible="qrcodeModalVisible"
            :url="currentQrUrl"
        />

        <!-- 密码管理 Modal -->
        <PasswordModal
            v-model:visible="passwordModalVisible"
            :link-id="currentPasswordLinkId"
            :update-fn="updateLinkPassword"
            @success="loadData"
        />

        <!-- Admin Link Edit Drawer -->
        <UnifiedLinkConfigDrawer
            v-model:visible="editDrawerVisible"
            :link-id="editingLinkId"
            mode="admin"
            @success="handleEditSuccess"
            @delete="handleEditDelete"
        />
    </div>
</template>
<style lang="css" scoped>
::v-deep(.arco-table-pagination) {
    margin-right: 10px;
}
</style>
