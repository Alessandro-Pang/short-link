<template>
    <div class="link-config-form">
        <!-- 基础配置 -->
        <div class="config-section">
            <div class="section-title">基础配置</div>
            <div class="section-content">
                <!-- 链接标题 -->
                <div class="form-item">
                    <div class="form-label">链接标题</div>
                    <a-input
                        v-model="formData.title"
                        placeholder="可选，为链接添加描述性标题"
                        :max-length="100"
                        allow-clear
                    />
                </div>

                <!-- 有效期 -->
                <div class="form-item">
                    <div class="form-label">有效期</div>
                    <a-radio-group
                        v-model="expirationMode"
                        type="button"
                        class="mb-2 w-full"
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
                        class="w-full mt-2"
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

                    <div v-if="expirationMode === 'none'" class="form-tip mt-2">
                        链接将永久有效
                    </div>
                </div>

                <!-- 重定向方式 -->
                <div class="form-item">
                    <div class="form-label">重定向方式</div>
                    <a-select v-model="formData.redirect_type" class="w-full">
                        <a-option
                            v-for="option in redirectTypeOptions"
                            :key="option.value"
                            :value="option.value"
                        >
                            <div class="select-option-content">
                                <span class="option-label">{{
                                    option.label
                                }}</span>
                                <span class="option-desc">{{
                                    option.description
                                }}</span>
                            </div>
                        </a-option>
                    </a-select>
                </div>

                <!-- 访问次数限制 -->
                <div class="form-item">
                    <div class="form-label">访问次数限制</div>
                    <a-input-number
                        v-model="formData.max_clicks"
                        placeholder="不限制"
                        :min="1"
                        :max="1000000"
                        :step="1"
                        hide-button
                        class="w-full"
                    >
                        <template #suffix>
                            <span class="input-suffix">次</span>
                        </template>
                    </a-input-number>
                    <div class="form-tip">达到限制次数后链接将自动失效</div>
                </div>
            </div>
        </div>

        <!-- 参数透传 -->
        <div class="config-section">
            <div class="section-title">参数透传</div>
            <div class="section-content">
                <!-- URL 参数透传 -->
                <div class="form-item-row">
                    <div class="row-content">
                        <div class="row-title">URL 参数透传</div>
                        <div class="row-desc">
                            访问短链接时的 URL 参数会自动追加到目标链接
                        </div>
                    </div>
                    <div class="row-action">
                        <a-switch v-model="formData.pass_query_params" />
                    </div>
                </div>

                <!-- Header 转发 -->
                <div class="form-item-row">
                    <div class="row-content">
                        <div class="row-title">请求头转发</div>
                        <div class="row-desc">
                            转发指定的 HTTP 请求头到目标链接
                        </div>
                    </div>
                    <div class="row-action">
                        <a-switch v-model="formData.forward_headers" />
                    </div>
                </div>

                <!-- 转发的 Header 列表 -->
                <div v-if="formData.forward_headers" class="form-item">
                    <div class="form-label">需要转发的请求头</div>
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
                    </a-select>
                </div>
            </div>
        </div>

        <!-- 访问限制 -->
        <div class="config-section">
            <div class="section-title">访问限制</div>
            <div class="section-content">
                <!-- 设备限制 -->
                <div class="form-item">
                    <div class="form-label">允许的设备类型</div>
                    <a-checkbox-group
                        v-model="accessRestrictions.allowed_devices"
                        class="device-checkbox-group"
                    >
                        <a-checkbox value="mobile">
                            <div class="checkbox-content">
                                <icon-mobile />
                                <span>手机</span>
                            </div>
                        </a-checkbox>
                        <a-checkbox value="tablet">
                            <div class="checkbox-content">
                                <icon-desktop />
                                <span>平板</span>
                            </div>
                        </a-checkbox>
                        <a-checkbox value="desktop">
                            <div class="checkbox-content">
                                <icon-computer />
                                <span>桌面设备</span>
                            </div>
                        </a-checkbox>
                    </a-checkbox-group>
                    <div class="form-tip">不选则允许所有设备访问</div>
                </div>

                <!-- IP 白名单 -->
                <div class="form-item">
                    <div class="form-label">IP 白名单</div>
                    <a-input-tag
                        v-model="accessRestrictions.ip_whitelist"
                        placeholder="输入 IP 地址后回车，支持 CIDR 格式"
                        allow-clear
                        class="w-full"
                    />
                    <div class="form-tip">
                        例如: 192.168.1.1 或 192.168.1.0/24，设置后只有这些 IP
                        可以访问
                    </div>
                </div>

                <!-- IP 黑名单 -->
                <div class="form-item">
                    <div class="form-label">IP 黑名单</div>
                    <a-input-tag
                        v-model="accessRestrictions.ip_blacklist"
                        placeholder="输入 IP 地址后回车，支持 CIDR 格式"
                        allow-clear
                        class="w-full"
                    />
                    <div class="form-tip">这些 IP 将被禁止访问</div>
                </div>

                <!-- 来源限制 -->
                <div class="form-item">
                    <div class="form-label">允许的来源域名</div>
                    <a-input-tag
                        v-model="accessRestrictions.allowed_referrers"
                        placeholder="输入域名后回车"
                        allow-clear
                        class="w-full"
                    />
                    <div class="form-tip">
                        例如: google.com，设置后只有从这些来源访问才有效
                    </div>
                </div>

                <!-- 禁止的来源 -->
                <div class="form-item">
                    <div class="form-label">禁止的来源域名</div>
                    <a-input-tag
                        v-model="accessRestrictions.blocked_referrers"
                        placeholder="输入域名后回车"
                        allow-clear
                        class="w-full"
                    />
                    <div class="form-tip">从这些来源的访问将被拒绝</div>
                </div>

                <!-- 国家/地区限制 -->
                <div class="form-item">
                    <div class="form-label">允许的国家/地区</div>
                    <a-select
                        v-model="accessRestrictions.allowed_countries"
                        multiple
                        allow-search
                        placeholder="选择国家/地区"
                        allow-clear
                        class="w-full"
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
                    </a-select>
                    <div class="form-tip">
                        需要部署在支持地理位置的服务商（如 Cloudflare）
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from "vue";
import {
    IconMobile,
    IconDesktop,
    IconComputer,
} from "@arco-design/web-vue/es/icon";
import { getExpirationOptions, REDIRECT_TYPE_OPTIONS } from "@/services/api";

