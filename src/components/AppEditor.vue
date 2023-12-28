<template>
  <md-editor
    editorId="editor"
    :disabled="false"
    :modelValue="content"
    @update:modelValue="$emit('update:modelValue')"
    @onUploadImg="onUploadImg"
    @onSave="onSave"
    :noUploadImg="false"
    class="w-full h-full"
  />
</template>

<script lang="ts" setup>
import { MdEditor, config } from "md-editor-v3"
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
})
// 配置md渲染自定义规则
config({
  markdownItConfig(md: any) {
    md.use(asyncImagePlugin)
    md.use(asyncIframePlugin)
  },
})
// const content = ref("")
function onUploadImg() {}
function onSave() {}
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
</script>

<style lang="scss" scoped></style>
