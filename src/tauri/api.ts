import { Command } from "@tauri-apps/api/shell"
import { open } from "@tauri-apps/api/dialog"
import { createDir, exists, readBinaryFile } from "@tauri-apps/api/fs"
import { appConfigDir } from "@tauri-apps/api/path"

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
export async function readFileAsJson<T>(path: string): Promise<T> {
  const data = await readBinaryFile(path)
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
  const selected = await open({
    directory: true,
    multiple: false,
    defaultPath: await appConfigDir(),
  })
  if (selected === null) {
    return ""
  }
  return selected as string
}
