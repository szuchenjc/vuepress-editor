<template>
  <div class="flex">
    <el-link href="" target="_blank" class="mr-[10px]">首页</el-link>
    <el-dropdown>
      <span class="el-dropdown-link">
        Dropdown List
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
</template>

<script lang="ts" setup>
import { ArrowDown } from "@element-plus/icons-vue"
// import { ref } from "vue"
</script>

<style lang="scss" scoped></style>
