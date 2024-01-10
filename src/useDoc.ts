import { readTextFile, removeFile, writeBinaryFile } from "@tauri-apps/api/fs"
import bus from "./lib/bus"
import { nextTick, ref } from "vue"
import { TreeNodeData } from "element-plus/lib/components/tree/src/tree.type"
import { ElMessage, ElMessageBox } from "element-plus"
import { v4 as uuidv4 } from "uuid"
import { Command } from "@tauri-apps/api/shell"
import { getTitle, resetChildren } from "./lib/docUtils"
import { AppSidebarItem } from "./type"
import type Node from "element-plus/es/components/tree/src/model/node"
import {
  convertFileToDataUri,
  createFolder,
  readFileAsJson,
  runVSCode,
  selectFolder,
} from "./tauri/api"
import { useStore } from "./stores"

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

export const useDoc = () => {
  const store = useStore()
  // 文档目录
  const docDir = ref("")
  // 未提交记录（修改记录）
  const uncommitDoc = ref<string[]>([])
  // 当前选中的文章（eltree节点）
  const currentNode = ref<Node | null>(null)
  // 所有文章（eltree数据源）
  const docList = ref<AppSidebarItem[]>([])
  // 当前编辑的文档
  const currentDoc = ref("")
  // 新增文档
  async function addDoc(node: Node, title: string) {
    // 创建文件夹
    await createFolder(`${docDir.value}/docs/article`)
    // 创建md文件
    const fileName = uuidv4()
    const encoder = new TextEncoder()
    const contents = encoder.encode(`# ${title}`)
    const path = `/article/${fileName}.md`
    try {
      await writeBinaryFile({
        path: `${docDir.value}/docs${path}`,
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
    // 定位当前文档为新增文档
    bus.emit("getCurrentNode", path)
    currentDoc.value = `# ${title}`
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
  // 自定义异步获取图片函数，这里使用了 Promise 模拟异步操作
  async function asyncFileFetcher(src: string) {
    let filePath = `${docDir.value}/docs/.vuepress/public${decodeURIComponent(
      src,
    )}`
    if (src.startsWith(".")) {
      filePath = `${docDir.value}/docs${currentNode.value!.data.path.replace(
        /\/[^/]+$/,
        "/",
      )}${decodeURIComponent(src)}`
    }
    const fileUri = await convertFileToDataUri(filePath)
    const element = document.getElementById(src) as HTMLImageElement
    element.src = fileUri
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
  // 删除文档
  function deleteDoc() {
    ElMessageBox.confirm("确定删除此文档吗?", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    }).then(async () => {
      if (!currentNode.value) {
        return
      }
      if (currentNode.value.parent.data.children) {
        currentNode.value.parent.data.children =
          currentNode.value.parent.data.children.filter(
            (t: AppSidebarItem) => t.path !== currentNode.value!.data.path,
          )
      } else {
        currentNode.value.parent.data = currentNode.value.parent.data.filter(
          (t: AppSidebarItem) => t.path !== currentNode.value!.data.path,
        )
      }
      // 删除后，先保存菜单设置
      await saveSidebar()
      // 再删除文件
      await removeFile(`${docDir.value}/docs${currentNode.value.data.path}`)
      currentDoc.value = ""
      currentNode.value = null
      loadDoc()
    })
  }
  // 生成文档节点，并获取文章名字和变更记录
  async function getDocNode(node: string) {
    try {
      const contents = await readTextFile(`${docDir.value}/docs${node}`)
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
  // 获取未提交的修改
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
  // 点击文档，进行加载
  async function handleDocClick(data: TreeNodeData, node: Node) {
    if (!data.path) {
      return
    }
    currentNode.value = node
    const contents = await readTextFile(`${docDir.value}/docs${data.path}`)
    currentDoc.value = contents
      .replace(/&#123;&#123;/g, "{{")
      .replace(/&#125;&#125;/g, "{{")
  }
  async function handleImport() {
    const folderPath = await selectFolder()
    if (folderPath) {
      docDir.value = folderPath
      store.opened = true
      if (!store.projectDirList.includes(folderPath)) {
        store.projectDirList.push(folderPath)
      }
      await loadDoc()
      console.log(docList)
    }
  }
  // 获取已有文档列表（全量）
  async function loadDoc() {
    if (!docDir.value) {
      return
    }
    await getUncommitDoc()
    const arr = await readFileAsJson<AppSidebarItem[]>(
      `${docDir.value}/docs/.vuepress/configs/sidebar/data.json`,
    )
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
        console.log(node.children)
        await setChildren(node.children)
      }
    }
    docList.value = arr
    // 重新获取数据后，重置当前文档节点
    if (currentNode.value) {
      nextTick(() => {
        // currentNode.value = treeRef.value!.getNode(currentNode.value!.data.path)
        bus.emit("getCurrentNode", currentNode.value!.data.path)
        console.log("重新点击了")
        handleDocClick(currentNode.value!.data, currentNode.value!)
      })
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
          console.log(child)
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
  // 保存文档(物理)
  async function saveMdFile() {
    if (!currentNode.value?.data.path) {
      return
    }
    const encoder = new TextEncoder()
    const data = encoder.encode(
      currentDoc.value
        .replace(/{{/g, "&#123;&#123;")
        .replace(/}}/g, "&#125;&#125;"),
    )
    try {
      await writeBinaryFile({
        path: `${docDir.value}/docs${currentNode.value?.data.path}`,
        contents: data,
      })
    } catch {
      return noPermission()
    }
    ElMessage.success("保存成功")
    // 暂存
    await new Command("run-git", [
      "-C",
      docDir.value,
      "add",
      `docs${currentNode.value!.data.path}`,
    ]).execute()
    // 取消暂存 (有时文件一样也是处于修改状态中)
    await new Command("run-git", [
      "-C",
      docDir.value,
      "restore",
      "--staged",
      `docs${currentNode.value!.data.path}`,
    ]).execute()
    // 保存文件把侧边栏顺便保存一下（比如缺了文件，侧边栏自我修复）
    await saveSidebar()
    // 刷新数据
    await loadDoc()
  }
  // 侧边栏保存方法
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
        path: `${docDir.value}/docs/.vuepress/configs/sidebar/data.json`,
        contents: data,
      })
    } catch {
      return noPermission()
    }
    await getUncommitDoc()
  }
  // 上传图片
  async function uploadImg(files: File[]) {
    // 创建文件夹
    await createFolder(`${docDir.value}/docs/.vuepress/public/image`)
    const output = [] as any
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const buffer = await file.arrayBuffer()
      const path = `/image/${uuidv4()}.${file.name.match(/\.([^./]+)$/)![1]}`
      try {
        await writeBinaryFile({
          path: `${docDir.value}/docs/.vuepress/public${path}`,
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
  return {
    docDir,
    docList,
    currentDoc,
    currentNode,
    uncommitDoc,
    saveSidebar,
    runVSCode,
    addDoc,
    addMenu,
    asyncFileFetcher,
    deleteDoc,
    deleteMenu,
    handleDocClick,
    handleImport,
    loadDoc,
    saveMdFile,
    uploadImg,
  }
}
