import { app, shell, BrowserWindow, dialog, ipcMain } from "electron"
import { join } from "path"
import { electronApp, optimizer, is } from "@electron-toolkit/utils"
import { autoUpdater } from "electron-updater"
import icon from "./resources/icon.png?asset"
import { exec } from "child_process"
import fs from "fs"

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === "linux" ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, "../preload/index.cjs"),
      sandbox: false,
    },
  })

  mainWindow.on("ready-to-show", () => {
    mainWindow.show()
  })

  // electron 11不支持
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: "deny" }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"])
  } else {
    // mainWindow.loadFile(join(__dirname, "src-electron/out/renderer/index.html"))
    mainWindow.loadFile("src-electron/out/renderer/index.html")
  }
  mainWindow.webContents.openDevTools()
  // mainWindow.loadURL("www.baidu.com")
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId("com.electron")

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  // 检查更新
  autoUpdater.checkForUpdatesAndNotify()
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.

// 更新事件
autoUpdater.on("update-available", (info) => {
  console.log("Update available:", info)
})

autoUpdater.on("update-downloaded", (info) => {
  console.log("Update downloaded:", info)
  dialog
    .showMessageBox({
      type: "info",
      title: "安装更新",
      message: "更新已下载，应用将重启以安装更新。",
      buttons: ["重启"],
    })
    .then(() => {
      autoUpdater.quitAndInstall()
    })
})

ipcMain.on("run-git", (event, cmd) => {
  exec(`git ${cmd}`, null, (err, stdout, stderr) => {
    if (err) {
      event.reply("git-result", `Error: ${err}`)
      return
    }
    event.reply("git-result", stdout)
  })
})

ipcMain.on("select-folder", (event, defaultPath) => {
  dialog
    .showOpenDialog({
      properties: ["openDirectory"],
      defaultPath, // 替换为你希望作为默认路径的文件夹路径
    })
    .then((result) => {
      if (!result.canceled && result.filePaths.length > 0) {
        event.reply("folder-result", result.filePaths[0])
        // console.log(result.filePaths[0]) // 输出用户选择的单个文件夹路径
      } else {
        event.reply("folder-result", "")
      }
    })
    .catch((err) => {
      console.error(err)
    })
})

ipcMain.on("read-text-file", (event, filePath) => {
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading file:", err)
      return
    }
    event.reply("text-file", data)
    // try {
    //   const jsonData = JSON.parse(data)
    //   console.log("JSON data:", jsonData)
    // } catch (jsonErr) {
    //   console.error("Error parsing JSON:", jsonErr)
    // }
  })
})
