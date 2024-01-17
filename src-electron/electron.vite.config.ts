// import { resolve } from "path"
import { defineConfig, externalizeDepsPlugin } from "electron-vite"
import { baseConfig } from "../vite.config"

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: "src-electron/out/main",
      lib: {
        entry: "src-electron/index.ts",
        formats: ["cjs"],
      },
      // rollupOptions: {
      //   input: "src-electron/index.html",
      // },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: "src-electron/out/preload",
      lib: {
        entry: "src-electron/preload/index.ts",
        formats: ["cjs"],
      },
    },
  },
  renderer: {
    ...baseConfig,
    root: ".",
    resolve: {
      alias: {
        // "@renderer": resolve("src-electron"),
      },
    },
    build: {
      outDir: "src-electron/out/renderer",
      rollupOptions: {
        input: "index.html",
      },
    },
  },
})
