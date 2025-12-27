<template>
    <div class="dashboard-wrapper">
        <header class="dashboard-header">
            <div class="logo">短链接统计面板</div>
            <div class="user-info">
                <span class="user-email">{{ userEmail }}</span>
                <button class="user-button" @click="handleLogout">
                    退出登录
                </button>
            </div>
        </header>

        <div class="dashboard-content">
            <div class="sidebar">
                <nav class="sidebar-nav">
                    <a
                        href="#"
                        class="nav-item active"
                        @click.prevent="currentView = 'stats'"
                    >
                        <span class="nav-icon" v-html="statsIcon"></span>
                        链接统计
                    </a>
                    <a
                        href="#"
                        class="nav-item"
                        @click.prevent="currentView = 'links'"
                    >
                        <span class="nav-icon" v-html="linkIcon"></span>
                        我的链接
                    </a>
                </nav>
            </div>

            <main class="main-content">
                <LoadingSpinner v-if="isLoading" :active="true" />

                <div v-else>
                    <div class="page-header">
                        <h1>
                            {{
                                currentView === "stats"
                                    ? "链接统计"
                                    : "我的链接"
                            }}
                        </h1>
                        <p>
                            {{
                                currentView === "stats"
                                    ? "查看您的短链接使用情况"
                                    : "管理您的所有短链接"
                            }}
                        </p>
                    </div>

                    <!-- 统计卡片 -->
                    <div v-if="currentView === 'stats'" class="stats-cards">
                        <div class="stats-card">
                            <div class="stats-card-header">总链接数</div>
                            <div class="stats-card-value">
                                {{ stats.total_links }}
                            </div>
                        </div>

                        <div class="stats-card">
                            <div class="stats-card-header">总点击数</div>
                            <div class="stats-card-value">
                                {{ stats.total_clicks }}
                            </div>
                        </div>

                        <div class="stats-card">
                            <div class="stats-card-header">本周新增</div>
                            <div class="stats-card-value">
                                {{ stats.weekly_new_links }}
                            </div>
                        </div>

                        <div class="stats-card">
                            <div class="stats-card-header">平均点击数</div>
                            <div class="stats-card-value">
                                {{ stats.avg_clicks_per_link }}
                            </div>
                        </div>
                    </div>

                    <!-- 链接列表 -->
                    <div class="recent-links">
                        <div class="section-header">
                            <h2>
                                {{
                                    currentView === "stats"
                                        ? "最近链接"
                                        : "全部链接"
                                }}
                            </h2>
                            <button class="refresh-btn" @click="loadData">
                                <svg
                                    viewBox="0 0 24 24"
                                    width="16"
                                    height="16"
                                    fill="currentColor"
                                >
                                    <path
                                        d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
                                    />
                                </svg>
                                刷新
                            </button>
                        </div>

                        <div v-if="links.length === 0" class="empty-state">
                            <p>暂无链接数据</p>
                            <p class="empty-hint">
                                前往首页创建您的第一个短链接
                            </p>
                            <button class="create-link-btn" @click="goToHome">
                                创建短链接
                            </button>
                        </div>

                        <div v-else class="links-table-container">
                            <table class="links-table">
                                <thead>
                                    <tr>
                                        <th>原始链接</th>
                                        <th>短链接</th>
                                        <th>创建时间</th>
                                        <th>点击次数</th>
                                        <th>状态</th>
                                        <th>操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="link in links" :key="link.id">
                                        <td
                                            class="original-link"
                                            :title="link.link"
                                        >
                                            {{ link.link }}
                                        </td>
                                        <td>
                                            <a
                                                :href="`/u/${link.short}`"
                                                target="_blank"
                                                class="short-link"
                                            >
                                                {{ origin }}/u/{{ link.short }}
                                            </a>
                                        </td>
                                        <td>
                                            {{ formatDate(link.created_at) }}
                                        </td>
                                        <td>
                                            <span class="click-count">{{
                                                link.click_count || 0
                                            }}</span>
                                        </td>
                                        <td>
                                            <span
                                                :class="[
                                                    'status-badge',
                                                    link.is_active
                                                        ? 'active'
                                                        : 'inactive',
                                                ]"
                                            >
                                                {{
                                                    link.is_active
                                                        ? "启用"
                                                        : "禁用"
                                                }}
                                            </span>
                                        </td>
                                        <td>
                                            <div class="link-actions">
                                                <button
                                                    class="action-icon copy"
                                                    title="复制链接"
                                                    @click="
                                                        copyLink(link.short)
                                                    "
                                                >
                                                    <span
                                                        v-html="copyIcon"
                                                    ></span>
                                                </button>
                                                <button
                                                    class="action-icon qr"
                                                    title="查看二维码"
                                                    @click="
                                                        showQRCode(link.short)
                                                    "
                                                >
                                                    <span
                                                        v-html="qrcodeIcon"
                                                    ></span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="dashboard-footer">
                        <p>统计数据更新于: {{ lastUpdated }}</p>
                    </div>
                </div>
            </main>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import LoadingSpinner from "@/components/base/LoadingSpinner.vue";
