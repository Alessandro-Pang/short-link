/*
 * @Author: zi.yang
 * @Date: 2025-06-09 19:48:21
 * @LastEditors: zi.yang
 * @LastEditTime: 2025-12-29 00:00:00
 * @Description:
 * @FilePath: /short-link/vite.config.ts
 */
import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";

import vue from "@vitejs/plugin-vue";
import { codeInspectorPlugin } from "code-inspector-plugin";
import { visualizer } from "rollup-plugin-visualizer";
import AutoImport from "unplugin-auto-import/vite";
import { ArcoResolver } from "unplugin-vue-components/resolvers";
import Components from "unplugin-vue-components/vite";
import { defineConfig, loadEnv, type UserConfig } from "vite";
import { compression } from "vite-plugin-compression2";

// https://vitejs.dev/config/
export default defineConfig(({ mode }): UserConfig => {
	const env = loadEnv(mode, process.cwd(), "");
	const isProduction = mode === "production";
	const isAnalyze = process.env.ANALYZE === "true";

	return {
		plugins: [
			vue(),
			tailwindcss(),
			AutoImport({
				resolvers: [ArcoResolver()],
			}),
			Components({
				resolvers: [
					ArcoResolver({
						sideEffect: false,
					}),
				],
			}),
			codeInspectorPlugin({
				bundler: "vite",
			}),
			// Gzip 压缩
			isProduction &&
				compression({
					algorithms: ["gzip", "brotliCompress"],
					exclude: [/\.(br)$/, /\.(gz)$/],
					threshold: 1024, // 只压缩大于 1KB 的文件
				}),
			// 打包分析 (运行 ANALYZE=true pnpm build 查看)
			isAnalyze &&
				visualizer({
					open: true,
					filename: "dist/stats.html",
					gzipSize: true,
					brotliSize: true,
				}),
		].filter(Boolean),
		resolve: {
			alias: {
				"@": fileURLToPath(new URL("./src", import.meta.url)),
			},
		},
		build: {
			outDir: "dist",
			emptyOutDir: true,
			// 启用 CSS 代码分割
			cssCodeSplit: true,
			// 设置 chunk 大小警告阈值 (500KB)
			chunkSizeWarningLimit: 500,
			// 生产环境移除 console 和 debugger
			minify: "esbuild",
			target: "es2020",
			rollupOptions: {
				output: {
					// 手动分割代码块
					manualChunks: (id) => {
						// Vue 核心库
						if (
							id.includes("node_modules/vue") ||
							id.includes("node_modules/@vue") ||
							id.includes("node_modules/vue-router") ||
							id.includes("node_modules/pinia")
						) {
							return "vue-vendor";
						}
						// Arco Design UI 组件库
						if (id.includes("node_modules/@arco-design")) {
							return "arco-vendor";
						}
						// 工具库
						if (
							id.includes("node_modules/dayjs") ||
							id.includes("node_modules/nanoid") ||
							id.includes("node_modules/qrcode")
						) {
							return "utils";
						}
					},
					// 优化 chunk 文件名
					chunkFileNames: "assets/js/[name]-[hash].js",
					// 入口文件名
					entryFileNames: "assets/js/[name]-[hash].js",
					// 静态资源文件名
					assetFileNames: (assetInfo) => {
						const name = assetInfo.name || "";
						// CSS 文件
						if (name.endsWith(".css")) {
							return "assets/css/[name]-[hash][extname]";
						}
						// 图片文件
						if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(name)) {
							return "assets/images/[name]-[hash][extname]";
						}
						// 字体文件
						if (/\.(woff2?|eot|ttf|otf)$/i.test(name)) {
							return "assets/fonts/[name]-[hash][extname]";
						}
						// 其他资源
						return "assets/[name]-[hash][extname]";
					},
				},
			},
		},
		// 依赖预构建优化
		optimizeDeps: {
			include: ["vue", "vue-router", "pinia", "@arco-design/web-vue", "dayjs", "qrcode"],
		},
		server: {
			proxy: {
				"/api": {
					target: `http://localhost:${env.DEV_SERVER_PORT || 3000}`,
					changeOrigin: true,
				},
				"/u": {
					target: `http://localhost:${env.DEV_SERVER_PORT || 3000}`,
					changeOrigin: true,
				},
			},
		},
		define: {
			__SUPABASE_URL__: JSON.stringify(env.SUPABASE_URL),
			__SUPABASE_ANON_KEY__: JSON.stringify(env.SUPABASE_ANON_KEY),
		},
	};
});
