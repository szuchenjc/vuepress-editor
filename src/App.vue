<script setup lang="ts">
import AppMenu from "./components/AppMenu.vue"
import AppHeader from "./components/AppHeader.vue"
import AppAside from "./components/AppAside.vue"
import AppEditor from "./components/AppEditor.vue"
import { useStore } from "./stores/index"
import { useDoc } from "./useDoc"
const store = useStore()
const {
  docList,
  currentDoc,
  currentNode,
  uncommitDoc,
  addDoc,
  addMenu,
  asyncFileFetcher,
  deleteDoc,
  deleteMenu,
  handleDocClick,
  handleImport,
  loadDoc,
  saveMdFile,
  saveSidebar,
  uploadImg,
} = useDoc()
loadDoc()
</script>

<template>
  <el-container class="h-full">
    <el-aside width="64px">
      <AppMenu
        :currentDoc="currentDoc"
        :uncommitDoc="uncommitDoc"
        :addMenu="addMenu"
        :deleteDoc="deleteDoc"
        :saveMdFile="saveMdFile"
        :loadDoc="loadDoc"
      ></AppMenu>
    </el-aside>
    <el-container class="overflow-hidden" v-if="store.docFolder">
      <el-header height="58px" class="px-[5px]">
        <AppHeader></AppHeader>
      </el-header>
      <el-container class="overflow-hidden">
        <AppAside
          v-model="currentNode"
          :docList="docList"
          :addDoc="addDoc"
          :handleDocClick="handleDocClick"
          :saveSidebar="saveSidebar"
          :deleteMenu="deleteMenu"
        ></AppAside>
        <el-main class="p-[10px]">
          <AppEditor
            v-model="currentDoc"
            :asyncFileFetcher="asyncFileFetcher"
            :uploadImg="uploadImg"
          ></AppEditor>
        </el-main>
      </el-container>
    </el-container>
    <el-container class="flex justify-center items-center" v-else>
      <el-button class="w-[200px] h-[150px]" @click="handleImport">
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
