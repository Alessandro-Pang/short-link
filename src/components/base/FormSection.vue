<template>
    <div class="form-section">
        <div v-if="title" class="section-title">{{ title }}</div>
        <div class="section-content">
            <slot />
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    title?: string;
}>();
</script>

<style scoped>
.form-section {
    margin-bottom: 24px;
}

.form-section:last-child {
    margin-bottom: 0;
}

.section-title {
    font-size: 14px;
    font-weight: 600;
    color: #1d2129;
    padding-bottom: 12px;
    margin-bottom: 16px;
    border-bottom: 1px solid #e5e6eb;
}

.section-content {
    display: flex;
    flex-direction: column;
}
</style>
