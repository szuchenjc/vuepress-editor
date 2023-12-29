import {
  createDir,
  exists,
  readBinaryFile,
  readTextFile,
  writeBinaryFile,
} from "@tauri-apps/api/fs"
import { nextTick, reactive, ref } from "vue"
import { TreeNodeData } from "element-plus/lib/components/tree/src/tree.type"
import { ElMessage, ElMessageBox, ElTree } from "element-plus"
import type Node from "element-plus/es/components/tree/src/model/node"
import { v4 as uuidv4 } from "uuid"
import { Command } from "@tauri-apps/api/shell"
import { resetChildren } from "./doc"
import bus from "../lib/bus"
import { AppSidebarItem } from "./type"

export async function runVSCode(path: string) {
  await new Command("cmd", ["/C", "code", path]).execute()
}

function noPermission() {
  ElMessageBox.alert(
    "权限不足！开发平台建议装在D盘，如果装在C盘，请用管理员权限重新打开",
    "提示",
    {
      confirmButtonText: "确认",
    },
  )
  return Promise.reject()
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
  const docDir = ref("D:/temp/docs/qianduan-doc/")
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
  async function getUncommitDoc() {
    // const loading = ElLoading.service()
    // 获取所有未上传的变更记录
    const result = (
      await new Command("run-git", [
        "-C",
        docDir.value,
        "status",
        "-u",
        "-s",
      ]).execute()
    ).stdout
      .split("\n")
      .filter((t: string) => t)
      .map((t: string) => t.split(" ").at(-1)!)
    // loading.close()
    uncommitDoc.value = result.filter((t: string) => !t?.startsWith("."))
  }
  // 获取已有文档列表（全量）
  async function loadDoc() {
    await getUncommitDoc()
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
    const element = document.getElementById(src) as HTMLImageElement
    element.src = `${type},${base64}`
  }
  async function saveSidebar() {
    const saveData = docList.value.map((t: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...rest } = t
      if (t.path) {
        return t.path
      }
      return {
        ...rest,
        children: resetChildren(JSON.parse(JSON.stringify(t.children))),
      }
    })
    const encoder = new TextEncoder()
    const data = encoder.encode(JSON.stringify(saveData, null, 2))
    try {
      await writeBinaryFile({
        path: `${docDir.value}docs/.vuepress/configs/sidebar/data.json`,
        contents: data,
      })
    } catch {
      return noPermission()
    }
    await getUncommitDoc()
  }
  // 新增菜单
  async function addMenu(name: string) {
    if (docList.value.some((t) => t.text === name)) {
      return ElMessage.error("目录名称已存在")
    }
    docList.value.push({
      text: name,
      collapsible: true,
      children: [],
    })
    await saveSidebar()
  }
  // 删除目录
  function deleteMenu(node: Node) {
    ElMessageBox.confirm("确定删除此目录吗?", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    }).then(async () => {
      // 如果删除根目录
      // 第一层是拷贝，用真实数据删除
      if (node.parent.parent === null) {
        docList.value = docList.value.filter(
          (t: any) => t.text !== node.data.text,
        )
      } else {
        // 下面是浅拷贝
        node.parent.data.children = node.parent.data.children.filter(
          (t: AppSidebarItem) => t.text !== node.data.text,
        )
      }
      // 删除后，先保存菜单设置
      await saveSidebar()
    })
  }
  async function addDoc(node: Node, title: string) {
    // 创建文件夹
    await createFolder(`${docDir.value}docs/article`)
    // 创建md文件
    const fileName = uuidv4()
    const encoder = new TextEncoder()
    const contents = encoder.encode(`# ${title}`)
    const path = `/article/${fileName}.md`
    try {
      await writeBinaryFile({
        path: `${docDir.value}docs${path}`,
        contents,
      })
    } catch {
      return noPermission()
    }
    // 修改菜单配置
    node.data.children.push({
      id: path,
      text: title,
      path,
      leaf: true,
      deleted: false,
      unCommit: true,
    })
    await saveSidebar()
    // 重新获取数据
    // await loadDoc()
    // 定位当前文档为新增文档
    bus.emit("getCurrentNode", path)
    // currentNode.value = treeRef.value.getNode(path)
    currentDoc.content = `# ${title}`
  }
  return {
    docDir,
    loadDoc,
    currentDoc,
    currentNode,
    docList,
    handleDocClick,
    uploadImg,
    asyncFileFetcher,
    saveSidebar,
    runVSCode,
    addMenu,
    addDoc,
  }
}
