import type { AbsenteeBallotsData, VotesByDay } from "./types";

export default class AbsenteeBallots {
  // Public properties from the template
  votesByDay: VotesByDay[] = [];
  lastUpdated?: string;

  // These are used to store pre-computed values of the property; basically, a minor efficiency item
  #totalAbsenteeVotes?: number;
  #absenteeVotesAsOfCurrentDate?: number;

  // Dumb assignment constructor, but it works for this very simple app
  constructor(template?: AbsenteeBallotsData) {
    if (template) Object.assign(this, template);
  }

  // latest reported day relative to election in dataset (e.g. -14)
  get latestDaysFromElection(): number | undefined {
    if (!this.votesByDay || this.votesByDay.length === 0) return undefined;
    return this.votesByDay[this.votesByDay.length - 1]?.DaysFromElection;
  }

  // total # of absentee votes cast
  get totalAbsenteeVotes(): number {
    if (this.#totalAbsenteeVotes !== undefined) return this.#totalAbsenteeVotes;
    const value = this.votesByDay[this.votesByDay.length - 1]?.votesToDate || 0;
    this.#totalAbsenteeVotes = value;
    return value;
  }

  // total # of absentee votes cast as of latest reported date
  get absenteeVotesAsOfCurrentDate(): number {
    if (this.#absenteeVotesAsOfCurrentDate !== undefined) return this.#absenteeVotesAsOfCurrentDate;
    const targetDay = this.latestDaysFromElection;
    const value = targetDay !== undefined ? this.absenteeVotesAsOfDaysOut(targetDay, true) : this.totalAbsenteeVotes;
    this.#absenteeVotesAsOfCurrentDate = value;
    return value;
  }

  absenteeVotesAsOfDaysOut(daysOut: number, inclusive = false): number {
    const absenteeDatesPrior = this.votesByDay.filter((ballotDay) =>
      inclusive ? ballotDay.DaysFromElection <= daysOut : ballotDay.DaysFromElection < daysOut,
    );
    if (absenteeDatesPrior.length === 0) return 0;
    const lastDate = absenteeDatesPrior.reduce(
      (previousValue, nextValue) => (previousValue > nextValue.DaysFromElection ? previousValue : nextValue.DaysFromElection),
      -9000,
    );
    if (lastDate === -9000) return 0;
    const daysOutAsOfDate = this.votesByDay.filter((ballotDay) => ballotDay.DaysFromElection === lastDate)[0];
    return daysOutAsOfDate?.votesToDate || 0;
  }
}
