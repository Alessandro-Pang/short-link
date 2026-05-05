<script setup>
import { Message } from "@arco-design/web-vue";
import {
	IconCheck,
	IconClose,
	IconCopy,
	IconDelete,
	IconEdit,
	IconLock,
	IconPlus,
	IconQrcode,
	IconSearch,
	IconUnlock,
} from "@arco-design/web-vue/es/icon";
import QRCode from "qrcode";
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import UnifiedLinkConfigDrawer from "@/components/UnifiedLinkConfigDrawer.vue";
import LinkBatchActions from "@/components/links/LinkBatchActions.vue";
import PasswordModal from "@/components/links/PasswordModal.vue";
import QRCodeModal from "@/components/links/QRCodeModal.vue";
import { updateLinkPassword } from "@/services/api";
import { useLinksStore } from "@/stores";
import { formatDate, isExpired } from "@/utils/date";

const router = useRouter();
const route = useRoute();
const origin = window.location.origin;

// Store
const linksStore = useLinksStore();

// Local State
const searchInput = ref(""); // 用于输入框的临时值
const qrcodeModalVisible = ref(false);
const currentQrUrl = ref("");
const editDrawerVisible = ref(false);
const editingLinkId = ref(null);
const passwordModalVisible = ref(false);
const currentPasswordLinkId = ref(null);

// Computed from store
const isLoading = computed(() => linksStore.isLoading);
const links = computed(() => linksStore.links);
const total = computed(() => linksStore.total);
const pagination = computed(() => linksStore.pagination);
const searchKeyword = computed(() => linksStore.searchKeyword);
const filterLinkId = computed(() => linksStore.filterLinkId);
const sortField = computed(() => linksStore.sortField);
const sortOrder = computed(() => linksStore.sortOrder);
const selectedRowKeys = computed({
	get: () => linksStore.selectedLinkIds,
	set: (val) => linksStore.setSelectedLinkIds(val),
});
const hasSelected = computed(() => linksStore.hasSelected);
const selectedCount = computed(() => linksStore.selectedCount);
const isBatchOperating = computed(() => linksStore.isBatchOperating);
const togglingIds = computed(() => Array.from(linksStore.togglingIds));

// 加载数据
const loadData = async () => {
	try {
		await linksStore.fetchLinks();
	} catch (error) {
		console.error("加载链接列表失败:", error);
		Message.error("加载链接列表失败");
	}
};

// 从路由参数获取筛选 ID
onMounted(() => {
	if (route.query.linkId) {
		linksStore.setFilterLinkId(route.query.linkId);
	}
	loadData();
});

// 监听路由变化
watch(
	() => route.query.linkId,
	(newLinkId) => {
		const oldLinkId = filterLinkId.value;
		if (oldLinkId !== newLinkId) {
			linksStore.setFilterLinkId(newLinkId || null);
			loadData();
		}
	},
);

// Methods
const goToHome = () => {
	router.push("/");
};

const handleSearch = () => {
	linksStore.setSearchKeyword(searchInput.value);
	loadData();
};

const handleClear = () => {
	searchInput.value = "";
	linksStore.setSearchKeyword("");
	loadData();
};

const clearFilter = () => {
	linksStore.setFilterLinkId(null);
	// 移除 URL 中的 linkId 参数
	router.replace({ query: {} });
	loadData();
};

const handlePageChange = (page) => {
	linksStore.setPagination(page);
	loadData();
};

const handleSortChange = (dataIndex, direction) => {
	if (!direction) {
		// 取消排序，恢复默认
		linksStore.setSort("created_at", "descend");
	} else {
		linksStore.setSort(dataIndex, direction);
	}
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
	return linksStore.utils.hasAdvancedConfig(record);
};

// Toggle link status
const handleToggleStatus = async (record, newValue) => {
	try {
		await linksStore.toggleLinkStatus(record.id, newValue);
		Message.success(newValue ? "链接已启用" : "链接已禁用");
	} catch (error) {
		// Revert the change
		record.is_active = !newValue;
		Message.error(error.message || "操作失败");
	}
};

// Delete link
const handleDeleteLink = async (linkId) => {
	try {
		await linksStore.deleteLink(linkId);
		Message.success("链接已删除");
	} catch (error) {
		Message.error(error.message || "删除失败");
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
	linksStore.clearSelection();
};

// 批量删除
const handleBatchDelete = async () => {
	if (!hasSelected.value) {
		Message.warning("请先选择要删除的链接");
		return;
	}

	try {
		await linksStore.batchDelete();
		Message.success("批量删除成功");
		loadData();
	} catch (error) {
		Message.error(error.message || "批量删除失败");
	}
};

// 批量启用
const handleBatchEnable = async () => {
	if (!hasSelected.value) {
		Message.warning("请先选择要启用的链接");
		return;
	}

	try {
		await linksStore.batchEnable();
		Message.success("批量启用成功");
	} catch (error) {
		Message.error(error.message || "批量启用失败");
	}
};

// 批量禁用
const handleBatchDisable = async () => {
	if (!hasSelected.value) {
		Message.warning("请先选择要禁用的链接");
		return;
	}

	try {
		await linksStore.batchDisable();
		Message.success("批量禁用成功");
	} catch (error) {
		Message.error(error.message || "批量禁用失败");
	}
};

const hasAccessRestrictions = (record) => {
	const accessRestrictions = record.access_restrictions;
	return (
		accessRestrictions &&
		Object.keys(accessRestrictions).some((key) => accessRestrictions[key].length)
	);
};

// 暴露刷新方法给父组件
defineExpose({
	refresh: loadData,
});
</script>

<template>
    <div class="space-y-6">
        <div
            class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden pb-3"
        >
            <div
                class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800"
            >
                <div class="flex items-center gap-4 flex-2">
                    <a-input-search
                        v-model="searchInput"
                        placeholder="搜索链接..."
                        class="bg-white! dark:bg-gray-700!"
                        style="width: 240px"
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
                        color="arcoblue"
                        @close="clearFilter"
                    >
                        筛选指定链接
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
                theme-class="bg-blue-50 border-blue-100"
                text-class="text-blue-600"
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
                                            v-if="hasAccessRestrictions(record)"
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
                                                    class="text-gray-600 dark:text-gray-300"
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
                                                <template #icon
                                                    ><icon-lock
                                                        class="text-orange-500"
                                                /></template>
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
                                            <template #icon>
                                                <icon-lock
                                                    v-if="record.password_hash"
                                                    class="text-gray-400"
                                                />
                                                <icon-unlock
                                                    v-else
                                                    class="text-gray-400"
                                                />
                                            </template>
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
                                                    class="text-gray-600 dark:text-gray-300"
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
                            <div v-if="filterLinkId || searchKeyword">
                                没有找到匹配的链接
                            </div>
                            <div v-else>暂无链接，去首页创建一个吧</div>
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

        <!-- Link Edit Drawer -->
        <UnifiedLinkConfigDrawer
            v-model:visible="editDrawerVisible"
            :link-id="editingLinkId"
            mode="user"
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
