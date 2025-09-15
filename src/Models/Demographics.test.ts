// @vitest-environment node

import { describe, it, expect, beforeAll } from "vitest";
// import fs from "fs";
// import path from "path";
// import { fileURLToPath } from "url";
import Demographics from "./Demographics";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

describe.concurrent("Demographics", () => {
  let demographic;
  beforeAll(() => {
    // const fileName = path.resolve(__dirname, "../../public/static/demographics-county-2020.json");
    // const fileData = fs.readFileSync(fileName);
    // const dataRawObject = JSON.parse(fileData);
    const dataRawObject = {
      id: "COLUMBIA",
      CTYNAME: "COLUMBIA",
      REG20: 117248,
      WMREG20: 36865,
      WFMREG20: 40431,
      WUKNREG20: 77,
      BLMREG20: 8780,
      BLFREG20: 10656,
      BLUKNREG20: 31,
      ASIANMREG2: 1671,
      ASIANFMREG: 2114,
      ASIANUKNRE: 10,
      HISPMREG20: 1859,
      HISPFMREG2: 2223,
      HSPUKNREG2: 4,
      OTHERMREG2: 1081,
      OTHERFMREG: 1423,
      OTHERUKNRE: 3,
      UKNMALEREG: 4859,
      UKNFMREG20: 4793,
      UKNOWNREG2: 60,
    };
    demographic = new Demographics(dataRawObject);
  });
  it("validate demographic percentages", async () => {
    // check when it's way past the date but we have a higher value in past
    expect(demographic.whitePer).toBeCloseTo(0.6599089, 5);
    expect(demographic.blackPer).toBeCloseTo(0.1660326, 5);
    expect(demographic.hispanicPer).toBeCloseTo(0.0348492, 5);
    expect(demographic.asianPer).toBeCloseTo(0.0323672, 5);
    expect(demographic.otherPer).toBeCloseTo(0.021382, 5);
    expect(demographic.unknownPer).toBeCloseTo(0.0828329, 5);
  });
});
