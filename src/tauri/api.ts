import { Command } from "@tauri-apps/api/shell"
import { open } from "@tauri-apps/api/dialog"
import {
  createDir,
  exists,
  readBinaryFile,
  writeBinaryFile,
} from "@tauri-apps/api/fs"
import { appConfigDir } from "@tauri-apps/api/path"
import { v4 as uuidv4 } from "uuid"
import { useStore } from "../stores"

// 运行vscode
export async function runVSCode(path: string) {
  await new Command("cmd", ["/C", "code", path]).execute()
}

// 递归创建文件夹
export async function createFolder(path: string) {
  if (path.endsWith("/") || path.endsWith("\\")) {
    path = path.slice(0, -1)
  }
  const existPath = await exists(path)
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

// 以Json的形式读取文件
export async function readFileAsJson<T>(filePath: string): Promise<T> {
  const data = await readBinaryFile(filePath)
  const decoder = new TextDecoder()
  const content = decoder.decode(data)
  const output = JSON.parse(content) as T
  return output
}

// 把文件转为可读uri
export async function convertFileToDataUri(
  filePath: string,
  type = "data:image/png;base64",
) {
  const buffer = await readBinaryFile(filePath)
  const base64 = btoa(
    new Uint8Array(buffer).reduce(
      (data, byte) => data + String.fromCharCode(byte),
      "",
    ),
  )
  return `${type},${base64}`
}

// 选择文件夹
export async function selectFolder() {
  const store = useStore()
  const selected = await open({
    directory: true,
    multiple: false,
    defaultPath: store.previousFolder || (await appConfigDir()),
  })
  if (selected === null) {
    return ""
  }
  store.previousFolder = selected as string
  return selected as string
}

// 保存MD文件
export async function writeMarkdownFile(filePath: string, contents: string) {
  const encoder = new TextEncoder()
  const encodedContent = encoder.encode(contents)
  await writeBinaryFile({
    path: filePath,
    contents: encodedContent,
  })
}

// 保存MD文件
export async function writeJsonFile<T>(filePath: string, contents: T) {
  const encoder = new TextEncoder()
  const data = encoder.encode(JSON.stringify(contents, null, 2))
  await writeBinaryFile({
    path: filePath,
    contents: data,
  })
}

// 保存图片
export async function writeImageFile(file: File, imageFolderPath: string) {
  const buffer = await file.arrayBuffer()
  const path = `/image/${uuidv4()}.${file.name.match(/\.([^./]+)$/)![1]}`
  await writeBinaryFile({
    path: imageFolderPath + path,
    contents: new Uint8Array(buffer),
  })
  return path
}

// git修改记录检查
export async function gitCheck(docDirPath: string, filePath: string) {
  // 暂存
  await new Command("run-git", ["-C", docDirPath, "add", filePath]).execute()
  // 取消暂存 (有时文件一样也是处于修改状态中)
  await new Command("run-git", [
    "-C",
    docDirPath,
    "restore",
    "--staged",
    filePath,
  ]).execute()
}
