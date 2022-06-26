<script setup lang='ts'>
import Foo from './Foo.vue'
</script>

<template>
  <nav>
    Windi CSS with Vite
  </nav>
  <div
    class="px-5 p-1 text-white hover:(text-green-100 rounded-full) bg-teal-100 hover:w-1/3"
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
  @apply text-white p-4 w-1/4;
}

@screen md {
  .bar {
    background: red;
  }
}
</style>

<style lang="scss" scoped>
@screen lg {
  .bar {
    background: orange;
  }
}
</style>

<style lang="stylus">
.bar
  @apply bg-pink-500;
</style>
