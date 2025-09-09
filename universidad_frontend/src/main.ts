import { createApp } from "vue";
import App from "./App.vue";

//Element
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";

//main.css
import "./assets/main.css";

//router
import { router } from "./routes/routes";

createApp(App).use(ElementPlus).use(router).mount("#app");
