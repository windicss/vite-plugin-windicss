<script setup lang='ts'>
import Foo from './Foo.vue'
</script>

<template>
  <nav>
    Windi CSS with Vite
  </nav>
  <div
    class="px-5 p-1 text-white hover:(text-green-100 rounded-full)"
    :class="{ 'bg-teal-100': true, 'hover:w-1/3': true }"
  >
    Hello World
  </div>
  <h2 class="btn">
    Button
  </h2>
  <div class="bar">
    Bar
  </div>
  <Foo />
  <router-link />

  <div class="bg-black bg-blue-200 bg-red-200">
    Without ! (red)
  </div>
  <div class="bg-black !bg-blue-200 bg-red-200">
    With ! (blue)
  </div>
</template>

<style lang="postcss" scoped>
.bar {
  @apply bg-pink-400 text-white p-4 w-1/4;
}

@screen md {
  .bar {
    background: red;
  }
}
</style>
