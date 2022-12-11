import * as path from "path";
import * as fs from "fs";
import { rest } from "msw";

export const handlers = [
  rest.get("/static/:file", (_, res, ctx) => {
    const file = req.params.file;
    const buffer = fs.readFileSync(path.resolve(__dirname, `/public/static/${file}`));
    return res(
      ctx.set("Content-Length", buffer.byteLength.toString()),
      ctx.set("Content-Type", "text/json"),
      ctx.body(buffer)
    );
  }),
];
