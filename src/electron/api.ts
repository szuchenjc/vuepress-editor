import { useStore } from "../stores"

// 运行vscode
export async function runVSCode(path: string) {}

// 递归创建文件夹
export async function createFolder(path: string) {}

// 以Json的形式读取文件
export async function readFileAsJson<T>(filePath: string): Promise<T> {
  const data = await window.api.readTextFile(filePath)
  const output = JSON.parse(data) as T
  return output
}

// 把文件转为可读uri
export async function convertFileToDataUri(
  filePath: string,
  type = "data:image/png;base64",
) {
  return ""
}

// 选择文件夹
export async function selectFolder() {
  const store = useStore()
  // window.api.runGit(["--version"].join(" "), (result: any) => {
  // })
  const selected = (
    await window.api.selectFolder(store.previousFolder)
  ).replace(/\//g, "\\")
  if (!selected) {
    return ""
  }
  store.previousFolder = selected as string
  return selected
}

// 保存MD文件
export async function writeMarkdownFile(filePath: string, contents: string) {}

// 保存JSON文件
export async function writeJsonFile<T>(filePath: string, contents: T) {}

// 保存图片
export async function writeImageFile(file: File, imageFolderPath: string) {}

// git修改记录检查
export async function gitCheck(docDirPath: string, filePath: string) {}

// 撤销修改
export async function undo(row: gitChangesItem) {}

// 获取未提交的修改
export async function getUncommitList() {}

// 获取未提交的修改
export async function runGitCommand(options: string[]) {}

export async function readTextFile(filePath: string) {
  const data = await window.api.readTextFile(filePath)
  return data
}

export async function removeFile(filePath: string) {}
