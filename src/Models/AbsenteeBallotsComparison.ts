import type AbsenteeBallots from "./AbsenteeBallots";

export default class AbsenteeBallotsComparison {
  baseElection: AbsenteeBallots;
  previousElection: AbsenteeBallots;

  // These are used to store pre-computed values of the property; basically, a minor efficiency item
  #turnoutAbsenteeBallotsSameDay?: number;
  #turnoutAbsenteeBallots?: number;

  constructor(baseElectionBallots: AbsenteeBallots, previousElectionBallots: AbsenteeBallots) {
    this.baseElection = baseElectionBallots;
    this.previousElection = previousElectionBallots;
  }

  // % change in absentee votes on the same day
  get turnoutAbsenteeBallotsSameDay(): number | undefined {
    if (this.#turnoutAbsenteeBallotsSameDay !== undefined) return this.#turnoutAbsenteeBallotsSameDay;
    const value =
      this.previousElection.absenteeVotesAsOfCurrentDate && this.previousElection.absenteeVotesAsOfCurrentDate > 25
        ? this.baseElection.absenteeVotesAsOfCurrentDate / this.previousElection.absenteeVotesAsOfCurrentDate
        : undefined;
    this.#turnoutAbsenteeBallotsSameDay = value;
    return value;
  }

  // % of absentee votes
  get turnoutAbsenteeBallots(): number | undefined {
    if (this.#turnoutAbsenteeBallots !== undefined) return this.#turnoutAbsenteeBallots;
    const value =
      this.previousElection.totalAbsenteeVotes && this.previousElection.totalAbsenteeVotes > 25
        ? this.baseElection.totalAbsenteeVotes / this.previousElection.totalAbsenteeVotes
        : undefined;
    this.#turnoutAbsenteeBallots = value;
    return value;
  }
}
