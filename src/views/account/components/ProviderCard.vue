<template>
    <div class="binding-card">
        <div class="binding-icon" :class="{ 'github': provider === 'github', 'google': provider === 'google' }">
            <template v-if="provider === 'email'">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="M3 7l9 6 9-6" />
                </svg>
            </template>
            <template v-else-if="provider === 'github'">
                <IconGithub :size="24" />
            </template>
            <template v-else-if="provider === 'google'">
                <IconGoogle :size="24" />
            </template>
        </div>
        <div class="binding-info">
            <h3>{{ providerName }}</h3>
            <p v-if="binding">
                已绑定: {{ bindingName }}
                <span class="linked-time">绑定于 {{ formatDate(binding.linkedAt) }}</span>
            </p>
            <p v-else class="not-linked">未绑定</p>
        </div>
        <div class="binding-actions">
            <button
                v-if="!binding"
                class="btn-link"
                :disabled="isLinking"
                @click="emit('link', provider)"
            >
                {{ isLinking ? "绑定中..." : "绑定" }}
            </button>
            <button
                v-else
                class="btn-unlink"
                :disabled="!canUnlink || isUnlinking"
                @click="emit('unlink', provider)"
            >
                {{ isUnlinking ? "解绑中..." : "解绑" }}
            </button>
        </div>
    </div>
</template>

<script setup>
import { computed } from "vue";
import IconGithub from "@/components/icons/IconGithub.vue";
import IconGoogle from "@/components/icons/IconGoogle.vue";
import { formatDate } from "@/utils/date";

const props = defineProps({
	provider: {
		type: String,
		required: true,
		validator: (value) => ["email", "github", "google"].includes(value),
	},
	binding: {
		type: Object,
		default: null,
	},
	canUnlink: {
		type: Boolean,
		default: true,
	},
	isLinking: {
		type: Boolean,
		default: false,
	},
	isUnlinking: {
		type: Boolean,
		default: false,
	},
});

const emit = defineEmits(["link", "unlink"]);

const providerName = computed(() => {
	switch (props.provider) {
		case "email":
			return "邮箱账号";
		case "github":
			return "GitHub 账号";
		case "google":
			return "Google 账号";
		default:
			return "未知账号";
	}
});

const bindingName = computed(() => {
	if (!props.binding) return "";
	if (props.provider === "github") {
		return props.binding.email || props.binding.metadata?.user_name || "GitHub 用户";
	}
	if (props.provider === "google") {
		return props.binding.email || "Google 用户";
	}
	return props.binding.email;
});
</script>

<style scoped>
.binding-card {
    display: flex;
    align-items: center;
    padding: 1.5rem;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: white;
    transition: all 0.2s;
}

.binding-card:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.binding-icon {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f3f4f6;
    color: #6b7280;
    margin-right: 1rem;
    flex-shrink: 0;
}

.binding-icon.github {
    background: #24292e;
    color: white;
}

.binding-icon.google {
    background: white;
    border: 1px solid #e5e7eb;
}

.binding-info {
    flex: 1;
}

.binding-info h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 0.25rem;
}

.binding-info p {
    color: #666;
    font-size: 0.875rem;
}

.not-linked {
    color: #999 !important;
}

.linked-time {
    color: #999;
    font-size: 0.75rem;
    margin-left: 0.5rem;
}

.binding-actions {
    flex-shrink: 0;
}

.btn-link,
.btn-unlink {
    padding: 0.5rem 1.5rem;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    outline: none;
}

.btn-link {
    background: #3b82f6;
    color: white;
}

.btn-link:hover:not(:disabled) {
    background: #2563eb;
}

.btn-unlink {
    background: #f3f4f6;
    color: #6b7280;
}

.btn-unlink:hover:not(:disabled) {
    background: #e5e7eb;
    color: #374151;
}

.btn-link:disabled,
.btn-unlink:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
</style>
