<template>
    <a-drawer
        v-model:visible="visible"
        :title="drawerTitle"
        :width="480"
        placement="right"
        :mask-closable="!isSubmitting"
        :closable="!isSubmitting"
        unmount-on-close
        @cancel="handleClose"
    >
        <a-spin :loading="isLoading" class="w-full">
            <a-form
                ref="formRef"
                :model="formData"
                :rules="rules"
                layout="vertical"
                size="medium"
            >
                <!-- 管理员模式标识 -->
                <a-alert v-if="mode === 'admin'" type="warning" class="mb-4">
                    <template #icon><icon-lock /></template>
                    您正在以管理员身份编辑此链接
                </a-alert>

                <!-- 链接所有者信息（仅管理员模式显示） -->
                <a-form-item
                    v-if="mode === 'admin' && !isNew"
                    label="链接所有者"
                >
                    <div class="flex items-center gap-2">
                        <a-tag
                            v-if="linkData?.user_id"
                            color="arcoblue"
                            size="medium"
                        >
                            <template #icon><icon-user /></template>
                            注册用户
                        </a-tag>
                        <a-tag v-else color="gray" size="medium">
                            <template #icon><icon-eye-invisible /></template>
                            匿名用户
                        </a-tag>
                        <span
                            v-if="linkData?.user_id"
                            class="text-gray-400 text-xs truncate max-w-40"
                        >
                            ID: {{ linkData.user_id }}
                        </span>
                    </div>
                </a-form-item>

                <!-- 基础信息 -->
                <FormSection title="基础信息">
                    <!-- 原始链接（仅新建时可编辑） -->
                    <a-form-item v-if="isNew" label="原始链接" field="link">
                        <a-input
                            v-model="formData.link"
                            placeholder="请输入要缩短的链接"
                            allow-clear
                        >
                            <template #prefix>
                                <icon-link />
                            </template>
                        </a-input>
                    </a-form-item>

                    <!-- 原始链接展示（编辑时） -->
                    <a-form-item v-else label="原始链接">
                        <div
                            class="text-gray-600 break-all bg-gray-50 p-3 rounded-lg text-sm"
                        >
                            {{ formData.link }}
                        </div>
                    </a-form-item>

                    <!-- 短链接（仅编辑模式且管理员模式显示） -->
                    <a-form-item
                        v-if="!isNew && mode === 'admin'"
                        label="短链接"
                    >
                        <div class="flex items-center gap-2">
                            <a-link
                                :href="`${origin}/u/${linkData?.short}`"
                                target="_blank"
                                class="text-blue-600"
                            >
                                {{ origin }}/u/{{ linkData?.short }}
                            </a-link>
                            <a-button
                                size="mini"
                                type="text"
                                @click="copyShortLink"
                                class="text-gray-400"
                            >
                                <template #icon><icon-copy /></template>
                            </a-button>
                        </div>
                    </a-form-item>

                    <!-- 链接标题 -->
                    <a-form-item label="链接标题" field="title">
                        <a-input
                            v-model="formData.title"
                            placeholder="可选，为链接添加描述性标题"
                            :max-length="100"
                            show-word-limit
                            allow-clear
                        />
                    </a-form-item>

                    <!-- 链接描述 -->
                    <a-form-item label="链接描述" field="description">
                        <a-textarea
                            v-model="formData.description"
                            placeholder="可选，添加备注说明"
                            :max-length="500"
                            show-word-limit
                            :auto-size="{ minRows: 2, maxRows: 4 }"
                        />
                    </a-form-item>

                    <!-- 启用状态 -->
                    <a-form-item label="启用状态">
                        <div class="status-row">
                            <span class="status-text">
                                {{
                                    formData.is_active
                                        ? "链接已启用，可正常访问"
                                        : "链接已禁用，无法访问"
                                }}
                            </span>
                            <a-switch
                                v-model="formData.is_active"
                                :checked-value="true"
                                :unchecked-value="false"
                            >
                                <template #checked>启用</template>
                                <template #unchecked>禁用</template>
                            </a-switch>
                        </div>
                    </a-form-item>
                </FormSection>

                <!-- 统计信息（仅编辑模式且管理员模式显示） -->
                <FormSection v-if="!isNew && mode === 'admin'" title="统计信息">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <div class="text-gray-400 text-xs mb-1">
                                点击次数
                            </div>
                            <div class="text-xl font-bold text-gray-800">
                                {{ linkData?.click_count || 0 }}
                            </div>
                        </div>
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <div class="text-gray-400 text-xs mb-1">
                                创建时间
                            </div>
                            <div class="text-sm text-gray-800">
                                {{ formatDate(linkData?.created_at) }}
                            </div>
                        </div>
                    </div>
                </FormSection>

                <!-- 重定向配置 -->
                <FormSection title="重定向配置">
                    <!-- 重定向方式 -->
                    <a-form-item label="重定向方式" field="redirect_type">
                        <a-select
                            v-model="formData.redirect_type"
                            placeholder="选择重定向方式"
                            class="w-full"
                        >
                            <a-option
                                v-for="option in redirectTypeOptions"
                                :key="option.value"
                                :value="option.value"
                            >
                                <div class="select-option-item">
                                    <span class="option-label">{{
                                        option.label
                                    }}</span>
                                    <span class="option-desc">{{
                                        option.description
                                    }}</span>
                                </div>
                            </a-option>
                        </a-select>
                    </a-form-item>

                    <!-- URL 参数透传 -->
                    <a-form-item>
                        <SwitchRow
                            v-model="formData.pass_query_params"
                            title="URL 参数透传"
                            description="访问短链接时的 URL 参数会自动追加到目标链接"
                        />
                    </a-form-item>

                    <!-- Header 转发 -->
                    <a-form-item>
                        <SwitchRow
                            v-model="formData.forward_headers"
                            title="请求头转发"
                            description="转发指定的 HTTP 请求头到目标链接"
                        />
                    </a-form-item>

                    <!-- 转发的 Header 列表 -->
                    <a-form-item
                        v-if="formData.forward_headers"
                        label="需要转发的请求头"
                    >
                        <a-select
                            v-model="formData.forward_header_list"
                            multiple
                            allow-create
                            placeholder="选择或输入请求头名称"
                            class="w-full"
                        >
                            <a-option value="User-Agent">User-Agent</a-option>
                            <a-option value="Accept-Language"
                                >Accept-Language</a-option
                            >
                            <a-option value="Referer">Referer</a-option>
                            <a-option value="X-Forwarded-For"
                                >X-Forwarded-For</a-option
                            >
                            <a-option value="Cookie">Cookie</a-option>
                        </a-select>
                    </a-form-item>
                </FormSection>

                <!-- 访问限制 -->
                <FormSection title="访问限制">
                    <!-- 有效期 -->
                    <a-form-item label="有效期">
                        <a-radio-group
                            v-model="expirationMode"
                            type="button"
                            class="mb-2"
                        >
                            <a-radio value="preset">预设选项</a-radio>
                            <a-radio value="custom">自定义时间</a-radio>
                            <a-radio value="none">不限制</a-radio>
                        </a-radio-group>

                        <a-select
                            v-if="expirationMode === 'preset'"
                            v-model="formData.expiration_option_id"
                            placeholder="选择有效期"
                            allow-clear
                            class="mt-2"
                        >
                            <a-option
                                v-for="option in expirationOptions"
                                :key="option.id"
                                :value="option.id"
                            >
                                {{ option.name }}
                            </a-option>
                        </a-select>

                        <a-date-picker
                            v-else-if="expirationMode === 'custom'"
                            v-model="formData.expiration_date"
                            show-time
                            format="YYYY-MM-DD HH:mm:ss"
                            placeholder="选择过期时间"
                            class="w-full! mt-2"
                            :disabled-date="(current) => current < new Date()"
                        />

                        <div
                            v-if="formData.expiration_date && !isNew"
                            class="mt-2 text-sm"
                        >
                            <span class="text-gray-500">当前过期时间：</span>
                            <span
                                :class="
                                    isExpired
                                        ? 'text-red-500'
                                        : 'text-green-600'
                                "
                            >
                                {{ formatDate(formData.expiration_date) }}
                                <a-tag
                                    v-if="isExpired"
                                    color="red"
                                    size="small"
                                    class="ml-2"
                                    >已过期</a-tag
                                >
                            </span>
                        </div>
                    </a-form-item>

                    <!-- 访问次数限制 -->
                    <a-form-item label="访问次数限制">
                        <a-input-number
                            v-model="formData.max_clicks"
                            placeholder="不限制"
                            :min="1"
                            :max="10000000"
                            :step="1"
                            hide-button
                            class="w-full!"
                        >
                            <template #suffix>
                                <span class="text-gray-400 text-sm">次</span>
                            </template>
                        </a-input-number>
                        <template #extra>
                            <div class="flex items-center justify-between">
                                <span class="text-xs text-gray-400">
                                    达到限制次数后链接将自动失效
                                </span>
                                <span
                                    v-if="!isNew && formData.max_clicks"
                                    class="text-xs"
                                >
                                    已使用: {{ linkData?.click_count || 0 }} /
                                    {{ formData.max_clicks }}
                                </span>
                            </div>
                        </template>
                    </a-form-item>

                    <!-- 设备限制 -->
                    <a-form-item label="允许的设备类型">
                        <a-checkbox-group
                            v-model="accessRestrictions.allowed_devices"
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
                            v-model="accessRestrictions.ip_whitelist"
                            placeholder="输入 IP 地址后回车，支持 CIDR 格式"
                            allow-clear
                        />
                        <template #extra>
                            <span class="text-xs text-gray-400">
                                例如: 192.168.1.1 或
                                192.168.1.0/24，设置后只有这些 IP 可以访问
                            </span>
                        </template>
                    </a-form-item>

                    <!-- IP 黑名单 -->
                    <a-form-item label="IP 黑名单">
                        <a-input-tag
                            v-model="accessRestrictions.ip_blacklist"
                            placeholder="输入 IP 地址后回车，支持 CIDR 格式"
                            allow-clear
                        />
                        <template #extra>
                            <span class="text-xs text-gray-400"
                                >这些 IP 将被禁止访问</span
                            >
                        </template>
                    </a-form-item>

                    <!-- 来源限制 -->
                    <a-form-item label="允许的来源域名">
                        <a-input-tag
                            v-model="accessRestrictions.allowed_referrers"
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
                            v-model="accessRestrictions.blocked_referrers"
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
                            v-model="accessRestrictions.allowed_countries"
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
                </FormSection>
            </a-form>
        </a-spin>

        <template #footer>
            <div class="flex justify-between items-center w-full">
                <div>
                    <a-popconfirm
                        v-if="!isNew"
                        content="确定要删除这个链接吗？此操作不可恢复。"
                        type="warning"
                        @ok="handleDelete"
                    >
                        <a-button
                            type="text"
                            status="danger"
                            :loading="isDeleting"
                        >
                            <template #icon><icon-delete /></template>
                            删除
                        </a-button>
                    </a-popconfirm>
                </div>
                <a-space>
                    <a-button @click="handleClose" :disabled="isSubmitting"
                        >取消</a-button
                    >
                    <a-button
                        type="primary"
                        @click="handleSubmit"
                        :loading="isSubmitting"
                    >
                        {{ isNew ? "创建" : "保存" }}
                    </a-button>
                </a-space>
            </div>
        </template>
    </a-drawer>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { Message } from "@arco-design/web-vue";
