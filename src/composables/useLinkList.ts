/**
 * 链接列表的可复用逻辑
 * 用于用户和管理员的链接列表页面
 */
import { ref, computed } from "vue";
import type { Ref } from "vue";

// API 服务接口
interface LinkListApiService {
  getLinks: (options: any) => Promise<any>;
  toggleLinkStatus: (id: number | string, isActive: boolean) => Promise<any>;
  deleteLink: (id: number | string) => Promise<any>;
  batchDeleteLinks: (ids: (number | string)[]) => Promise<any>;
  batchToggleLinks: (ids: (number | string)[], isActive: boolean) => Promise<any>;
}

export function useLinkList(apiService: LinkListApiService) {
  // State
  const isLoading = ref(false);
  const links = ref<any[]>([]);
  const total = ref(0);
  const searchKeyword = ref("");
  const searchInput = ref(""); // 用于输入框的临时值
  const filterLinkId = ref<number | string | null>(null);
  const filterUserId = ref<number | string | null>(null);
  const togglingIds = ref<Set<number | string>>(new Set());

  // 分页
  const pagination = ref({
    current: 1,
    pageSize: 10,
  });

  // 批量选择
  const selectedRowKeys = ref<(number | string)[]>([]);
  const isBatchOperating = ref(false);

  // Computed
  const hasSelected = computed(() => selectedRowKeys.value.length > 0);
  const selectedCount = computed(() => selectedRowKeys.value.length);

  // 加载数据
  const loadData = async (options: any = {}) => {
    isLoading.value = true;
    try {
      const result = await apiService.getLinks({
        limit: options.limit || pagination.value.pageSize,
        offset:
          options.offset ||
          (pagination.value.current - 1) * pagination.value.pageSize,
        orderBy: options.orderBy || "created_at",
        ascending: options.ascending ?? false,
        linkId: options.linkId || filterLinkId.value,
        keyword: options.keyword || searchKeyword.value,
        userId: options.userId || filterUserId.value,
      });

      links.value = result.links || [];
      total.value = result.total || 0;
      // 清空选择
      selectedRowKeys.value = [];

      return result;
    } catch (error) {
      console.error("加载链接列表失败:", error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  // 搜索
  const handleSearch = () => {
    searchKeyword.value = searchInput.value;
    pagination.value.current = 1;
    loadData();
  };

  // 清除搜索
  const handleClear = () => {
    searchInput.value = "";
    searchKeyword.value = "";
    pagination.value.current = 1;
    loadData();
  };

  // 清除筛选
  const clearFilter = () => {
    filterLinkId.value = null;
    filterUserId.value = null;
    pagination.value.current = 1;
  };

  // 设置筛选
  const setFilterLinkId = (id: number | string | null) => {
    filterLinkId.value = id;
    pagination.value.current = 1;
  };

  const setFilterUserId = (id: number | string | null) => {
    filterUserId.value = id;
    pagination.value.current = 1;
  };

  // 分页变化
  const handlePageChange = (page: number) => {
    pagination.value.current = page;
    loadData();
  };

  // 切换链接状态
  const handleToggleStatus = async (record: any, newValue: boolean) => {
    togglingIds.value.add(record.id);
    try {
      await apiService.toggleLinkStatus(record.id, newValue);
      // 更新本地状态
      record.is_active = newValue;
      return true;
    } catch (error) {
      // Revert the change
      record.is_active = !newValue;
      throw error;
    } finally {
      togglingIds.value.delete(record.id);
    }
  };

  // 删除链接
  const handleDeleteLink = async (linkId: number | string) => {
    try {
      await apiService.deleteLink(linkId);
      // 重新加载数据
      await loadData();
      return true;
    } catch (error) {
      throw error;
    }
  };

  // 批量操作
  const clearSelection = () => {
    selectedRowKeys.value = [];
  };

  const handleBatchDelete = async () => {
    if (!hasSelected.value) {
      throw new Error("请先选择要删除的链接");
    }

    isBatchOperating.value = true;
    try {
      await apiService.batchDeleteLinks(selectedRowKeys.value);
      await loadData();
      return true;
    } catch (error) {
      throw error;
    } finally {
      isBatchOperating.value = false;
    }
  };

  const handleBatchEnable = async () => {
    if (!hasSelected.value) {
      throw new Error("请先选择要启用的链接");
    }

    isBatchOperating.value = true;
    try {
      await apiService.batchToggleLinks(selectedRowKeys.value, true);
      await loadData();
      return true;
    } catch (error) {
      throw error;
    } finally {
      isBatchOperating.value = false;
    }
  };

  const handleBatchDisable = async () => {
    if (!hasSelected.value) {
      throw new Error("请先选择要禁用的链接");
    }

    isBatchOperating.value = true;
    try {
      await apiService.batchToggleLinks(selectedRowKeys.value, false);
      await loadData();
      return true;
    } catch (error) {
      throw error;
    } finally {
      isBatchOperating.value = false;
    }
  };

  return {
    // State
    isLoading,
    links,
    total,
    searchKeyword,
    searchInput,
    filterLinkId,
    filterUserId,
    togglingIds,
    pagination,
    selectedRowKeys,
    isBatchOperating,

    // Computed
    hasSelected,
    selectedCount,

    // Methods
    loadData,
    handleSearch,
    handleClear,
    clearFilter,
    setFilterLinkId,
    setFilterUserId,
    handlePageChange,
    handleToggleStatus,
    handleDeleteLink,
    clearSelection,
    handleBatchDelete,
    handleBatchEnable,
    handleBatchDisable,
  };
}
