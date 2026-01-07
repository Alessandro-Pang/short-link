<template>
    <div class="min-h-screen flex bg-white dark:bg-gray-900">
        <!-- Left Side - Branding -->
        <div class="hidden lg:flex lg:w-1/2">
            <BrandingSection :title="brandingTitle" :description="brandingDescription" />
        </div>

        <!-- Right Side - Content Slot -->
        <div class="flex-1 flex items-center justify-center p-4 sm:p-12">
            <div class="w-full max-w-md space-y-8">
                <slot />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import BrandingSection from "@/components/base/BrandingSection.vue";

defineProps<{
	brandingTitle: string;
	brandingDescription: string;
}>();
</script>

<style scoped>
.min-h-screen {
    min-height: 100vh;
}

.flex {
    display: flex;
}

.flex-1 {
    flex: 1;
}

.items-center {
    align-items: center;
}

.justify-center {
    justify-content: center;
}


.hidden {
    display: none;
}

.p-4 {
    padding: 16px;
}

.space-y-8 > * + * {
    margin-top: 32px;
}

.w-full {
    width: 100%;
}

.max-w-md {
    max-width: 448px;
}

@media (min-width: 1024px) {
    .lg\:flex {
        display: flex;
    }

    .lg\:w-1\/2 {
        width: 50%;
    }
}

@media (min-width: 640px) {
    .sm\:p-12 {
        padding: 48px;
    }
}
</style>
