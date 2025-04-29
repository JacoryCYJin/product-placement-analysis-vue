import {createApp} from 'vue'
// 引入清楚默认样式
import "@/style/reset.scss";
import App from './App.vue'
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
// 引入全局组件--顶部，底部都是全局组件
import HomeBottom from "@/components/home_bottom/Bottom.vue";
import HomeTop from "@/components/home_top/Top.vue";
// 引入vue-router核心插件并安装
import router from "./router";


const app = createApp(App)
app.component("HomeBottom", HomeBottom);
app.component("HomeTop", HomeTop);
app.use(router)
app.use(ElementPlus)
app.mount('#app')
