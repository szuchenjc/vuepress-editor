import { createApp } from "vue"
import "./styles.css"
import App from "./App.vue"
import { createPinia } from "pinia"
import "element-plus/dist/index.css"

const pinia = createPinia()
createApp(App).use(pinia).mount("#app")