import { showMessage, showError } from "@/utils/message.js";
import { getCurrentUser, signOut } from "@/services/auth.js";
import { getUserLinkStats, getUserLinks } from "@/services/dashboard.js";
import statsIcon from "@/assets/images/stats.svg?raw";
import linkIcon from "@/assets/images/link.svg?raw";
import copyIcon from "@/assets/images/copy.svg?raw";
import qrcodeIcon from "@/assets/images/qrcode.svg?raw";

const origin = ref(window.location.origin);

// 路由
const router = useRouter();

// 响应式状态
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
const lastUpdated = ref("");

// 加载数据
async function loadData() {
    isLoading.value = true;

    try {
        // 获取当前用户
        const user = await getCurrentUser();
        if (!user) {
            throw new Error("未登录");
        }

        userEmail.value = user.email;

        // 获取用户统计数据（通过后端 API）
        const statsData = await getUserLinkStats();
        stats.value = {
            total_links: statsData.total_links || 0,
            total_clicks: statsData.total_clicks || 0,
            weekly_new_links: statsData.weekly_new_links || 0,
            avg_clicks_per_link: parseFloat(
                statsData.avg_clicks_per_link || 0,
            ).toFixed(1),
        };

        // 获取用户链接列表（通过后端 API）
        const { links: userLinks } = await getUserLinks({
            limit: 50,
            orderBy: "created_at",
            ascending: false,
        });
        links.value = userLinks;

        // 更新最后更新时间
        lastUpdated.value = new Date().toLocaleString("zh-CN");

        isLoading.value = false;
    } catch (error) {
        console.error("加载数据失败:", error);
        showError(error.message || "加载数据失败");
        isLoading.value = false;

        // 如果是未登录错误，重定向到登录页
        if (error.message === "未登录") {
            router.push("/login");
        }
    }
}

// 复制链接
async function copyLink(short) {
    const url = `${window.location.origin}/${short}`;
    try {
        await navigator.clipboard.writeText(url);
        showMessage("链接已复制到剪贴板", "success");
    } catch (error) {
        console.error("复制失败:", error);
        showError("复制失败，请手动复制");
    }
}

// 显示二维码
function showQRCode(short) {
    showMessage("二维码功能即将上线", "info");
}

// 退出登录
async function handleLogout() {
    try {
        await signOut();
        showMessage("已退出登录", "success");
        router.push("/login");
    } catch (error) {
        console.error("退出登录失败:", error);
        showError(error.message || "退出登录失败");
    }
}

// 前往首页
function goToHome() {
    router.push("/");
}

