import type AbsenteeBallots from "./AbsenteeBallots";

export default class AbsenteeBallotsComparison {
  baseElection: AbsenteeBallots;
  previousElection: AbsenteeBallots;
  targetDaysOut?: number;

  // These are used to store pre-computed values of the property; basically, a minor efficiency item
  #turnoutAbsenteeBallotsSameDay?: number;
  #turnoutAbsenteeBallots?: number;

  constructor(
    baseElectionBallots: AbsenteeBallots,
    previousElectionBallots: AbsenteeBallots,
    targetDaysOut?: number,
  ) {
    this.baseElection = baseElectionBallots;
    this.previousElection = previousElectionBallots;
    this.targetDaysOut = targetDaysOut;
  }

  // Raw votes cast in the baseline election on or before the target day out
  get previousVotesSameDay(): number | undefined {
    const targetDaysOut = this.targetDaysOut ?? this.baseElection?.latestDaysFromElection;
    if (targetDaysOut === undefined) return undefined;
    return this.previousElection.absenteeVotesAsOfDaysOut(targetDaysOut, true);
  }

  // % change in absentee votes on the same day
  get turnoutAbsenteeBallotsSameDay(): number | undefined {
    if (this.#turnoutAbsenteeBallotsSameDay !== undefined) return this.#turnoutAbsenteeBallotsSameDay;

    const prevVotesSameDay = this.previousVotesSameDay ?? this.previousElection.absenteeVotesAsOfCurrentDate ?? 0;
    const currentVotes =
      (this.targetDaysOut !== undefined ? this.baseElection?.absenteeVotesAsOfDaysOut(this.targetDaysOut, true) : undefined) ??
      this.baseElection?.absenteeVotesAsOfCurrentDate ??
      this.baseElection?.totalAbsenteeVotes ??
      0;

    const value =
      prevVotesSameDay > 25
        ? currentVotes / prevVotesSameDay
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
