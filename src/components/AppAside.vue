<template>
  <el-tree :data="docList"></el-tree>
</template>

<script lang="ts" setup>
import { ref } from "vue"
const docList = ref<any>(null)
</script>

<style lang="scss" scoped></style>
