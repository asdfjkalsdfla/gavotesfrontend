/// <reference types="vitest" />
import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import basicSsl from "@vitejs/plugin-basic-ssl";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig(
  {
    plugins: [
      react(),
      basicSsl(),
      visualizer({
        template: "treemap", // or sunburst
        open: true,
        gzipSize: true,
        brotliSize: true,
        filename: "buildAnalysis.html", // will be saved in project's root
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      open: "/index.html",
      port: 3000,
    },
    build: {
      outDir: "build",
    },
    test: {
      base: "https://georgiavotesvisual.com/",
      globals: true,
      exclude: ["**/node_modules/**", "**/dist/**"],
      setupFiles: ["./src/setupTests.js"],
      testTimeout: 20000,
      alias: [{ find: /^@deck.gl\/layers$/, replacement: "@deck.gl/layers/dist/esm" }],
    }
  });

