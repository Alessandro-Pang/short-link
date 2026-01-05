<script setup lang="ts">
import { Message } from "@arco-design/web-vue";
import {
	IconCopy,
	IconDelete,
	IconEyeInvisible,
	IconLink,
	IconLock,
	IconUser,
} from "@arco-design/web-vue/es/icon";
import { computed, ref, watch } from "vue";
import FormSection from "@/components/base/FormSection.vue";
import SwitchRow from "@/components/base/SwitchRow.vue";
import AccessRestrictions from "@/components/link-config/AccessRestrictions.vue";
import ExpirationSelector from "@/components/link-config/ExpirationSelector.vue";
import { useLinkForm } from "@/composables/useLinkForm";
import * as adminApi from "@/services/admin";
import * as userApi from "@/services/api";
import { REDIRECT_TYPE_OPTIONS } from "@/services/api";

const props = withDefaults(
	defineProps<{
		visible: boolean;
		linkId?: number | string | null;
		mode?: "user" | "admin" | "home";
		initialLink?: string;
	}>(),
	{
		mode: "user",
		linkId: null,
		initialLink: "",
	},
);

const emit = defineEmits<{
	(e: "update:visible", value: boolean): void;
	(e: "success"): void;
	(e: "delete", id: number | string): void;
	(e: "confirm", data: any): void;
}>();

const origin = window.location.origin;

// Computed
const visible = computed({
	get: () => props.visible,
	set: (val) => emit("update:visible", val),
});

const isNew = computed(() => !props.linkId);

const drawerTitle = computed(() => {
	if (props.mode === "home") return "高级配置";
	if (isNew.value) return "创建链接";
	return props.mode === "admin" ? "编辑链接（管理员）" : "编辑链接";
});

// 根据模式选择 API
const apiService = computed(() => (props.mode === "admin" ? adminApi : userApi));

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
	buildSubmitData,
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

		// 首页模式：返回配置数据，不直接创建
		if (props.mode === "home") {
			const configData = buildSubmitData();
			emit("confirm", configData);
			handleClose();
			return;
		}

		// 正常创建/更新流程
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
				// 如果是首页模式且有初始链接，则填充
				if (props.mode === "home" && props.initialLink) {
					formData.link = props.initialLink;
				}
			}
		}
	},
	{ immediate: true },
);
</script>

<template>
    <a-drawer
        v-model:visible="visible"
        :title="drawerTitle"
        :width="480"
        placement="right"
        :mask-closable="false"
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
                    <!-- 原始链接（新建时可编辑，首页模式只读） -->
                    <a-form-item
                        v-if="isNew || mode === 'home'"
                        label="原始链接"
                        field="link"
                    >
                        <a-input
                            v-model="formData.link"
                            placeholder="请输入要缩短的链接"
                            allow-clear
                            :readonly="mode === 'home'"
                            :disabled="mode === 'home'"
                        >
                            <template #prefix>
                                <icon-link />
                            </template>
                        </a-input>
                    </a-form-item>

                    <!-- 原始链接展示（编辑时且非首页模式） -->
                    <a-form-item
                        v-else-if="!isNew && (mode as string) !== 'home'"
                        label="原始链接"
                    >
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

                    <!-- 启用状态（仅编辑模式显示） -->
                    <a-form-item v-if="!isNew" label="启用状态">
                        <div
                            class="flex items-center justify-between w-full px-4 py-3 bg-gray-50 rounded-lg"
                        >
                            <span class="text-sm text-gray-600">
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
                                <div class="flex flex-col py-1">
                                    <span
                                        class="text-sm font-medium text-gray-900"
                                        >{{ option.label }}</span
                                    >
                                    <span
                                        class="text-xs text-gray-400 mt-0.5"
                                        >{{ option.description }}</span
                                    >
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
                        <ExpirationSelector
                            :expiration-mode="expirationMode"
                            :expiration-option-id="
                                formData.expiration_option_id
                            "
                            :expiration-date="formData.expiration_date"
                            :expiration-options="expirationOptions"
                            :is-new="isNew"
                            :is-expired="isExpired"
                            @update:expiration-mode="
                                (val) => (expirationMode = val)
                            "
                            @update:expiration-option-id="
                                (val) => (formData.expiration_option_id = val)
                            "
                            @update:expiration-date="
                                (val) => (formData.expiration_date = val)
                            "
                        />
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
                            class="w-full"
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

                    <!-- 访问密码（新建时显示） -->
                    <a-form-item
                        v-if="isNew || mode === 'home'"
                        label="访问密码"
                    >
                        <a-input-password
                            v-model="formData.password"
                            placeholder="设置密码后访问需要验证"
                            :max-length="50"
                            allow-clear
                            :invisible-button="false"
                        >
                            <template #prefix>
                                <icon-lock />
                            </template>
                        </a-input-password>
                        <template #extra>
                            <span class="text-xs text-gray-400">
                                设置后访问短链接需要输入密码
                            </span>
                        </template>
                    </a-form-item>

                    <!-- 编辑时显示密码状态 -->
                    <a-form-item
                        v-else-if="!isNew && (mode as string) !== 'home'"
                        label="访问密码"
                    >
                        <div class="flex items-center gap-2">
                            <a-tag
                                v-if="linkData?.password_hash"
                                color="orange"
                                size="medium"
                            >
                                <template #icon><icon-lock /></template>
                                已设置密码
                            </a-tag>
                            <a-tag v-else color="gray" size="medium">
                                无密码保护
                            </a-tag>
                        </div>
                        <template #extra>
                            <span class="text-xs text-gray-400">
                                密码管理请使用表格操作列中的"密码"按钮
                            </span>
                        </template>
                    </a-form-item>

                    <!-- 访问限制配置 -->
                    <AccessRestrictions
                        :modelValue="accessRestrictions"
                        @update:modelValue="
                            (val) => {
                                Object.assign(accessRestrictions, val);
                            }
                        "
                    />
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
                        {{ mode === "home" ? "确认" : isNew ? "创建" : "保存" }}
                    </a-button>
                </a-space>
            </div>
        </template>
    </a-drawer>
</template>

<style scoped>
:deep(.arco-drawer-body) {
    padding: 16px 24px;
}

:deep(.arco-drawer-footer) {
    padding: 12px 24px;
}

:deep(.arco-form-item) {
    margin-bottom: 18px;
}

:deep(.arco-form-item-label) {
    font-weight: 500;
}

/* 亮色模式样式 */
:deep(.arco-drawer-body) {
    background-color: #fafafa;
}

:deep(.arco-drawer-footer) {
    border-top: 1px solid #e5e6eb;
}

:deep(.arco-form-item-label) {
    color: #4e5969;
}

/* 暗色模式样式 */
.dark :deep(.arco-drawer-body) {
    background-color: #1f2937;
}

.dark :deep(.arco-drawer-footer) {
    border-top: 1px solid #374151;
}

.dark :deep(.arco-form-item-label) {
    color: #d1d5db;
}
</style>
