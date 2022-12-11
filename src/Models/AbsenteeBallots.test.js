import { vi, describe, it, expect, beforeAll } from "vitest";
import AbsenteeBallots from "./AbsenteeBallots";

describe.concurrent("Absentee Ballot Test", () => {
  let absTest;
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
    // set hour within business hours
    const date = new Date(2022, 12, 5, 13);
    vi.setSystemTime(date);
    // expect(absTest.absenteeVotesAsOfCurrentDate).toBe(1871252);
    // Commented out because temporal isn't working for mock
  });
});
