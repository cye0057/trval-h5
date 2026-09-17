import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import Vant from 'vant'
import 'vant/lib/index.css'
import './styles/theme.css'   // Soft UI 令牌：必须在 vant 之后 import，否则 Vant :root 会覆盖

createApp(App).use(router).use(Vant).mount('#app')

