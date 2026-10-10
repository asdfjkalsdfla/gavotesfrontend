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
});
