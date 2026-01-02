<script setup>
import { ref, onMounted, computed } from "vue";
import { Message } from "@arco-design/web-vue";
import {
    IconRefresh,
    IconFilter,
    IconSearch,
    IconCheckCircle,
    IconCloseCircle,
    IconUser,
    IconCalendar,
    IconComputer,
    IconLocation,
} from "@arco-design/web-vue/es/icon";
import { getAllLoginLogs, getLoginStats } from "@/services/admin";

// State
const isLoading = ref(false);
const logs = ref([]);
const stats = ref(null);
const pagination = ref({
    current: 1,
    pageSize: 20,
});
const total = ref(0);

// 筛选条件
const filters = ref({
    userId: null,
    success: null,
    startDate: null,
    endDate: null,
});

const showFilters = ref(false);

// 加载登录日志
const loadLogs = async () => {
    isLoading.value = true;
    try {
        const result = await getAllLoginLogs({
            limit: pagination.value.pageSize,
            offset: (pagination.value.current - 1) * pagination.value.pageSize,
            ...filters.value,
        });

        logs.value = result.logs || [];
        total.value = result.total || 0;
    } catch (error) {
        console.error("加载登录日志失败:", error);
        Message.error(error.message || "加载登录日志失败");
    } finally {
        isLoading.value = false;
    }
};

// 加载统计数据
const loadStats = async () => {
    try {
        const result = await getLoginStats();
        stats.value = result;
    } catch (error) {
        console.error("加载统计数据失败:", error);
    }
};

// 格式化日期
const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
};

// 应用筛选
const applyFilters = () => {
    pagination.value.current = 1;
    loadLogs();
};

// 重置筛选
const resetFilters = () => {
    filters.value = {
        userId: null,
        success: null,
        startDate: null,
        endDate: null,
    };
    pagination.value.current = 1;
    loadLogs();
};

// 分页
const handlePageChange = (page) => {
    pagination.value.current = page;
    loadLogs();
};

// 获取登录方法文本
const getLoginMethodText = (method) => {
    const methods = {
        email: "邮箱登录",
        github: "GitHub",
        google: "Google",
    };
    return methods[method] || method;
};

// 成功率计算
const successRate = computed(() => {
    if (!stats.value || stats.value.total === 0) return 0;
    return ((stats.value.successful / stats.value.total) * 100).toFixed(1);
});

onMounted(() => {
    loadLogs();
    loadStats();
});

// 暴露刷新方法
defineExpose({
    refresh: () => {
        loadLogs();
        loadStats();
    },
});
</script>

