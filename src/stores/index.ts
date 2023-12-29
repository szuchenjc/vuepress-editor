import { defineStore, createPinia } from "pinia"

const pinia = createPinia()

export const useStore = defineStore("main", {
  state: () => {
    return {
      // 所有这些属性都将自动推断其类型
      opened: false,
    }
  },
  // other options...
})

export default pinia
