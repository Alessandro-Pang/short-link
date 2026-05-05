import { createPinia } from "pinia";
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
// Arco Design 全局反馈组件样式（Message/Modal/Notification 通过 JS API 调用，unplugin 无法自动检测）
import "@arco-design/web-vue/es/message/style/css.js";
import "@arco-design/web-vue/es/modal/style/css.js";
import "@arco-design/web-vue/es/notification/style/css.js";
import "./assets/main.css";
import { useUiStore } from "@/stores/ui";

// 创建 Pinia 实例
const pinia = createPinia();

// 创建 Vue 应用
const app = createApp(App);

// 使用插件
app.use(pinia);
app.use(router);

// 挂载应用
app.mount("#app");

// 初始化主题
const uiStore = useUiStore();
uiStore.initTheme();

// 移除 Loading 页面
const removeLoading = () => {
	const loadingEl = document.getElementById("app-loading");
	if (loadingEl) {
		loadingEl.classList.add("fade-out");
		setTimeout(() => loadingEl.remove(), 400);
	}
};

// 等待路由就绪后移除 Loading
router.isReady().then(removeLoading);