// 格式化日期
function formatDate(dateString) {
    if (!dateString) return "-";

    const date = new Date(dateString);
    return date.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

// 组件挂载时加载数据
onMounted(() => {
    loadData();
});
</script>

<style scoped>
/* 样式保持不变 */
.dashboard-wrapper {
    min-height: 100vh;
    background-color: #f8f9fa;
    display: flex;
    flex-direction: column;
}

.dashboard-header {
    background-color: #fff;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    padding: 16px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: sticky;
    top: 0;
    z-index: 100;
}

.logo {
    font-size: 20px;
    font-weight: 700;
    color: #6c5ce7;
}

.user-info {
    display: flex;
    align-items: center;
    gap: 16px;
}

.user-email {
    font-size: 14px;
    color: #636e72;
}

.user-button {
    background-color: transparent;
    border: 1px solid #6c5ce7;
    color: #6c5ce7;
    padding: 8px 16px;
    border-radius: 50px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.user-button:hover {
    background-color: #6c5ce7;
    color: #fff;
}

.dashboard-content {
    display: flex;
    flex: 1;
}

.sidebar {
    width: 240px;
    background-color: #fff;
    box-shadow: 2px 0 10px rgba(0, 0, 0, 0.05);
    padding: 24px 0;
}

.sidebar-nav {
    display: flex;
    flex-direction: column;
}

.nav-item {
    padding: 12px 24px;
    color: #636e72;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 12px;
    transition: all 0.2s ease;
    border-left: 3px solid transparent;
}

.nav-item:hover {
    background-color: #f8f9fa;
    color: #6c5ce7;
}

.nav-item.active {
    background-color: #f0f1fe;
    color: #6c5ce7;
    border-left-color: #6c5ce7;
    font-weight: 600;
}

.nav-icon {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.main-content {
    flex: 1;
    padding: 24px;
    overflow-y: auto;
}

.page-header {
    margin-bottom: 24px;
}

.page-header h1 {
    font-size: 24px;
    font-weight: 700;
    color: #2d3436;
    margin-bottom: 8px;
}

.page-header p {
    color: #636e72;
    font-size: 14px;
}

.stats-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 20px;
    margin-bottom: 32px;
}

.stats-card {
    background-color: #fff;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
}

.stats-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.stats-card-header {
    font-size: 14px;
    color: #636e72;
    margin-bottom: 8px;
}

.stats-card-value {
    font-size: 28px;
    font-weight: 700;
    color: #2d3436;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.section-header h2 {
    font-size: 18px;
    font-weight: 700;
    color: #2d3436;
}

.refresh-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background-color: transparent;
    border: 1px solid #6c5ce7;
    color: #6c5ce7;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.refresh-btn:hover {
    background-color: #6c5ce7;
    color: #fff;
}

.empty-state {
    background-color: #fff;
    border-radius: 12px;
    padding: 60px 20px;
    text-align: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.empty-state p {
    color: #636e72;
    font-size: 16px;
    margin-bottom: 12px;
}

.empty-hint {
    font-size: 14px;
    color: #b2bec3;
    margin-bottom: 24px;
}

.create-link-btn {
    background: linear-gradient(90deg, #4776e6, #8e54e9);
    color: #fff;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
}

.create-link-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(108, 92, 231, 0.3);
}

.links-table-container {
    background-color: #fff;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    margin-bottom: 32px;
}

.links-table {
    width: 100%;
    border-collapse: collapse;
}

.links-table th {
    background-color: #f8f9fa;
    padding: 12px 16px;
    text-align: left;
    font-size: 14px;
    font-weight: 600;
    color: #2d3436;
    border-bottom: 1px solid #e0e0e0;
}

.links-table td {
    padding: 12px 16px;
    font-size: 14px;
    color: #636e72;
    border-bottom: 1px solid #f0f0f0;
}

.links-table tr:last-child td {
    border-bottom: none;
}

.links-table tr:hover {
    background-color: #f8f9fa;
}

.original-link {
    max-width: 250px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.short-link {
    color: #6c5ce7;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.2s ease;
}

.short-link:hover {
    text-decoration: underline;
    color: #4834d4;
}

.click-count {
    font-weight: 600;
    color: #00b894;
}

.status-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
}

.status-badge.active {
    background-color: #d5f9e5;
    color: #00b894;
}

.status-badge.inactive {
    background-color: #ffeaa7;
    color: #fdcb6e;
}

.link-actions {
    display: flex;
    gap: 8px;
}

.action-icon {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    background-color: #f0f0f0;
}

.action-icon:hover {
    transform: translateY(-2px);
}

.action-icon span {
    width: 16px;
    height: 16px;
    display: flex;
}

.action-icon.copy {
    color: #6c5ce7;
}

.action-icon.copy:hover {
    background-color: #6c5ce7;
    color: #fff;
}

.action-icon.qr {
    color: #0984e3;
}

.action-icon.qr:hover {
    background-color: #0984e3;
    color: #fff;
}

.dashboard-footer {
    text-align: center;
    font-size: 12px;
    color: #b2bec3;
    margin-top: 16px;
}

@media (max-width: 768px) {
    .sidebar {
        width: 60px;
    }

    .nav-item span:not(.nav-icon) {
        display: none;
    }

    .stats-cards {
        grid-template-columns: repeat(2, 1fr);
    }

    .original-link {
        max-width: 150px;
    }

    .user-email {
        display: none;
    }
}

@media (max-width: 576px) {
    .stats-cards {
        grid-template-columns: 1fr;
    }

    .links-table-container {
        overflow-x: auto;
    }

    .links-table {
        min-width: 600px;
    }
}
</style>
