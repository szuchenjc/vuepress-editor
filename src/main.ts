import { createApp } from "vue"
import App from "./App.vue"
import pinia from "./stores"
import "element-plus/dist/index.css"
import "./styles.css"

createApp(App).use(pinia).mount("#app")
