<template>
    <div class="flex flex-col">
        <div>
            <a-radio-group
                v-model="expirationMode"
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
                v-if="expirationMode === 'preset'"
                v-model="localExpirationOptionId"
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
                v-else-if="expirationMode === 'custom'"
                v-model="localExpirationDate"
                show-time
                format="YYYY-MM-DD HH:mm:ss"
                placeholder="选择过期时间"
                class="w-full mt-2"
                :disabled-date="(current) => current < new Date()"
            />

            <div
                v-if="expirationMode === 'none'"
                class="text-xs text-gray-400 mt-2"
            >
                链接将永久有效
            </div>

            <div v-if="localExpirationDate && !isNew" class="mt-2 text-sm">
                <span class="text-gray-500">当前过期时间：</span>
                <span :class="isExpired ? 'text-red-500' : 'text-green-600'">
                    {{ formatDate(localExpirationDate) }}
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
import { ref, watch, nextTick } from "vue";

const props = defineProps<{
    modelValue: any;
    expirationOptions: any[];
    isNew: boolean;
    isExpired: boolean;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: any): void;
}>();

const isUpdating = ref(false);

// 有效期模式
const expirationMode = ref<"preset" | "custom" | "none">("none");
const localExpirationOptionId = ref<number | null>(null);
const localExpirationDate = ref<string | null>(null);

// 初始化本地值
const initLocalValues = (val: any) => {
    if (!val) return;

    localExpirationOptionId.value = val.expiration_option_id || null;
    localExpirationDate.value = val.expiration_date || null;

    // 设置模式
    if (val.expiration_date) {
        expirationMode.value = "custom";
    } else if (val.expiration_option_id) {
        expirationMode.value = "preset";
    } else {
        expirationMode.value = "none";
    }
};

// 监听 modelValue 变化，初始化本地值
watch(
    () => props.modelValue,
    (newVal) => {
        if (isUpdating.value) return;

        isUpdating.value = true;
        initLocalValues(newVal);
    },
    { immediate: true, deep: true },
);

// 监听有效期模式变化
watch(expirationMode, (newMode) => {
    if (isUpdating.value) return;

    if (newMode === "preset") {
        localExpirationDate.value = null;
    } else if (newMode === "custom") {
        localExpirationOptionId.value = null;
    } else {
        localExpirationOptionId.value = null;
        localExpirationDate.value = null;
    }
    updateParent();
});

// 监听本地值变化
watch(localExpirationOptionId, () => {
    if (!isUpdating.value) {
        updateParent();
    }
});

watch(localExpirationDate, () => {
    if (!isUpdating.value) {
        updateParent();
    }
});

// 更新父组件
const updateParent = () => {
    if (isUpdating.value) return;

    const updated = {
        ...props.modelValue,
        expirationMode: expirationMode.value,
        expiration_option_id: localExpirationOptionId.value,
        expiration_date: localExpirationDate.value,
    };
    emit("update:modelValue", updated);
};

const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
};
</script>
