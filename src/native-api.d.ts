declare module "@native/api" {
  export async function runVSCode(path: string): Promise<void>
  export async function createFolder(path: string): Promise<void>
  export async function readFileAsJson<T>(filePath: string): Promise<T>
  export async function convertFileToDataUri(
    filePath: string,
    type = "data:image/png;base64",
  ): Promise<string>
  export async function selectFolder(): Promise<string>
  export async function writeMarkdownFile(
    filePath: string,
    contents: string,
  ): Promise<void>
  export async function writeJsonFile<T>(
    filePath: string,
    contents: T,
  ): Promise<void>
  export async function writeImageFile(
    file: File,
    imageFolderPath: string,
  ): Promise<string | never[]>
  export async function gitCheck(
    docDirPath: string,
    filePath: string,
  ): Promise<void>
  export async function undo(row: gitChangesItem): Promise<void>
  export async function getUncommitList(): Promise<void>
  export async function runGitCommand(options: string[]): Promise<ChildProcess>
  export async function readTextFile(
    filePath: string,
    options?: FsOptions,
  ): Promise<string>
  export async function removeFile(
    file: string,
    options?: FsOptions,
  ): Promise<void>
}
