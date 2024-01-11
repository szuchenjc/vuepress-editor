import { defineStore, createPinia } from "pinia"
import piniaPluginPersistedstate from "pinia-plugin-persistedstate"

const pinia = createPinia().use(piniaPluginPersistedstate)

export const useStore = defineStore("main", {
  state: () => {
    return {
      previousFolder: "", // 上一次选择的文件夹
      docFolder: "", // 当前文件夹
      docDirHistory: [] as string[],
    }
  },
  persist: true,
  // other options...
})

export default pinia
