<script setup>
import { Message } from "@arco-design/web-vue";
import { IconLock } from "@arco-design/web-vue/es/icon";
import { ref, watch } from "vue";

const props = defineProps({
	visible: {
		type: Boolean,
		required: true,
	},
	linkId: {
		type: [Number, String],
		default: null,
	},
	updateFn: {
		type: Function,
		required: true,
	},
});

const emit = defineEmits(["update:visible", "success"]);

const passwordFormData = ref({
	linkId: null,
	password: "",
});
const isPasswordSubmitting = ref(false);

watch(
	() => props.visible,
	(newVal) => {
		if (newVal) {
			passwordFormData.value = {
				linkId: props.linkId,
				password: "",
			};
		}
	},
);

const handleClose = () => {
	emit("update:visible", false);
};

const handlePasswordSubmit = async () => {
	if (!passwordFormData.value.password) {
		Message.warning("请输入新密码");
		return;
	}

	isPasswordSubmitting.value = true;
	try {
		await props.updateFn(passwordFormData.value.linkId, passwordFormData.value.password);
		Message.success("密码修改成功");
		handleClose();
		emit("success");
	} catch (error) {
		Message.error(error.message || "修改密码失败");
	} finally {
		isPasswordSubmitting.value = false;
	}
};
</script>

<template>
	<a-modal
		:visible="visible"
		@update:visible="(val) => emit('update:visible', val)"
		title="修改访问密码"
		:width="400"
		@ok="handlePasswordSubmit"
		@cancel="handleClose"
	>
		<a-form layout="vertical" :model="passwordFormData">
			<a-form-item label="新密码" required>
				<a-input-password
					v-model="passwordFormData.password"
					placeholder="请输入新密码"
					:max-length="50"
					allow-clear
				>
					<template #prefix>
						<icon-lock />
					</template>
				</a-input-password>
				<template #extra>
					<span class="text-xs text-gray-400">
						设置后访问短链接需要输入此密码
					</span>
				</template>
			</a-form-item>
		</a-form>
		<template #footer>
			<a-space>
				<a-button @click="handleClose">取消</a-button>
				<a-button
					type="primary"
					:loading="isPasswordSubmitting"
					@click="handlePasswordSubmit"
				>
					确定
				</a-button>
			</a-space>
		</template>
	</a-modal>
</template>
