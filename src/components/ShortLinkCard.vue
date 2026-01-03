<template>
  <div class="response" :class="{ visible, error: isError }" aria-live="polite">
    <div v-if="shortUrl" class="short-link-card">
      <div class="short-link-label">短链接地址</div>
      <div class="short-link-value">
        <a :href="shortUrl" target="_blank">{{ shortUrl }}</a>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
	shortUrl: {
		type: String,
		default: "",
	},
	visible: {
		type: Boolean,
		default: false,
	},
	isError: {
		type: Boolean,
		default: false,
	},
});
</script>

<style scoped>
.response {
  margin-top: 24px;
  font-size: 16px;
  color: #28a745;
  padding: 20px;
  border-radius: 12px;
  background-color: rgba(40, 167, 69, 0.05);
  border: 1px solid rgba(40, 167, 69, 0.2);
  display: none;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
}

.response.error {
  color: #e74c3c;
  background-color: rgba(231, 76, 60, 0.05);
  border: 1px solid rgba(231, 76, 60, 0.2);
}

.short-link-card {
  margin-top: 16px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.short-link-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.short-link-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.short-link-value {
  font-size: 16px;
  color: #6c5ce7;
  font-weight: 600;
  word-break: break-all;
  display: flex;
  align-items: center;
  gap: 8px;
}

.response.visible {
  display: block;
  animation: fadeIn 0.5s ease;
}

.response a {
  color: #6c5ce7;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s ease;
}

.response a:hover {
  text-decoration: underline;
  color: #4834d4;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>