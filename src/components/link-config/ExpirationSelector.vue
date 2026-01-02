<template>
    <div class="flex flex-col">
        <div>
            <a-radio-group
                v-model="localMode"
                type="button"
                class="w-full mb-2"
            >
                <a-radio value="preset">预设选项</a-radio>
                <a-radio value="custom">自定义时间</a-radio>
                <a-radio value="none">不限制</a-radio>
            </a-radio-group>
        </div>
        <div>
            <a-select
                v-if="localMode === 'preset'"
                v-model="localOptionId"
                placeholder="选择有效期"
                allow-clear
                class="w-full mt-2"
            >
                <a-option
                    v-for="option in expirationOptions"
                    :key="option.id"
                    :value="option.id"
                >
                    {{ option.name }}
                </a-option>
            </a-select>

            <a-date-picker
                v-else-if="localMode === 'custom'"
                v-model="localDate"
                show-time
                format="YYYY-MM-DD HH:mm:ss"
                placeholder="选择过期时间"
                class="w-full mt-2"
                :disabled-date="(current) => current < new Date()"
            />

            <div v-if="localMode === 'none'" class="text-xs text-gray-400 mt-2">
                链接将永久有效
            </div>

            <div v-if="localDate && !isNew" class="mt-2 text-sm">
                <span class="text-gray-500">当前过期时间：</span>
                <span :class="isExpired ? 'text-red-500' : 'text-green-600'">
                    {{ formatDate(localDate) }}
                    <a-tag
                        v-if="isExpired"
                        color="red"
                        size="small"
                        class="ml-2"
                        >已过期</a-tag
                    >
                </span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { formatDate } from "@/utils/date";

const props = defineProps<{
    expirationMode: "preset" | "custom" | "none";
    expirationOptionId: number | null;
    expirationDate: string | null;
    expirationOptions: any[];
    isNew: boolean;
    isExpired: boolean;
}>();

const emit = defineEmits<{
    (e: "update:expirationMode", value: "preset" | "custom" | "none"): void;
    (e: "update:expirationOptionId", value: number | null): void;
    (e: "update:expirationDate", value: string | null): void;
}>();

// 使用计算属性实现 v-model
const localMode = computed({
    get: () => props.expirationMode,
    set: (val) => {
        emit("update:expirationMode", val);
        // 切换模式时清空对应字段
        if (val === "preset") {
            emit("update:expirationDate", null);
        } else if (val === "custom") {
            emit("update:expirationOptionId", null);
        } else {
            emit("update:expirationOptionId", null);
            emit("update:expirationDate", null);
        }
    },
});

const localOptionId = computed({
    get: () => props.expirationOptionId,
    set: (val) => emit("update:expirationOptionId", val),
});

const localDate = computed({
    get: () => props.expirationDate,
    set: (val) => emit("update:expirationDate", val),
});
</script>
