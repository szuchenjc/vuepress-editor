<template>
  <el-aside class="h-full p-[10px]" width="250px" ref="sideRef">
    <el-tree
      ref="treeRef"
      empty-text="请新增目录"
      :data="docList"
      draggable
      default-expand-all
      :allow-drop="allowDrop"
      @node-drag-end="handleDragEnd"
      :props="{
        children: 'children',
        label: 'text',
        isLeaf: 'leaf',
      }"
      node-key="id"
      @node-click="handleDocClick"
    >
      <template #default="{ node, data }">
        <span class="flex flex-row justify-center items-center">
          <el-icon
            class="mr-[5px]"
            v-if="!data.path && !data.link"
            color="#409eff"
          >
            <Folder />
          </el-icon>
          <el-icon
            v-if="data.unCommit"
            :size="20"
            class="mr-[5px]"
            color="#409EFC"
          >
            <UploadFilled />
          </el-icon>
          <span>{{ node.label }}</span>
          <el-tooltip
            v-if="!data.path && !data.link"
            effect="dark"
            content="新建子文档"
            placement="bottom"
          >
            <el-icon class="ml-[5px]" @click.stop="handleAddDoc(node)">
              <DocumentAdd />
            </el-icon>
          </el-tooltip>
          <el-tooltip
            v-if="!data.path && data.children && data.children.length === 0"
            effect="dark"
            content="删除目录"
            placement="bottom"
          >
            <el-icon
              color="#f56c6c"
              class="ml-[5px]"
              @click.stop="deleteMenu(node)"
            >
              <Delete />
            </el-icon>
          </el-tooltip>
        </span>
      </template>
    </el-tree>
  </el-aside>
</template>

<script lang="ts" setup>
import type { AllowDropType } from "element-plus/es/components/tree/src/tree.type"
import type Node from "element-plus/es/components/tree/src/model/node"
import bus from "../lib/bus"
import {
  UploadFilled,
  DocumentAdd,
  Folder,
  Delete,
} from "@element-plus/icons-vue"
import { ref } from "vue"
import { ElMessageBox } from "element-plus"
import { AppSidebarItem } from "../tauriApi/type"
import { ElTree } from "element-plus"
import { PropType } from "vue"
const emit = defineEmits(["update:modelValue"])
const treeRef = ref<InstanceType<typeof ElTree>>()
bus.on("addMenu", scrollBottom)
bus.on("getCurrentNode", getCurrentNode)
const sideRef = ref()
function getCurrentNode(path: unknown) {
  console.log("触发更新了")
  emit("update:modelValue", treeRef.value!.getNode(path as string))
}
function scrollBottom() {
  const scrollContainer = sideRef.value!
  scrollContainer.$el.scrollTop = scrollContainer.$el.scrollHeight
}
const props = defineProps({
  docList: {
    type: Array as () => AppSidebarItem[],
    default: () => [],
  },
  currentNode: {
    type: Object as () => Node,
    default: null,
  },
  addDoc: {
    type: Function,
    default: null,
  },
  deleteMenu: {
    type: Function,
    default: null,
  },
  handleDocClick: {
    type: Function as PropType<(...args: any[]) => void>,
    default: null,
  },
  saveSidebar: {
    type: Function,
    default: null,
  },
})
// 判断拖拽
function allowDrop(_draggingNode: Node, dropNode: Node, type: AllowDropType) {
  switch (type) {
    case "inner":
      if (dropNode.data.leaf) {
        return false
      }
      return true
    default:
      return true
  }
}
function handleDragEnd() {
  props.saveSidebar()
}
// function handleDocClick(_node: Node) {}
function handleAddDoc(node: Node) {
  ElMessageBox.prompt("请输入文档名称", "文档", {
    confirmButtonText: "确认",
    cancelButtonText: "取消",
    inputPattern: /^(?!\s*$).+/,
    inputErrorMessage: "名称不能为空",
  }).then(async ({ value }) => {
    await props.addDoc(node, value)
  })
}
</script>

<style lang="scss" scoped></style>
