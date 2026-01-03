/*
 * @Description: 管理员链接管理 Store
 * @FilePath: /short-link/src/stores/adminLinks.ts
 */
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import {
	batchDeleteLinks,
	batchToggleLinks,
	deleteLink,
	getAllLinks,
	toggleLinkStatus,
} from "@/services/admin";
import type { Link } from "../../types/shared";

interface FetchLinksOptions {
	limit?: number;
	offset?: number;
	orderBy?: string;
	ascending?: boolean;
	linkId?: number | null;
	keyword?: string | null;
	userId?: string | null;
}

export const useAdminLinksStore = defineStore("adminLinks", () => {
	// ==================== State ====================

	// 链接列表
	const links = ref<Link[]>([]);
	const total = ref(0);

	// 加载状态
	const isLoading = ref(false);

	// 分页参数
	const pagination = ref({
		current: 1,
		pageSize: 10,
	});

	// 搜索和筛选
	const searchKeyword = ref("");
	const filterLinkId = ref(null);
	const filterUserId = ref(null);

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

	// ==================== Actions ====================

	/**
	 * 加载所有链接列表（管理员权限）
	 * @param {Object} options - 查询选项
	 */
	async function fetchLinks(options: FetchLinksOptions = {}) {
		isLoading.value = true;
		try {
			const result = await getAllLinks({
				limit: options.limit || pagination.value.pageSize,
				offset: options.offset || (pagination.value.current - 1) * pagination.value.pageSize,
				orderBy: options.orderBy || "created_at",
				ascending: options.ascending ?? false,
				linkId: options.linkId || filterLinkId.value,
				keyword: options.keyword || searchKeyword.value,
				userId: options.userId || filterUserId.value,
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
	 * 切换链接状态
	 * @param {number} linkId - 链接 ID
	 * @param {boolean} isActive - 是否启用
	 */
	async function toggleLink(linkId, isActive) {
		togglingIds.value.add(linkId);
		try {
			const data = await toggleLinkStatus(linkId, isActive);

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
	 * 删除链接
	 * @param {number} linkId - 链接 ID
	 */
	async function removeLink(linkId) {
		try {
			await deleteLink(linkId);

			// 从列表中移除
			const currentLinks: any[] = links.value as any;
			const filteredLinks = currentLinks.filter((link: any) => link.id !== linkId);
			links.value = filteredLinks as any;
			total.value = Math.max(0, total.value - 1);

			// 从选中列表中移除
			selectedLinkIds.value = selectedLinkIds.value.filter((id) => id !== linkId);

			return true;
		} catch (error) {
			console.error("删除链接失败:", error);
			throw error;
		}
	}

	/**
	 * 批量删除链接
	 * @param {Array<number>} linkIds - 链接 ID 数组
	 */
	async function batchDelete(linkIds = selectedLinkIds.value) {
		isBatchOperating.value = true;
		try {
			await batchDeleteLinks(linkIds);

			// 从列表中移除
			const currentLinks: any[] = links.value as any;
			const filteredLinks = currentLinks.filter((link: any) => !linkIds.includes(link.id));
			links.value = filteredLinks as any;
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
			await batchToggleLinks(linkIds, true);

			// 更新列表中的链接状态
			const currentLinks: any[] = links.value as any;
			const updatedLinks = currentLinks.map((link: any) => {
				if (linkIds.includes(link.id)) {
					return { ...link, is_active: true };
				}
				return link;
			});
			links.value = updatedLinks as any;

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
			await batchToggleLinks(linkIds, false);

			// 更新列表中的链接状态
			const currentLinks: any[] = links.value as any;
			const updatedLinks = currentLinks.map((link: any) => {
				if (linkIds.includes(link.id)) {
					return { ...link, is_active: false };
				}
				return link;
			});
			links.value = updatedLinks as any;

			return true;
		} catch (error) {
			console.error("批量禁用链接失败:", error);
			throw error;
		} finally {
			isBatchOperating.value = false;
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
	 * 设置用户 ID 筛选
	 * @param {number|null} userId - 用户 ID
	 */
	function setFilterUserId(userId) {
		filterUserId.value = userId;
		pagination.value.current = 1; // 重置分页
	}

	/**
	 * 清除筛选条件
	 */
	function clearFilters() {
		searchKeyword.value = "";
		filterLinkId.value = null;
		filterUserId.value = null;
		pagination.value.current = 1;
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
	 * 重置 store
	 */
	function $reset() {
		links.value = [];
		total.value = 0;
		isLoading.value = false;
		pagination.value = { current: 1, pageSize: 10 };
		searchKeyword.value = "";
		filterLinkId.value = null;
		filterUserId.value = null;
		selectedLinkIds.value = [];
		isBatchOperating.value = false;
		togglingIds.value = new Set();
	}

	return {
		// State
		links,
		total,
		isLoading,
		pagination,
		searchKeyword,
		filterLinkId,
		filterUserId,
		selectedLinkIds,
		isBatchOperating,
		togglingIds,

		// Getters
		hasSelected,
		selectedCount,

		// Actions
		fetchLinks,
		toggleLink,
		removeLink,
		batchDelete,
		batchEnable,
		batchDisable,
		setPagination,
		setSearchKeyword,
		setFilterLinkId,
		setFilterUserId,
		clearFilters,
		setSelectedLinkIds,
		clearSelection,
		$reset,
	};
});
