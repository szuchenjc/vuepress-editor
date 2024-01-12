<template>
  <md-editor
    :toolbars="toolbarsConfig"
    editorId="editor"
    :disabled="false"
    :modelValue="content"
    @update:modelValue="$emit('update:modelValue')"
    @onUploadImg="onUploadImg"
    :noUploadImg="false"
    class="w-full h-full"
  >
    <template #defToolbars>
      <NormalToolbar title="保存" @onClick="onSave">
        <template #trigger>
          <i class="iconfont icon-save-fill text-[17px] text-[#1296db]"></i>
        </template>
      </NormalToolbar>
      <NormalToolbar title="删除" @onClick="handleDelete">
        <template #trigger>
          <el-icon class="text-[#f89898] h-[24px] w-[24px]">
            <DeleteFilled />
          </el-icon>
        </template>
      </NormalToolbar>
    </template>
  </md-editor>
</template>

<script lang="ts" setup>
import { MdEditor, config, NormalToolbar } from "md-editor-v3"
import { DeleteFilled } from "@element-plus/icons-vue"
import toolbarsConfig from "../lib/toolbars"
import "md-editor-v3/lib/style.css"
const props = defineProps({
  content: {
    type: String,
    default: "",
  },
  asyncFileFetcher: {
    type: Function,
    default: null,
  },
  uploadImg: {
    type: Function,
    default: null,
  },
  saveMdFile: {
    type: Function,
    default: null,
  },
  deleteDoc: {
    type: Function,
    default: null,
  },
})
// 配置md渲染自定义规则
config({
  markdownItConfig(md: any) {
    md.use(asyncImagePlugin)
    md.use(asyncIframePlugin)
  },
})
async function onUploadImg(files: any, callback: any) {
  const images = await props.uploadImg(files)
  callback(images)
  onSave()
}
function onSave() {
  props.saveMdFile(true)
}
// 图片插件函数
function asyncImagePlugin(md: any) {
  md.renderer.rules.image = function (
    tokens: any,
    idx: any,
    options: any,
    env: any,
    self: any,
  ) {
    const token = tokens[idx]
    const src = token.attrs[token.attrIndex("src")][1]
    token.attrs[token.attrIndex("src")][1] = ""
    token.attrs[token.attrIndex("alt")][1] = token.content
    token.attrs.push(["id", src])
    // 预览时，异步请求本地图片文件
    props.asyncFileFetcher(src)
    // 继续默认的渲染
    return self.renderToken(tokens, idx, options, env, self)
  }
}
// iframe插件函数
function asyncIframePlugin(md: any) {
  const fn = md.renderer.rules.html_block
  md.renderer.rules.html_block = function (
    tokens: any,
    idx: any,
    options: any,
    env: any,
    self: any,
  ) {
    const token = tokens[idx]

    if (token.content.indexOf("<iframe") > -1) {
      // let src = ""
      const srcRegex = /src="([^"]+)"/
      var match = token.content.match(srcRegex)
      if (match && match[1]) {
        // src = match[1]
        token.content = "<div>pdf文件（暂不支持预览）</div>"
        // token.content = `<iframe id="${src}"></iframe>`
        // asyncFileFetcher(src, 'data:application/pdf')
      }
    }
    return fn(tokens, idx, options, env, self)
  }
}
function handleDelete() {
  props.deleteDoc()
}
</script>

<style lang="scss" scoped></style>
