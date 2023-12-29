<template>
  <el-menu
    :collapse="true"
    class="h-full"
    active-text-color="#303133"
    @select="menuSelect"
  >
    <el-menu-item index="close">
      <el-icon><HomeFilled /></el-icon>
      <template #title>主页</template>
    </el-menu-item>
    <el-sub-menu index="home">
      <template #title>
        <el-icon><icon-menu /></el-icon>
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

    <el-menu-item index="2">
      <i class="iconfont icon-git text-[20px] text-[#1296db] ml-[2px]"></i>
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
  HomeFilled,
} from "@element-plus/icons-vue"
import { useStore } from "../store/index"
import { runVSCode } from "../tauriApi/utils"
import { ElMessageBox } from "element-plus"
import bus from "../lib/bus"
const props = defineProps({
  docDir: {
    type: String,
    default: "",
  },
  addMenu: {
    type: Function,
    default: null,
  },
})
const store = useStore()
function menuSelect(index: string) {
  console.log(index)
  switch (index) {
    case "close":
      store.opened = false
      break
    case "vscode":
      runVSCode(props.docDir)
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

<style lang="scss" scoped></style>
