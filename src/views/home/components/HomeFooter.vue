<template>
    <footer
        class="border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800"
    >
        <div
            class="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 text-sm text-gray-500 dark:text-gray-400"
        >
            <div
                class="flex flex-col sm:flex-row items-center justify-between gap-3"
            >
                <div>
                    © {{ new Date().getFullYear() }} Short Link Service. All
                    rights reserved.
                </div>
                <div class="text-gray-400">
                    <a
                        href="https://blog.pangcy.cn"
                        target="_blank"
                        rel="noopener"
                        class="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                        ziYang | 子洋 · blog
                    </a>
                </div>
            </div>
        </div>
    </footer>
</template>
