<template>
  <div class="flex justify-between items-center h-full app-header">
    <div class="text-[27px] text-[#2c3e50] font-bold">前端文档</div>
    <div class="flex items-center h-full">
      <el-link href="" target="_blank" class="mr-[10px] leading-[20px]">
        首页
      </el-link>
      <el-dropdown>
        <span class="el-dropdown-link leading-[20px]">
          菜单
          <el-icon class="el-icon--right"><arrow-down /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item>Action 1</el-dropdown-item>
            <el-dropdown-item>Action 2</el-dropdown-item>
            <el-dropdown-item>Action 3</el-dropdown-item>
            <el-dropdown-item>Action 4</el-dropdown-item>
            <el-dropdown-item>Action 5</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ArrowDown } from "@element-plus/icons-vue"
// import { ref } from "vue"
</script>

<style lang="scss" scoped>
.app-header {
  padding: 0 20px;
  border-bottom: solid 1px var(--el-menu-border-color);
}
</style>
