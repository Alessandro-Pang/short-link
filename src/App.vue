<template>
    <div class="app-container">
        <router-view />
    </div>
</template>

<script setup>
// App.vue - 应用程序根组件
</script>

<style>
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family:
        "pingfang SC", "helvetica neue", arial, "hiragino sans gb",
        "microsoft yahei ui", "microsoft yahei", simsun, sans-serif;
    color: #333;
    min-height: 100vh;
    margin: 0;
}

.app-container {
    min-height: 100%;
    width: 100%;
}
</style>
