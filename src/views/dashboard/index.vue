<template>
    <a-layout class="h-screen bg-gray-50">
        <a-layout-sider
            breakpoint="lg"
            :width="220"
            collapsible
            :collapsed="collapsed"
            @collapse="onCollapse"
            class="bg-white! shadow-sm z-10"
        >
            <div
                class="h-16 flex items-center justify-center border-b border-gray-100"
            >
                <div
                    class="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-purple-600 cursor-pointer flex items-center gap-2"
                    @click="goToHome"
                >
                    <span v-if="!collapsed">Short Link</span>
                    <span v-else>SL</span>
                </div>
            </div>
            <a-menu
                :default-selected-keys="['stats']"
                :selected-keys="[currentView]"
                @menu-item-click="handleMenuClick"
                class="mt-2"
            >
                <a-menu-item key="stats">
                    <template #icon><icon-bar-chart /></template>
                    数据概览
                </a-menu-item>
                <a-menu-item key="links">
                    <template #icon><icon-link /></template>
                    链接管理
                </a-menu-item>
            </a-menu>
        </a-layout-sider>

        <a-layout>
            <a-layout-header
                class="h-16 bg-white shadow-sm px-6 flex justify-between items-center z-10"
            >
                <div class="text-lg font-medium text-gray-800">
                    {{ currentView === "stats" ? "数据概览" : "链接管理" }}
                </div>
                <div class="flex items-center gap-4">
                    <a-tooltip content="刷新数据">
                        <a-button
                            shape="circle"
                            size="small"
                            @click="loadData"
                            :loading="isLoading"
                        >
                            <template #icon><icon-refresh /></template>
                        </a-button>
                    </a-tooltip>
                    <a-dropdown @select="handleUserDropdown">
                        <div
                            class="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors"
                        >
                            <a-avatar :size="32" class="bg-blue-500">{{
                                userEmail?.[0]?.toUpperCase()
                            }}</a-avatar>
                            <span class="text-gray-700 hidden sm:block">{{
                                userEmail
                            }}</span>
                            <icon-down class="text-gray-400" />
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

            <a-layout-content class="p-6 overflow-y-auto">
                <a-spin :loading="isLoading" class="w-full min-h-50">
                    <!-- Stats View -->
                    <div v-if="currentView === 'stats'" class="space-y-6">
                        <div
                            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                        >
                            <a-card
                                class="rounded-xl shadow-sm hover:shadow-md transition-shadow border-none"
                            >
                                <a-statistic
                                    title="总链接数"
                                    :value="stats.total_links"
                                    show-group-separator
                                    animation
                                >
                                    <template #prefix
                                        ><icon-link class="text-blue-500"
                                    /></template>
                                </a-statistic>
                            </a-card>
                            <a-card
                                class="rounded-xl shadow-sm hover:shadow-md transition-shadow border-none"
                            >
                                <a-statistic
                                    title="总点击数"
                                    :value="stats.total_clicks"
                                    show-group-separator
                                    animation
                                >
                                    <template #prefix
                                        ><icon-thunderbolt
                                            class="text-orange-500"
                                    /></template>
                                </a-statistic>
                            </a-card>
                            <a-card
                                class="rounded-xl shadow-sm hover:shadow-md transition-shadow border-none"
                            >
                                <a-statistic
                                    title="本周新增"
                                    :value="stats.weekly_new_links"
                                    show-group-separator
                                    animation
                                >
                                    <template #prefix
                                        ><icon-plus-circle
                                            class="text-green-500"
                                    /></template>
                                </a-statistic>
                            </a-card>
                            <a-card
                                class="rounded-xl shadow-sm hover:shadow-md transition-shadow border-none"
                            >
                                <a-statistic
                                    title="平均点击"
                                    :value="Number(stats.avg_clicks_per_link)"
                                    :precision="1"
                                    animation
                                >
                                    <template #prefix
                                        ><icon-bar-chart
                                            class="text-purple-500"
                                    /></template>
                                </a-statistic>
                            </a-card>
                        </div>

                        <!-- Recent Links Preview in Stats -->
                        <a-card
                            class="rounded-xl shadow-sm border-none"
                            title="最近创建"
                        >
                            <template #extra>
                                <a-link @click="currentView = 'links'"
                                    >查看全部</a-link
                                >
                            </template>
                            <a-table
                                :data="links.slice(0, 5)"
                                :pagination="false"
                                :bordered="false"
                            >
                                <template #columns>
                                    <a-table-column
                                        title="原始链接"
                                        data-index="link"
                                        ellipsis
                                        tooltip
                                    ></a-table-column>
                                    <a-table-column
                                        title="短链接"
                                        data-index="short"
                                    >
                                        <template #cell="{ record }">
                                            <a-link
                                                :href="`${origin}/${record.short}`"
                                                target="_blank"
                                                >{{ origin }}/{{
                                                    record.short
                                                }}</a-link
                                            >
                                        </template>
                                    </a-table-column>
                                    <a-table-column
                                        title="点击数"
                                        data-index="click_count"
                                    ></a-table-column>
                                    <a-table-column
                                        title="创建时间"
                                        data-index="created_at"
                                    >
                                        <template #cell="{ record }">
                                            {{ formatDate(record.created_at) }}
                                        </template>
                                    </a-table-column>
                                </template>
                            </a-table>
                        </a-card>
                    </div>

                    <!-- Links View -->
                    <div v-else class="space-y-6">
                        <a-card class="rounded-xl shadow-sm border-none">
                            <div class="flex justify-between items-center mb-4">
                                <h3 class="text-lg font-medium">链接列表</h3>
                                <a-button type="primary" @click="goToHome">
                                    <template #icon><icon-plus /></template>
                                    创建新链接
                                </a-button>
                            </div>

                            <a-table
                                :data="links"
                                :pagination="{ pageSize: 10 }"
                                :bordered="{ wrapper: true, cell: true }"
                            >
                                <template #columns>
                                    <a-table-column
                                        title="原始链接"
                                        data-index="link"
                                        ellipsis
                                        tooltip
                                    ></a-table-column>
                                    <a-table-column
                                        title="短链接"
                                        data-index="short"
                                        :width="280"
                                    >
                                        <template #cell="{ record }">
                                            <div
                                                class="flex items-center gap-2"
                                            >
                                                <a-link
                                                    :href="`${origin}/${record.short}`"
                                                    target="_blank"
                                                    class="truncate"
                                                    >{{ origin }}/{{
                                                        record.short
                                                    }}</a-link
                                                >
                                                <a-button
                                                    size="mini"
                                                    type="text"
                                                    @click="
                                                        copyLink(record.short)
                                                    "
                                                >
                                                    <template #icon
                                                        ><icon-copy
                                                    /></template>
                                                </a-button>
                                            </div>
                                        </template>
                                    </a-table-column>
                                    <a-table-column
                                        title="点击数"
                                        data-index="click_count"
                                        :width="100"
                                        align="center"
                                    ></a-table-column>
                                    <a-table-column
                                        title="状态"
                                        data-index="is_active"
                                        :width="100"
                                        align="center"
                                    >
                                        <template #cell="{ record }">
                                            <a-tag
                                                :color="
                                                    record.is_active
                                                        ? 'green'
                                                        : 'red'
                                                "
                                            >
                                                {{
                                                    record.is_active
                                                        ? "启用"
                                                        : "禁用"
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
                                            {{ formatDate(record.created_at) }}
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
                                                        @click="
                                                            showQRCode(
                                                                record.short,
                                                            )
                                                        "
                                                    >
                                                        <template #icon
                                                            ><icon-qrcode
                                                        /></template>
                                                    </a-button>
                                                </a-tooltip>
                                            </a-space>
                                        </template>
                                    </a-table-column>
                                </template>
                            </a-table>
                        </a-card>
                    </div>
                </a-spin>
            </a-layout-content>

            <a-layout-footer class="text-center py-4 text-gray-400 text-sm">
                © {{ new Date().getFullYear() }} Short Link Service.
            </a-layout-footer>
        </a-layout>

        <!-- QR Code Modal -->
        <a-modal
            v-model:visible="qrcodeModalVisible"
            title="链接二维码"
            :footer="false"
            :width="300"
        >
            <div class="flex flex-col items-center p-4">
                <canvas
                    ref="qrcodeCanvas"
                    class="rounded-lg shadow-sm border border-gray-100"
                ></canvas>
                <div
                    class="text-center text-gray-500 mt-4 text-sm break-all px-2 bg-gray-50 py-2 rounded w-full"
                >
                    {{ currentQrUrl }}
                </div>
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
