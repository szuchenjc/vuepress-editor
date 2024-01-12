import type { SidebarItem } from "vuepress"

export interface AppSidebarItem extends SidebarItem {
  deleted?: boolean
  id?: string
  children?: AppSidebarItem[]
  collapsible?: boolean
  path?: string
}

export type gitChangesItem = {
  file: string
  type: string
  path: string
  status: string
}
