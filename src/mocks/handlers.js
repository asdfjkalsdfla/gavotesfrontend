import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { rest } from "msw";

// eslint-disable-next-line no-undef
const _dirname = typeof __dirname !== "undefined" ? __dirname : dirname(fileURLToPath(import.meta.url));

export const handlers = [
  rest.get("/static/:file", (req, res, ctx) => {
    const { file } = req.params;
    const buffer = readFileSync(join(_dirname, file), "utf-8");
    return res(ctx.set("Content-Length", buffer.byteLength.toString()), ctx.set("Content-Type", "text/json"), ctx.body(buffer));
  }),
];
