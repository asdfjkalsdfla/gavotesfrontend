#!/usr/bin/env node
import fs from "node:fs";
import esbuild from "esbuild";

// CONFIG
const DIST_DIR = "./dist";
const PORT = 3000;
const ESBUILD_CONFIG = {
  platform: "browser",
  target: "esnext",
  bundle: true,
  splitting: true,
  format: "esm",
  sourcemap: false,
  entryPoints: ["./src/index.jsx", "./public/index.html"],
  loader: { ".js": "jsx", ".html": "copy" },
  outdir: `${DIST_DIR}`,
  entryNames: "[name]",
  chunkNames: "assets/[ext]/[name]-[hash]",
  assetNames: "assets/[ext]/[name]-[hash]",
};

const serve = async () => {
  // Create a context for incremental builds
  const context = await esbuild.context({
    ...ESBUILD_CONFIG,
    minify: false,
    sourcemap: true,
    write: false,
    outdir: "./public",
    banner: {
      js: "new EventSource('/esbuild').addEventListener('change', () => location.reload());",
    },
  });

  // Enable watch mode
  await context.watch();

  // Enable serve mode
  await context.serve({ port: PORT, servedir: "./public", keyfile: "key.pem", certfile: "cert.pem" });

  // Dispose of the context
  // context.dispose();
};
/**
 *
 */
const build = async () => {
  // Check if dist directory exists, if not create it
  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdir(DIST_DIR, (err) => {
      if (err) throw err;
      // eslint-disable-next-line no-console
      console.log(`${DIST_DIR} created.`);
    });
  } else {
    // eslint-disable-next-line no-console
    console.log(`${DIST_DIR} already exists.`);
  }
  // Build our files
  await esbuild.build({
    ...ESBUILD_CONFIG,
    outdir: `${DIST_DIR}/assets`,
    minify: true,
    write: true,
  });
  fs.copyFile("./index.html", `${DIST_DIR}/index.html`, (err) => {
    if (err) throw err;
    // eslint-disable-next-line no-console
    console.log(`${DIST_DIR}/index.html: copied.`);
  });
};
/**
 *
 */
const init = () => {
  if (process.argv.includes("--serve")) {
    serve();
  } else {
    build();
  }
};

init();