import {
    IconLink,
    IconLock,
    IconUser,
    IconEyeInvisible,
    IconCopy,
    IconMobile,
    IconDesktop,
    IconComputer,
    IconDelete,
} from "@arco-design/web-vue/es/icon";
import { REDIRECT_TYPE_OPTIONS } from "@/services/api";
import * as userApi from "@/services/api";
import * as adminApi from "@/services/admin";
import { useLinkForm } from "@/composables/useLinkForm";
import FormSection from "@/components/base/FormSection.vue";
import SwitchRow from "@/components/base/SwitchRow.vue";

const props = withDefaults(
    defineProps<{
        visible: boolean;
        linkId?: number | string | null;
        mode?: "user" | "admin";
    }>(),
    {
        mode: "user",
        linkId: null,
    },
);

const emit = defineEmits<{
    (e: "update:visible", value: boolean): void;
    (e: "success"): void;
    (e: "delete", id: number | string): void;
}>();

const origin = window.location.origin;

// Computed
const visible = computed({
    get: () => props.visible,
    set: (val) => emit("update:visible", val),
});

const isNew = computed(() => !props.linkId);

const drawerTitle = computed(() => {
    if (isNew.value) return "创建链接";
    return props.mode === "admin" ? "编辑链接（管理员）" : "编辑链接";
});

