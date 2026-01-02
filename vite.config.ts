/*
 * @Author: zi.yang
 * @Date: 2025-06-09 19:48:21
 * @LastEditors: zi.yang
 * @LastEditTime: 2025-12-29 00:00:00
 * @Description:
 * @FilePath: /short-link/vite.config.ts
 */
import { fileURLToPath, URL } from "node:url";

import { defineConfig, loadEnv, type UserConfig } from "vite";

import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ArcoResolver } from "unplugin-vue-components/resolvers";
import { codeInspectorPlugin } from "code-inspector-plugin";

// https://vitejs.dev/config/
export default defineConfig(({ mode }): UserConfig => {
  const env = loadEnv(mode, process.cwd(), "");
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
            sideEffect: true,
          }),
        ],
      }),
      codeInspectorPlugin({
        bundler: "vite",
      }),
    ],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
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
