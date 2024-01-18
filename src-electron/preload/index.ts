import { contextBridge } from "electron"
import { ipcRenderer } from "electron"
import { electronAPI } from "@electron-toolkit/preload"

// Custom APIs for renderer
const api = {
  runGit: (cmd: string) => {
    return new Promise((resolve, reject) => {
      ipcRenderer.send("run-git", cmd)
      ipcRenderer.once("git-result", (event, result) => {
        resolve(result)
      })
    })
  },
  selectFolder: (defaultPath: string) => {
    return new Promise((resolve, reject) => {
      ipcRenderer.send("select-folder", defaultPath)
      ipcRenderer.once("folder-result", (event, result) => {
        resolve(result)
      })
    })
  },
  readTextFile: (filePath: string) => {
    return new Promise((resolve, reject) => {
      ipcRenderer.send("read-text-file", filePath)
      ipcRenderer.once("text-file", (event, result) => {
        resolve(result)
      })
    })
  },
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI)
    contextBridge.exposeInMainWorld("api", api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
