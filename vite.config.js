/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig(() => ({
  server: {
    open: true,
    port: 3000,
  },
  build: {
    outDir: "build",
  },
  test: {
    base: "https://georgiavotesvisual.com/",
    globals: true,
    environment: "jsdom",
    exclude: ["**/node_modules/**", "**/dist/**"],
    setupFiles: ["./src/setupTests.js"],
    testTimeout: 20000,
  },
  plugins: [react()],
  esbuild: {
    loader: "jsx",
    include: /src\/.*\.jsx?$/,
    // loader: "tsx",
    // include: /src\/.*\.[tj]sx?$/,
    exclude: [],
  },
}));
