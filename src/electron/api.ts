// 运行vscode
export async function runVSCode(path: string) {}

// 递归创建文件夹
export async function createFolder(path: string) {}

// 以Json的形式读取文件
export async function readFileAsJson<T>(filePath: string): Promise<T> {
  return [] as T
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
  return ""
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

export async function readTextFile(filePath: string) {}

export async function removeFile(filePath: string) {}
