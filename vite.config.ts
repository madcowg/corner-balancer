import path from "node:path";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vitest/config";

function ensureTrailingSlash(value: string) {
  return value.endsWith("/") ? value : `${value}/`;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const repositoryName = env.VITE_GITHUB_PAGES_REPOSITORY?.trim() || "corner-balancer";
  const base =
    mode === "github-pages"
      ? ensureTrailingSlash(env.VITE_BASE_PATH?.trim() || `/${repositoryName}/`)
      : ensureTrailingSlash(env.VITE_BASE_PATH?.trim() || "/");
  const outDir =
    mode === "alpha"
      ? "dist-alpha"
      : mode === "github-pages"
        ? "dist-pages"
        : "dist";

  return {
    base,
    build: {
      chunkSizeWarningLimit: 600,
      emptyOutDir: mode === "github-pages" ? false : true,
      outDir
    },
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        manifest: {
          name: "CornerBalance Alpha",
          short_name: "CornerBalance",
          description: "Mobile-first corner balancing workflow assistant for workshop sessions.",
          theme_color: "#2463A7",
          background_color: "#F6F7F9",
          display: "standalone",
          start_url: base,
          scope: base,
          icons: [
            {
              src: `${base}icon-192.svg`,
              sizes: "192x192",
              type: "image/svg+xml",
              purpose: "any"
            },
            {
              src: `${base}icon-512.svg`,
              sizes: "512x512",
              type: "image/svg+xml",
              purpose: "any maskable"
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src")
      }
    },
    test: {
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
      include: ["src/**/*.test.ts", "src/**/*.test.tsx"]
    }
  };
});
