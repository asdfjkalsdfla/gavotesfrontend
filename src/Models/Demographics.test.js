/* eslint-disable no-underscore-dangle */
import { describe, it, expect, beforeAll } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Demographics from "./Demographics";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe.concurrent("Demographics", () => {
  let demographic;
  beforeAll(() => {
    const fileName = path.resolve(__dirname, "../../public/static/demographics-county-2020.json");
    const fileData = fs.readFileSync(fileName);
    const dataRawObject = JSON.parse(fileData);
    demographic = new Demographics(dataRawObject[0]);
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
