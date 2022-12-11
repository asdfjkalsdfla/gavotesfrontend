import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import fs from "fs/promises";

export default defineConfig(() => ({
  server: {
    open: true,
    port: 3000,
  },
  build: {
    outDir: "build",
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
