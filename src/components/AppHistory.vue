<template>
  <Dialog
    ref="ZlDialogRef"
    :title="props.push ? '推送修改' : '修改历史'"
    width="650px"
    :before-close="close"
  >
    <el-alert
      v-if="props.push"
      title="请确认以下修改内容"
      type="warning"
      class="mb-[5px]"
    />
    <el-table border :data="tableData">
      <el-table-column
        prop="type"
        label="类型"
        width="60"
        align="center"
      ></el-table-column>
      <el-table-column prop="file" label="修改文件"></el-table-column>
      <el-table-column label="备注" width="145">
        <template #default="{ row }">
          <span
            v-if="
              props.currentDoc.indexOf(row.file) > -1 && row.type === '文件'
            "
          >
            当前文档包含该文件
          </span>
          <span v-else-if="row.status === '??'">新增</span>
          <span v-else-if="row.status === 'D'">删除</span>
          <span v-else-if="row.type === '目录'">新增文档或修改顺序</span>
          <span v-else>变更</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" fix="right" width="60" align="center">
        <template #default="{ row }">
          <el-button link type="primary" @click="reset(row)">撤销</el-button>
        </template>
      </el-table-column>
    </el-table>
    <template #footer>
      <span class="dialog-footer" v-if="props.push">
        <el-button @click="confirm" type="primary">提交</el-button>
        <el-button @click="cancel">取消</el-button>
      </span>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import { ref } from "vue"
import Dialog from "../components/Dialog.vue"
import { Command } from "@tauri-apps/api/shell"
import {
  readBinaryFile,
  readTextFile,
  writeBinaryFile,
} from "@tauri-apps/api/fs"
import { ElMessage, ElMessageBox } from "element-plus"
import { useStore } from "../stores"
import { undo } from "../tauri/api"

const store = useStore()
const ZlDialogRef = ref<InstanceType<typeof Dialog>>()
const tableData = ref<any[]>([])
const pushCount = ref(0)

const props = defineProps({
  currentDoc: {
    type: String,
    default: "",
  },
  push: {
    type: Boolean,
    default: false,
  },
})

