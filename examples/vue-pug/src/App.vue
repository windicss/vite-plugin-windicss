<script setup lang='ts'>
import Foo from './Foo.vue'
// import InvalidPug from './InvalidPug_vue'
</script>

<template lang="pug">
div
  nav Windi CSS with Vite
  .px-5.p-1.text-white.bg-green-500 Hello World
  h2.btn Button
  .bar Bar
  Foo
  InvalidPug
  router-link
  .bg-black.bg-blue-200.bg-red-200 Without ! (red)
  .bg-black.bg-red-200(class="!bg-blue-200")
    | With ! (blue)
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
