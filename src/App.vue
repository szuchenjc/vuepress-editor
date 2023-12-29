<script setup lang="ts">
import AppMenu from "./components/AppMenu.vue"
import AppHeader from "./components/AppHeader.vue"
import AppAside from "./components/AppAside.vue"
import AppEditor from "./components/AppEditor.vue"
import { useStore } from "./store/index"
import { useDoc } from "./tauriApi/utils"
const store = useStore()
const {
  docDir,
  currentNode,
  loadDoc,
  docList,
  handleDocClick,
  currentDoc,
  asyncFileFetcher,
  uploadImg,
  saveSidebar,
  addMenu,
  addDoc,
} = useDoc()
loadDoc()
</script>

<template>
  <el-container class="h-full">
    <el-aside width="64px">
      <AppMenu :docDir="docDir" :addMenu="addMenu"></AppMenu>
    </el-aside>
    <el-container class="overflow-hidden" v-if="store.opened">
      <el-header height="58px" class="flex items-center flex-row-reverse">
        <AppHeader></AppHeader>
      </el-header>
      <el-container class="overflow-hidden">
        <AppAside
          v-model="currentNode"
          :docList="docList"
          :addDoc="addDoc"
          :handleDocClick="handleDocClick"
          :saveSidebar="saveSidebar"
        ></AppAside>
        <el-main class="p-[10px]">
          <AppEditor
            v-model="currentDoc.content"
            :asyncFileFetcher="asyncFileFetcher"
            :uploadImg="uploadImg"
          ></AppEditor>
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