// 根据模式选择 API
const apiService = computed(() =>
    props.mode === "admin" ? adminApi : userApi,
);

// 使用 composable
const {
    isLoading,
    isSubmitting,
    isDeleting,
    linkData,
    expirationOptions,
    expirationMode,
    formData,
    accessRestrictions,
    isExpired,
    formatDate,
    loadExpirationOptions,
    loadLinkDetail,
    resetForm,
    submitForm,
    deleteFormLink,
} = useLinkForm(
    computed(() => props.linkId),
    apiService.value,
    isNew,
);

// 表单引用
const formRef = ref(null);

// 重定向类型选项
const redirectTypeOptions = REDIRECT_TYPE_OPTIONS;

// 表单验证规则
const rules = {
    link: [
        { required: true, message: "请输入原始链接" },
        {
            validator: (value: string, cb: (msg?: string) => void) => {
                if (value && !/^(https?:\/\/|#小程序:\/\/)/.test(value)) {
                    cb("链接必须以 http://、https:// 或 #小程序:// 开头");
                } else {
                    cb();
                }
            },
        },
    ],
};

// 复制短链接
const copyShortLink = async () => {
    if (!linkData.value?.short) return;
    const url = `${origin}/u/${linkData.value.short}`;
    try {
        await navigator.clipboard.writeText(url);
        Message.success("链接已复制到剪贴板");
    } catch (error) {
        Message.error("复制失败，请手动复制");
    }
};

// 提交表单
const handleSubmit = async () => {
    try {
        const valid = await (formRef.value as any)?.validate();
        if (valid) return;

        await submitForm();

        Message.success(isNew.value ? "链接创建成功" : "链接更新成功");
        emit("success");
        handleClose();
    } catch (error: any) {
        console.error("提交失败:", error);
        Message.error(error.message || "操作失败");
    }
};

// 删除链接
const handleDelete = async () => {
    try {
        await deleteFormLink();
        Message.success("链接已删除");
        emit("delete", props.linkId!);
        handleClose();
    } catch (error: any) {
        console.error("删除失败:", error);
        Message.error(error.message || "删除失败");
    }
};

// 关闭抽屉
const handleClose = () => {
    visible.value = false;
    resetForm();
};

// 监听 visible 变化
watch(
    () => props.visible,
    (val) => {
        if (val) {
            loadExpirationOptions();
            if (props.linkId) {
                loadLinkDetail();
            } else {
                resetForm();
            }
        }
    },
    { immediate: true },
);
</script>

<style scoped>
.w-full {
    width: 100%;
}

/* 状态行样式 */
.status-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 12px 16px;
    background-color: #f7f8fa;
    border-radius: 8px;
}

