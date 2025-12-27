<template>
    <a-layout class="h-screen bg-gray-50">
        <a-layout-sider
            breakpoint="lg"
            :width="240"
            collapsible
            :collapsed="collapsed"
            @collapse="onCollapse"
            class="bg-white! shadow-sm z-20 border-r border-gray-100"
        >
            <div
                class="h-16 flex items-center justify-center border-b border-gray-50"
            >
                <div
                    class="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-purple-600 cursor-pointer flex items-center gap-2 transition-all duration-300 hover:opacity-80"
                    @click="goToHome"
                >
                    <div
                        class="w-8 h-8 bg-linear-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white shadow-md shrink-0"
                    >
                        <icon-link v-if="collapsed" />
                        <icon-dashboard v-else />
                    </div>
                    <span
                        v-if="!collapsed"
                        class="tracking-tight text-gray-800! font-bold"
                        >Short Link</span
                    >
                </div>
            </div>
            <a-menu
                :default-selected-keys="['stats']"
                :selected-keys="[currentView]"
                @menu-item-click="handleMenuClick"
                class="mt-4 px-2"
            >
                <a-menu-item key="stats" class="rounded-lg! mb-1">
                    <template #icon><icon-bar-chart /></template>
                    数据概览
                </a-menu-item>
                <a-menu-item key="links" class="rounded-lg! mb-1">
                    <template #icon><icon-link /></template>
                    链接管理
                </a-menu-item>
            </a-menu>
        </a-layout-sider>

        <a-layout class="flex flex-col h-screen overflow-hidden">
            <a-layout-header
                class="h-16 bg-white border-b border-gray-100 px-6 flex justify-between items-center z-10 shrink-0"
            >
                <div class="flex items-center gap-4">
                    <h2 class="text-lg font-semibold text-gray-800">
                        {{ currentView === "stats" ? "数据概览" : "链接管理" }}
                    </h2>
                </div>
                <div class="flex items-center gap-4">
                    <a-tooltip content="刷新数据">
                        <a-button
                            shape="circle"
                            type="text"
                            size="small"
                            @click="loadData"
                            :loading="isLoading"
                            class="text-gray-500 hover:bg-gray-100"
                        >
                            <template #icon><icon-refresh /></template>
                        </a-button>
                    </a-tooltip>
                    <div class="h-6 w-px bg-gray-200 mx-1"></div>
                    <a-dropdown @select="handleUserDropdown">
                        <div
                            class="flex items-center gap-3 cursor-pointer hover:bg-gray-50 px-3 py-1.5 rounded-full transition-colors border border-transparent hover:border-gray-100"
                        >
                            <a-avatar :size="32" class="bg-blue-600">{{
                                userEmail?.[0]?.toUpperCase()
                            }}</a-avatar>
                            <div class="hidden sm:flex flex-col items-start">
                                <span
                                    class="text-sm font-medium text-gray-700 leading-none"
                                    >{{ userEmail?.split("@")[0] }}</span
                                >
                                <span
                                    class="text-xs text-gray-400 leading-none mt-1"
                                    >Pro Plan</span
                                >
                            </div>
                            <icon-down class="text-gray-400 text-xs ml-1" />
                        </div>
                        <template #content>
                            <a-doption value="home">
                                <template #icon><icon-home /></template>
                                返回首页
                            </a-doption>
                            <a-doption value="logout">
                                <template #icon><icon-export /></template>
                                退出登录
                            </a-doption>
                        </template>
                    </a-dropdown>
                </div>
            </a-layout-header>

            <a-layout-content class="flex-1 overflow-y-auto bg-gray-50 p-6">
                <div class="max-w-7xl mx-auto">
                    <a-spin :loading="isLoading" class="w-full min-h-50">
                        <!-- Stats View -->
                        <div v-if="currentView === 'stats'" class="space-y-6">
                            <!-- Stats Grid -->
                            <div
                                class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                            >
                                <div
                                    class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                                >
                                    <div
                                        class="flex items-center justify-between mb-4"
                                    >
                                        <span class="text-gray-500 text-sm"
                                            >总链接数</span
                                        >
                                        <div
                                            class="p-2 bg-blue-50 rounded-lg text-blue-600"
                                        >
                                            <icon-link />
                                        </div>
                                    </div>
                                    <div
                                        class="text-2xl font-bold text-gray-900"
                                    >
                                        {{ stats.total_links }}
                                    </div>
                                    <div
                                        class="mt-2 text-xs text-green-600 flex items-center"
                                    >
                                        <icon-arrow-rise class="mr-1" />
                                        <span>持续增长中</span>
                                    </div>
                                </div>

                                <div
                                    class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                                >
                                    <div
                                        class="flex items-center justify-between mb-4"
                                    >
                                        <span class="text-gray-500 text-sm"
                                            >总点击数</span
                                        >
                                        <div
                                            class="p-2 bg-orange-50 rounded-lg text-orange-600"
                                        >
                                            <icon-thunderbolt />
                                        </div>
                                    </div>
                                    <div
                                        class="text-2xl font-bold text-gray-900"
                                    >
                                        {{ stats.total_clicks }}
                                    </div>
                                    <div class="mt-2 text-xs text-gray-400">
                                        累计所有链接点击
                                    </div>
                                </div>

                                <div
                                    class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                                >
                                    <div
                                        class="flex items-center justify-between mb-4"
                                    >
                                        <span class="text-gray-500 text-sm"
                                            >本周新增</span
                                        >
                                        <div
                                            class="p-2 bg-green-50 rounded-lg text-green-600"
                                        >
                                            <icon-plus-circle />
                                        </div>
                                    </div>
                                    <div
                                        class="text-2xl font-bold text-gray-900"
                                    >
                                        {{ stats.weekly_new_links }}
                                    </div>
                                    <div class="mt-2 text-xs text-gray-400">
                                        最近7天创建
                                    </div>
                                </div>

                                <div
                                    class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                                >
                                    <div
                                        class="flex items-center justify-between mb-4"
                                    >
                                        <span class="text-gray-500 text-sm"
                                            >平均点击</span
                                        >
                                        <div
                                            class="p-2 bg-purple-50 rounded-lg text-purple-600"
                                        >
                                            <icon-bar-chart />
                                        </div>
                                    </div>
                                    <div
                                        class="text-2xl font-bold text-gray-900"
                                    >
                                        {{ stats.avg_clicks_per_link }}
                                    </div>
                                    <div class="mt-2 text-xs text-gray-400">
                                        每条链接平均点击
                                    </div>
                                </div>
                            </div>

                            <!-- Recent Links Preview -->
                            <div
                                class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                            >
                                <div
                                    class="px-6 py-4 border-b border-gray-100 flex justify-between items-center"
                                >
                                    <h3 class="font-semibold text-gray-800">
                                        最近创建
                                    </h3>
                                    <a-link
                                        @click="currentView = 'links'"
                                        class="text-sm"
                                        >查看全部</a-link
                                    >
                                </div>
                                <a-table
                                    :data="links.slice(0, 5)"
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
                                                <div
                                                    class="flex items-center gap-2"
                                                >
                                                    <div
                                                        class="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-500 shrink-0"
                                                    >
                                                        <icon-link />
                                                    </div>
                                                    <span
                                                        class="truncate text-gray-600"
                                                        >{{ record.link }}</span
                                                    >
                                                </div>
                                            </template>
                                        </a-table-column>
                                        <a-table-column
                                            title="短链接"
                                            data-index="short"
                                        >
                                            <template #cell="{ record }">
                                                <a-link
                                                    :href="`${origin}/${record.short}`"
                                                    target="_blank"
                                                    class="font-medium text-blue-600"
                                                    >{{ origin }}/{{
                                                        record.short
                                                    }}</a-link
                                                >
                                            </template>
                                        </a-table-column>
                                        <a-table-column
                                            title="点击数"
                                            data-index="click_count"
                                            align="right"
                                        >
                                            <template #cell="{ record }">
                                                <span
                                                    class="font-mono text-gray-700"
                                                    >{{
                                                        record.click_count
                                                    }}</span
                                                >
                                            </template>
                                        </a-table-column>
                                        <a-table-column
                                            title="创建时间"
                                            data-index="created_at"
                                            align="right"
                                        >
                                            <template #cell="{ record }">
                                                <span
                                                    class="text-gray-400 text-sm"
                                                    >{{
                                                        formatDate(
                                                            record.created_at,
                                                        )
                                                    }}</span
                                                >
                                            </template>
                                        </a-table-column>
                                    </template>
                                </a-table>
                            </div>
                        </div>

                        <!-- Links View -->
                        <div v-else class="space-y-6">
                            <div
                                class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                            >
                                <div
                                    class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50"
                                >
                                    <div class="flex items-center gap-4">
                                        <a-input-search
                                            placeholder="搜索链接..."
                                            class="w-64 bg-white!"
                                        />
                                    </div>
                                    <a-button type="primary" @click="goToHome">
                                        <template #icon><icon-plus /></template>
                                        创建新链接
                                    </a-button>
                                </div>

                                <a-table
                                    :data="links"
                                    :pagination="{
                                        pageSize: 10,
                                        showTotal: true,
                                        showJumper: true,
                                    }"
                                    :bordered="{ wrapper: false, cell: false }"
                                    :hoverable="true"
                                    row-key="id"
                                >
                                    <template #columns>
                                        <a-table-column
                                            title="链接信息"
                                            data-index="link"
                                        >
                                            <template #cell="{ record }">
                                                <div class="py-2">
                                                    <div
                                                        class="flex items-center gap-2 mb-1"
                                                    >
                                                        <a-link
                                                            :href="`${origin}/${record.short}`"
                                                            target="_blank"
                                                            class="font-bold text-blue-600 text-base"
                                                            >{{ origin }}/{{
                                                                record.short
                                                            }}</a-link
                                                        >
                                                        <a-button
                                                            size="mini"
                                                            type="text"
                                                            class="text-gray-400 hover:text-blue-600"
                                                            @click="
                                                                copyLink(
                                                                    record.short,
                                                                )
                                                            "
                                                        >
                                                            <template #icon
                                                                ><icon-copy
                                                            /></template>
                                                        </a-button>
                                                    </div>
                                                    <div
                                                        class="text-gray-400 text-sm truncate max-w-md"
                                                        :title="record.link"
                                                    >
                                                        {{ record.link }}
                                                    </div>
                                                </div>
                                            </template>
                                        </a-table-column>
                                        <a-table-column
                                            title="数据统计"
                                            data-index="click_count"
                                            :width="150"
                                        >
                                            <template #cell="{ record }">
                                                <div class="flex flex-col">
                                                    <span
                                                        class="text-lg font-bold text-gray-800"
                                                        >{{
                                                            record.click_count
                                                        }}</span
                                                    >
                                                    <span
                                                        class="text-xs text-gray-400"
                                                        >总点击</span
                                                    >
                                                </div>
                                            </template>
                                        </a-table-column>
                                        <a-table-column
                                            title="状态"
                                            data-index="is_active"
                                            :width="120"
                                        >
                                            <template #cell="{ record }">
                                                <a-tag
                                                    :color="
                                                        record.is_active
                                                            ? 'green'
                                                            : 'red'
                                                    "
                                                    bordered
                                                    class="rounded-full px-3"
                                                >
                                                    <template #icon>
                                                        <div
                                                            class="w-1.5 h-1.5 rounded-full mr-1"
                                                            :class="
                                                                record.is_active
                                                                    ? 'bg-green-600'
                                                                    : 'bg-red-600'
                                                            "
                                                        ></div>
                                                    </template>
                                                    {{
                                                        record.is_active
                                                            ? "运行中"
                                                            : "已停用"
                                                    }}
                                                </a-tag>
                                            </template>
                                        </a-table-column>
                                        <a-table-column
                                            title="创建时间"
                                            data-index="created_at"
                                            :width="180"
                                        >
                                            <template #cell="{ record }">
                                                <span class="text-gray-500">{{
                                                    formatDate(
                                                        record.created_at,
                                                    )
                                                }}</span>
                                            </template>
                                        </a-table-column>
                                        <a-table-column
                                            title="操作"
                                            :width="120"
                                            align="center"
                                        >
                                            <template #cell="{ record }">
                                                <a-space>
                                                    <a-tooltip content="二维码">
                                                        <a-button
                                                            size="small"
                                                            shape="circle"
                                                            class="hover:bg-gray-100"
                                                            @click="
                                                                showQRCode(
                                                                    record.short,
                                                                )
                                                            "
                                                        >
                                                            <template #icon
                                                                ><icon-qrcode
                                                                    class="text-gray-600"
                                                            /></template>
                                                        </a-button>
                                                    </a-tooltip>
                                                    <a-tooltip content="编辑">
                                                        <a-button
                                                            size="small"
                                                            shape="circle"
                                                            class="hover:bg-gray-100"
                                                        >
                                                            <template #icon
                                                                ><icon-edit
                                                                    class="text-gray-600"
                                                            /></template>
                                                        </a-button>
                                                    </a-tooltip>
                                                </a-space>
                                            </template>
                                        </a-table-column>
                                    </template>
                                </a-table>
                            </div>
                        </div>
                    </a-spin>
                </div>
            </a-layout-content>
        </a-layout>

        <!-- QR Code Modal -->
        <a-modal
            v-model:visible="qrcodeModalVisible"
            title="链接二维码"
            :footer="false"
            :width="340"
            modal-class="rounded-xl!"
        >
            <div class="flex flex-col items-center p-6">
                <div
                    class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6"
                >
                    <canvas ref="qrcodeCanvas" class="block"></canvas>
                </div>
                <div class="w-full">
                    <div class="text-xs text-gray-400 mb-2 text-center">
                        短链接地址
                    </div>
                    <div
                        class="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg border border-gray-100"
                    >
                        <span
                            class="text-gray-700 text-sm truncate mr-4 font-medium"
                            >{{ currentQrUrl }}</span
                        >
                        <a-link @click="copyLink(currentQrUrl.split('/').pop())"
                            >复制</a-link
                        >
                    </div>
                </div>
                <a-button
                    type="primary"
                    long
                    class="mt-6 rounded-lg!"
                    @click="qrcodeModalVisible = false"
                >
                    完成
                </a-button>
            </div>
        </a-modal>
    </a-layout>
