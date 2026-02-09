/**
 * 链接表单的可复用逻辑
 * 用于 LinkEditDrawer 和 AdminLinkEditDrawer
 */

import dayjs from "dayjs";
import type { Ref } from "vue";
import { computed, reactive, ref } from "vue";
import { getExpirationOptions } from "@/services/api";
import type { ApiResponse, LinkDetailResponse, UpdateLinkRequest } from "../../types/api";
import type {
	AccessRestrictions,
	ExpirationOption,
	Link,
	LinkCreateOptions,
} from "../../types/shared";

// 定义 API 服务接口
interface ApiService {
	getLinkDetail: (id: number | string) => Promise<ApiResponse<LinkDetailResponse>>;
	updateLink: (id: number | string, data: UpdateLinkRequest) => Promise<ApiResponse<Link>>;
	deleteLink: (id: number | string) => Promise<ApiResponse<void>>;
	addUrl?: (
		url: string,
		options: LinkCreateOptions,
	) => Promise<ApiResponse<{ link: Link; short_url: string }>>;
}

// 表单数据类型
interface LinkFormData {
	link: string;
	title: string;
	description: string;
	is_active: boolean;
	redirect_type: number;
	pass_query_params: boolean;
	forward_headers: boolean;
	forward_header_list: string[];
	expiration_option_id: number | null;
	expiration_date: string | null;
	max_clicks: number | null;
	password: string;
}

