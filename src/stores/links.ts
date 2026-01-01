/*
 * @Description: 链接状态管理
 * @FilePath: /short-link/src/stores/links.js
 */
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
  getUserLinkStats,
  getUserLinks,
  getLinkDetailById,
  updateLinkConfig,
  removeLinkById,
  toggleLink,
  batchRemoveLinks,
  batchEnableLinks,
  batchDisableLinks,
  getLinkLogs,
  formatLinkStatus,
  hasAdvancedConfig,
  getConfigSummary,
} from "@/services/dashboard.js";

interface fetchLinkOptions {
  limit: number;
  offset: number;
  orderBy: string;
  ascending?: boolean;
  linkId: string;
  keyword: string;
}

export const useLinksStore = defineStore("links", () => {
  // ==================== State ====================

  // 链接列表
  const links = ref([]);
  const total = ref(0);

  // 统计数据
  const stats = ref({
    total_links: 0,
    total_clicks: 0,
    weekly_new_links: 0,
    avg_clicks_per_link: 0,
  });

  // 加载状态
  const isLoading = ref(false);
  const isStatsLoading = ref(false);

  // 当前链接详情
  const currentLink = ref(null);
  const currentLinkLogs = ref([]);
  const currentLinkLogsTotal = ref(0);

  // 分页参数
  const pagination = ref({
    current: 1,
    pageSize: 10,
  });

  // 搜索和筛选
  const searchKeyword = ref("");
  const filterLinkId = ref(null);

  // 排序参数
  const sortField = ref("created_at");
  const sortOrder = ref("descend"); // 'ascend' | 'descend'

  // 选中的链接 ID（用于批量操作）
  const selectedLinkIds = ref([]);

  // 批量操作状态
  const isBatchOperating = ref(false);

  // 正在切换状态的链接 ID
  const togglingIds = ref(new Set());

  // ==================== Getters ====================

  // 是否有选中项
  const hasSelected = computed(() => selectedLinkIds.value.length > 0);

  // 选中数量
  const selectedCount = computed(() => selectedLinkIds.value.length);

  // 格式化的统计数据
  const formattedStats = computed(() => ({
    total_links: stats.value.total_links || 0,
    total_clicks: stats.value.total_clicks || 0,
    weekly_new_links: stats.value.weekly_new_links || 0,
    avg_clicks_per_link: parseFloat(
      `${stats.value.avg_clicks_per_link || 0}`,
    ).toFixed(1),
  }));

  // 最近创建的链接（前5条）
  const recentLinks = computed(() => links.value.slice(0, 5));

  // ==================== Actions ====================

  /**
   * 加载链接列表
   * @param {Object} options - 查询选项
   */
  async function fetchLinks(
    options: fetchLinkOptions = {} as fetchLinkOptions,
  ) {
    isLoading.value = true;
    try {
      const result = await getUserLinks({
        limit: options.limit || pagination.value.pageSize,
        offset:
          options.offset ||
          (pagination.value.current - 1) * pagination.value.pageSize,
        orderBy: options.orderBy || sortField.value,
        ascending: options.ascending ?? sortOrder.value === "ascend",
        linkId: options.linkId || filterLinkId.value,
        keyword: options.keyword || searchKeyword.value,
      });

      links.value = result.links || [];
      total.value = result.total || 0;

      return result;
    } catch (error) {
      console.error("加载链接列表失败:", error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 加载统计数据
   */
  async function fetchStats() {
    isStatsLoading.value = true;
    try {
      const data = await getUserLinkStats();
      stats.value = {
        total_links: data.total_links || 0,
        total_clicks: data.total_clicks || 0,
        weekly_new_links: data.weekly_new_links || 0,
        avg_clicks_per_link: data.avg_clicks_per_link || 0,
      };
      return stats.value;
    } catch (error) {
      console.error("加载统计数据失败:", error);
      throw error;
    } finally {
      isStatsLoading.value = false;
    }
  }

  /**
   * 加载链接详情
   * @param {number} linkId - 链接 ID
   */
  async function fetchLinkDetail(linkId) {
    try {
      const data = await getLinkDetailById(linkId);
      currentLink.value = data;
      return data;
    } catch (error) {
      console.error("加载链接详情失败:", error);
      throw error;
    }
  }

  /**
   * 更新链接配置
   * @param {number} linkId - 链接 ID
   * @param {Object} updates - 更新数据
   */
  async function updateLink(linkId, updates) {
    try {
      const data = await updateLinkConfig(linkId, updates);

      // 更新列表中的链接
      const index = links.value.findIndex((link) => link.id === linkId);
      if (index !== -1) {
        links.value[index] = { ...links.value[index], ...data };
      }

      // 更新当前链接详情
      if (currentLink.value?.id === linkId) {
        currentLink.value = { ...currentLink.value, ...data };
      }

      return data;
    } catch (error) {
      console.error("更新链接失败:", error);
      throw error;
    }
  }

  /**
   * 删除链接
   * @param {number} linkId - 链接 ID
   */
  async function deleteLink(linkId) {
    try {
      await removeLinkById(linkId);

      // 从列表中移除
      links.value = links.value.filter((link) => link.id !== linkId);
      total.value = Math.max(0, total.value - 1);

      // 清除当前链接详情
      if (currentLink.value?.id === linkId) {
        currentLink.value = null;
      }

      // 从选中列表中移除
      selectedLinkIds.value = selectedLinkIds.value.filter(
        (id) => id !== linkId,
      );

      return true;
    } catch (error) {
      console.error("删除链接失败:", error);
      throw error;
    }
  }

  /**
   * 切换链接状态
   * @param {number} linkId - 链接 ID
   * @param {boolean} isActive - 是否启用
   */
  async function toggleLinkStatus(linkId, isActive) {
    togglingIds.value.add(linkId);
    try {
      const data = await toggleLink(linkId, isActive);

      // 更新列表中的链接
      const index = links.value.findIndex((link) => link.id === linkId);
      if (index !== -1) {
        links.value[index].is_active = isActive;
      }

      return data;
    } catch (error) {
      console.error("切换链接状态失败:", error);
      throw error;
    } finally {
      togglingIds.value.delete(linkId);
    }
  }

  /**
   * 批量删除链接
   * @param {Array<number>} linkIds - 链接 ID 数组
   */
  async function batchDelete(linkIds = selectedLinkIds.value) {
    isBatchOperating.value = true;
    try {
      await batchRemoveLinks(linkIds);

      // 从列表中移除
      links.value = links.value.filter((link) => !linkIds.includes(link.id));
      total.value = Math.max(0, total.value - linkIds.length);

      // 清空选中
      clearSelection();

      return true;
    } catch (error) {
      console.error("批量删除链接失败:", error);
      throw error;
    } finally {
      isBatchOperating.value = false;
    }
  }

  /**
   * 批量启用链接
   * @param {Array<number>} linkIds - 链接 ID 数组
   */
  async function batchEnable(linkIds = selectedLinkIds.value) {
    isBatchOperating.value = true;
    try {
      await batchEnableLinks(linkIds);

      // 更新列表中的链接状态
      links.value = links.value.map((link) => {
        if (linkIds.includes(link.id)) {
          return { ...link, is_active: true };
        }
        return link;
      });

      return true;
    } catch (error) {
      console.error("批量启用链接失败:", error);
      throw error;
    } finally {
      isBatchOperating.value = false;
    }
  }

  /**
   * 批量禁用链接
   * @param {Array<number>} linkIds - 链接 ID 数组
   */
  async function batchDisable(linkIds = selectedLinkIds.value) {
    isBatchOperating.value = true;
    try {
      await batchDisableLinks(linkIds);

      // 更新列表中的链接状态
      links.value = links.value.map((link) => {
        if (linkIds.includes(link.id)) {
          return { ...link, is_active: false };
        }
        return link;
      });

      return true;
    } catch (error) {
      console.error("批量禁用链接失败:", error);
      throw error;
    } finally {
      isBatchOperating.value = false;
    }
  }

  /**
   * 加载链接访问日志
   * @param {number} linkId - 链接 ID
   * @param {Object} options - 查询选项
   */
  async function fetchLinkLogs(linkId, options = {}) {
    try {
      const result = await getLinkLogs(linkId, options);
      currentLinkLogs.value = result.logs || [];
      currentLinkLogsTotal.value = result.total || 0;
      return result;
    } catch (error) {
      console.error("加载访问日志失败:", error);
      throw error;
    }
  }

  /**
   * 设置分页
   * @param {number} page - 页码
   * @param {number} pageSize - 每页数量
   */
  function setPagination(page, pageSize) {
    pagination.value.current = page;
    if (pageSize) {
      pagination.value.pageSize = pageSize;
    }
  }

  /**
   * 设置搜索关键词
   * @param {string} keyword - 关键词
   */
  function setSearchKeyword(keyword) {
    searchKeyword.value = keyword;
    pagination.value.current = 1; // 重置分页
  }

  /**
   * 设置链接 ID 筛选
   * @param {number|null} linkId - 链接 ID
   */
  function setFilterLinkId(linkId) {
    filterLinkId.value = linkId;
    pagination.value.current = 1; // 重置分页
  }

  /**
   * 清除筛选条件
   */
  function clearFilters() {
    searchKeyword.value = "";
    filterLinkId.value = null;
    pagination.value.current = 1;
  }

  /**
   * 设置排序
   * @param {string} field - 排序字段
   * @param {string} order - 排序顺序 ('ascend' | 'descend')
   */
  function setSort(field, order) {
    sortField.value = field;
    sortOrder.value = order;
    pagination.value.current = 1; // 重置分页
  }

  /**
   * 选择链接
   * @param {Array<number>} ids - 链接 ID 数组
   */
  function setSelectedLinkIds(ids) {
    selectedLinkIds.value = ids;
  }

  /**
   * 清空选中
   */
  function clearSelection() {
    selectedLinkIds.value = [];
  }

  /**
   * 清除当前链接详情
   */
  function clearCurrentLink() {
    currentLink.value = null;
    currentLinkLogs.value = [];
    currentLinkLogsTotal.value = 0;
  }

  /**
   * 添加新链接到列表（用于创建后立即更新列表）
   * @param {Object} link - 链接数据
   */
  function addLink(link) {
    links.value.unshift(link);
    total.value += 1;
    stats.value.total_links += 1;
    stats.value.weekly_new_links += 1;
  }

  /**
   * 重置 store
   */
  function $reset() {
    links.value = [];
    total.value = 0;
    stats.value = {
      total_links: 0,
      total_clicks: 0,
      weekly_new_links: 0,
      avg_clicks_per_link: 0,
    };
    isLoading.value = false;
    isStatsLoading.value = false;
    currentLink.value = null;
    currentLinkLogs.value = [];
    currentLinkLogsTotal.value = 0;
    pagination.value = { current: 1, pageSize: 10 };
    searchKeyword.value = "";
    filterLinkId.value = null;
    sortField.value = "created_at";
    sortOrder.value = "descend";
    selectedLinkIds.value = [];
    isBatchOperating.value = false;
    togglingIds.value = new Set();
  }

  // 导出工具函数（来自 dashboard service）
  const utils = {
    formatLinkStatus,
    hasAdvancedConfig,
    getConfigSummary,
  };

  return {
    // State
    links,
    total,
    stats,
    isLoading,
    isStatsLoading,
    currentLink,
    currentLinkLogs,
    currentLinkLogsTotal,
    pagination,
    searchKeyword,
    filterLinkId,
    sortField,
    sortOrder,
    selectedLinkIds,
    isBatchOperating,
    togglingIds,

    // Getters
    hasSelected,
    selectedCount,
    formattedStats,
    recentLinks,

    // Actions
    fetchLinks,
    fetchStats,
    fetchLinkDetail,
    updateLink,
    deleteLink,
    toggleLinkStatus,
    batchDelete,
    batchEnable,
    batchDisable,
    fetchLinkLogs,
    setPagination,
    setSearchKeyword,
    setFilterLinkId,
    clearFilters,
    setSort,
    setSelectedLinkIds,
    clearSelection,
    clearCurrentLink,
    addLink,
    $reset,

    // Utils
    utils,
  };
});
