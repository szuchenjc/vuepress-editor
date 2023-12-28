<template>
  <el-menu
    :collapse="true"
    class="h-full"
    active-text-color="#303133"
    @select="menuSelect"
  >
    <el-sub-menu index="1">
      <template #title>
        <el-icon><location /></el-icon>
        <span>Navigator One</span>
      </template>
      <el-menu-item-group>
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
      </el-sub-menu>
    </el-sub-menu>
    <el-menu-item index="2">
      <el-icon><icon-menu /></el-icon>
      <template #title>Navigator Two</template>
    </el-menu-item>
    <!-- <el-menu-item index="3" disabled>
      <el-icon><document /></el-icon>
      <template #title>Navigator Three</template>
    </el-menu-item> -->
    <el-menu-item index="vscode">
      <i class="iconfont icon-vscode text-[20px] text-[#1296db] ml-[2px]"></i>
      <template #title>vscode打开项目</template>
    </el-menu-item>
    <el-menu-item index="webstorm">
      <i class="iconfont icon-webstorm text-[18px] text-[#1296db] ml-[2px]"></i>
      <template #title>webstorm打开项目</template>
    </el-menu-item>
    <el-menu-item index="close">
      <el-icon><CloseBold /></el-icon>
      <template #title>关闭项目</template>
    </el-menu-item>
  </el-menu>
</template>

<script lang="ts" setup>
import {
  Document,
  Menu as IconMenu,
  Location,
  Setting,
  CloseBold,
} from "@element-plus/icons-vue"
import { useStore } from "../store/index"
const store = useStore()
// import { ref } from "vue"
function menuSelect(index: string) {
  console.log(index)
  store.opened = false
}
</script>

<style lang="scss" scoped></style>
