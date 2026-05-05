/**
 * URL 安全检查失败弹窗
 * 统一处理安全策略拦截后的用户提示与申诉引导
 */

import { Message, Modal } from "@arco-design/web-vue";
import {
	IconCopy,
	IconExclamationCircleFill,
	IconExclamationPolygonFill,
	IconInfoCircleFill,
	IconLink,
	IconRight,
	IconSafe,
} from "@arco-design/web-vue/es/icon";
import { h } from "vue";
import "./useSafetyModal.css";

const ISSUES_URL = "https://github.com/Alessandro-Pang/short-link/issues/new";

interface SafetyModalOptions {
	/** 被拦截的 URL */
	url: string;
	/** 拦截原因（后端返回的 message） */
	reason: string;
}

export function showSafetyBlockModal({ url, reason }: SafetyModalOptions) {
	const appeal = () => {
		const title = encodeURIComponent(`[误判申诉] ${url}`);
		const body = encodeURIComponent(
			`## 申诉链接\n\n\`${url}\`\n\n## 拒绝原因\n\n${reason}\n\n## 补充说明\n\n请描述为什么您认为这是误判...`,
		);
		window.open(`${ISSUES_URL}?title=${title}&body=${body}`, "_blank");
	};

	const copyUrl = async () => {
		try {
			await navigator.clipboard.writeText(url);
			Message.success("链接已复制到剪贴板");
		} catch {
			Message.error("复制失败，请手动复制");
		}
	};

	let modal: ReturnType<typeof Modal.open>;
	modal = Modal.open({
		width: "min(640px, calc(100vw - 32px))",
		modalClass: "safety-block-modal",
		maskClosable: false,
		alignCenter: true,
		content: () =>
			h("div", { class: "safety-modal-body" }, [
				h("div", { class: "safety-modal-hero" }, [
					h("div", { class: "safety-modal-warning-badge" }, [
						h(IconExclamationPolygonFill, {
							class: "safety-modal-warning-icon",
						}),
					]),
					h("div", { class: "safety-modal-heading" }, [
						h("h2", null, "存在安全风险"),
						h("p", null, "该链接可能是钓鱼网站，建议不要创建或分享"),
					]),
				]),
				h("section", { class: "safety-modal-risk-card" }, [
					h("div", { class: "safety-modal-risk-title" }, [
						h(IconExclamationCircleFill, {
							class: "safety-modal-risk-title-icon",
						}),
						h("span", null, "可疑链接"),
					]),
					h("div", { class: "safety-modal-url-box" }, [
						h(IconLink, { class: "safety-modal-url-icon" }),
						h("span", { class: "safety-modal-url-value" }, url),
						h(
							"button",
							{
								class: "safety-modal-copy-button",
								type: "button",
								onClick: copyUrl,
							},
							[h(IconCopy), h("span", null, "复制")],
						),
					]),
					h("div", { class: "safety-modal-reason" }, [
						h(IconSafe, { class: "safety-modal-reason-icon" }),
						h("span", null, reason || "该网站可能伪装成可信网站，窃取您的个人信息或财产"),
					]),
				]),
				h(
					"button",
					{
						class: "safety-modal-appeal-banner",
						type: "button",
						onClick: appeal,
					},
					[
						h("span", { class: "safety-modal-appeal-content" }, [
							h(IconInfoCircleFill, { class: "safety-modal-appeal-icon" }),
							h("span", null, "如果您认为这是误判，可以提交申诉，我们将尽快为您复核。"),
						]),
						h(IconRight, { class: "safety-modal-appeal-arrow" }),
					],
				),
			]),
		footer: () =>
			h("div", { class: "safety-modal-actions" }, [
				h(
					"button",
					{
						class: "safety-modal-action safety-modal-action-secondary",
						type: "button",
						onClick: () => modal.close(),
					},
					"关闭",
				),
				h(
					"button",
					{
						class: "safety-modal-action safety-modal-action-outline",
						type: "button",
						onClick: appeal,
					},
					"提交申诉",
				),
			]),
	});
}
