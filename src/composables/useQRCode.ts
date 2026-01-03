/**
 * QR Code 生成和显示的可复用逻辑
 * 用于在多个组件中生成和显示二维码
 */

import QRCode from "qrcode";
import { nextTick, ref } from "vue";

export function useQRCode() {
	const visible = ref(false);
	const currentUrl = ref("");
	const canvasRef = ref<HTMLCanvasElement | null>(null);

	/**
	 * 显示二维码
	 * @param url - 要生成二维码的链接
	 */
	const show = async (url: string) => {
		currentUrl.value = url;
		visible.value = true;
		await nextTick();
		if (canvasRef.value) {
			QRCode.toCanvas(canvasRef.value, url, { width: 200, margin: 1 }, (error) => {
				if (error) console.error("生成二维码失败:", error);
			});
		}
	};

	/**
	 * 隐藏二维码
	 */
	const hide = () => {
		visible.value = false;
		currentUrl.value = "";
	};

	return {
		visible,
		currentUrl,
		canvasRef,
		show,
		hide,
	};
}
