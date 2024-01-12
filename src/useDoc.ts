import { readTextFile, removeFile } from "@tauri-apps/api/fs"
import { nextTick, ref, watch } from "vue"
import { TreeNodeData } from "element-plus/lib/components/tree/src/tree.type"
import { ElMessage, ElMessageBox } from "element-plus"
import { v4 as uuidv4 } from "uuid"
import { getTitle, resetChildren } from "./lib/docUtils"
import { AppSidebarItem } from "./type"
import { useStore } from "./stores"
import type Node from "element-plus/es/components/tree/src/model/node"
import bus from "./lib/bus"
import {
  convertFileToDataUri,
  createFolder,
  getUncommitList,
  gitCheck,
  readFileAsJson,
  runVSCode,
  selectFolder,
  writeImageFile,
  writeJsonFile,
  writeMarkdownFile,
} from "./tauri/api"

export const useDoc = () => {
  const store = useStore()
  // 当前选中的文章（eltree节点）
  const currentNode = ref<Node | null>(null)
  // 所有文章（eltree数据源）
  const docList = ref<AppSidebarItem[]>([])
  // 当前编辑的文档
  const currentDoc = ref("")
  // 新增文档
  async function addDoc(node: Node, title: string) {
    // 创建文件夹
    await createFolder(`${store.docFolder}/docs/article`)
    // 创建md文件
    const fileName = uuidv4()
    const path = `/article/${fileName}.md`
    // 物理保存
    await writeMarkdownFile(`${store.docFolder}/docs${path}`, `# ${title}`)
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
    let filePath = `${
      store.docFolder
    }/docs/.vuepress/public${decodeURIComponent(src)}`
    if (src.startsWith(".")) {
      filePath = `${store.docFolder}/docs${currentNode.value!.data.path.replace(
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
      await removeFile(`${store.docFolder}/docs${currentNode.value.data.path}`)
      currentDoc.value = ""
      currentNode.value = null
      loadDoc()
    })
  }
  // 生成文档节点，并获取文章名字和变更记录
  async function getDocNode(node: string) {
    try {
      const contents = await readTextFile(`${store.docFolder}/docs${node}`)
      return {
        id: node,
        text: getTitle(contents),
        path: node,
        leaf: true,
        deleted: false,
        unCommit: store.uncommitList.some((t) => `docs${node}`.indexOf(t) > -1),
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
  // // 获取未提交的修改
  // async function getUncommitList() {
  //   // const loading = ElLoading.service()
  //   // 获取所有未上传的变更记录
  //   const result = (
  //     await new Command("run-git", [
  //       "-C",
  //       store.docFolder,
  //       "status",
  //       "-u",
  //       "-s",
  //     ]).execute()
  //   ).stdout
  //     .split("\n")
  //     .filter((t: string) => t)
  //     .map((t: string) => t.split(" ").at(-1)!)
  //   // loading.close()
  //   store.uncommitList = result.filter((t: string) => !t?.startsWith("."))
  // }
  // 点击文档，进行加载
  async function handleDocClick(data: TreeNodeData, node: Node) {
    if (!data.path) {
      return
    }
    currentNode.value = node
    const contents = await readTextFile(`${store.docFolder}/docs${data.path}`)
    currentDoc.value = contents
      .replace(/&#123;&#123;/g, "{{")
      .replace(/&#125;&#125;/g, "{{")
  }
  async function handleImport() {
    const folderPath = await selectFolder()
    if (folderPath) {
      store.docFolder = folderPath
      if (!store.docDirHistory.includes(folderPath)) {
        store.docDirHistory.push(folderPath)
      }
    }
  }
  // 获取已有文档列表（全量）
  async function loadDoc() {
    console.log("loadDoc")
    if (!store.docFolder) {
      return
    }
    await getUncommitList()
    const arr = await readFileAsJson<AppSidebarItem[]>(
      `${store.docFolder}/docs/.vuepress/configs/sidebar/data.json`,
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
        await setChildren(node.children)
      }
    }
    docList.value = arr
    // 重新获取数据后，重置当前文档节点
    if (currentNode.value) {
      nextTick(() => {
        // currentNode.value = treeRef.value!.getNode(currentNode.value!.data.path)
        bus.emit("getCurrentNode", currentNode.value!.data.path)
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
  async function saveMdFile(showSuccessMessage: boolean = false) {
    if (!currentNode.value?.data.path) {
      return
    }
    await writeMarkdownFile(
      `${store.docFolder}/docs${currentNode.value?.data.path}`,
      currentDoc.value
        .replace(/{{/g, "&#123;&#123;")
        .replace(/}}/g, "&#125;&#125;"),
    )
    if (showSuccessMessage) {
      ElMessage.success("保存成功")
    }
    // git修改状态检查
    await gitCheck(store.docFolder, `docs${currentNode.value!.data.path}`)
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
    await writeJsonFile(
      `${store.docFolder}/docs/.vuepress/configs/sidebar/data.json`,
      saveData,
    )
    await getUncommitList()
  }
  // 上传图片
  async function uploadImg(files: File[]) {
    // 创建文件夹
    await createFolder(`${store.docFolder}/docs/.vuepress/public/image`)
    const output = [] as any
    for (let i = 0; i < files.length; i++) {
      const path = await writeImageFile(
        files[i],
        `${store.docFolder}/docs/.vuepress/public`,
      )
      output.push(path)
    }
    getUncommitList()
    return output
  }
  watch(
    () => store.docFolder,
    (newValue) => {
      if (!newValue) {
        currentNode.value = null
        docList.value = []
        store.uncommitList = []
        currentDoc.value = ""
        return
      } else {
        loadDoc()
      }
    },
  )
  return {
    docList,
    currentDoc,
    currentNode,
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
