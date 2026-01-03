<template>
    <div class="space-y-4">
        <!-- 设备限制 -->
        <a-form-item label="允许的设备类型">
            <a-checkbox-group
                v-model="localRestrictions.allowed_devices"
                class="flex flex-wrap gap-4"
            >
                <a-checkbox value="mobile">
                    <div class="flex items-center gap-1">
                        <icon-mobile />
                        <span>手机</span>
                    </div>
                </a-checkbox>
                <a-checkbox value="tablet">
                    <div class="flex items-center gap-1">
                        <icon-desktop />
                        <span>平板</span>
                    </div>
                </a-checkbox>
                <a-checkbox value="desktop">
                    <div class="flex items-center gap-1">
                        <icon-computer />
                        <span>桌面设备</span>
                    </div>
                </a-checkbox>
            </a-checkbox-group>
            <template #extra>
                <span class="text-xs text-gray-400"
                    >不选则允许所有设备访问</span
                >
            </template>
        </a-form-item>

        <!-- IP 白名单 -->
        <a-form-item label="IP 白名单">
            <a-input-tag
                v-model="localRestrictions.ip_whitelist"
                placeholder="输入 IP 地址后回车，支持 CIDR 格式"
                allow-clear
            />
            <template #extra>
                <span class="text-xs text-gray-400">
                    例如: 192.168.1.1 或 192.168.1.0/24，设置后只有这些 IP
                    可以访问
                </span>
            </template>
        </a-form-item>

        <!-- IP 黑名单 -->
        <a-form-item label="IP 黑名单">
            <a-input-tag
                v-model="localRestrictions.ip_blacklist"
                placeholder="输入 IP 地址后回车，支持 CIDR 格式"
                allow-clear
            />
            <template #extra>
                <span class="text-xs text-gray-400">这些 IP 将被禁止访问</span>
            </template>
        </a-form-item>

        <!-- 来源限制 -->
        <a-form-item label="允许的来源域名">
            <a-input-tag
                v-model="localRestrictions.allowed_referrers"
                placeholder="输入域名后回车"
                allow-clear
            />
            <template #extra>
                <span class="text-xs text-gray-400">
                    例如: google.com，设置后只有从这些来源访问才有效
                </span>
            </template>
        </a-form-item>

        <!-- 禁止的来源 -->
        <a-form-item label="禁止的来源域名">
            <a-input-tag
                v-model="localRestrictions.blocked_referrers"
                placeholder="输入域名后回车"
                allow-clear
            />
            <template #extra>
                <span class="text-xs text-gray-400"
                    >从这些来源的访问将被拒绝</span
                >
            </template>
        </a-form-item>

        <!-- 国家/地区限制 -->
        <a-form-item label="允许的国家/地区">
            <a-select
                v-model="localRestrictions.allowed_countries"
                multiple
                allow-search
                placeholder="选择国家/地区"
                allow-clear
            >
                <a-option value="CN">🇨🇳 中国</a-option>
                <a-option value="US">🇺🇸 美国</a-option>
                <a-option value="JP">🇯🇵 日本</a-option>
                <a-option value="KR">🇰🇷 韩国</a-option>
                <a-option value="GB">🇬🇧 英国</a-option>
                <a-option value="DE">🇩🇪 德国</a-option>
                <a-option value="FR">🇫🇷 法国</a-option>
                <a-option value="SG">🇸🇬 新加坡</a-option>
                <a-option value="HK">🇭🇰 香港</a-option>
                <a-option value="TW">🇹🇼 台湾</a-option>
                <a-option value="AU">🇦🇺 澳大利亚</a-option>
                <a-option value="CA">🇨🇦 加拿大</a-option>
            </a-select>
            <template #extra>
                <span class="text-xs text-gray-400">
                    需要部署在支持地理位置的服务商（如 Cloudflare）
                </span>
            </template>
        </a-form-item>
    </div>
</template>

<script setup lang="ts">
import { IconComputer, IconDesktop, IconMobile } from "@arco-design/web-vue/es/icon";
import { nextTick, reactive, ref, watch } from "vue";

const props = defineProps<{
	modelValue: any;
}>();

const emit = defineEmits<(e: "update:modelValue", value: any) => void>();

const isUpdating = ref(false);

const localRestrictions = reactive({
	allowed_devices: [],
	ip_whitelist: [],
	ip_blacklist: [],
	allowed_referrers: [],
	blocked_referrers: [],
	allowed_countries: [],
});

// 初始化本地值
const initLocalRestrictions = (val: any) => {
	if (!val) {
		Object.assign(localRestrictions, {
			allowed_devices: [],
			ip_whitelist: [],
			ip_blacklist: [],
			allowed_referrers: [],
			blocked_referrers: [],
			allowed_countries: [],
		});
	} else {
		Object.assign(localRestrictions, {
			allowed_devices: val.allowed_devices || [],
			ip_whitelist: val.ip_whitelist || [],
			ip_blacklist: val.ip_blacklist || [],
			allowed_referrers: val.allowed_referrers || [],
			blocked_referrers: val.blocked_referrers || [],
			allowed_countries: val.allowed_countries || [],
		});
	}
};

// 监听 modelValue 变化
watch(
	() => props.modelValue,
	(newVal) => {
		if (isUpdating.value) {
			return;
		}

		isUpdating.value = true;
		initLocalRestrictions(newVal);
		// 使用 nextTick 确保在下一个事件循环中重置标志
		nextTick(() => {
			isUpdating.value = false;
		});
	},
	{ immediate: true, deep: true },
);

// 监听本地值变化
watch(
	localRestrictions,
	(newVal) => {
		if (!isUpdating.value) {
			emit("update:modelValue", { ...newVal });
		}
	},
	{ deep: true },
);
</script>
