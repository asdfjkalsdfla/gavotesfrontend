import { expect, bench, describe, beforeAll } from "vitest";
import ElectionResult from "./ElectionResult";
import ElectionResultComparison from "./ElectionResultComparison";

bench(
  "perf test",
  async () => {
    const electionCurrent = new ElectionResult({
      race: "US Senate Runoff",
      democratic: 1816499,
      republican: 1719714,
    });
    const electionPrevious = new ElectionResult({
      race: "US Senate",
      democratic: 1946117,
      republican: 1908442,
      other: 81365,
    });
    const electionResultComparison = new ElectionResultComparison(electionCurrent, electionPrevious, 0.95);
    expect(electionResultComparison.voteShiftRepublican).toBeCloseTo(-59110, 5);
    expect(electionResultComparison.voteShiftDemocratic).toBeCloseTo(59110, 5);
    expect(electionResultComparison.voteShiftRepublicanNormalized).toBeCloseTo(-60993.75, 5);
    expect(electionResultComparison.voteShiftDemocraticNormalized).toBeCloseTo(60993.75, 5);
    expect(electionResultComparison.perShiftRepublican).toBeCloseTo(-0.0177975, 5);
    expect(electionResultComparison.perShiftDemocratic).toBeCloseTo(0.0177975, 5);
    expect(electionResultComparison.totalVotesPercent).toBeCloseTo(0.898445, 5);
    expect(electionResultComparison.totalVotesRDPercent).toBeCloseTo(0.91741, 5);
    expect(electionResultComparison.totalVotesRepublicanPercent).toBeCloseTo(0.9011088, 5);
    expect(electionResultComparison.totalVotesDemocraticPercent).toBeCloseTo(0.9333966, 5);
  },
  { time: 1000 }
);
