import { createPinia } from "pinia";
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "@arco-design/web-vue/dist/arco.css";
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
