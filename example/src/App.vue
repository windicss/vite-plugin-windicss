<script setup lang='ts'>
import Foo from './Foo.vue'
</script>

<template>
  <div
    class="px-5 p-1 text-white hover:(text-green-100 rounded-full)"
    :class="{ 'bg-teal-100': true, 'hover:w-1/3': true }"
  >
    Hello World
  </div>
  <h2 class="button">
    Button
  </h2>
  <div class="foo">
    foo
  </div>
  <Foo />
  <router-link />
</template>

<style lang="postcss">
.foo {
  @apply rounded-full bg-pink-400 text-white p-4 w-1/4;
}
</style>