const props = defineProps({
    modelValue: {
        type: Object,
        default: () => ({}),
    },
});

const emit = defineEmits(["update:modelValue"]);

// 过期时间选项
const expirationOptions = ref([]);
const redirectTypeOptions = REDIRECT_TYPE_OPTIONS;

// 有效期模式: preset, custom, none
const expirationMode = ref("none");

// 表单数据
const formData = reactive({
    title: "",
    expiration_option_id: null,
    expiration_date: null,
    redirect_type: 302,
    max_clicks: null,
    pass_query_params: false,
    forward_headers: false,
    forward_header_list: [],
});

// 访问限制单独管理
const accessRestrictions = reactive({
    ip_whitelist: [],
    ip_blacklist: [],
    allowed_countries: [],
    blocked_countries: [],
    allowed_devices: [],
    allowed_referrers: [],
    blocked_referrers: [],
});

// 加载过期时间选项
onMounted(async () => {
    try {
        const result = await getExpirationOptions();
        expirationOptions.value = result.data || [];
    } catch (error) {
        console.error("获取过期时间选项失败:", error);
    }
});

// 监听 modelValue 变化，同步到表单
watch(
    () => props.modelValue,
    (newVal) => {
        if (newVal) {
            Object.assign(formData, {
                title: newVal.title || "",
                expiration_option_id: newVal.expiration_option_id || null,
                expiration_date: newVal.expiration_date || null,
                redirect_type: newVal.redirect_type || 302,
                max_clicks: newVal.max_clicks || null,
                pass_query_params: newVal.pass_query_params || false,
                forward_headers: newVal.forward_headers || false,
                forward_header_list: newVal.forward_header_list || [],
            });

            // 设置有效期模式
            if (newVal.expiration_date) {
                expirationMode.value = "custom";
            } else if (newVal.expiration_option_id) {
                expirationMode.value = "preset";
            } else {
                expirationMode.value = "none";
            }

            if (newVal.access_restrictions) {
                Object.assign(accessRestrictions, newVal.access_restrictions);
            }
        }
    },
    { immediate: true, deep: true },
);

