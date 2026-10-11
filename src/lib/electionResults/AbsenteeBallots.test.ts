// @vitest-environment node
import { vi, describe, it, expect, beforeAll } from "vitest";
import AbsenteeBallots from "./AbsenteeBallots";

describe.concurrent("Absentee Ballot Test", () => {
  let absTest: AbsenteeBallots;
  beforeAll(() => {
    absTest = new AbsenteeBallots({
      votesByDay: [
        {
          DaysFromElection: -3,
          DateDT: "2022-12-03",
          votesToDate: 1871252,
          votesOnDate: 6545,
        },
        {
          DaysFromElection: 0,
          DateDT: "2022-12-06",
          votesToDate: 1889746,
          votesOnDate: 652,
        },
        {
          DaysFromElection: 5,
          DateDT: "2022-12-11",
          votesToDate: 1889758,
          votesOnDate: 12,
        },
        {
          DaysFromElection: 22,
          DateDT: "2022-12-28",
          votesToDate: 1889763,
          votesOnDate: 5,
        },
      ],
    });
  });
  it("validate days out form elections data", async () => {
    // check when it's way past the date but we have a higher value in past
    expect(absTest.absenteeVotesAsOfDaysOut(500)).toBe(1889763);
    // check for an exact date match
    expect(absTest.absenteeVotesAsOfDaysOut(1)).toBe(1889746);
    // check for the day right in front
    expect(absTest.absenteeVotesAsOfDaysOut(-2)).toBe(1871252);
    // check for a date we don't have
    expect(absTest.absenteeVotesAsOfDaysOut(-3)).toBe(0);
    expect(absTest.absenteeVotesAsOfDaysOut(-5)).toBe(0);
  });

  it("check the current value to use", async () => {
    // Current early voting value aligns to the latest pre-election day (Day 0)
    expect(absTest.absenteeVotesAsOfCurrentDate).toBe(1889746);
  });

  it("check total absentee ballots", async () => {
    expect(absTest.totalAbsenteeVotes).toBe(1889763);
  });

  it("check lastUpdated property", async () => {
    const withDate = new AbsenteeBallots({
      votesByDay: [],
      lastUpdated: "2026-10-10T22:09:47Z",
    });
    expect(withDate.lastUpdated).toBe("2026-10-10T22:09:47Z");
  });

  it("check latestDaysFromElection", async () => {
    // Limits early voting pace to <= 0 (Election Day is Day 0)
    expect(absTest.latestDaysFromElection).toBe(0);
    const emptyAbs = new AbsenteeBallots({ votesByDay: [] });
    expect(emptyAbs.latestDaysFromElection).toBeUndefined();
  });

  it("ignores rogue future or post-election dates (e.g. Day 35 typo in 2026 data)", async () => {
    const ballotsWithFutureError = new AbsenteeBallots({
      votesByDay: [
        { DaysFromElection: -25, DateDT: "2026-10-09", votesToDate: 8150, votesOnDate: 2740 },
        { DaysFromElection: 35, DateDT: "2026-12-08", votesToDate: 8152, votesOnDate: 2 },
      ],
    });
    expect(ballotsWithFutureError.latestDaysFromElection).toBe(-25);
    expect(ballotsWithFutureError.absenteeVotesAsOfCurrentDate).toBe(8150);
    expect(ballotsWithFutureError.totalAbsenteeVotes).toBe(8152);
  });

  it("check inclusive days out matching", async () => {
    // When inclusive is true, -3 includes day -3
    expect(absTest.absenteeVotesAsOfDaysOut(-3, true)).toBe(1871252);
    // Day 0 includes day 0
    expect(absTest.absenteeVotesAsOfDaysOut(0, true)).toBe(1889746);
    // When date is before any votes, returns 0
    expect(absTest.absenteeVotesAsOfDaysOut(-10, true)).toBe(0);
  });
});
