import { readFileSync } from "fs";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { http, HttpResponse } from "msw";

// eslint-disable-next-line no-undef
const _dirname = typeof __dirname !== "undefined" ? __dirname : `${dirname(fileURLToPath(import.meta.url))}/src/mocks/static/`;

export const handlers = [
  http.get("https://georgiavotesvisual.com/static/absentee/:file", (req) => {
    const { file } = req.params;
    const bufferLocation = `${_dirname}/static/absentee/${file}`;
    const buffer = readFileSync(bufferLocation, "utf-8");
    const jsonObject = JSON.parse(buffer);
    return HttpResponse.json(jsonObject);
  }),
  http.get("https://georgiavotesvisual.com/static/electionResults/:file", (req) => {
    const { file } = req.params;
    const bufferLocation = `${_dirname}/static/electionResults/${file}`;
    const buffer = readFileSync(bufferLocation, "utf-8");
    const jsonObject = JSON.parse(buffer);
    return HttpResponse.json(jsonObject);
  }),
];