export function useLinkForm(
	linkId: Ref<number | string | null>,
	apiService: ApiService,
	isNew: Ref<boolean> = ref(false),
) {
	// State
	const isLoading = ref(false);
	const isSubmitting = ref(false);
	const isDeleting = ref(false);
	const linkData = ref<LinkDetailResponse | null>(null);
	const expirationOptions = ref<ExpirationOption[]>([]);
	const expirationMode = ref<"preset" | "custom" | "none">("none");

	// 表单数据
	const formData = reactive<LinkFormData>({
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
		password: "",
	});

	// 访问限制
	const accessRestrictions = reactive<AccessRestrictions>({
		ip_whitelist: [],
		ip_blacklist: [],
		allowed_countries: [],
		blocked_countries: [],
		allowed_devices: [],
		allowed_referrers: [],
		blocked_referrers: [],
	});

	// 计算是否已过期
	const isExpired = computed(() => {
		if (!formData.expiration_date) return false;
		return dayjs(formData.expiration_date).isBefore(dayjs());
	});

	// 格式化日期
	const formatDate = (dateString: string | null): string => {
		if (!dateString) return "-";
		return dayjs(dateString).format("YYYY-MM-DD HH:mm:ss");
	};

	// 加载过期时间选项
	const loadExpirationOptions = async () => {
		try {
			const result = await getExpirationOptions();
			expirationOptions.value = result?.data?.data || [];
		} catch (error) {
			console.error("获取过期时间选项失败:", error);
		}
	};

	// 加载链接详情
	const loadLinkDetail = async () => {
		if (!linkId.value) return;

		isLoading.value = true;
		try {
			const result = await apiService.getLinkDetail(linkId.value);
			// Store the entire response
			linkData.value = result.data || null;

			// Extract the link data for form population
			const data = linkData.value;
			if (!data) return;

			// 填充表单数据 - avoiding destructuring to prevent deep type recursion
			formData.link = data.link || "";
			formData.title = data.title || "";
			formData.description = data.description || "";
			formData.is_active = data.is_active !== false;
			formData.redirect_type = data.redirect_type || 302;
			formData.pass_query_params = data.pass_query_params || false;
			formData.forward_headers = data.forward_headers || false;
			formData.expiration_date = data.expiration_date || null;
			formData.expiration_option_id = data.expiration_option_id || null;
			formData.max_clicks = data.max_clicks || null;
			formData.password = ""; // 密码不从服务器加载，始终为空

			// Handle forward_header_list separately to avoid type recursion
			const fwdHeaders = (data as any).forward_header_list;
			formData.forward_header_list = Array.isArray(fwdHeaders) ? fwdHeaders : [];

			// 设置过期模式
			if (data.expiration_option_id) {
				expirationMode.value = "preset";
			} else if (data.expiration_date) {
				expirationMode.value = "custom";
			} else {
				expirationMode.value = "none";
			}

			// 填充访问限制
			const restrictions = (data as any).access_restrictions;
			if (restrictions) {
				Object.assign(accessRestrictions, {
					ip_whitelist: restrictions.ip_whitelist || [],
					ip_blacklist: restrictions.ip_blacklist || [],
					allowed_countries: restrictions.allowed_countries || [],
					blocked_countries: restrictions.blocked_countries || [],
					allowed_devices: restrictions.allowed_devices || [],
					allowed_referrers: restrictions.allowed_referrers || [],
					blocked_referrers: restrictions.blocked_referrers || [],
				});
			}
		} catch (error) {
			console.error("加载链接详情失败:", error);
			throw error;
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
			password: "",
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
	const buildSubmitData = (): UpdateLinkRequest => {
		const data: UpdateLinkRequest = {
			title: formData.title || null,
			description: formData.description || null,
			is_active: formData.is_active,
			redirect_type: formData.redirect_type,
			pass_query_params: formData.pass_query_params,
			forward_headers: formData.forward_headers,
			forward_header_list: formData.forward_headers ? formData.forward_header_list : [],
			max_clicks: formData.max_clicks || null,
			password: formData.password || null, // 直接包含密码字段
		};

		// 处理过期时间
		if (expirationMode.value === "preset" && formData.expiration_option_id) {
			// 根据预设选项计算实际过期时间
			const selectedOption = expirationOptions.value.find(
				(opt) => opt.id === formData.expiration_option_id,
			);
			if (selectedOption && !selectedOption.is_permanent) {
				let expirationTime = dayjs();
				if (selectedOption.hours) {
					expirationTime = expirationTime.add(selectedOption.hours, "hour");
				} else if (selectedOption.days) {
					expirationTime = expirationTime.add(selectedOption.days, "day");
				}
				data.expiration_date = expirationTime.format("YYYY-MM-DDTHH:mm:ss");
			} else {
				// 永久选项或未找到选项，清除过期时间
				data.expiration_date = null;
			}
		} else if (expirationMode.value === "custom" && formData.expiration_date) {
			data.expiration_date = formData.expiration_date;
		} else {
			data.expiration_date = null;
		}

		// 构建访问限制
		const restrictions: AccessRestrictions = {
			ip_whitelist: accessRestrictions.ip_whitelist,
			ip_blacklist: accessRestrictions.ip_blacklist,
			allowed_countries: accessRestrictions.allowed_countries,
			blocked_countries: accessRestrictions.blocked_countries,
			allowed_devices: accessRestrictions.allowed_devices,
			allowed_referrers: accessRestrictions.allowed_referrers,
			blocked_referrers: accessRestrictions.blocked_referrers,
		};

		// 只要有任何访问限制配置（即使是空数组），也发送完整对象
		data.access_restrictions = restrictions;

		return data;
	};

	// 提交表单
	const submitForm = async () => {
		isSubmitting.value = true;
		try {
			const submitData = buildSubmitData();

			if (isNew.value && apiService.addUrl) {
				// 创建新链接
				await apiService.addUrl(formData.link, submitData);
			} else if (linkId.value) {
				// 更新链接
				await apiService.updateLink(linkId.value, submitData);
			}

			return true;
		} catch (error) {
			console.error("提交失败:", error);
			throw error;
		} finally {
			isSubmitting.value = false;
		}
	};

	// 删除链接
	const deleteFormLink = async () => {
		if (!linkId.value) return false;

		isDeleting.value = true;
		try {
			await apiService.deleteLink(linkId.value);
			return true;
		} catch (error) {
			console.error("删除失败:", error);
			throw error;
		} finally {
			isDeleting.value = false;
		}
	};

	return {
		// State
		isLoading,
		isSubmitting,
		isDeleting,
		linkData,
		expirationOptions,
		expirationMode,
		formData,
		accessRestrictions,

		// Computed
		isExpired,

		// Methods
		formatDate,
		loadExpirationOptions,
		loadLinkDetail,
		resetForm,
		buildSubmitData,
		submitForm,
		deleteFormLink,
	};
}
