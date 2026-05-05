<template>
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        <HomeHeader />
        
        <!-- Main Content -->
        <main class="flex-1 w-full">
            <div class="mx-auto w-full max-w-7xl px-4 sm:px-6 py-10 sm:py-14">
                <div
                    class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start"
                >
                    <HeroSection class="lg:col-span-7" />
                    <EnterpriseSidebar class="lg:col-span-5" />
                </div>

                <FeatureCards />
            </div>
        </main>

        <HomeFooter />
    </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useUserStore } from "@/stores";
import EnterpriseSidebar from "./components/EnterpriseSidebar.vue";
import FeatureCards from "./components/FeatureCards.vue";
import HeroSection from "./components/HeroSection.vue";
import HomeFooter from "./components/HomeFooter.vue";
import HomeHeader from "./components/HomeHeader.vue";

const userStore = useUserStore();

onMounted(async () => {
    // 初始化用户状态（使用缓存，避免重复请求）
    await userStore.initialize();
});
</script>
