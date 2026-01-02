<template>
    <a-menu
        :selected-keys="[currentRouteKey]"
        @menu-item-click="handleMenuClick"
        class="mt-4"
    >
        <!-- 主菜单组 -->
        <a-menu-item
            v-for="item in menuGroups.main"
            :key="item.key"
            class="rounded-lg!"
        >
            <template #icon>
                <component :is="getIconComponent(item.icon)" />
            </template>
            {{ item.title }}
        </a-menu-item>

        <!-- 用户菜单组 -->
        <template v-if="menuGroups.user.length > 0">
            <a-divider class="my-3!" />
            <a-menu-item
                v-for="item in menuGroups.user"
                :key="item.key"
                class="rounded-lg!"
            >
                <template #icon>
                    <component :is="getIconComponent(item.icon)" />
                </template>
                {{ item.title }}
            </a-menu-item>
        </template>

        <!-- 管理员菜单组 -->
        <template v-if="menuGroups.admin.length > 0">
            <a-divider class="my-3!" />
            <div
                v-if="!collapsed"
                class="px-3 py-2 text-xs text-gray-400 uppercase tracking-wider"
            >
                管理员
            </div>
            <a-menu-item
                v-for="item in menuGroups.admin"
                :key="item.key"
                class="rounded-lg! mb-1"
            >
                <template #icon>
                    <component
                        :is="getIconComponent(item.icon)"
                        class="text-orange-500"
                    />
                </template>
                <span class="text-orange-600">{{ item.title }}</span>
            </a-menu-item>
        </template>
    </a-menu>
</template>

<script setup>
import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import {
    IconBarChart,
    IconLink,
    IconDashboard,
    IconApps,
    IconUser,
    IconHistory,
    IconSettings,
    IconFile,
} from "@arco-design/web-vue/es/icon";
import { getDashboardMenuRoutes } from "@/router";

const props = defineProps({
    isAdmin: {
        type: Boolean,
        default: false,
    },
    collapsed: {
        type: Boolean,
        default: false,
    },
});

const router = useRouter();
const route = useRoute();

// 图标映射表
const iconMap = {
    IconBarChart,
    IconLink,
    IconDashboard,
    IconApps,
    IconUser,
    IconHistory,
    IconSettings,
    IconFile,
};

// 获取图标组件
const getIconComponent = (iconName) => {
    return iconMap[iconName] || IconFile;
};

// 从路由树获取菜单分组
const menuGroups = computed(() => {
    return getDashboardMenuRoutes(props.isAdmin);
});

// 当前选中的路由 key
const currentRouteKey = computed(() => {
    return route.name || "";
});

// 菜单点击处理
const handleMenuClick = (key) => {
    const allRoutes = [
        ...menuGroups.value.main,
        ...menuGroups.value.user,
        ...menuGroups.value.admin,
    ];
    const targetRoute = allRoutes.find((item) => item.key === key);
    if (targetRoute) {
        router.push(targetRoute.path);
    }
};
</script>
