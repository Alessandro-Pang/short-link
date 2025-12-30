/**
 * 链接表单的可复用逻辑
 * 用于 LinkEditDrawer 和 AdminLinkEditDrawer
 */
import { ref, reactive, computed, watch } from "vue";
import type { Ref } from "vue";

// 定义 API 服务接口
interface ApiService {
  getExpirationOptions: () => Promise<any>;
  getLinkDetail: (id: number | string) => Promise<any>;
  updateLink: (id: number | string, data: any) => Promise<any>;
  deleteLink: (id: number | string) => Promise<any>;
  addUrl?: (url: string, options: any) => Promise<any>;
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
}

// 访问限制类型
interface AccessRestrictions {
  ip_whitelist: string[];
  ip_blacklist: string[];
  allowed_countries: string[];
  blocked_countries: string[];
  allowed_devices: string[];
  allowed_referrers: string[];
  blocked_referrers: string[];
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
  const linkData = ref<any>(null);
  const expirationOptions = ref<any[]>([]);
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
    return new Date(formData.expiration_date) < new Date();
  });

  // 格式化日期
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // 加载过期时间选项
  const loadExpirationOptions = async () => {
    try {
      const result = await apiService.getExpirationOptions();
      expirationOptions.value = result.data || [];
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
      // 兼容不同 API 返回格式
      linkData.value = result.data || result;

      const data = linkData.value;

      // 填充表单数据
      Object.assign(formData, {
        link: data.link || "",
        title: data.title || "",
        description: data.description || "",
        is_active: data.is_active !== false,
        redirect_type: data.redirect_type || 302,
        pass_query_params: data.pass_query_params || false,
        forward_headers: data.forward_headers || false,
        forward_header_list: data.forward_header_list || [],
        expiration_date: data.expiration_date || null,
        max_clicks: data.max_clicks || null,
      });

      // 设置过期模式
      if (data.expiration_date) {
        expirationMode.value = "custom";
      } else {
        expirationMode.value = "none";
      }

      // 填充访问限制
      if (data.access_restrictions) {
        Object.assign(accessRestrictions, {
          ip_whitelist: data.access_restrictions.ip_whitelist || [],
          ip_blacklist: data.access_restrictions.ip_blacklist || [],
          allowed_countries: data.access_restrictions.allowed_countries || [],
          blocked_countries: data.access_restrictions.blocked_countries || [],
          allowed_devices: data.access_restrictions.allowed_devices || [],
          allowed_referrers: data.access_restrictions.allowed_referrers || [],
          blocked_referrers: data.access_restrictions.blocked_referrers || [],
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
  const buildSubmitData = () => {
    const data: any = {
      title: formData.title || null,
      description: formData.description || null,
      is_active: formData.is_active,
      redirect_type: formData.redirect_type,
      pass_query_params: formData.pass_query_params,
      forward_headers: formData.forward_headers,
      forward_header_list: formData.forward_headers
        ? formData.forward_header_list
        : [],
      max_clicks: formData.max_clicks || null,
    };

    // 处理过期时间
    if (expirationMode.value === "preset" && formData.expiration_option_id) {
      data.expiration_option_id = formData.expiration_option_id;
    } else if (expirationMode.value === "custom" && formData.expiration_date) {
      data.expiration_date = formData.expiration_date;
    } else {
      data.expiration_date = null;
    }

    // 构建访问限制
    const restrictions: any = {};
    let hasRestrictions = false;

    for (const [key, value] of Object.entries(accessRestrictions)) {
      if (Array.isArray(value) && value.length > 0) {
        restrictions[key] = value;
        hasRestrictions = true;
      }
    }

    data.access_restrictions = hasRestrictions ? restrictions : null;

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

  // 监听过期模式变化
  watch(expirationMode, (mode) => {
    if (mode === "none") {
      formData.expiration_option_id = null;
      formData.expiration_date = null;
    } else if (mode === "preset") {
      formData.expiration_date = null;
    } else if (mode === "custom") {
      formData.expiration_option_id = null;
    }
  });

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