<template>
    <div class="space-y-6">
        <!-- 统计卡片 -->
        <div
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            v-if="stats"
        >
            <div
                class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
            >
                <div class="flex items-center justify-between">
                    <div>
                        <p
                            class="text-gray-500 dark:text-gray-400 text-sm mb-1"
                        >
                            总登录次数
                        </p>
                        <p
                            class="text-2xl font-bold text-gray-800 dark:text-gray-200"
                        >
                            {{ stats.total }}
                        </p>
                    </div>
                    <div
                        class="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center"
                    >
                        <icon-user class="text-2xl text-blue-500" />
                    </div>
                </div>
            </div>

            <div
                class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
            >
                <div class="flex items-center justify-between">
                    <div>
                        <p
                            class="text-gray-500 dark:text-gray-400 text-sm mb-1"
                        >
                            成功登录
                        </p>
                        <p class="text-2xl font-bold text-green-600">
                            {{ stats.successful }}
                        </p>
                        <p class="text-xs text-gray-400 mt-1">
                            成功率 {{ successRate }}%
                        </p>
                    </div>
                    <div
                        class="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center"
                    >
                        <icon-check-circle class="text-2xl text-green-500" />
                    </div>
                </div>
            </div>

            <div
                class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
            >
                <div class="flex items-center justify-between">
                    <div>
                        <p
                            class="text-gray-500 dark:text-gray-400 text-sm mb-1"
                        >
                            失败登录
                        </p>
                        <p class="text-2xl font-bold text-red-600">
                            {{ stats.failed }}
                        </p>
                    </div>
                    <div
                        class="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center"
                    >
                        <icon-close-circle class="text-2xl text-red-500" />
                    </div>
                </div>
            </div>

            <div
                class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
            >
                <div class="flex items-center justify-between">
                    <div>
                        <p
                            class="text-gray-500 dark:text-gray-400 text-sm mb-1"
                        >
                            24小时内登录
                        </p>
                        <p class="text-2xl font-bold text-purple-600">
                            {{ stats.last24h }}
                        </p>
                    </div>
                    <div
                        class="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center"
                    >
                        <icon-calendar class="text-2xl text-purple-500" />
                    </div>
                </div>
            </div>
        </div>

        <!-- 日志列表 -->
        <div
            class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-orange-100 dark:border-gray-700 overflow-hidden pb-4"
        >
            <div
                class="px-6 py-4 border-b border-orange-100 dark:border-orange-900/30 flex justify-between items-center bg-orange-50 dark:bg-gray-800"
            >
                <div class="flex items-center gap-2">
                    <h3
                        class="text-lg font-semibold text-gray-800 dark:text-gray-200"
                    >
                        登录日志
                    </h3>
                    <a-tag color="orange">{{ total }} 条记录</a-tag>
                </div>
                <div class="flex gap-2">
                    <a-button
                        type="outline"
                        @click="showFilters = !showFilters"
                        :class="{ 'bg-orange-50': showFilters }"
                    >
                        <template #icon><icon-filter /></template>
                        筛选
                    </a-button>
                    <a-button
                        type="outline"
                        @click="
                            loadLogs();
                            loadStats();
                        "
                    >
                        <template #icon><icon-refresh /></template>
                        刷新
                    </a-button>
                </div>
            </div>

            <!-- 筛选条件 -->
            <div
                v-if="showFilters"
                class="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700"
            >
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <a-input
                        v-model="filters.userId"
                        placeholder="用户 ID"
                        allow-clear
                    />
                    <a-select
                        v-model="filters.success"
                        placeholder="登录状态"
                        allow-clear
                    >
                        <a-option :value="true">成功</a-option>
                        <a-option :value="false">失败</a-option>
                    </a-select>
                    <a-date-picker
                        v-model="filters.startDate"
                        placeholder="开始日期"
                        show-time
                        allow-clear
                    />
                    <a-date-picker
                        v-model="filters.endDate"
                        placeholder="结束日期"
                        show-time
                        allow-clear
                    />
                </div>
                <div class="flex gap-2 mt-4">
                    <a-button type="primary" @click="applyFilters">
                        <template #icon><icon-search /></template>
                        应用筛选
                    </a-button>
                    <a-button @click="resetFilters">重置</a-button>
                </div>
            </div>

            <a-spin :loading="isLoading" class="w-full">
                <a-table
                    :data="logs"
                    :pagination="{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: total,
                        showTotal: true,
                        showJumper: true,
                    }"
                    :bordered="{ wrapper: false, cell: false }"
                    :hoverable="true"
                    @page-change="handlePageChange"
                    :scroll="{ maxHeight: 'calc(100vh - 450px)' }"
                >
                    <template #columns>
                        <a-table-column
                            title="登录状态"
                            data-index="success"
                            :width="100"
                            align="center"
                        >
                            <template #cell="{ record }">
                                <a-tag
                                    :color="record.success ? 'green' : 'red'"
                                    size="small"
                                >
                                    <template #icon>
                                        <icon-check-circle
                                            v-if="record.success"
                                        />
                                        <icon-close-circle v-else />
                                    </template>
                                    {{ record.success ? "成功" : "失败" }}
                                </a-tag>
                            </template>
                        </a-table-column>

                        <a-table-column
                            title="用户信息"
                            data-index="email"
                            :width="280"
                        >
                            <template #cell="{ record }">
                                <div class="flex flex-col gap-1">
                                    <span
                                        class="text-gray-800 dark:text-gray-200 font-medium"
                                        >{{ record.email }}</span
                                    >
                                    <a-typography-text
                                        copyable
                                        :copy-text="record.user_id"
                                        class="text-xs text-gray-400 font-mono"
                                    >
                                        {{
                                            record.user_id?.substring(0, 20)
                                        }}...
                                    </a-typography-text>
                                </div>
                            </template>
                        </a-table-column>

                        <a-table-column
                            title="登录方式"
                            data-index="login_method"
                            :width="120"
                        >
                            <template #cell="{ record }">
                                <a-tag size="small" color="arcoblue">
                                    {{
                                        getLoginMethodText(record.login_method)
                                    }}
                                </a-tag>
                            </template>
                        </a-table-column>

                        <a-table-column
                            title="IP 地址"
                            data-index="ip_address"
                            :width="150"
                        >
                            <template #cell="{ record }">
                                <span
                                    class="text-gray-600 font-mono text-sm flex items-center gap-1"
                                >
                                    <icon-location class="text-xs" />
                                    {{ record.ip_address || "-" }}
                                </span>
                            </template>
                        </a-table-column>

                        <a-table-column
                            title="设备信息"
                            data-index="user_agent"
                            :width="200"
                        >
                            <template #cell="{ record }">
                                <a-tooltip :content="record.user_agent">
                                    <span
                                        class="text-gray-500 dark:text-gray-400 text-sm truncate flex items-center gap-1"
                                    >
                                        <icon-computer
                                            class="text-xs shrink-0"
                                        />
                                        <span class="truncate">
                                            {{
                                                record.user_agent?.substring(
                                                    0,
                                                    30,
                                                )
                                            }}...
                                        </span>
                                    </span>
                                </a-tooltip>
                            </template>
                        </a-table-column>

                        <a-table-column
                            title="失败原因"
                            data-index="failure_reason"
                            :width="200"
                        >
                            <template #cell="{ record }">
                                <span
                                    v-if="!record.success"
                                    class="text-red-500 text-sm"
                                >
                                    {{ record.failure_reason || "-" }}
                                </span>
                                <span v-else class="text-gray-400 text-sm"
                                    >-</span
                                >
                            </template>
                        </a-table-column>

                        <a-table-column
                            title="登录时间"
                            data-index="login_at"
                            :width="190"
                        >
                            <template #cell="{ record }">
                                <span
                                    class="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-1"
                                >
                                    <icon-calendar class="text-xs" />
                                    {{ formatDate(record.login_at) }}
                                </span>
                            </template>
                        </a-table-column>
                    </template>

                    <template #empty>
                        <div class="py-8 text-center text-gray-400">
                            <div class="text-4xl mb-2">📝</div>
                            <div>暂无登录日志</div>
                        </div>
                    </template>
                </a-table>
            </a-spin>
        </div>
    </div>
</template>

<style scoped>
::v-deep(.arco-table-pagination) {
    margin-right: 10px;
}
</style>
