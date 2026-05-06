<template>
    <div class="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
            class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-300 hover:-translate-y-1"
        >
            <div
                class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 text-2xl mb-4"
            >
                <icon-dashboard />
            </div>
            <h3
                class="font-bold text-gray-800 dark:text-gray-200 text-lg mb-2"
            >
                链接管理
            </h3>
            <p
                class="text-gray-500 dark:text-gray-400 text-sm leading-relaxed"
            >
                登录后可查看和管理所有生成的短链接历史，随时修改或删除。
            </p>
        </div>
        <div
            class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-300 hover:-translate-y-1"
        >
            <div
                class="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400 text-2xl mb-4"
            >
                <icon-bar-chart />
            </div>
            <h3
                class="font-bold text-gray-800 dark:text-gray-200 text-lg mb-2"
            >
                访问统计
            </h3>
            <p
                class="text-gray-500 dark:text-gray-400 text-sm leading-relaxed"
            >
                实时监控链接访问数据，包括点击量、来源、设备等详细分析。
            </p>
        </div>
        <div
            class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-300 hover:-translate-y-1"
        >
            <div
                class="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center text-orange-600 dark:text-orange-400 text-2xl mb-4"
            >
                <icon-clock-circle />
            </div>
            <h3
                class="font-bold text-gray-800 dark:text-gray-200 text-lg mb-2"
            >
                有效期设置
            </h3>
            <p
                class="text-gray-500 dark:text-gray-400 text-sm leading-relaxed"
            >
                自定义短链接失效时间，灵活控制访问权限，过期自动失效。
            </p>
        </div>
    </div>
</template>

<script setup>
import { IconBarChart, IconClockCircle, IconDashboard } from "@arco-design/web-vue/es/icon";
</script>