.status-text {
    font-size: 13px;
    color: #4e5969;
}

/* 下拉选项样式 */
.select-option-item {
    display: flex;
    flex-direction: column;
    padding: 4px 0;
}

.option-label {
    font-size: 14px;
    font-weight: 500;
    color: #1d2129;
}

.option-desc {
    font-size: 12px;
    color: #86909c;
    margin-top: 2px;
}

/* 覆盖 arco 组件样式 */
:deep(.arco-drawer-body) {
    padding: 16px 24px;
    background-color: #fafafa;
}

:deep(.arco-drawer-footer) {
    padding: 12px 24px;
    border-top: 1px solid #e5e6eb;
}

:deep(.arco-form-item) {
    margin-bottom: 18px;
}

:deep(.arco-form-item-label) {
    font-weight: 500;
    color: #4e5969;
}

:deep(.arco-select),
:deep(.arco-input-wrapper),
:deep(.arco-input-number),
:deep(.arco-input-tag),
:deep(.arco-picker) {
    width: 100%;
}

:deep(.arco-switch) {
    flex-shrink: 0;
}

:deep(.arco-checkbox-group) {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
}

.mb-4 {
    margin-bottom: 16px;
}

.mb-2 {
    margin-bottom: 8px;
}

.mt-2 {
    margin-top: 8px;
}

.ml-2 {
    margin-left: 8px;
}

.flex {
    display: flex;
}

.items-center {
    align-items: center;
}

.justify-between {
    justify-content: space-between;
}

.gap-1 {
    gap: 4px;
}

.gap-2 {
    gap: 8px;
}

.gap-4 {
    gap: 16px;
}

.grid {
    display: grid;
}

.grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
}

.text-xs {
    font-size: 12px;
}

.text-sm {
    font-size: 14px;
}

.text-xl {
    font-size: 20px;
}

.text-gray-400 {
    color: #86909c;
}

.text-gray-600 {
    color: #86909c;
}

.text-gray-800 {
    color: #1d2129;
}

.text-blue-600 {
    color: #165dff;
}

.text-red-500 {
    color: #f53f3f;
}

.text-green-600 {
    color: #00b42a;
}

.text-gray-500 {
    color: #86909c;
}

.bg-gray-50 {
    background-color: #f7f8fa;
}

.p-3 {
    padding: 12px;
}

.p-4 {
    padding: 16px;
}

.rounded-lg {
    border-radius: 8px;
}

.break-all {
    word-break: break-all;
}

.truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.max-w-40 {
    max-width: 160px;
}

.font-bold {
    font-weight: 700;
}
</style>
