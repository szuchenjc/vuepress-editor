import { createApp } from "vue"
import pinia from "../stores"
declare type Data = Record<string, unknown>

export const useDialog = () => {
  const show = (component: any, props?: Data | null | undefined) => {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve) => {
      if (component instanceof Promise) {
        component = await component.then((res) => res.default)
      }
      const app = createApp(component, props).use(pinia)

      // Vue3新实例需要重新手动挂载组件
      // app.use(ElementPlus)
      // app.component(ZlDialog.name, ZlDialog)

      const div = document.createElement("div")
      const node = document.body.appendChild(div)

      // 此处类型没有解决
      const $vm = app.mount(div) as any

      $vm.open().then(
        (result: any) => {
          // if (resolve) {
          resolve(result)
          // }
          setTimeout(() => {
            app.unmount()
            node.remove()
          }, 300)
        },
        () => {
          setTimeout(() => {
            app.unmount()
            node.remove()
          }, 300)
        },
      )
    })
  }
  return {
    show,
  }
}
