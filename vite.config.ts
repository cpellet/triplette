import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import path from "path";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [
    react(),
    tailwindcss(),
    nodePolyfills({
      include: ["fs", "path", "stream", "util", "buffer", "process"],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  optimizeDeps: {
    exclude: ["xpath-iterator"],
  },
  resolve: {
    alias: {
      "@rmlio/yarrrml-parser": path.resolve(__dirname, "node_modules/@rmlio/yarrrml-parser/lib/rml-generator.js"),
      "xpath-iterator": path.resolve(__dirname, "src/lib/empty.ts"),
    },
  },
  build: {
    rollupOptions: {
      external: ["xpath-iterator", "canvas", "fsevents"],
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
