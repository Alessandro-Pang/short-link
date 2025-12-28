import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import "@arco-design/web-vue/dist/arco.css";
import "./assets/main.css";

// 创建 Pinia 实例
const pinia = createPinia();

// 创建 Vue 应用
const app = createApp(App);

// 使用插件
app.use(pinia);
app.use(router);

// 挂载应用
app.mount("#app");
