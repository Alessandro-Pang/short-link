<template>
    <div class="space-y-6">
        <!-- Admin Stats Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div
                class="bg-white p-6 rounded-xl shadow-sm border border-orange-100 hover:shadow-md transition-shadow"
            >
                <div class="flex items-center justify-between mb-4">
                    <span class="text-gray-500 text-sm">全站链接数</span>
                    <div class="p-2 bg-orange-50 rounded-lg text-orange-600">
                        <icon-link />
                    </div>
                </div>
                <div class="text-2xl font-bold text-gray-900">
                    {{ stats.total_links }}
                </div>
                <div class="mt-2 text-xs text-gray-400">
                    包含所有用户创建的链接
                </div>
            </div>

            <div
                class="bg-white p-6 rounded-xl shadow-sm border border-orange-100 hover:shadow-md transition-shadow"
            >
                <div class="flex items-center justify-between mb-4">
                    <span class="text-gray-500 text-sm">全站点击数</span>
                    <div class="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <icon-thunderbolt />
                    </div>
                </div>
                <div class="text-2xl font-bold text-gray-900">
                    {{ stats.total_clicks }}
                </div>
                <div class="mt-2 text-xs text-gray-400">累计所有链接点击</div>
            </div>

            <div
                class="bg-white p-6 rounded-xl shadow-sm border border-orange-100 hover:shadow-md transition-shadow"
            >
                <div class="flex items-center justify-between mb-4">
                    <span class="text-gray-500 text-sm">本周新增链接</span>
                    <div class="p-2 bg-green-50 rounded-lg text-green-600">
                        <icon-plus-circle />
                    </div>
                </div>
                <div class="text-2xl font-bold text-gray-900">
                    {{ stats.weekly_new_links }}
                </div>
                <div class="mt-2 text-xs text-gray-400">最近7天创建</div>
            </div>

            <div
                class="bg-white p-6 rounded-xl shadow-sm border border-orange-100 hover:shadow-md transition-shadow"
            >
                <div class="flex items-center justify-between mb-4">
                    <span class="text-gray-500 text-sm">注册用户数</span>
                    <div class="p-2 bg-purple-50 rounded-lg text-purple-600">
                        <icon-user-group />
                    </div>
                </div>
                <div class="text-2xl font-bold text-gray-900">
                    {{ stats.total_users }}
                </div>
                <div class="mt-2 text-xs text-gray-400">已创建链接的用户</div>
            </div>

            <div
                class="bg-white p-6 rounded-xl shadow-sm border border-orange-100 hover:shadow-md transition-shadow"
            >
                <div class="flex items-center justify-between mb-4">
                    <span class="text-gray-500 text-sm">匿名链接数</span>
                    <div class="p-2 bg-gray-100 rounded-lg text-gray-600">
                        <icon-eye-invisible />
                    </div>
                </div>
                <div class="text-2xl font-bold text-gray-900">
                    {{ stats.anonymous_links }}
                </div>
                <div class="mt-2 text-xs text-gray-400">未登录用户创建</div>
            </div>

            <div
                class="bg-white p-6 rounded-xl shadow-sm border border-orange-100 hover:shadow-md transition-shadow"
            >
                <div class="flex items-center justify-between mb-4">
                    <span class="text-gray-500 text-sm">平均点击</span>
                    <div class="p-2 bg-cyan-50 rounded-lg text-cyan-600">
                        <icon-bar-chart />
                    </div>
                </div>
                <div class="text-2xl font-bold text-gray-900">
                    {{ stats.avg_clicks_per_link }}
                </div>
                <div class="mt-2 text-xs text-gray-400">每条链接平均点击</div>
            </div>
        </div>

        <!-- Recent Links Preview -->
        <div
            class="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden"
        >
            <div
                class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-orange-50"
            >
                <h3 class="font-semibold text-gray-800 flex items-center gap-2">
                    <icon-history class="text-orange-500" />
                    最近创建的链接
                </h3>
                <a-link @click="goToAllLinks" class="text-sm text-orange-600"
                    >查看全部</a-link
                >
            </div>
            <a-spin :loading="isLoading" class="w-full">
                <a-table
                    :data="recentLinks"
                    :pagination="false"
                    :bordered="false"
                    :hoverable="true"
                >
                    <template #columns>
                        <a-table-column title="创建者" data-index="user_id">
                            <template #cell="{ record }">
                                <a-tag
                                    v-if="record.user_id"
                                    size="small"
                                    color="arcoblue"
                                >
                                    用户
                                </a-tag>
                                <a-tag v-else size="small" color="gray">
                                    匿名
                                </a-tag>
                            </template>
                        </a-table-column>
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
                            title="状态"
                            data-index="is_active"
                            align="center"
                        >
                            <template #cell="{ record }">
                                <a-tag
                                    :color="record.is_active ? 'green' : 'red'"
                                    size="small"
                                >
                                    {{ record.is_active ? "启用" : "禁用" }}
                                </a-tag>
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
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
    IconLink,
    IconThunderbolt,
    IconPlusCircle,
    IconBarChart,
    IconUserGroup,
    IconEyeInvisible,
    IconHistory,
} from "@arco-design/web-vue/es/icon";
import { getGlobalStats, getAllLinks } from "@/services/admin.js";

const router = useRouter();
const origin = window.location.origin;

// State
const isLoading = ref(false);
const stats = ref({
    total_links: 0,
    total_clicks: 0,
    weekly_new_links: 0,
    avg_clicks_per_link: 0,
    total_users: 0,
    anonymous_links: 0,
});
const recentLinks = ref([]);

// Methods
const loadData = async () => {
    isLoading.value = true;
    try {
        // 并行请求统计和链接数据
        const [statsData, linksData] = await Promise.all([
            getGlobalStats(),
            getAllLinks({ limit: 10, orderBy: "created_at", ascending: false }),
        ]);

        stats.value = {
            total_links: statsData.total_links || 0,
            total_clicks: statsData.total_clicks || 0,
            weekly_new_links: statsData.weekly_new_links || 0,
            avg_clicks_per_link: parseFloat(
                statsData.avg_clicks_per_link || 0,
            ).toFixed(1),
            total_users: statsData.total_users || 0,
            anonymous_links: statsData.anonymous_links || 0,
        };

        recentLinks.value = linksData.links || [];
    } catch (error) {
        console.error("加载全局统计数据失败:", error);
    } finally {
        isLoading.value = false;
    }
};

const goToAllLinks = () => {
    router.push("/dashboard/admin/links");
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