async function getData() {
  let changeList = (
    await new Command("run-git", [
      "-C",
      store.docFolder,
      "status",
      "-u",
      "-s",
    ]).execute()
  ).stdout
    .split("\n")
    .filter((t) => t)
    .map((t) => ({
      status: t.split(" ").at(-2),
      path: t.split(" ").at(-1),
    }))
  // 兼容处理
  changeList = changeList.filter((t) => !t.path?.startsWith("."))
  tableData.value = []
  for (let i = 0; i < changeList.length; i++) {
    const row = changeList[i] as any
    // 删除的文件，不要读取
    if (row.path.endsWith(".md") && row.status !== "D") {
      let contents = ""
      try {
        contents = await readTextFile(`${store.docFolder}/${row.path}`)
      } catch (error) {
        console.log(error)
      }
      const match = contents.match(/^#\s*(.*?)\s*$/m)
      tableData.value.push({
        file: match ? match[1] : "未知文章",
        type: "文档",
        path: row.path,
        status: row.status,
      })
    } else if (row.path.endsWith(".json")) {
      tableData.value.push({
        file: "目录结构",
        type: "目录",
        path: row.path,
        status: row.status,
      })
    } else {
      tableData.value.push({
        file: row.path.split("/").at(-1),
        type: "文件",
        path: row.path,
        status: row.status,
      })
    }
  }
}

async function reset(row: any) {
  await undo(row)
  await getData()
}

// 固定操作
const open = async () => {
  await getData()
  return ZlDialogRef.value?.open()
}
const close = () => {
  ZlDialogRef.value?.close()
}
const confirm = async () => {
  // ZlLoading.show()
  try {
    // 暂存修改
    await new Command("run-git", ["-C", store.docFolder, "add", "."]).execute()
    // 提交
    await new Command("run-git", [
      "-C",
      store.docFolder,
      "commit",
      "-a",
      "-m",
      "文档编辑",
    ]).execute()
    const logMessage = await new Command("run-git", [
      "-C",
      store.docFolder,
      "log",
      "-n",
      "1",
      "--format=%H",
    ]).execute()
    const hash = logMessage.stdout
    const pullMessage = await new Command("run-git", [
      "-C",
      store.docFolder,
      "pull",
    ]).execute()
    console.log(pullMessage)
    console.log("合并失败,即将回退")
    if (pullMessage.stdout.indexOf("merge failed") > -1) {
      ElMessage.warning(`修改和线上版本部分文件冲突，部分修改将自动撤销！`)
      // 回退到提交节点
      await new Command("run-git", [
        "-C",
        store.docFolder,
        "reset",
        "--hard",
        hash,
      ]).execute()
      // 撤销最后一次提交
      await new Command("run-git", [
        "-C",
        store.docFolder,
        "reset",
        "HEAD^",
      ]).execute()
      // 获取所有非新增的修改，需要进行撤销（可以优化仅冲突的）
      // 获取所有未上传的变更记录
      const result = (
        await new Command("run-git", [
          "-C",
          store.docFolder,
          "status",
          "-u",
          "-s",
        ]).execute()
      ).stdout
        .split("\n")
        .filter((t) => t)
      const conflictList = result
        .filter((t: any) => t.split(" ").at(-2) !== "??")
        .map((t: any) => t.split(" ").at(-1)) as any[]
      for (let i = 0; i < conflictList.length; i++) {
        await new Command("run-git", [
          "-C",
          store.docFolder,
          "checkout",
          "--",
          conflictList[i],
        ]).execute()
      }
      // 重新获取最新，这个时候应该不冲突
      await new Command("run-git", ["-C", store.docFolder, "pull"]).execute()
      // 获取新增md文件
      const mdList = result
        .filter((t: any) => t.split(" ").at(-1).endsWith(".md"))
        .map((t: any) => t.split(" ").at(-1)) as any[]
      if (mdList.length > 0) {
        // 获取菜单，把md文件新增进去
        const data = await readBinaryFile(
          `${store.docFolder}/docs/.vuepress/configs/sidebar/data.json`,
        )
        const decoder = new TextDecoder()
        const content = decoder.decode(data)
        let arr = JSON.parse(content)
        mdList.forEach((t) => {
          arr.push(t.replace(/^docs\//, "/"))
        })
        const encoder = new TextEncoder()
        const data2 = encoder.encode(JSON.stringify(arr, null, 2))
        await writeBinaryFile({
          path: `${store.docFolder}/docs/.vuepress/configs/sidebar/data.json`,
          contents: data2,
        })
        if (pushCount.value > 2) {
          // ZlLoading.close()
          return ElMessage.error(
            `提交失败，次数${pushCount.value},请联系管理员`,
          )
        }
        pushCount.value++
        console.log("重新提交")
        confirm()
      }
    } else {
      const pushMessage = await new Command("run-git", [
        "-C",
        store.docFolder,
        "push",
      ]).execute()
      console.log(pushMessage)
      if (
        pushMessage.stderr.indexOf(
          "You are not allowed to push code to protected branches",
        ) > -1
      ) {
        ElMessageBox.alert(
          "文档被设置了保护，当前用户无法进行推送，请联系管理员",
          "提示",
          {
            dangerouslyUseHTMLString: true,
            confirmButtonText: "确定",
            type: "warning",
          },
        )
      } else {
        ElMessage.success("提交成功")
      }
    }
    close()
  } catch (e) {
    console.log(e)
    ElMessage.error("提交失败，请联系管理员")
  }
  // ZlLoading.close()
}
// } else if (pushMessage.stderr) {
// 成功也是 stderr
// ElMessageBox.alert(
//   '推送失败，请确认配置了全局git信息：<br>git config --global user.name "username"<br>git config --global user.email "email"<br>git config --global user.password "password"',
//   '提示',
//   {
//     dangerouslyUseHTMLString: true,
//     confirmButtonText: '确定',
//     type: 'warning'
//   }
// )
const cancel = () => {
  ZlDialogRef.value?.cancel()
}
defineExpose({
  open,
})
</script>

<style>
.el-dialog__body {
  padding-top: 20px;
}
</style>
