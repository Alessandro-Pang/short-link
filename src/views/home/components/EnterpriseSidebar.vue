<template>
    <aside>
        <div
            class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm p-6 sm:p-8"
        >
            <div class="flex items-start justify-between gap-3">
                <div>
                    <div
                        class="text-sm text-gray-500 dark:text-gray-400"
                    >
                        企业级能力
                    </div>
                    <div
                        class="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight"
                    >
                        更稳定、更可控的短链平台
                    </div>
                </div>
                <div
                    class="hidden sm:flex items-center rounded-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-1 text-xs text-gray-600 dark:text-gray-400"
                >
                    SLA Ready
                </div>
            </div>

            <div class="mt-6 space-y-4">
                <div class="flex gap-3">
                    <div
                        class="mt-0.5 w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0"
                    >
                        <icon-dashboard />
                    </div>
                    <div>
                        <div
                            class="font-semibold text-gray-900 dark:text-gray-100"
                        >
                            统一管理与审计
                        </div>
                        <div
                            class="mt-1 text-sm text-gray-600 dark:text-gray-400 leading-relaxed"
                        >
                            在控制台集中管理短链、备注、分组与状态，便于团队协作与审计追踪。
                        </div>
                    </div>
                </div>

                <div class="flex gap-3">
                    <div
                        class="mt-0.5 w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0"
                    >
                        <icon-bar-chart />
                    </div>
                    <div>
                        <div
                            class="font-semibold text-gray-900 dark:text-gray-100"
                        >
                            数据统计与洞察
                        </div>
                        <div
                            class="mt-1 text-sm text-gray-600 dark:text-gray-400 leading-relaxed"
                        >
                            监控点击量与趋势，帮助你评估投放效果，快速定位高价值渠道与内容。
                        </div>
                    </div>
                </div>

                <div class="flex gap-3">
                    <div
                        class="mt-0.5 w-9 h-9 rounded-lg bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0"
                    >
                        <icon-clock-circle />
                    </div>
                    <div>
                        <div
                            class="font-semibold text-gray-900 dark:text-gray-100"
                        >
                            安全策略与有效期
                        </div>
                        <div
                            class="mt-1 text-sm text-gray-600 dark:text-gray-400 leading-relaxed"
                        >
                            支持短链有效期管理与风险控制，降低长期暴露带来的安全隐患。
                        </div>
                    </div>
                </div>
            </div>

            <div class="mt-8 flex flex-col sm:flex-row gap-3">
                <a-button
                    type="primary"
                    long
                    class="h-11! rounded-lg! font-medium!"
                    @click="$router.push('/dashboard')"
                >
                    进入控制台
                </a-button>
                <a-button
                    type="secondary"
                    long
                    class="h-11! rounded-lg! font-medium!"
                    @click="
                        () => {
                            if (userStore.user) {
                                $router.push(
                                    '/dashboard/links',
                                );
                            } else {
                                $router.push('/login');
                            }
                        }
                    "
                >
                    查看我的链接
                </a-button>
            </div>

            <div
                class="mt-4 text-xs text-gray-400 dark:text-gray-500"
            >
                提示：登录后可查看历史记录、统计分析并管理你的短链接资产。
            </div>
        </div>
    </aside>
</template>

<script setup>
import { IconBarChart, IconClockCircle, IconDashboard } from "@arco-design/web-vue/es/icon";
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores";

const router = useRouter();
const userStore = useUserStore();
</script>
