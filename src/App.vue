<script setup lang="ts">
import AppMenu from "./components/AppMenu.vue"
import AppHeader from "./components/AppHeader.vue"
import AppAside from "./components/AppAside.vue"
import AppEditor from "./components/AppEditor.vue"
import { useStore } from "./store/index"
const store = useStore()
</script>

<template>
  <el-container class="h-full">
    <el-aside width="64px">
      <AppMenu></AppMenu>
    </el-aside>
    <el-container v-if="store.opened">
      <el-header height="58px" class="flex items-center flex-row-reverse">
        <AppHeader></AppHeader>
      </el-header>
      <el-container>
        <el-aside class="p-[10px]" width="250px">
          <AppAside></AppAside>
        </el-aside>
        <el-main class="p-[10px]">
          <AppEditor></AppEditor>
        </el-main>
      </el-container>
    </el-container>
    <el-container class="flex justify-center items-center" v-else>
      <el-button class="w-[200px] h-[150px]" @click="store.opened = true">
        打开项目
      </el-button>
    </el-container>
  </el-container>
</template>

<style>
html,
body,
#app {
  @apply h-full;
}
</style>
