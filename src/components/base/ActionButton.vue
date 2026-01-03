<template>
  <button 
    class="action-btn" 
    :class="[buttonClass, { 'share-animation': animation, 'share-success': success }]" 
    @click="emit('click')"
  >
    <div class="btn-icon" v-html="icon"></div>
    <slot></slot>
  </button>
</template>

<script setup>
// 定义props和emits
defineProps({
	icon: {
		type: String,
		required: true,
	},
	buttonClass: {
		type: String,
		default: "",
	},
	animation: {
		type: Boolean,
		default: false,
	},
	success: {
		type: Boolean,
		default: false,
	},
});

const emit = defineEmits(["click"]);
</script>

<style scoped>
.action-btn {
  padding: 10px 16px;
  background: #6c5ce7;
  color: #fff;
  border: none;
  border-radius: 50px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-shadow: 0 4px 8px rgba(108, 92, 231, 0.2);
}

.action-btn:hover {
  background: #4834d4;
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(108, 92, 231, 0.3);
}

.action-btn:active {
  transform: translateY(0);
}

.action-btn.share {
  background: #00b894;
  box-shadow: 0 4px 8px rgba(0, 184, 148, 0.2);
}

.action-btn.share:hover {
  background: #00a382;
  box-shadow: 0 6px 12px rgba(0, 184, 148, 0.3);
}

.action-btn.share-success {
  background: #00a382;
}

.share-animation {
  animation: pulse 0.5s ease;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.1);
  }

  100% {
    transform: scale(1);
  }
}

.action-btn.qrcode {
  background: #0984e3;
  box-shadow: 0 4px 8px rgba(9, 132, 227, 0.2);
}

.action-btn.qrcode:hover {
  background: #0876cc;
  box-shadow: 0 6px 12px rgba(9, 132, 227, 0.3);
}

.action-btn.stats {
  background: #e17055;
  box-shadow: 0 4px 8px rgba(225, 112, 85, 0.2);
}

.action-btn.stats:hover {
  background: #d65f45;
  box-shadow: 0 6px 12px rgba(225, 112, 85, 0.3);
}

.btn-icon {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>