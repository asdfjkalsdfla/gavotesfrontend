// @vitest-environment node
import { describe, it, expect, beforeAll } from "vitest";
import ElectionResult from "./ElectionResult";

describe.concurrent("Election Result Basic Test", () => {
  let electionResult: ElectionResult;
  beforeAll(() => {
    electionResult = new ElectionResult({
      race: "US Senate",
      democratic: 1946117,
      republican: 1908442,
      other: 81365,
    });
  });
  it("check total votes", async () => {
    // check when it's way past the date but we have a higher value in past
    expect(electionResult.totalVotes).toBeCloseTo(3935924, 1);
  });
  it("check RD voters", async () => {
    // check when it's way past the date but we have a higher value in past
    expect(electionResult.totalVotesRD).toBeCloseTo(3854559, 1);
  });
  it("check vote share", async () => {
    // check when it's way past the date but we have a higher value in past
    expect(electionResult.perRepublican).toBeCloseTo(0.484877, 5);
    expect(electionResult.perDemocratic).toBeCloseTo(0.494449, 5);
    expect(electionResult.perOther).toBeCloseTo(0.020672, 5);
  });
  it("check margins", async () => {
    // check when it's way past the date but we have a higher value in past
    expect(electionResult.marginDemocratic).toBeCloseTo(37675, 1);
    expect(electionResult.marginRepublican).toBeCloseTo(-37675, 1);
  });
  it("check margin per", async () => {
    // check when it's way past the date but we have a higher value in past
    expect(electionResult.marginPerPerDemocratic).toBeCloseTo(0.009572, 5);
    expect(electionResult.marginPerRepublican).toBeCloseTo(-0.009572, 5);
  });
});

describe.concurrent("Election Result Only Ds Test", () => {
  let electionResult: ElectionResult;
  beforeAll(() => {
    electionResult = new ElectionResult({
      race: "US Senate",
      democratic: 1946117,
    });
  });
  it("check total votes", async () => {
    // check when it's way past the date but we have a higher value in past
    expect(electionResult.totalVotes).toBeCloseTo(1946117, 1);
  });
  it("check RD voters", async () => {
    // check when it's way past the date but we have a higher value in past
    expect(electionResult.totalVotesRD).toBeCloseTo(1946117, 1);
  });
  it("check vote share", async () => {
    // check when it's way past the date but we have a higher value in past
    expect(electionResult.perRepublican).toBeCloseTo(0, 5);
    expect(electionResult.perDemocratic).toBeCloseTo(1, 5);
    expect(electionResult.perOther).toBeCloseTo(0, 5);
  });
  it("check margins", async () => {
    // check when it's way past the date but we have a higher value in past
    expect(electionResult.marginDemocratic).toBeCloseTo(1946117, 1);
    expect(electionResult.marginRepublican).toBeCloseTo(-1946117, 1);
  });
  it("check margin per", async () => {
    // check when it's way past the date but we have a higher value in past
    expect(electionResult.marginPerRepublican).toBeCloseTo(-1, 5);
    expect(electionResult.marginPerPerDemocratic).toBeCloseTo(1, 5);
  });
});

describe.concurrent("Election Result Only Rs Test", () => {
  let electionResult: ElectionResult;
  beforeAll(() => {
    electionResult = new ElectionResult({
      race: "US Senate",
      republican: 1908442,
    });
  });
  it("check total votes", async () => {
    // check when it's way past the date but we have a higher value in past
    expect(electionResult.totalVotes).toBeCloseTo(1908442, 1);
  });
  it("check RD voters", async () => {
    // check when it's way past the date but we have a higher value in past
    expect(electionResult.totalVotesRD).toBeCloseTo(1908442, 1);
  });
  it("check vote share", async () => {
    // check when it's way past the date but we have a higher value in past
    expect(electionResult.perRepublican).toBeCloseTo(1, 5);
    expect(electionResult.perDemocratic).toBeCloseTo(0, 5);
    expect(electionResult.perOther).toBeCloseTo(0, 5);
  });
  it("check margins", async () => {
    // check when it's way past the date but we have a higher value in past
    expect(electionResult.marginDemocratic).toBeCloseTo(-1908442, 1);
    expect(electionResult.marginRepublican).toBeCloseTo(1908442, 1);
  });
  it("check margin per", async () => {
    // check when it's way past the date but we have a higher value in past
    expect(electionResult.marginPerRepublican).toBeCloseTo(1, 5);
    expect(electionResult.marginPerPerDemocratic).toBeCloseTo(-1, 5);
  });
});

describe.concurrent("Election Result Test By Mode", () => {
  let electionResult: ElectionResult;
  beforeAll(() => {
    electionResult = new ElectionResult({
      race: "US Senate",
      resultsByMode: [
        {
          mode: "Election Day Votes",
          democratic: 1946117,
          republican: 1908442,
          other: 81365,
        },
      ],
    });
  });
  it("check total votes", async () => {
    // check when it's way past the date but we have a higher value in past
    expect(electionResult.resultsByMode?.[0]?.totalVotes).toBeCloseTo(3935924, 1);
  });
  it("check RD voters", async () => {
    // check when it's way past the date but we have a higher value in past
    expect(electionResult.resultsByMode?.[0]?.totalVotesRD).toBeCloseTo(3854559, 1);
  });
  it("check vote share", async () => {
    // check when it's way past the date but we have a higher value in past
    expect(electionResult.resultsByMode?.[0]?.perRepublican).toBeCloseTo(0.484877, 5);
    expect(electionResult.resultsByMode?.[0]?.perDemocratic).toBeCloseTo(0.494449, 5);
    expect(electionResult.resultsByMode?.[0]?.perOther).toBeCloseTo(0.020672, 5);
  });
  it("check margins", async () => {
    // check when it's way past the date but we have a higher value in past
    expect(electionResult.resultsByMode?.[0]?.marginDemocratic).toBeCloseTo(37675, 1);
    expect(electionResult.resultsByMode?.[0]?.marginRepublican).toBeCloseTo(-37675, 1);
  });
  it("check margin per", async () => {
    // check when it's way past the date but we have a higher value in past
    expect(electionResult.resultsByMode?.[0]?.marginPerPerDemocratic).toBeCloseTo(0.009572, 5);
    expect(electionResult.resultsByMode?.[0]?.marginPerRepublican).toBeCloseTo(-0.009572, 5);
  });
});

describe.concurrent("Election Result Test Early Only", () => {
  let electionResult: ElectionResult;
  beforeAll(() => {
    electionResult = new ElectionResult({
      race: "US Senate",
      resultsByMode: [
        {
          mode: "Advance Voting Votes",
          democratic: 1946117,
          republican: 1908442,
          other: 81365,
        },
        {
          mode: "Absentee by Mail Votes",
          democratic: 1946117,
          republican: 1908442,
          other: 0,
        },
        {
          mode: "Election Day Votes",
          democratic: 500000000,
          republican: 500000000,
          other: 500000000,
        },
      ],
    });
  });
  it("check early vote margin per - 2 party", async () => {
    // check when it's way past the date but we have a higher value in past
    expect(electionResult.marginEarlyPerRepublican).toBeCloseTo(-0.00977, 5);
  });
});