</template>

<script setup>
import { ref, onMounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import { Message } from "@arco-design/web-vue";
import {
    IconBarChart,
    IconLink,
    IconRefresh,
    IconDown,
    IconHome,
    IconExport,
    IconThunderbolt,
    IconPlusCircle,
    IconPlus,
    IconCopy,
    IconQrcode,
    IconDashboard,
    IconArrowRise,
    IconEdit,
} from "@arco-design/web-vue/es/icon";
import QRCode from "qrcode";
import { getCurrentUser, signOut } from "@/services/auth.js";
import { getUserLinkStats, getUserLinks } from "@/services/dashboard.js";

const router = useRouter();
const origin = ref(window.location.origin);

// State
const collapsed = ref(false);
const isLoading = ref(true);
const currentView = ref("stats");
const userEmail = ref("");
const stats = ref({
    total_links: 0,
    total_clicks: 0,
    weekly_new_links: 0,
    avg_clicks_per_link: 0,
});
const links = ref([]);
const qrcodeModalVisible = ref(false);
const currentQrUrl = ref("");
const qrcodeCanvas = ref(null);

// Methods
const onCollapse = (val) => {
    collapsed.value = val;
};

const handleMenuClick = (key) => {
    currentView.value = key;
};

const goToHome = () => {
    router.push("/");
};

const handleUserDropdown = async (value) => {
    if (value === "home") {
        goToHome();
    } else if (value === "logout") {
        try {
            await signOut();
            Message.success("已退出登录");
            router.push("/login");
        } catch (error) {
            Message.error("退出登录失败");
        }
    }
};

const loadData = async () => {
    isLoading.value = true;
    try {
        const user = await getCurrentUser();
        if (!user) {
            router.push("/login");
            return;
        }
        userEmail.value = user.email;

        // Load stats
        const statsData = await getUserLinkStats();
        stats.value = {
            total_links: statsData.total_links || 0,
            total_clicks: statsData.total_clicks || 0,
            weekly_new_links: statsData.weekly_new_links || 0,
            avg_clicks_per_link: parseFloat(
                statsData.avg_clicks_per_link || 0,
            ).toFixed(1),
        };

        // Load links
        const { links: userLinks } = await getUserLinks({
            limit: 50,
            orderBy: "created_at",
            ascending: false,
        });
        links.value = userLinks || [];
    } catch (error) {
        console.error("Load data error:", error);
        Message.error("加载数据失败");
    } finally {
        isLoading.value = false;
    }
};

const copyLink = async (short) => {
    const url = `${origin.value}/${short}`;
    try {
        await navigator.clipboard.writeText(url);
        Message.success("链接已复制到剪贴板");
    } catch (error) {
        Message.error("复制失败，请手动复制");
    }
};

const showQRCode = async (short) => {
    const url = `${origin.value}/${short}`;
    currentQrUrl.value = url;
    qrcodeModalVisible.value = true;
    await nextTick();
    if (qrcodeCanvas.value) {
        QRCode.toCanvas(
            qrcodeCanvas.value,
            url,
            { width: 200, margin: 1 },
            function (error) {
                if (error) console.error(error);
            },
        );
    }
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

onMounted(() => {
    loadData();
});
</script>
