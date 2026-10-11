// @vitest-environment node
import { describe, it, expect } from "vitest";
import AbsenteeBallots from "./AbsenteeBallots";
import AbsenteeBallotsComparison from "./AbsenteeBallotsComparison";

describe("AbsenteeBallotsComparison Test", () => {
  it("computes same-day turnout ratio aligning to current election's latest reported day", () => {
    // Current election has data up to Day -10 (5,000 votes)
    const currentElection = new AbsenteeBallots({
      votesByDay: [
        { DaysFromElection: -14, DateDT: "2026-10-20", votesToDate: 2000, votesOnDate: 2000 },
        { DaysFromElection: -10, DateDT: "2026-10-24", votesToDate: 5000, votesOnDate: 3000 },
      ],
    });

    // Baseline election has full data past Day -10 (4,000 votes on Day -10, 10,000 total)
    const baseElection = new AbsenteeBallots({
      votesByDay: [
        { DaysFromElection: -14, DateDT: "2022-10-25", votesToDate: 1500, votesOnDate: 1500 },
        { DaysFromElection: -10, DateDT: "2022-10-29", votesToDate: 4000, votesOnDate: 2500 },
        { DaysFromElection: -5, DateDT: "2022-11-03", votesToDate: 7000, votesOnDate: 3000 },
        { DaysFromElection: 0, DateDT: "2022-11-08", votesToDate: 10000, votesOnDate: 3000 },
      ],
    });

    const comparison = new AbsenteeBallotsComparison(currentElection, baseElection);

    // Baseline votes on same day out (-10)
    expect(comparison.previousVotesSameDay).toBe(4000);

    // Same day ratio compares current votes (5,000) against base votes on Day -10 (4,000)
    // 5000 / 4000 = 1.25
    expect(comparison.turnoutAbsenteeBallotsSameDay).toBeCloseTo(1.25, 4);

    // Total ratio compares current votes (5,000) against base final total (10,000)
    // 5000 / 10000 = 0.50
    expect(comparison.turnoutAbsenteeBallots).toBeCloseTo(0.5, 4);
  });

  it("returns undefined when baseline votes are 25 or fewer", () => {
    const currentElection = new AbsenteeBallots({
      votesByDay: [{ DaysFromElection: -20, DateDT: "2026-10-14", votesToDate: 10, votesOnDate: 10 }],
    });
    const baseElection = new AbsenteeBallots({
      votesByDay: [{ DaysFromElection: -20, DateDT: "2022-10-19", votesToDate: 15, votesOnDate: 15 }],
    });

    const comparison = new AbsenteeBallotsComparison(currentElection, baseElection);
    expect(comparison.turnoutAbsenteeBallotsSameDay).toBeUndefined();
    expect(comparison.turnoutAbsenteeBallots).toBeUndefined();
  });

  it("accurately computes same-day comparison when current election has rogue future dates (e.g. 2026 Day 35)", () => {
    // Current election has votes on Day -25, plus a rogue entry on Day 35
    const currentElection = new AbsenteeBallots({
      votesByDay: [
        { DaysFromElection: -25, DateDT: "2026-10-09", votesToDate: 8150, votesOnDate: 2740 },
        { DaysFromElection: 35, DateDT: "2026-12-08", votesToDate: 8152, votesOnDate: 2 },
      ],
    });

    // Baseline election has Day -25 with 3,134 votes and 2.5M final votes
    const baseElection = new AbsenteeBallots({
      votesByDay: [
        { DaysFromElection: -25, DateDT: "2022-10-14", votesToDate: 3134, votesOnDate: 1800 },
        { DaysFromElection: 0, DateDT: "2022-11-08", votesToDate: 2509557, votesOnDate: 1000 },
      ],
    });

    const comparison = new AbsenteeBallotsComparison(currentElection, baseElection);

    // Should pull Day -25 baseline votes (3,134), NOT the full 2.5M
    expect(comparison.previousVotesSameDay).toBe(3134);
    // Turnout same day ratio compares Day -25 votes: 8,150 / 3,134 ~ 2.6005
    expect(comparison.turnoutAbsenteeBallotsSameDay).toBeCloseTo(8150 / 3134, 4);
    // Turnout total ratio compares against full base total
    expect(comparison.turnoutAbsenteeBallots).toBeCloseTo(8152 / 2509557, 4);
  });

  it("aligns to statewide targetDaysOut when an individual precinct is missing data for the latest day", () => {
    // Current election precinct only reported up to Day -28 (15 votes)
    const currentElectionPrecinct = new AbsenteeBallots({
      votesByDay: [
        { DaysFromElection: -32, DateDT: "2026-10-02", votesToDate: 5, votesOnDate: 5 },
        { DaysFromElection: -28, DateDT: "2026-10-06", votesToDate: 15, votesOnDate: 10 },
      ],
    });

    // Baseline precinct has 20 votes on Day -28 and 30 votes on Day -25
    const baseElectionPrecinct = new AbsenteeBallots({
      votesByDay: [
        { DaysFromElection: -28, DateDT: "2022-10-11", votesToDate: 20, votesOnDate: 20 },
        { DaysFromElection: -25, DateDT: "2022-10-14", votesToDate: 30, votesOnDate: 10 },
        { DaysFromElection: 0, DateDT: "2022-11-08", votesToDate: 100, votesOnDate: 70 },
      ],
    });

    // Statewide election is currently at Day -25
    const statewideDaysOut = -25;
    const comparison = new AbsenteeBallotsComparison(
      currentElectionPrecinct,
      baseElectionPrecinct,
      statewideDaysOut,
    );

    // Baseline votes should be queried as of statewide date (-25), giving 30 (not 20)
    expect(comparison.previousVotesSameDay).toBe(30);
    // Current votes as of Day -25 is 15. Turnout ratio is 15 / 30 = 0.50
    expect(comparison.turnoutAbsenteeBallotsSameDay).toBeCloseTo(0.5, 4);
    // Total turnout ratio is 15 / 100 = 0.15
    expect(comparison.turnoutAbsenteeBallots).toBeCloseTo(0.15, 4);
  });
});
