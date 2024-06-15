import { Temporal } from "temporal-polyfill";

const electionDate = Temporal.PlainDateTime.from({
  year: 2024,
  month: 11,
  day: 5,
  hour: 19,
});

const currentDate = Temporal.Now.plainDateISO();
const daysToElection = electionDate.until(currentDate).days;

export default class AbsenteeBallots {
  // These are used to store pre-computed values of the property; basically, a minor efficiency item
  #totalAbsenteeVotes;
  #absenteeVotesAsOfCurrentDate;

  // Dumb assignment constructor, but it works for this very simple app
  constructor(template) {
    if (template) Object.assign(this, template);
  }

  // total # of absentee votes cast
  get totalAbsenteeVotes() {
    if (this.#totalAbsenteeVotes) return this.#totalAbsenteeVotes;
    const value = this.votesByDay[this.votesByDay.length - 1].votesToDate;
    this.#totalAbsenteeVotes = value;
    return value;
  }

  // total # of absentee votes cast as of same date
  get absenteeVotesAsOfCurrentDate() {
    if (this.#absenteeVotesAsOfCurrentDate) return this.#absenteeVotesAsOfCurrentDate;
    const value = this.absenteeVotesAsOfDaysOut(daysToElection);
    this.#absenteeVotesAsOfCurrentDate = value;
    return value;
  }

  absenteeVotesAsOfDaysOut(daysOut) {
    const absenteeDatesPrior = this.votesByDay.filter((ballotDay) => ballotDay.DaysFromElection < daysOut);
    if (absenteeDatesPrior.length === 0) return 0;
    const lastDate = absenteeDatesPrior.reduce(
      (previousValue, nextValue) => (previousValue > nextValue.DaysFromElection ? previousValue : nextValue.DaysFromElection),
      -9000,
    );
    if (lastDate === -9000) return 0;
    const daysOutAsOfDate = this.votesByDay.filter((ballotDay) => ballotDay.DaysFromElection === lastDate)[0];
    return daysOutAsOfDate.votesToDate;
  }
}
