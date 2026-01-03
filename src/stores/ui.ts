/**
 * UI 状态管理
 * 管理全局 UI 状态，如加载状态、通知、侧边栏等
 */

import { defineStore } from "pinia";
import { computed, ref } from "vue";

export const useUiStore = defineStore("ui", () => {
	// ==================== State ====================

	// 全局加载状态
	const isGlobalLoading = ref(false);
	const loadingText = ref("");

	// 侧边栏状态
	const sidebarCollapsed = ref(false);

	// 当前主题
	const theme = ref("light");

	// 活跃的加载任务计数器
	const loadingCounter = ref(0);

	// 模态框状态
	const modals = ref({
		qrcode: {
			visible: false,
			url: "",
		},
		linkEdit: {
			visible: false,
			linkId: null,
		},
		confirm: {
			visible: false,
			title: "",
			content: "",
			onOk: null,
			onCancel: null,
		},
	});

	// 抽屉状态
	const drawers = ref({
		linkConfig: {
			visible: false,
		},
		linkEdit: {
			visible: false,
			linkId: null,
		},
	});

	// ==================== Getters ====================

	// 是否有加载中的任务
	const hasLoadingTasks = computed(() => loadingCounter.value > 0);

	// 是否为暗色主题
	const isDarkTheme = computed(() => theme.value === "dark");

	// ==================== Actions ====================

	/**
	 * 开始加载
	 * @param {string} text - 加载提示文本
	 */
	function startLoading(text = "") {
		loadingCounter.value++;
		isGlobalLoading.value = true;
		if (text) {
			loadingText.value = text;
		}
	}

	/**
	 * 结束加载
	 */
	function stopLoading() {
		loadingCounter.value = Math.max(0, loadingCounter.value - 1);
		if (loadingCounter.value === 0) {
			isGlobalLoading.value = false;
			loadingText.value = "";
		}
	}

	/**
	 * 强制结束所有加载
	 */
	function forceStopLoading() {
		loadingCounter.value = 0;
		isGlobalLoading.value = false;
		loadingText.value = "";
	}

	/**
	 * 切换侧边栏折叠状态
	 */
	function toggleSidebar() {
		sidebarCollapsed.value = !sidebarCollapsed.value;
	}

	/**
	 * 设置侧边栏折叠状态
	 * @param {boolean} collapsed - 是否折叠
	 */
	function setSidebarCollapsed(collapsed) {
		sidebarCollapsed.value = collapsed;
	}

	/**
	 * 切换主题
	 */
	function toggleTheme() {
		theme.value = theme.value === "light" ? "dark" : "light";
		applyTheme();
	}

	/**
	 * 设置主题
	 * @param {string} newTheme - 主题名称 ('light' | 'dark')
	 */
	function setTheme(newTheme) {
		theme.value = newTheme;
		applyTheme();
	}

	/**
	 * 应用主题到 DOM
	 */
	function applyTheme() {
		if (theme.value === "dark") {
			document.body.setAttribute("arco-theme", "dark");
			document.documentElement.classList.add("dark");
		} else {
			document.body.removeAttribute("arco-theme");
			document.documentElement.classList.remove("dark");
		}
		// 持久化主题设置
		localStorage.setItem("theme", theme.value);
	}

	/**
	 * 从本地存储初始化主题
	 */
	function initTheme() {
		const savedTheme = localStorage.getItem("theme");
		if (savedTheme) {
			theme.value = savedTheme;
		} else {
			// 跟随系统主题
			const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
			theme.value = prefersDark ? "dark" : "light";
		}
		applyTheme();
	}

	// ==================== Modal Actions ====================

	/**
	 * 打开二维码模态框
	 * @param {string} url - 短链接 URL
	 */
	function openQrcodeModal(url) {
		modals.value.qrcode.visible = true;
		modals.value.qrcode.url = url;
	}

	/**
	 * 关闭二维码模态框
	 */
	function closeQrcodeModal() {
		modals.value.qrcode.visible = false;
		modals.value.qrcode.url = "";
	}

	/**
	 * 打开确认模态框
	 * @param {Object} options - 配置选项
	 */
	function openConfirmModal({ title, content, onOk, onCancel }) {
		modals.value.confirm.visible = true;
		modals.value.confirm.title = title;
		modals.value.confirm.content = content;
		modals.value.confirm.onOk = onOk;
		modals.value.confirm.onCancel = onCancel;
	}

	/**
	 * 关闭确认模态框
	 */
	function closeConfirmModal() {
		modals.value.confirm.visible = false;
		modals.value.confirm.title = "";
		modals.value.confirm.content = "";
		modals.value.confirm.onOk = null;
		modals.value.confirm.onCancel = null;
	}

	// ==================== Drawer Actions ====================

	/**
	 * 打开链接配置抽屉
	 */
	function openLinkConfigDrawer() {
		drawers.value.linkConfig.visible = true;
	}

	/**
	 * 关闭链接配置抽屉
	 */
	function closeLinkConfigDrawer() {
		drawers.value.linkConfig.visible = false;
	}

	/**
	 * 打开链接编辑抽屉
	 * @param {number} linkId - 链接 ID
	 */
	function openLinkEditDrawer(linkId) {
		drawers.value.linkEdit.visible = true;
		drawers.value.linkEdit.linkId = linkId;
	}

	/**
	 * 关闭链接编辑抽屉
	 */
	function closeLinkEditDrawer() {
		drawers.value.linkEdit.visible = false;
		drawers.value.linkEdit.linkId = null;
	}

	/**
	 * 重置所有 UI 状态
	 */
	function $reset() {
		isGlobalLoading.value = false;
		loadingText.value = "";
		sidebarCollapsed.value = false;
		loadingCounter.value = 0;

		modals.value = {
			qrcode: { visible: false, url: "" },
			linkEdit: { visible: false, linkId: null },
			confirm: {
				visible: false,
				title: "",
				content: "",
				onOk: null,
				onCancel: null,
			},
		};

		drawers.value = {
			linkConfig: { visible: false },
			linkEdit: { visible: false, linkId: null },
		};
	}

	return {
		// State
		isGlobalLoading,
		loadingText,
		sidebarCollapsed,
		theme,
		loadingCounter,
		modals,
		drawers,

		// Getters
		hasLoadingTasks,
		isDarkTheme,

		// Actions
		startLoading,
		stopLoading,
		forceStopLoading,
		toggleSidebar,
		setSidebarCollapsed,
		toggleTheme,
		setTheme,
		applyTheme,
		initTheme,

		// Modal Actions
		openQrcodeModal,
		closeQrcodeModal,
		openConfirmModal,
		closeConfirmModal,

		// Drawer Actions
		openLinkConfigDrawer,
		closeLinkConfigDrawer,
		openLinkEditDrawer,
		closeLinkEditDrawer,

		// Reset
		$reset,
	};
});
