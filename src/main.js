import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "@arco-design/web-vue/dist/arco.css";
import "./assets/main.css";

const app = createApp(App);

app.use(router);
app.mount("#app");
