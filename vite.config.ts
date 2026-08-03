/// <reference types="vitest/config" />
import path from "path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
// import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
// import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
    basicSsl(),
    // visualizer({
    //   template: "treemap", // or sunburst
    //   open: true,
    //   gzipSize: true,
    //   brotliSize: true,
    //   filename: "buildAnalysis.html", // will be saved in project's root
    // }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    // maplibre-gl resolves its worker via `import.meta.url` relative to its own dist
    // folder at runtime; pre-bundling it moves that URL into .vite/deps and the
    // sibling maplibre-gl-worker.mjs never gets copied there, causing a 404.
    // exclude: ["maplibre-gl"],
  },
  server: {
    open: "/",
    port: 3000,
    cors: { origin: ["https://localhost", "https://basemaps.cartocdn.com"] },
  },
  build: {
    outDir: "build",
  },
  test: {
    // pool: "vmForks",
    base: "https://georgiavotesvisual.com/",
    globals: true,
    exclude: ["**/node_modules/**", "**/dist/**"],
    setupFiles: ["./src/setupTests.js"],
    testTimeout: 20000,
    server: {
      deps: {
        inline: ["react-router"],
      },
    },
    // alias: [{ find: /^@deck.gl\/layers$/, replacement: "@deck.gl/layers/dist/esm" }],
  },
});
