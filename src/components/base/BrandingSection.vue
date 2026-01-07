<template>
    <div class="branding-section">
        <!-- Abstract Background Shapes -->
        <div
            class="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none"
        >
            <div
                class="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full bg-white blur-3xl dark:bg-white/20"
            ></div>
            <div
                class="absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full bg-white blur-3xl dark:bg-white/20"
            ></div>
        </div>

        <div class="relative z-10 text-center px-12">
            <div class="mb-8 flex justify-center">
                <div
                    class="w-24 h-24 bg-white/10 dark:bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center p-4"
                >
                    <img
                        src="@/assets/images/logo-simple.svg"
                        alt="Short Link Logo"
                        class="w-full h-full"
                    />
                </div>
            </div>
            <h1 class="text-4xl font-bold text-white mb-6 tracking-tight">
                {{ title }}
            </h1>
            <p class="text-blue-100 text-lg max-w-md mx-auto leading-relaxed">
                {{ description }}
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
	title: string;
	description: string;
}>();
</script>

<style scoped>
.branding-section {
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    position: relative;
    overflow: hidden;
    min-height: 100vh;
}

/* Dark mode: distinct layered slate base with indigo/violet accents */
.dark .branding-section {
    background: linear-gradient(160deg, #0f172a 0%, #1f2937 40%, #111827 100%);
}

.dark .branding-section::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
        radial-gradient(800px circle at 20% 30%, rgba(99, 102, 241, 0.25), transparent 60%),
        radial-gradient(600px circle at 80% 70%, rgba(139, 92, 246, 0.20), transparent 60%);
}

.dark .branding-section::after {
    content: "";
    position: absolute;
    inset: 0;
    opacity: 0.08;
    background-image:
        repeating-linear-gradient(0deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 24px),
        repeating-linear-gradient(90deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 24px);
}

/* Tint existing blur circles without changing template */
.dark .branding-section > .absolute > div:first-child {
    background-color: rgba(99, 102, 241, 0.20);
}

.dark .branding-section > .absolute > div:nth-child(2) {
    background-color: rgba(139, 92, 246, 0.20);
}

/* Slightly stronger logo tile background for dark */
.dark .branding-section .rounded-2xl {
    background-color: rgba(255, 255, 255, 0.20) !important;
}

.absolute {
    position: absolute;
}

.relative {
    position: relative;
}

.top-0 {
    top: 0;
}

.left-0 {
    left: 0;
}

.w-full {
    width: 100%;
}

.h-full {
    height: 100%;
}

.opacity-10 {
    opacity: 0.1;
}

.pointer-events-none {
    pointer-events: none;
}

.w-96 {
    width: 24rem;
}

.h-96 {
    height: 24rem;
}

.rounded-full {
    border-radius: 9999px;
}

.bg-white {
    background-color: white;
}

.blur-3xl {
    filter: blur(64px);
}

.z-10 {
    z-index: 10;
}

.text-center {
    text-align: center;
}

.px-12 {
    padding-left: 48px;
    padding-right: 48px;
}

.mb-8 {
    margin-bottom: 32px;
}

.mb-6 {
    margin-bottom: 24px;
}

.flex {
    display: flex;
}

.justify-center {
    justify-content: center;
}

.items-center {
    align-items: center;
}

.w-20 {
    width: 80px;
}

.h-20 {
    height: 80px;
}

.rounded-2xl {
    border-radius: 16px;
}

.text-5xl {
    font-size: 48px;
}

.text-4xl {
    font-size: 36px;
}

.text-lg {
    font-size: 18px;
}

.text-white {
    color: white;
}

.text-blue-100 {
    color: #dbeafe;
}

.font-bold {
    font-weight: 700;
}

.tracking-tight {
    letter-spacing: -0.025em;
}

.max-w-md {
    max-width: 448px;
}

.mx-auto {
    margin-left: auto;
    margin-right: auto;
}

.leading-relaxed {
    line-height: 1.625;
}
</style>
