<template>
    <div class="social-auth-buttons">
        <div class="grid grid-cols-2 gap-4">
            <button
                type="button"
                class="social-button"
                @click="handleGithubLogin"
                :disabled="loading"
            >
                <icon-github class="text-xl" />
                <span class="text-gray-700 font-medium">GitHub</span>
            </button>
            <button
                type="button"
                class="social-button"
                @click="handleGoogleLogin"
                :disabled="loading"
            >
                <icon-google class="text-xl" />
                <span class="text-gray-700 font-medium">Google</span>
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { IconGithub, IconGoogle } from "@arco-design/web-vue/es/icon";

defineProps<{
    loading?: boolean;
}>();

const emit = defineEmits<{
    (e: 'github-login'): void;
    (e: 'google-login'): void;
}>();

const handleGithubLogin = () => {
    emit('github-login');
};

const handleGoogleLogin = () => {
    emit('google-login');
};
</script>

<style scoped>
.social-auth-buttons {
    width: 100%;
}

.grid {
    display: grid;
}

.grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
}

.gap-4 {
    gap: 16px;
}

.social-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 16px;
    border: 1px solid #e5e6eb;
    border-radius: 8px;
    background-color: white;
    cursor: pointer;
    transition: all 0.2s;
}

.social-button:hover:not(:disabled) {
    background-color: #f7f8fa;
}

.social-button:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(var(--primary-6), 0.2);
}

.social-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.text-xl {
    font-size: 20px;
}

.text-gray-700 {
    color: #4e5969;
}

.font-medium {
    font-weight: 500;
}
</style>
