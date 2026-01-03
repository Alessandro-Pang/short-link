/**
 * 验证工具
 * 提供各种验证函数
 */

/**
 * 验证URL格式是否正确
 * @param {string} url - 要验证的URL
 * @returns {boolean} - 验证结果
 */
export function validateUrl(url) {
  const urlPattern = /^(https?:\/\/|#小程序:\/\/).+/;
  return urlPattern.test(url);
}

/**
 * 校验密码强度（业务规则）
 * 1. 必须 6 位以上
 * 2. 必须包含：英文、数字、标点符号、大小写（同时包含大写+小写）四项中至少三项
 * 3. 密码不能和账号、邮箱一致（忽略大小写比较）
 *
 * @param {Object} params
 * @param {string} params.password
 * @param {string} [params.username]
 * @param {string} [params.email]
 * @returns {{ valid: boolean, message: string }}
 */
export function validatePasswordStrength({
  password,
  username = "",
  email = "",
}) {
  const pwd = String(password || "");

  if (pwd.length < 6) {
    return { valid: false, message: "密码长度至少 6 个字符" };
  }

  const u = String(username || "").trim();
  const e = String(email || "").trim();
  const pLower = pwd.toLowerCase();
  if ((u && pLower === u.toLowerCase()) || (e && pLower === e.toLowerCase())) {
    return { valid: false, message: "密码不能与用户名或邮箱一致" };
  }

  const hasEnglish = /[A-Za-z]/.test(pwd);
  const hasNumber = /\d/.test(pwd);
  const hasPunct = /[^A-Za-z0-9]/.test(pwd);
  const hasCase = /[A-Z]/.test(pwd) && /[a-z]/.test(pwd);

  const satisfiedCount =
    (hasEnglish ? 1 : 0) +
    (hasNumber ? 1 : 0) +
    (hasPunct ? 1 : 0) +
    (hasCase ? 1 : 0);

  if (satisfiedCount < 3) {
    return {
      valid: false,
      message: "密码需至少满足三项：英文、数字、标点符号、同时包含大写小写",
    };
  }

  return { valid: true, message: "" };
}

/**
 * 生成 Arco Form 的密码校验 rules（统一复用）
 *
 * @param {Object} params
 * @param {() => string} [params.getUsername] - 获取当前用户名（用于规则 3）
 * @param {() => string} [params.getEmail] - 获取当前邮箱（用于规则 3）
 * @param {string} [params.requiredMessage]
 * @returns {Array} Arco Form rules
 */
export function makePasswordRules({
  getUsername,
  getEmail,
  requiredMessage = "请输入密码",
}: {
  getUsername?: () => string;
  getEmail?: () => string;
  requiredMessage?: string;
} = {}) {
  return [
    { required: true, message: requiredMessage },
    { minLength: 6, message: "密码长度至少 6 个字符" },
    {
      validator: (value, cb) => {
        const result = validatePasswordStrength({
          password: String(value || ""),
          username: typeof getUsername === "function" ? getUsername() : "",
          email: typeof getEmail === "function" ? getEmail() : "",
        });

        if (!result.valid) {
          cb(result.message);
          return;
        }

        cb();
      },
    },
  ];
}

export default {
  validateUrl,
  validatePasswordStrength,
  makePasswordRules,
};
