export default class AbsenteeBallotsComparison {
  // These are used to store pre-computed values of the property; basically, a minor efficiency item
  #turnoutAbsenteeBallotsSameDay;
  #turnoutAbsenteeBallots;

  constructor(baseElectionBallots, previousElectionBallots) {
    this.baseElection = baseElectionBallots;
    this.previousElection = previousElectionBallots;
  }

  // % change in absentee votes on the same day
  get turnoutAbsenteeBallotsSameDay() {
    if (this.#turnoutAbsenteeBallotsSameDay) return this.#turnoutAbsenteeBallotsSameDay;
    const value =
      this.previousElection.absenteeVotesAsOfCurrentDate && this.previousElection.absenteeVotesAsOfCurrentDate > 25
        ? this.baseElection.absenteeVotesAsOfCurrentDate / this.previousElection.absenteeVotesAsOfCurrentDate
        : undefined;
    this.#turnoutAbsenteeBallotsSameDay = value;
    return value;
  }

  // % of absentee votes
  get turnoutAbsenteeBallots() {
    if (this.#turnoutAbsenteeBallots) return this.#turnoutAbsenteeBallots;
    const value =
      this.previousElection.totalAbsenteeVotes && this.previousElection.totalAbsenteeVotes > 25
        ? this.baseElection.totalAbsenteeVotes / this.previousElection.totalAbsenteeVotes
        : undefined;
    this.#turnoutAbsenteeBallots = value;
    return value;
  }
}
