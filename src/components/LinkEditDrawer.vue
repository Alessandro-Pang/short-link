<template>
    <a-drawer
        v-model:visible="visible"
        :title="isNew ? '创建链接' : '编辑链接'"
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
                <!-- 基础信息 -->
                <a-divider orientation="left">基础信息</a-divider>

                <!-- 原始链接（仅新建时可编辑） -->
                <a-form-item
                    v-if="isNew"
                    label="原始链接"
                    field="link"
                    :rules="[{ required: true, message: '请输入原始链接' }]"
                >
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

                <!-- 重定向配置 -->
                <a-divider orientation="left">重定向配置</a-divider>

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
                    <div class="switch-row">
                        <div class="switch-content">
                            <div class="switch-title">URL 参数透传</div>
                            <div class="switch-desc">
                                访问短链接时的 URL 参数会自动追加到目标链接
                            </div>
                        </div>
                        <div class="switch-action">
                            <a-switch v-model="formData.pass_query_params" />
                        </div>
                    </div>
                </a-form-item>

                <!-- Header 转发 -->
                <a-form-item>
                    <div class="switch-row">
                        <div class="switch-content">
                            <div class="switch-title">请求头转发</div>
                            <div class="switch-desc">
                                转发指定的 HTTP 请求头到目标链接
                            </div>
                        </div>
                        <div class="switch-action">
                            <a-switch v-model="formData.forward_headers" />
                        </div>
                    </div>
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

                <!-- 访问限制 -->
                <a-divider orientation="left">访问限制</a-divider>

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
                                isExpired ? 'text-red-500' : 'text-green-600'
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
                            例如: 192.168.1.1 或 192.168.1.0/24，设置后只有这些
                            IP 可以访问
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

<script setup>
import { ref, reactive, computed, watch, onMounted } from "vue";
import { Message } from "@arco-design/web-vue";
import {
    IconLink,
    IconMobile,
    IconDesktop,
    IconComputer,
    IconDelete,
} from "@arco-design/web-vue/es/icon";
import {
    getExpirationOptions,
    getLinkDetail,
    updateLink,
    deleteLink,
    addUrl,
    REDIRECT_TYPE_OPTIONS,
} from "@/services/api.js";

const props = defineProps({
    visible: {
        type: Boolean,
        default: false,
    },
    linkId: {
        type: [Number, String],
        default: null,
    },
});

const emit = defineEmits(["update:visible", "success", "delete"]);

// State
const visible = computed({
    get: () => props.visible,
    set: (val) => emit("update:visible", val),
});

const isNew = computed(() => !props.linkId);
const isLoading = ref(false);
const isSubmitting = ref(false);
const isDeleting = ref(false);
const formRef = ref(null);
const linkData = ref(null);
const expirationOptions = ref([]);
const expirationMode = ref("none");
const redirectTypeOptions = REDIRECT_TYPE_OPTIONS;

// 表单数据
const formData = reactive({
    link: "",
    title: "",
    description: "",
    is_active: true,
    redirect_type: 302,
    pass_query_params: false,
    forward_headers: false,
    forward_header_list: [],
    expiration_option_id: null,
    expiration_date: null,
    max_clicks: null,
});

// 访问限制
const accessRestrictions = reactive({
    ip_whitelist: [],
    ip_blacklist: [],
    allowed_countries: [],
    blocked_countries: [],
    allowed_devices: [],
    allowed_referrers: [],
    blocked_referrers: [],
});

