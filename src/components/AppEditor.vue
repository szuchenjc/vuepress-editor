<template>
  <md-editor
    editorId="editor"
    :disabled="false"
    v-model="content"
    @onUploadImg="onUploadImg"
    @onSave="onSave"
    :noUploadImg="false"
    class="w-full h-full"
  />
</template>

<script lang="ts" setup>
import { ref } from "vue"
import { MdEditor, config } from "md-editor-v3"
import "md-editor-v3/lib/style.css"
// 配置md渲染自定义规则
config({
  //   markdownItConfig(md: any) {
  //     md.use(asyncImagePlugin)
  //     md.use(asyncIframePlugin)
  //   },
})
const content = ref("")
function onUploadImg() {}
function onSave() {}
</script>

<style lang="scss" scoped></style>
