<script setup>
import { IconLink, IconTrophy } from "@arco-design/web-vue/es/icon";
import { ref } from "vue";

const props = defineProps({
	title: {
		type: String,
		default: "热门链接排行榜",
	},
	showCreator: {
		type: Boolean,
		default: false,
	},
	initialPeriod: {
		type: String,
		default: "daily",
	},
	headerClass: {
		type: String,
		default: "bg-gradient-to-r from-blue-50 to-purple-50",
	},
	periodClicksClass: {
		type: String,
		default: "text-blue-600",
	},
	links: {
		type: Array,
		default: () => [],
	},
	loading: {
		type: Boolean,
		default: false,
	},
});

const emit = defineEmits(["period-change"]);

const origin = window.location.origin;
const currentPeriod = ref(props.initialPeriod);

const getRankClass = (index) => {
	if (index === 0) {
		return "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white";
	} else if (index === 1) {
		return "bg-gradient-to-br from-gray-300 to-gray-500 text-white";
	} else if (index === 2) {
		return "bg-gradient-to-br from-orange-400 to-orange-600 text-white";
	}
	return "bg-white text-gray-600 dark:text-gray-300 border border-gray-200";
};

const getPeriodText = () => {
	const periodMap = {
		daily: "今日",
		weekly: "本周",
		monthly: "本月",
	};
	return periodMap[currentPeriod.value] || "今日";
};

const handlePeriodChange = () => {
	emit("period-change", currentPeriod.value);
};
</script>

<template>
    <div
        class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
    >
        <!-- 标题栏 -->
        <div
            class="px-6 py-4 border-b border-gray-100 dark:border-gray-700"
            :class="headerClass"
        >
            <div class="flex items-center justify-between">
                <h3
                    class="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2"
                >
                    <icon-trophy class="text-yellow-500" />
                    {{ title }}
                </h3>
                <a-radio-group
                    v-model="currentPeriod"
                    type="button"
                    size="small"
                    @change="handlePeriodChange"
                >
                    <a-radio value="daily">日榜</a-radio>
                    <a-radio value="weekly">周榜</a-radio>
                    <a-radio value="monthly">月榜</a-radio>
                </a-radio-group>
            </div>
        </div>

        <!-- 排行榜内容 -->
        <a-spin :loading="loading" class="w-full">
            <div class="p-6">
                <a-empty
                    v-if="!loading && links.length === 0"
                    description="暂无数据"
                />
                <div v-else class="space-y-3">
                    <div
                        v-for="(link, index) in links"
                        :key="link.id"
                        class="flex items-center gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                        <!-- 排名 -->
                        <div
                            class="flex items-center justify-center w-10 h-10 rounded-full shrink-0 font-bold text-lg"
                            :class="getRankClass(index)"
                        >
                            {{ index + 1 }}
                        </div>

                        <!-- 创建者标识（仅管理员模式显示） -->
                        <div v-if="showCreator" class="w-16 shrink-0">
                            <a-tag
                                v-if="link.user_id"
                                size="small"
                                color="arcoblue"
                            >
                                用户
                            </a-tag>
                            <a-tag v-else size="small" color="gray">
                                匿名
                            </a-tag>
                        </div>

                        <!-- 链接信息 -->
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 mb-1">
                                <a-link
                                    :href="`${origin}/u/${link.short}`"
                                    target="_blank"
                                    class="font-medium text-blue-600 hover:text-blue-700 text-base"
                                >
                                    {{ origin }}/u/{{ link.short }}
                                </a-link>
                            </div>
                            <div
                                class="text-sm text-gray-400 dark:text-gray-500 truncate flex items-center gap-1"
                                :title="link.link"
                            >
                                <icon-link class="text-xs" />
                                {{ link.link }}
                            </div>
                        </div>

                        <!-- 统计数据 -->
                        <div class="flex items-center gap-6 shrink-0">
                            <!-- 周期点击 -->
                            <div class="text-right">
                                <div
                                    class="text-2xl font-bold"
                                    :class="periodClicksClass"
                                >
                                    {{ link.period_clicks || 0 }}
                                </div>
                                <div
                                    class="text-xs text-gray-400 dark:text-gray-500"
                                >
                                    {{ getPeriodText() }}点击
                                </div>
                            </div>
                            <!-- 总点击 -->
                            <div class="text-right">
                                <div
                                    class="text-lg font-semibold text-gray-700 dark:text-gray-500"
                                >
                                    {{ link.click_count }}
                                </div>
                                <div
                                    class="text-xs text-gray-400 dark:text-gray-500"
                                >
                                    总点击
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </a-spin>
    </div>
</template>
