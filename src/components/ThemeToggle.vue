<template>
    <a-tooltip :content="isDarkTheme ? '切换到浅色模式' : '切换到深色模式'">
        <a-button
            type="text"
            shape="circle"
            size="medium"
            @click="handleToggleTheme"
            class="theme-toggle-button"
        >
            <template #icon>
                <icon-moon-fill v-if="!isDarkTheme" class="text-lg" />
                <icon-sun-fill v-else class="text-lg" />
            </template>
        </a-button>
    </a-tooltip>
</template>

<script setup>
import { computed } from "vue";
import { IconMoonFill, IconSunFill } from "@arco-design/web-vue/es/icon";
import { useUiStore } from "@/stores/ui";

const uiStore = useUiStore();

// 是否为暗色主题
const isDarkTheme = computed(() => uiStore.isDarkTheme);

// 切换主题
const handleToggleTheme = () => {
    uiStore.toggleTheme();
};
</script>

<style scoped>
.theme-toggle-button {
    transition: all 0.3s ease;
}

.theme-toggle-button:hover {
    transform: rotate(15deg);
}
</style>
