import { describe, it, expect, beforeAll } from "vitest";
import ElectionResult from "./ElectionResult";
import ElectionResultComparison from "./ElectionResultComparison";

describe.concurrent("Election Result Comparison Basic Test", () => {
  let electionCurrent;
  let electionPrevious;
  let electionResultComparison;
  beforeAll(() => {
    electionCurrent = new ElectionResult({
      race: "US Senate Runoff",
      democratic: 1816499,
      republican: 1719714,
    });
    electionPrevious = new ElectionResult({
      race: "US Senate",
      democratic: 1946117,
      republican: 1908442,
      other: 81365,
    });
    electionResultComparison = new ElectionResultComparison(electionCurrent, electionPrevious, 0.95);
  });
  it("check vote shift", async () => {
    // check when it's way past the date but we have a higher value in past
    expect(electionResultComparison.voteShiftRepublican).toBeCloseTo(-59110, 5);
    expect(electionResultComparison.voteShiftDemocratic).toBeCloseTo(59110, 5);
  });
  it("check vote shift normalized to turnout", async () => {
    // check when it's way past the date but we have a higher value in past
    expect(electionResultComparison.voteShiftRepublicanNormalized).toBeCloseTo(-60993.75, 5);
    expect(electionResultComparison.voteShiftDemocraticNormalized).toBeCloseTo(60993.75, 5);
  });
  it("check swing normalized to turnout", async () => {
    // check when it's way past the date but we have a higher value in past
    expect(electionResultComparison.perShiftRepublican).toBeCloseTo(-0.0177975, 5);
    expect(electionResultComparison.perShiftDemocratic).toBeCloseTo(0.0177975, 5);
  });
  it("check total turnout change", async () => {
    // check when it's way past the date but we have a higher value in past
    expect(electionResultComparison.totalVotesPercent).toBeCloseTo(0.898445, 5);
    expect(electionResultComparison.totalVotesRDPercent).toBeCloseTo(0.91741, 5);
  });
  it("check party vote turnout change", async () => {
    // check when it's way past the date but we have a higher value in past
    expect(electionResultComparison.totalVotesRepublicanPercent).toBeCloseTo(0.9011088, 5);
    expect(electionResultComparison.totalVotesDemocraticPercent).toBeCloseTo(0.9333966, 5);
  });
});

describe.concurrent("Election Result Same Result Test", () => {
  let electionCurrent;
  let electionPrevious;
  let electionResultComparison;
  beforeAll(() => {
    electionCurrent = new ElectionResult({
      race: "US Senate Runoff",
      democratic: 1816499,
      republican: 1719714,
    });
    electionPrevious = new ElectionResult({
      race: "US Senate",
      democratic: 1816499,
      republican: 1719714,
    });
    electionResultComparison = new ElectionResultComparison(electionCurrent, electionPrevious, 1);
  });
  it("check vote shift", async () => {
    // check when it's way past the date but we have a higher value in past
    expect(electionResultComparison.voteShiftRepublican).toBeCloseTo(0, 5);
    expect(electionResultComparison.voteShiftDemocratic).toBeCloseTo(0, 5);
  });
  it("check vote shift normalized to turnout", async () => {
    // check when it's way past the date but we have a higher value in past
    expect(electionResultComparison.voteShiftRepublicanNormalized).toBeCloseTo(0, 5);
    expect(electionResultComparison.voteShiftDemocraticNormalized).toBeCloseTo(0, 5);
  });
  it("check swing normalized to turnout", async () => {
    // check when it's way past the date but we have a higher value in past
    expect(electionResultComparison.perShiftRepublican).toBeCloseTo(0, 5);
    expect(electionResultComparison.perShiftDemocratic).toBeCloseTo(0, 5);
  });
  it("check total turnout change", async () => {
    // check when it's way past the date but we have a higher value in past
    expect(electionResultComparison.totalVotesPercent).toBeCloseTo(1, 5);
    expect(electionResultComparison.totalVotesRDPercent).toBeCloseTo(1, 5);
  });
  it("check party vote turnout change", async () => {
    // check when it's way past the date but we have a higher value in past
    expect(electionResultComparison.totalVotesRepublicanPercent).toBeCloseTo(1, 5);
    expect(electionResultComparison.totalVotesDemocraticPercent).toBeCloseTo(1, 5);
  });
});
