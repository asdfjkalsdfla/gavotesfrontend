// IMPORTS
// =============================================
const esbuild = require("esbuild");
const fs = require("fs");
const http = require("http");

// CONFIG
// =============================================
const PUBLIC_DIR = "./public";
const DIST_DIR = "./dist";
const PORT = 3000;
const ESBUILD_CONFIG = {
  entryPoints: ["./src/index.jsx"],
  entryNames: "[ext]/[name]-[hash]",
  bundle: true,
  outdir: `${PUBLIC_DIR}/assets`,
  loader: { ".js": "jsx" },
  assetNames: "[ext]/[name]-[hash]",
  target: "es2020",
  sourcemap: true,
};
let CLIENTS = [];

// FUNCTIONS
// =============================================
/**
 *
 */
const serve = () => {
  esbuild
    .build({
      ...ESBUILD_CONFIG,
      write: false,
      watch: {
        onRebuild(error, result) {
          if (error) {
            console.log({ error });
          }
          console.log({ result });
          if (CLIENTS.length > 0) {
            CLIENTS.forEach((res) => res.write("data: Rebuild event!\n\n"));
          }
        },
      },
    })
    .catch(() => process.exit(1));
  esbuild
    .serve(
      { servedir: PUBLIC_DIR },
      {
        ...ESBUILD_CONFIG,
        banner: {
          js: '// Self executing function\n (() => { console.log("Event Source Starting..."); \nconst es = new EventSource("/esbuild"); es.addEventListener("message", () => window.location.reload()) })();',
        },
      }
    )
    .then((result) => {
      // By default runs on host: 0.0.0.0, port: 8000
      const { host, port } = result;

      http
        .createServer((req, res) => {
          const { url, method, headers } = req;
          if (url.startsWith("/esbuild")) {
            return CLIENTS.push(
              res.writeHead(200, {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
              })
            );
          }

          // Catch requests and if it's a file serve the file
          // Otherwise if it's a directory default to index.html
          // Ex: /assets/index.js
          const pathAsArray = url.split("/");
          // ['', 'assets', 'index.js']
          const endOfPathArray = pathAsArray.pop();
          // index.js
          const isFile = endOfPathArray.indexOf(".") !== -1;
          // true
          const path = isFile ? url : "/index.html";
          // /assets/index.js
          // if /assets => /index.html

          // Pass the request to esbuild and get the result
          // from a proxy request and serve the proxy result
          req.pipe(
            http.request({ hostname: host, port, path, method, headers }, (proxyRes) => {
              res.writeHead(proxyRes.statusCode, proxyRes.headers);
              proxyRes.pipe(res, { end: true });
            }),
            { end: true }
          );
        })
        .listen(PORT);
    })
    .then(() => console.log(`Listening on port: ${PORT}`));
};
/**
 *
 */
const build = () => {
  // Check if dist directory exists, if not create it
  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdir(DIST_DIR, (err) => {
      if (err) throw err;
      console.log(`${DIST_DIR} created.`);
    });
  } else {
    console.log(`${DIST_DIR} already exists.`);
  }
  // Build our files
  esbuild
    .build({
      ...ESBUILD_CONFIG,
      outdir: `${DIST_DIR}/assets`,
      minify: true,
      write: true,
    })
    .then(() => {
      // Copy over index.html
      fs.copyFile(`./index.html`, `${DIST_DIR}/index.html`, (err) => {
        if (err) throw err;
        console.log(`${DIST_DIR}/index.html: copied.`);
      });
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
// INIT
// =============================================
init();
