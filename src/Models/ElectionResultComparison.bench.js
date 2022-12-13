import { expect, bench } from "vitest";
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
    expect(typeof electionPrevious.totalVotes).toBe("number");
    expect(typeof electionPrevious.totalVotesRD).toBe("number");
    expect(typeof electionPrevious.perRepublican).toBe("number");
    expect(typeof electionPrevious.perDemocratic).toBe("number");
    expect(typeof electionPrevious.perOther).toBe("number");
    expect(typeof electionPrevious.marginDemocratic).toBe("number");
    expect(typeof electionPrevious.marginRepublican).toBe("number");
    expect(typeof electionPrevious.marginPerPerDemocratic).toBe("number");
    expect(typeof electionPrevious.marginPerRepublican).toBe("number");

    expect(typeof electionResultComparison.voteShiftRepublican).toBe("number");
    expect(typeof electionResultComparison.voteShiftDemocratic).toBe("number");
    expect(typeof electionResultComparison.voteShiftRepublicanNormalized).toBe("number");
    expect(typeof electionResultComparison.voteShiftDemocraticNormalized).toBe("number");
    expect(typeof electionResultComparison.perShiftRepublican).toBe("number");
    expect(typeof electionResultComparison.perShiftDemocratic).toBe("number");
    expect(typeof electionResultComparison.totalVotesPercent).toBe("number");
    expect(typeof electionResultComparison.totalVotesRDPercent).toBe("number");
    expect(typeof electionResultComparison.totalVotesRepublicanPercent).toBe("number");
    expect(typeof electionResultComparison.totalVotesDemocraticPercent).toBe("number");
  },
  { time: 1000 }
);

// const electionCurrentCached = new ElectionResult({
//   race: "US Senate Runoff",
//   democratic: 1816499,
//   republican: 1719714,
// });
// const electionPreviousCached = new ElectionResult({
//   race: "US Senate",
//   democratic: 1946117,
//   republican: 1908442,
//   other: 81365,
// });
// const electionResultComparisonCached = new ElectionResultComparison(electionCurrentCached, electionPreviousCached, 0.95);
// const triggerCache = electionCurrentCached.totalVotes > 0;

// bench(
//   "perf test cached",
//   async () => {
//     expect(electionCurrentCached.totalVotesInCache).toEqual(true);
//     expect(typeof electionCurrentCached.totalVotes).toBe("number");
//     expect(typeof electionCurrentCached.totalVotesRD).toBe("number");
//     expect(typeof electionCurrentCached.perRepublican).toBe("number");
//     expect(typeof electionCurrentCached.perDemocratic).toBe("number");
//     expect(typeof electionCurrentCached.perOther).toBe("number");
//     expect(typeof electionCurrentCached.marginDemocratic).toBe("number");
//     expect(typeof electionCurrentCached.marginRepublican).toBe("number");
//     expect(typeof electionCurrentCached.marginPerPerDemocratic).toBe("number");
//     expect(typeof electionCurrentCached.marginPerRepublican).toBe("number");

//     expect(typeof electionResultComparisonCached.voteShiftRepublican).toBe("number");
//     expect(typeof electionResultComparisonCached.voteShiftDemocratic).toBe("number");
//     expect(typeof electionResultComparisonCached.voteShiftRepublicanNormalized).toBe("number");
//     expect(typeof electionResultComparisonCached.voteShiftDemocraticNormalized).toBe("number");
//     expect(typeof electionResultComparisonCached.perShiftRepublican).toBe("number");
//     expect(typeof electionResultComparisonCached.perShiftDemocratic).toBe("number");
//     expect(typeof electionResultComparisonCached.totalVotesPercent).toBe("number");
//     expect(typeof electionResultComparisonCached.totalVotesRDPercent).toBe("number");
//     expect(typeof electionResultComparisonCached.totalVotesRepublicanPercent).toBe("number");
//     expect(typeof electionResultComparisonCached.totalVotesDemocraticPercent).toBe("number");
//   },
//   {
//     time: 1000,
//   }
// );
