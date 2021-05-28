<template>
  <div
    text="xl lime-400"
    md="italic"
  >
    XL LIME
  </div>
  <div
    p="x-2 y-1"
    border="2"
    rounded="md"
    font="mono bold"
    hover:bg="gray-400 opacity-10"
    class="grid"
  >
    BOLD MONO
  </div>
  <div class="*app-border">
    app-border
  </div>
  <Foo/>
</template>

<script setup lang="ts">
import Foo from './B.vue'
</script>