// 监听有效期模式变化，清理相关数据
watch(expirationMode, (newMode) => {
    if (newMode === "preset") {
        formData.expiration_date = null;
    } else if (newMode === "custom") {
        formData.expiration_option_id = null;
    } else {
        // none
        formData.expiration_option_id = null;
        formData.expiration_date = null;
    }
});

// 监听表单变化，向上传递
watch(
    [formData, accessRestrictions],
    () => {
        // 构建配置对象
        const config = {
            ...formData,
            access_restrictions: cleanAccessRestrictions(accessRestrictions),
        };

        emit("update:modelValue", config);
    },
    { deep: true },
);

// 清理空的访问限制配置
function cleanAccessRestrictions(restrictions) {
    const cleaned = {};
    for (const [key, value] of Object.entries(restrictions)) {
        if (Array.isArray(value) && value.length > 0) {
            cleaned[key] = value;
        }
    }
    return Object.keys(cleaned).length > 0 ? cleaned : null;
}
</script>

<style scoped>
.link-config-form {
    padding: 0 4px;
}

.config-section {
    margin-bottom: 24px;
}

.config-section:last-child {
    margin-bottom: 0;
}

.section-title {
    font-size: 14px;
    font-weight: 600;
    color: #1d2129;
    padding-bottom: 12px;
    margin-bottom: 16px;
    border-bottom: 1px solid #e5e6eb;
}

.section-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.form-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.form-label {
    font-size: 13px;
    font-weight: 500;
    color: #4e5969;
}

.form-tip {
    font-size: 12px;
    color: #86909c;
    line-height: 1.5;
}

.input-suffix {
    font-size: 13px;
    color: #86909c;
}

/* 开关行样式 */
.form-item-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 12px 16px;
    background-color: #f7f8fa;
    border-radius: 8px;
    gap: 16px;
}

.row-content {
    flex: 1;
    min-width: 0;
}

.row-title {
    font-size: 14px;
    font-weight: 500;
    color: #1d2129;
    margin-bottom: 4px;
}

.row-desc {
    font-size: 12px;
    color: #86909c;
    line-height: 1.5;
}

.row-action {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    padding-top: 2px;
}

/* 设备选择框组 */
.device-checkbox-group {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
}

.checkbox-content {
    display: inline-flex;
    align-items: center;
    gap: 4px;
}

/* 下拉选项样式 */
.select-option-content {
    display: flex;
    flex-direction: column;
    padding: 4px 0;
}

.option-label {
    font-size: 14px;
    color: #1d2129;
}

.option-desc {
    font-size: 12px;
    color: #86909c;
    margin-top: 2px;
}

/* 全宽样式 */
.w-full {
    width: 100%;
}

.mb-2 {
    margin-bottom: 8px;
}

.mt-2 {
    margin-top: 8px;
}

/* 覆盖 arco 组件默认样式 */
:deep(.arco-input-wrapper) {
    width: 100%;
}

:deep(.arco-select) {
    width: 100%;
}

:deep(.arco-input-number) {
    width: 100%;
}

:deep(.arco-input-tag) {
    width: 100%;
}

:deep(.arco-checkbox-group) {
    width: 100%;
}

:deep(.arco-switch) {
    flex-shrink: 0;
}

:deep(.arco-radio-group) {
    display: flex;
    width: 100%;
}

:deep(.arco-radio-group .arco-radio-button) {
    flex: 1;
    text-align: center;
}

:deep(.arco-picker) {
    width: 100%;
}
</style>
