<template>
  <div class="loading" :class="{ active: active }">
    <div class="loading-spinner"></div>
    <span><slot>加载中...</slot></span>
  </div>
</template>

<script setup>
// 定义props
defineProps({
	active: {
		type: Boolean,
		default: false,
	},
});
</script>

<style scoped>
.loading {
  display: none;
  margin-top: 16px;
  font-size: 14px;
  color: #6c5ce7;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.loading.active {
  display: flex;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(108, 92, 231, 0.3);
  border-radius: 50%;
  border-top-color: #6c5ce7;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>