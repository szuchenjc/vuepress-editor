import { defineConfig, loadEnv } from "vite"
import vue from "@vitejs/plugin-vue"
import eslintPlugin from "vite-plugin-eslint"
import AutoImport from "unplugin-auto-import/vite"
import Components from "unplugin-vue-components/vite"
import { ElementPlusResolver } from "unplugin-vue-components/resolvers"
import path from "path"

const baseConfig = ({ mode }) => {
  return {
    plugins: [
      vue(),
      eslintPlugin({
        include: ["src/**/*.ts", "src/**/*.vue", "src/*.ts", "src/*.vue"],
      }),
      AutoImport({
        resolvers: [ElementPlusResolver()],
      }),
      Components({
        resolvers: [ElementPlusResolver()],
      }),
    ],
    resolve: {
      alias: {
        "@native": path.resolve(
          __dirname,
          `./src/${loadEnv(mode, process.cwd()).VITE_APP_MODE}`.trim(),
        ),
      },
    },
    define: {
      // 定义全局变量显式关闭__VUE_OPTIONS_API__
      __VUE_OPTIONS_API__: false,
    },
    // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
    //
    // 1. prevent vite from obscuring rust errors
    clearScreen: false,
    // 2. tauri expects a fixed port, fail if that port is not available
    server: {
      port: 1420,
      strictPort: true,
      watch: {
        // 3. tell vite to ignore watching `src-tauri`
        ignored: ["**/src-tauri/**"],
      },
    },
  }
}
// https://vitejs.dev/config/
export default defineConfig(baseConfig)

export { baseConfig }
