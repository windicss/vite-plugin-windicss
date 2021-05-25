<script setup lang="ts">
import { ref } from 'vue'

const foo = ref(false)
</script>

<template>
  <div
    w:text="xl lime-400"
    w:md="italic"
  >
    XL LIME
  </div>
  <div
    w:p="x-2 y-1"
    w:border="2"
    w:rounded="md"
    w:font="mono bold"
    w:hover:bg="gray-400 opacity-10"
    :w:bg="foo ? 'gray-200' : 'orange-400'"
    class="grid"
    @click="foo = !foo"
  >
    BOLD MONO
  </div>
  <div class="*app-border">
    app-border
  </div>
</template>
