<template>
    <div
        class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
    >
        <div
            class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
        >
            <h3
                class="text-lg font-semibold text-gray-800 dark:text-gray-200"
            >
                账号绑定
            </h3>
            <p
                class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1"
            >
                绑定多个登录方式，方便随时登录
            </p>
        </div>

        <a-spin :loading="loadingIdentities" class="w-full">
            <div class="p-6">
                <div class="space-y-3">
                    <!-- 邮箱绑定 -->
                    <div
                        class="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                    >
                        <div class="flex items-center gap-3">
                            <div
                                class="w-10 h-10 bg-gray-100 dark:bg-gray-400 rounded-lg flex items-center justify-center"
                            >
                                <icon-email
                                    class="text-gray-600 dark:text-gray-300 text-lg"
                                />
                            </div>
                            <div>
                                <div
                                    class="font-medium text-gray-800 dark:text-gray-200"
                                >
                                    邮箱账号
                                </div>
                                <div
                                    v-if="bindings.email"
                                    class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500"
                                >
                                    {{ bindings.email.email }}
                                </div>
                                <div
                                    v-else
                                    class="text-sm text-gray-400 dark:text-gray-500"
                                >
                                    未绑定
                                </div>
                            </div>
                        </div>
                        <a-tag
                            v-if="bindings.email"
                            color="green"
                            size="small"
                        >
                            已绑定
                        </a-tag>
                        <a-tag v-else color="gray" size="small">
                            未绑定
                        </a-tag>
                    </div>

                    <!-- GitHub 绑定 -->
                    <div
                        class="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                    >
                        <div class="flex items-center gap-3">
                            <div
                                class="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="white"
                                >
                                    <path
                                        d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <div
                                    class="font-medium text-gray-800 dark:text-gray-200"
                                >
                                    GitHub 账号
                                </div>
                                <div
                                    v-if="bindings.github"
                                    class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500"
                                >
                                    {{
                                        bindings.github.email ||
                                        "GitHub 用户"
                                    }}
                                </div>
                                <div
                                    v-else
                                    class="text-sm text-gray-400 dark:text-gray-500"
                                >
                                    未绑定
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <a-tag
                                v-if="bindings.github"
                                color="green"
                                size="small"
                            >
                                已绑定
                            </a-tag>
                            <a-button
                                v-if="!bindings.github"
                                type="primary"
                                size="small"
                                :loading="linking === 'github'"
                                @click="$emit('link-provider', 'github')"
                            >
                                绑定
                            </a-button>
                            <a-button
                                v-else
                                size="small"
                                status="danger"
                                :disabled="
                                    !canUnlink || unlinking === 'github'
                                "
                                :loading="unlinking === 'github'"
                                @click="$emit('unlink-account', 'github')"
                            >
                                解绑
                            </a-button>
                        </div>
                    </div>

                    <!-- Google 绑定 -->
                    <div
                        class="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                    >
                        <div class="flex items-center gap-3">
                            <div
                                class="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    />
                                </svg>
                            </div>
                            <div>
                                <div
                                    class="font-medium text-gray-800 dark:text-gray-200"
                                >
                                    Google 账号
                                </div>
                                <div
                                    v-if="bindings.google"
                                    class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500"
                                >
                                    {{
                                        bindings.google.email ||
                                        "Google 用户"
                                    }}
                                </div>
                                <div
                                    v-else
                                    class="text-sm text-gray-400 dark:text-gray-500"
                                >
                                    未绑定
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <a-tag
                                v-if="bindings.google"
                                color="green"
                                size="small"
                            >
                                已绑定
                            </a-tag>
                            <a-button
                                v-if="!bindings.google"
                                type="primary"
                                size="small"
                                :loading="linking === 'google'"
                                @click="$emit('link-provider', 'google')"
                            >
                                绑定
                            </a-button>
                            <a-button
                                v-else
                                size="small"
                                status="danger"
                                :disabled="
                                    !canUnlink || unlinking === 'google'
                                "
                                :loading="unlinking === 'google'"
                                @click="$emit('unlink-account', 'google')"
                            >
                                解绑
                            </a-button>
                        </div>
                    </div>

                    <!-- 提示信息 -->
                    <div
                        v-if="!canUnlink"
                        class="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg"
                    >
                        <div class="flex items-start gap-2">
                            <icon-info-circle
                                class="text-orange-500 mt-0.5 shrink-0"
                            />
                            <div class="text-sm text-orange-700">
                                至少需要保留一种登录方式，请先绑定其他方式后再解绑。
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </a-spin>
    </div>
</template>

<script setup>
import { IconEmail, IconInfoCircle } from "@arco-design/web-vue/es/icon";

const props = defineProps({
	bindings: {
		type: Object,
		required: true,
	},
	loadingIdentities: {
		type: Boolean,
		default: false,
	},
	canUnlink: {
		type: Boolean,
		default: false,
	},
	linking: {
		type: String,
		default: null,
	},
	unlinking: {
		type: String,
		default: null,
	},
});

const emit = defineEmits(["link-provider", "unlink-account"]);
</script>
