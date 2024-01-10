import { createApp } from "vue"
import App from "./App.vue"
import pinia from "./stores"
import "./assets/styles.css"
import "element-plus/dist/index.css"

createApp(App).use(pinia).mount("#app")
