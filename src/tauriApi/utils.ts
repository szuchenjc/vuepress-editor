import {
  createDir,
  exists,
  readBinaryFile,
  readTextFile,
  writeBinaryFile,
} from "@tauri-apps/api/fs"
import { nextTick, reactive, ref } from "vue"
import { TreeNodeData } from "element-plus/lib/components/tree/src/tree.type"
import { ElMessageBox, ElTree } from "element-plus"
import type Node from "element-plus/es/components/tree/src/model/node"
import type { SidebarItem } from "vuepress"
import { v4 as uuidv4 } from "uuid"

interface AppSidebarItem extends SidebarItem {
  deleted: boolean
  id: string
  children?: AppSidebarItem[]
}

export async function createFolder(path: string) {
  if (path.endsWith("/") || path.endsWith("\\")) {
    path = path.slice(0, -1)
  }
  const existPath = (await exists(path)) as unknown as boolean
  if (!existPath) {
    if (path.includes("\\")) {
      const perPath = path.substring(0, path.lastIndexOf("\\"))
      await createFolder(perPath)
      await createDir(`${perPath}/${path.split("\\").at(-1)}`)
    } else {
      const perPath = path.substring(0, path.lastIndexOf("/"))
      await createFolder(perPath)
      await createDir(`${perPath}/${path.split("/").at(-1)}`)
    }
  }
}

export const useDoc = () => {
  // 文档目录
  const docDir = ref("D:/temp/docs/knowledge-doc/")
  const uncommitDoc = ref<string[]>([])
  const currentNode = ref<Node | null>(null)
  const docList = ref<AppSidebarItem[]>([])
  const treeRef = ref<InstanceType<typeof ElTree>>()
  // 当前编辑的文档
  const currentDoc = reactive({
    id: "",
    title: "", // 标题
    path: "", // 文件路径
    content: "", // 文档内容
    unCommit: false, // 是否已推送
  })
  // 获取已有文档列表（全量）
  async function loadDoc() {
    // await getUncommitDoc()
    const data = await readBinaryFile(
      `${docDir.value}docs/.vuepress/configs/sidebar/data.json`,
    )
    const decoder = new TextDecoder()
    const content = decoder.decode(data)
    const arr = JSON.parse(content) as AppSidebarItem[]

    for (let j = arr.length - 1; j >= 0; j--) {
      const node = arr[j]
      if (typeof node === "string") {
        arr[j] = await getDocNode(node)
        if (arr[j].deleted) {
          // 文件不存在，删除菜单配置
          arr.splice(j, 1)
        }
      } else {
        node.id = node.text
        await setChildren(node.children)
      }
    }
    docList.value = arr
    // 重新获取数据后，重置当前文档节点
    if (currentNode.value) {
      nextTick(() => {
        currentNode.value = treeRef.value!.getNode(currentNode.value!.data.path)
        handleDocClick(currentNode.value.data, currentNode.value)
      })
    }
  }
  // 生成文档节点，并获取文章名字和变更记录
  async function getDocNode(node: string) {
    try {
      const contents = await readTextFile(`${docDir.value}docs${node}`)
      return {
        id: node,
        text: getTitle(contents),
        path: node,
        leaf: true,
        deleted: false,
        unCommit: uncommitDoc.value.some((t) => `docs${node}`.indexOf(t) > -1),
      }
    } catch {
      return {
        id: node,
        text: "文件不存在",
        path: node,
        leaf: true,
        deleted: true,
        unCommit: true,
      }
    }
  }
  // 设置文档节点
  async function setChildren(children: AppSidebarItem[] | undefined) {
    if (!children) {
      return
    }
    for (let i = children.length - 1; i >= 0; i--) {
      {
        const child = children[i]
        if (typeof child === "string") {
          children[i] = await getDocNode(child)
          if (children[i].deleted) {
            // 文件不存在，删除菜单配置
            children.splice(i, 1)
          }
        } else {
          child.id = child.text
          await setChildren(child.children)
        }
      }
    }
  }
  // 点击文档，进行加载
  async function handleDocClick(data: TreeNodeData, node: Node) {
    if (!data.path) {
      return
    }
    currentNode.value = node
    const contents = await readTextFile(`${docDir.value}docs${data.path}`)
    currentDoc.content = contents
      .replace(/&#123;&#123;/g, "{{")
      .replace(/&#125;&#125;/g, "{{")
  }
  // 获取标题
  function getTitle(text: string) {
    const match = text.match(/^#\s*(.*?)\s*$/m)
    return match ? match[1] : "未知标题"
  }
  async function uploadImg(files: any) {
    // 创建文件夹
    await createFolder(`${docDir.value}docs/.vuepress/public/image`)
    const output = [] as any
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const buffer = await file.arrayBuffer()
      const path = `/image/${uuidv4()}.${file.name.match(/\.([^./]+)$/)[1]}`
      try {
        await writeBinaryFile({
          path: `${docDir.value}docs/.vuepress/public${path}`,
          contents: new Uint8Array(buffer),
        })
      } catch {
        ElMessageBox.alert(
          "权限不足！开发平台建议装在D盘，如果装在C盘，请用管理员权限重新打开",
          "提示",
          {
            confirmButtonText: "确认",
          },
        )
        return []
      }
      output.push(path)
    }
    return output
  }
  // 自定义异步获取图片函数，这里使用了 Promise 模拟异步操作
  async function asyncFileFetcher(src: string, type = "data:image/png;base64") {
    let filePath = `${docDir.value}docs/.vuepress/public${decodeURIComponent(
      src,
    )}`
    if (src.startsWith(".")) {
      filePath = `${docDir.value}docs${currentNode.value!.data.path.replace(
        /\/[^/]+$/,
        "/",
      )}${decodeURIComponent(src)}`
    }
    const buffer = await readBinaryFile(filePath)
    const base64 = btoa(
      new Uint8Array(buffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        "",
      ),
    )
    const element = document.getElementById(src) as any
    element.src = `${type},${base64}`
  }
  return {
    loadDoc,
    currentDoc,
    docList,
    handleDocClick,
    uploadImg,
    asyncFileFetcher,
  }
}
