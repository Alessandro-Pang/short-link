<template>
    <div class="app-container">
        <router-view />
    </div>
</template>

<script setup>
// App.vue - 应用程序根组件
</script>

<style>
/*
  这里不要做全局 reset（例如 * { margin/padding }、box-sizing、body 字体等），
  避免与 Tailwind 的 Preflight/Utilities 以及 Arco 的全局样式发生冲突，
  导致组件间距、字体、行高等出现“错乱”。
*/

.app-container {
    min-height: 100%;
    width: 100%;
}
</style>