// 表单验证规则
const rules = {
    link: [
        { required: true, message: "请输入原始链接" },
        {
            validator: (value, cb) => {
                if (value && !/^(https?:\/\/|#小程序:\/\/)/.test(value)) {
                    cb("链接必须以 http://、https:// 或 #小程序:// 开头");
                } else {
                    cb();
                }
            },
        },
    ],
};

// 计算是否已过期
const isExpired = computed(() => {
    if (!formData.expiration_date) return false;
    return new Date(formData.expiration_date) < new Date();
});

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

// 加载过期时间选项
const loadExpirationOptions = async () => {
    try {
        const result = await getExpirationOptions();
        expirationOptions.value = result.data || [];
    } catch (error) {
        console.error("获取过期时间选项失败:", error);
    }
};

// 加载链接详情
const loadLinkDetail = async () => {
    if (!props.linkId) return;

    isLoading.value = true;
    try {
        const result = await getLinkDetail(props.linkId);
        linkData.value = result.data;

        // 填充表单数据
        Object.assign(formData, {
            link: result.data.link || "",
            title: result.data.title || "",
            description: result.data.description || "",
            is_active: result.data.is_active !== false,
            redirect_type: result.data.redirect_type || 302,
            pass_query_params: result.data.pass_query_params || false,
            forward_headers: result.data.forward_headers || false,
            forward_header_list: result.data.forward_header_list || [],
            expiration_date: result.data.expiration_date || null,
            max_clicks: result.data.max_clicks || null,
        });

        // 设置过期模式
        if (result.data.expiration_date) {
            expirationMode.value = "custom";
        } else {
            expirationMode.value = "none";
        }

        // 填充访问限制
        if (result.data.access_restrictions) {
            Object.assign(accessRestrictions, {
                ip_whitelist:
                    result.data.access_restrictions.ip_whitelist || [],
                ip_blacklist:
                    result.data.access_restrictions.ip_blacklist || [],
                allowed_countries:
                    result.data.access_restrictions.allowed_countries || [],
                blocked_countries:
                    result.data.access_restrictions.blocked_countries || [],
                allowed_devices:
                    result.data.access_restrictions.allowed_devices || [],
                allowed_referrers:
                    result.data.access_restrictions.allowed_referrers || [],
                blocked_referrers:
                    result.data.access_restrictions.blocked_referrers || [],
            });
        }
    } catch (error) {
        console.error("加载链接详情失败:", error);
        Message.error("加载链接详情失败");
    } finally {
        isLoading.value = false;
    }
};

// 重置表单
const resetForm = () => {
    Object.assign(formData, {
        link: "",
        title: "",
        description: "",
        is_active: true,
        redirect_type: 302,
        pass_query_params: false,
        forward_headers: false,
        forward_header_list: [],
        expiration_option_id: null,
        expiration_date: null,
        max_clicks: null,
    });

    Object.assign(accessRestrictions, {
        ip_whitelist: [],
        ip_blacklist: [],
        allowed_countries: [],
        blocked_countries: [],
        allowed_devices: [],
        allowed_referrers: [],
        blocked_referrers: [],
    });

    expirationMode.value = "none";
    linkData.value = null;
};

// 构建提交数据
const buildSubmitData = () => {
    const data = {
        title: formData.title || null,
        description: formData.description || null,
        is_active: formData.is_active,
        redirect_type: formData.redirect_type,
        pass_query_params: formData.pass_query_params,
        forward_headers: formData.forward_headers,
        forward_header_list: formData.forward_headers
            ? formData.forward_header_list
            : [],
        max_clicks: formData.max_clicks || null,
    };

    // 处理过期时间
    if (expirationMode.value === "preset" && formData.expiration_option_id) {
        data.expiration_option_id = formData.expiration_option_id;
    } else if (expirationMode.value === "custom" && formData.expiration_date) {
        data.expiration_date = formData.expiration_date;
    } else {
        data.expiration_date = null;
    }

    // 构建访问限制
    const restrictions = {};
    let hasRestrictions = false;

    for (const [key, value] of Object.entries(accessRestrictions)) {
        if (Array.isArray(value) && value.length > 0) {
            restrictions[key] = value;
            hasRestrictions = true;
        }
    }

    data.access_restrictions = hasRestrictions ? restrictions : null;

    return data;
};

// 提交表单
const handleSubmit = async () => {
    try {
        const valid = await formRef.value?.validate();
        if (valid) return;

        isSubmitting.value = true;

        const submitData = buildSubmitData();

        if (isNew.value) {
            // 创建新链接
            await addUrl(formData.link, submitData);
            Message.success("链接创建成功");
        } else {
            // 更新链接
            await updateLink(props.linkId, submitData);
            Message.success("链接更新成功");
        }

        emit("success");
        handleClose();
    } catch (error) {
        console.error("提交失败:", error);
        Message.error(error.message || "操作失败");
    } finally {
        isSubmitting.value = false;
    }
};

// 删除链接
const handleDelete = async () => {
    if (!props.linkId) return;

    isDeleting.value = true;
    try {
        await deleteLink(props.linkId);
        Message.success("链接已删除");
        emit("delete", props.linkId);
        handleClose();
    } catch (error) {
        console.error("删除失败:", error);
        Message.error(error.message || "删除失败");
    } finally {
        isDeleting.value = false;
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

// 监听过期模式变化
watch(expirationMode, (mode) => {
    if (mode === "none") {
        formData.expiration_option_id = null;
        formData.expiration_date = null;
    } else if (mode === "preset") {
        formData.expiration_date = null;
    } else if (mode === "custom") {
        formData.expiration_option_id = null;
    }
});
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

/* 开关行样式 */
.switch-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    width: 100%;
    padding: 12px 16px;
    background-color: #f7f8fa;
    border-radius: 8px;
    gap: 16px;
}

.switch-content {
    flex: 1;
    min-width: 0;
}

.switch-title {
    font-size: 14px;
    font-weight: 500;
    color: #1d2129;
    margin-bottom: 4px;
}

.switch-desc {
    font-size: 12px;
    color: #86909c;
    line-height: 1.5;
}

.switch-action {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    padding-top: 2px;
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

:deep(.arco-divider-text) {
    font-size: 13px;
    font-weight: 600;
    color: #1d2129;
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
</style>
