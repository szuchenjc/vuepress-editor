import { ElMessageBox } from "element-plus"
import { AppSidebarItem } from "../type"

interface AppSidebarItemOut extends Omit<AppSidebarItem, "children"> {
  deleted?: boolean
  id?: string
  children?: Array<AppSidebarItemOut | string>
  collapsible?: boolean
  path?: string
}

export function resetChildren(
  children: Array<AppSidebarItemOut | string>,
): Array<AppSidebarItemOut | string> {
  return children.map((child) => {
    if (typeof child === "string") {
      // 如果 child 是字符串，则直接返回
      return child
    } else {
      // child 是 AppSidebarItem
      if (child.path) {
        // 如果是文档
        return child.path
      } else if (child.children) {
        // 递归处理子元素
        child.children = resetChildren(child.children)
        // 删除id属性，此属性为编辑时临时标记
        delete child.id
      }
      return child
    }
  })
}

// 获取标题
export function getTitle(text: string) {
  const match = text.match(/^#\s*(.*?)\s*$/m)
  return match ? match[1] : "未知标题"
}

export function showErrorMessage(error: unknown) {
  console.log(error)
  ElMessageBox.alert((error as Error)?.message, "提示", {
    confirmButtonText: "确认",
  })
  return Promise.reject()
}
