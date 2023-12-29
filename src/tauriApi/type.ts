import type { SidebarItem } from "vuepress"

export interface AppSidebarItem extends SidebarItem {
  deleted?: boolean
  id?: string
  children?: AppSidebarItem[]
  collapsible?: boolean
  path?: string
}
