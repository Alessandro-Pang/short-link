<template>
    <div class="space-y-6">
        <!-- Stats Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div
                class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
                <div class="flex items-center justify-between mb-4">
                    <span class="text-gray-500 text-sm">总链接数</span>
                    <div class="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <icon-link />
                    </div>
                </div>
                <div class="text-2xl font-bold text-gray-900">
                    {{ linksStore.formattedStats.total_links }}
                </div>
                <div class="mt-2 text-xs text-green-600 flex items-center">
                    <icon-arrow-rise class="mr-1" />
                    <span>持续增长中</span>
                </div>
            </div>

            <div
                class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
                <div class="flex items-center justify-between mb-4">
                    <span class="text-gray-500 text-sm">总点击数</span>
                    <div class="p-2 bg-orange-50 rounded-lg text-orange-600">
                        <icon-thunderbolt />
                    </div>
                </div>
                <div class="text-2xl font-bold text-gray-900">
                    {{ linksStore.formattedStats.total_clicks }}
                </div>
                <div class="mt-2 text-xs text-gray-400">累计所有链接点击</div>
            </div>

            <div
                class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
                <div class="flex items-center justify-between mb-4">
                    <span class="text-gray-500 text-sm">本周新增</span>
                    <div class="p-2 bg-green-50 rounded-lg text-green-600">
                        <icon-plus-circle />
                    </div>
                </div>
                <div class="text-2xl font-bold text-gray-900">
                    {{ linksStore.formattedStats.weekly_new_links }}
                </div>
                <div class="mt-2 text-xs text-gray-400">最近7天创建</div>
            </div>

            <div
                class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
                <div class="flex items-center justify-between mb-4">
                    <span class="text-gray-500 text-sm">平均点击</span>
                    <div class="p-2 bg-purple-50 rounded-lg text-purple-600">
                        <icon-bar-chart />
                    </div>
                </div>
                <div class="text-2xl font-bold text-gray-900">
                    {{ linksStore.formattedStats.avg_clicks_per_link }}
                </div>
                <div class="mt-2 text-xs text-gray-400">每条链接平均点击</div>
            </div>
        </div>

        <!-- Recent Links Preview -->
        <div
            class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
        >
            <div
                class="px-6 py-4 border-b border-gray-100 flex justify-between items-center"
            >
                <h3 class="font-semibold text-gray-800">最近创建</h3>
                <a-link @click="goToLinks" class="text-sm">查看全部</a-link>
            </div>
            <a-spin :loading="linksStore.isLoading" class="w-full">
                <a-table
                    :data="linksStore.recentLinks"
                    :pagination="false"
                    :bordered="false"
                    :hoverable="true"
                >
                    <template #columns>
                        <a-table-column
                            title="原始链接"
                            data-index="link"
                            ellipsis
                            tooltip
                        >
                            <template #cell="{ record }">
                                <div class="flex items-center gap-2">
                                    <div
                                        class="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-500 shrink-0"
                                    >
                                        <icon-link />
                                    </div>
                                    <span class="truncate text-gray-600">{{
                                        record.link
                                    }}</span>
                                </div>
                            </template>
                        </a-table-column>
                        <a-table-column title="短链接" data-index="short">
                            <template #cell="{ record }">
                                <a-link
                                    :href="`${origin}/u/${record.short}`"
                                    target="_blank"
                                    class="font-medium text-blue-600"
                                    >{{ origin }}/u/{{ record.short }}</a-link
                                >
                            </template>
                        </a-table-column>
                        <a-table-column
                            title="点击数"
                            data-index="click_count"
                            align="right"
                        >
                            <template #cell="{ record }">
                                <span class="font-mono text-gray-700">{{
                                    record.click_count
                                }}</span>
                            </template>
                        </a-table-column>
                        <a-table-column
                            title="创建时间"
                            data-index="created_at"
                            align="right"
                        >
                            <template #cell="{ record }">
                                <span class="text-gray-400 text-sm">{{
                                    formatDate(record.created_at)
                                }}</span>
                            </template>
                        </a-table-column>
                    </template>
                </a-table>
            </a-spin>
        </div>
    </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import {
    IconLink,
    IconThunderbolt,
    IconPlusCircle,
    IconBarChart,
    IconArrowRise,
} from "@arco-design/web-vue/es/icon";
import { useLinksStore } from "@/stores";

const router = useRouter();
const origin = window.location.origin;

// Store
const linksStore = useLinksStore();

// Methods
const loadData = async () => {
    // 并行请求统计和链接数据
    await Promise.all([
        linksStore.fetchStats(),
        linksStore.fetchLinks({
            limit: 5,
            orderBy: "created_at",
            ascending: false,
        }),
    ]);
};

const goToLinks = () => {
    router.push("/dashboard/links");
};

const formatDate = (dateString) => {
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

// 暴露刷新方法给父组件
defineExpose({
    refresh: loadData,
});

onMounted(() => {
    loadData();
});
</script>
