<script setup lang="ts">
defineProps<{
	title: string;
	description?: string;
	modelValue: boolean;
}>();

defineEmits<(e: "update:modelValue", value: boolean) => void>();
</script>

<template>
    <div class="switch-row">
        <div class="switch-content">
            <div class="switch-title">{{ title }}</div>
            <div v-if="description" class="switch-desc">{{ description }}</div>
        </div>
        <div class="switch-action">
            <a-switch
                :model-value="modelValue"
                @update:model-value="
                    (val: boolean) => $emit('update:modelValue', val)
                "
            />
        </div>
    </div>
</template>

<style scoped>
.switch-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    width: 100%;
    padding: 12px 16px;
    background-color: #f7f8fa;
    border-radius: 8px;
    gap: 16px;
}

.switch-content {
    flex: 1;
    min-width: 0;
}

.switch-title {
    font-size: 14px;
    font-weight: 500;
    color: #1d2129;
    margin-bottom: 4px;
}

.switch-desc {
    font-size: 12px;
    color: #86909c;
    line-height: 1.5;
}

.switch-action {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    padding-top: 2px;
}

:deep(.arco-switch) {
    flex-shrink: 0;
}
</style>
