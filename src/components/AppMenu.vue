<template>
  <el-menu
    :collapse="true"
    class="h-full"
    active-text-color="#303133"
    @select="menuSelect"
  >
    <el-menu-item index="close">
      <el-icon class="text-[#2c3e50]"><HomeFilled /></el-icon>
      <template #title>主页</template>
    </el-menu-item>
    <el-sub-menu index="home">
      <template #title>
        <el-icon class="text-[#2c3e50]"><icon-menu /></el-icon>
      </template>
      <el-menu-item index="newMenu">新建目录</el-menu-item>
      <el-menu-item index="send">上线发布</el-menu-item>
      <!-- <el-menu-item-group>
        <template #title><span>Group One</span></template>
        <el-menu-item index="1-1">item one</el-menu-item>
        <el-menu-item index="1-2">item two</el-menu-item>
      </el-menu-item-group>
      <el-menu-item-group title="Group Two">
        <el-menu-item index="1-3">item three</el-menu-item>
      </el-menu-item-group>
      <el-sub-menu index="1-4">
        <template #title><span>item four</span></template>
        <el-menu-item index="1-4-1">item one</el-menu-item>
      </el-sub-menu> -->
    </el-sub-menu>
    <el-menu-item index="save">
      <i
        class="iconfont icon-save-fill text-[20px] text-[#1296db] ml-[2px]"
      ></i>
      <template #title>保存当前文档</template>
    </el-menu-item>
    <el-menu-item index="changes">
      <el-badge
        v-if="uncommitDoc.length"
        :value="uncommitDoc.length"
        type="primary"
        class="changes"
      >
        <i class="iconfont icon-git text-[20px] text-[#1296db] ml-[2px]"></i>
      </el-badge>
      <i
        v-else
        class="iconfont icon-git text-[20px] text-[#1296db] ml-[2px]"
      ></i>
      <template #title>修改记录</template>
    </el-menu-item>
    <!-- <el-menu-item index="3" disabled>
      <el-icon><document /></el-icon>
      <template #title>Navigator Three</template>
    </el-menu-item> -->
    <el-menu-item index="vscode">
      <i class="iconfont icon-vscode text-[20px] text-[#1296db] ml-[2px]"></i>
      <template #title>vscode打开项目</template>
    </el-menu-item>
    <el-menu-item index="delete">
      <el-icon class="text-[#f89898]"><DeleteFilled /></el-icon>
      <template #title>删除当前文档</template>
    </el-menu-item>

    <!-- <el-menu-item index="webstorm">
      <i class="iconfont icon-webstorm text-[18px] text-[#1296db] ml-[2px]"></i>
      <template #title>webstorm打开项目</template>
    </el-menu-item> -->
  </el-menu>
</template>

<script lang="ts" setup>
import {
  // Document,
  Menu as IconMenu,
  // Location,
  // Setting,
  // CloseBold,
  DeleteFilled,
  HomeFilled,
} from "@element-plus/icons-vue"
import { useStore } from "../stores/index"
import { ElMessageBox } from "element-plus"
import bus from "../lib/bus"
import { useDialog } from "../lib/useDialog"
import AppHistory from "../components/AppHistory.vue"
import { runVSCode } from "../tauri/api"
const props = defineProps({
  currentDoc: {
    type: String,
    default: "",
  },
  uncommitDoc: {
    type: Array as () => string[],
    default: () => [],
  },
  addMenu: {
    type: Function,
    default: null,
  },
  loadDoc: {
    type: Function,
    default: null,
  },
  deleteDoc: {
    type: Function,
    default: null,
  },
  saveMdFile: {
    type: Function,
    default: null,
  },
})
const { show } = useDialog()
const store = useStore()
async function menuSelect(index: string) {
  switch (index) {
    case "changes":
      show(AppHistory, {
        currentDoc: props.currentDoc,
      }).then(() => {
        // TODO：未修改记录会丢失，如果删除了当前文档怎么办
        props.loadDoc()
      })
      break
    case "save":
      await props.saveMdFile(true)
      break
    case "delete":
      props.deleteDoc()
      break
    case "close":
      store.docFolder = ""
      break
    case "vscode":
      console.log("runVSCode")
      runVSCode(store.docFolder)
      break
    case "newMenu":
      // 新增目录
      ElMessageBox.prompt("请输入目录名称", "目录", {
        confirmButtonText: "确认",
        cancelButtonText: "取消",
        inputPattern: /^(?!\s*$).+/,
        inputErrorMessage: "名称不能为空",
      }).then(async ({ value }) => {
        await props.addMenu(value)
        bus.emit("addMenu")
      })
      break
    default:
      break
  }
}
</script>

<style lang="scss">
.changes .el-badge__content {
  top: 38px !important;
  right: 12px !important;
}
</style>
