<script setup>
// 定义props
const props = defineProps({
	modelValue: {
		type: String,
		default: "",
	},
	placeholder: {
		type: String,
		default: "输入链接",
	},
	buttonText: {
		type: String,
		default: "提交",
	},
	icon: {
		type: String,
		required: true,
	},
});

// 定义emits
const emit = defineEmits(["update:modelValue", "submit"]);
</script>

<template>
    <div class="url-wrapper">
        <div class="input-container">
            <div class="input-icon" v-html="icon"></div>
            <input
                type="text"
                :placeholder="placeholder"
                :value="modelValue"
                @input="emit('update:modelValue', $event.target.value)"
            />
        </div>
        <input type="button" :value="buttonText" @click="emit('submit')" />
    </div>
</template>

<style scoped>
.url-wrapper {
    margin-top: 24px;
    position: relative;
}

.input-container {
    position: relative;
    margin-bottom: 16px;
}

.input-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-90%);
    width: 20px;
    height: 20px;
    color: #a0a0a0;
}

input[type="text"] {
    width: 100%;
    padding: 14px 14px 14px 44px;
    margin-bottom: 16px;
    border: 2px solid #e0e0e0;
    border-radius: 12px;
    font-size: 16px;
    transition: all 0.3s ease;
    background-color: #f9f9f9;
}

input[type="text"]:focus {
    outline: none;
    border-color: #6c5ce7;
    box-shadow: 0 0 0 4px rgba(108, 92, 231, 0.15);
    background-color: #fff;
}

input[type="button"] {
    width: 100%;
    padding: 14px;
    background: linear-gradient(90deg, #4776e6, #8e54e9);
    color: #fff;
    border: none;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 10px rgba(108, 92, 231, 0.2);
}

input[type="button"]:hover {
    background: linear-gradient(90deg, #3d68d8, #7c48d5);
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(108, 92, 231, 0.3);
}

input[type="button"]:active {
    transform: translateY(0);
    box-shadow: 0 2px 5px rgba(108, 92, 231, 0.2);
}
</style>
