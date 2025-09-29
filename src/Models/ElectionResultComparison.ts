import type ElectionResult from "./ElectionResult";

export default class ElectionResultComparison {
  baseElection: ElectionResult;
  previousElection: ElectionResult;
  statewideTurnoutFactor: number;

  // These are used to store pre-computed values of the property; basically, a minor efficiency item
  #voteShiftRepublican?: number;
  #voteShiftDemocratic?: number;
  #voteShiftRepublicanNormalized?: number;
  #voteShiftDemocraticNormalized?: number;
  #perShiftRepublican?: number;
  #perShiftDemocratic?: number;
  #totalVotesPercent?: number;
  #totalVotesRDPercent?: number;
  #totalVotesRepublicanPercent?: number;
  #totalVotesDemocraticPercent?: number;
  #perShiftRepublicanEarly?: number;

  constructor(baseElection: ElectionResult, previousElection: ElectionResult, statewideTurnoutFactor: number) {
    this.baseElection = baseElection;
    this.previousElection = previousElection;
    this.statewideTurnoutFactor = statewideTurnoutFactor;
  }

  // # of votes gained by republican
  get voteShiftRepublican(): number {
    if (this.#voteShiftRepublican !== undefined) return this.#voteShiftRepublican;
    const value = this.baseElection?.marginRepublican - this.previousElection?.marginRepublican;
    this.#voteShiftRepublican = value;
    return value;
  }

  // # of votes gained by democrats
  get voteShiftDemocratic(): number {
    if (this.#voteShiftDemocratic !== undefined) return this.#voteShiftDemocratic;
    const value = -1 * this.voteShiftRepublican;
    this.#voteShiftDemocratic = value;
    return value;
  }

  // normalized # of votes gained by republican
  // adjusts for differences in the statewide R/D turnout
  get voteShiftRepublicanNormalized(): number {
    if (this.#voteShiftRepublicanNormalized !== undefined) return this.#voteShiftRepublicanNormalized;
    const value = this.baseElection?.marginRepublican - this.statewideTurnoutFactor * this.previousElection?.marginRepublican;
    this.#voteShiftRepublicanNormalized = value;
    return value;
  }

  // normalized # of votes gained by democrats
  // adjusts for differences in the statewide R/D turnout
  get voteShiftDemocraticNormalized(): number {
    if (this.#voteShiftDemocraticNormalized !== undefined) return this.#voteShiftDemocraticNormalized;
    const value = -1 * this.voteShiftRepublicanNormalized;
    this.#voteShiftDemocraticNormalized = value;
    return value;
  }

  // % shift to republicans
  get perShiftRepublican(): number | undefined {
    if (this.#perShiftRepublican !== undefined) return this.#perShiftRepublican;
    const baseMargin = this.baseElection?.marginPerRepublican;
    const previousMargin = this.previousElection?.marginPerRepublican;
    const value = baseMargin !== undefined && previousMargin !== undefined ? baseMargin - previousMargin : undefined;
    this.#perShiftRepublican = value;
    return value;
  }

  // % shift to democrats
  get perShiftDemocratic(): number | undefined {
    if (this.#perShiftDemocratic !== undefined) return this.#perShiftDemocratic;
    const baseMargin = this.baseElection?.marginPerPerDemocratic;
    const previousMargin = this.previousElection?.marginPerPerDemocratic;
    const value = baseMargin !== undefined && previousMargin !== undefined ? baseMargin - previousMargin : undefined;
    this.#perShiftDemocratic = value;
    return value;
  }

  // % change in total votes
  get totalVotesPercent(): number {
    if (this.#totalVotesPercent !== undefined) return this.#totalVotesPercent;
    const value = this.baseElection?.totalVotes / this.previousElection?.totalVotes;
    this.#totalVotesPercent = value;
    return value;
  }

  // % change in total R/D votes
  get totalVotesRDPercent(): number {
    if (this.#totalVotesRDPercent !== undefined) return this.#totalVotesRDPercent;
    const value = this.baseElection?.totalVotesRD / this.previousElection?.totalVotesRD;
    this.#totalVotesRDPercent = value;
    return value;
  }

  // % change in republican votes
  get totalVotesRepublicanPercent(): number | undefined {
    if (this.#totalVotesRepublicanPercent !== undefined) return this.#totalVotesRepublicanPercent;
    const baseRepublican = this.baseElection?.republican;
    const previousRepublican = this.previousElection?.republican;
    const value = baseRepublican !== undefined && previousRepublican !== undefined && previousRepublican > 0 ? baseRepublican / previousRepublican : undefined;
    this.#totalVotesRepublicanPercent = value;
    return value;
  }

  // % change in democratic votes
  get totalVotesDemocraticPercent(): number | undefined {
    if (this.#totalVotesDemocraticPercent !== undefined) return this.#totalVotesDemocraticPercent;
    const baseDemocratic = this.baseElection?.democratic;
    const previousDemocratic = this.previousElection?.democratic;
    const value = baseDemocratic !== undefined && previousDemocratic !== undefined && previousDemocratic > 0 ? baseDemocratic / previousDemocratic : undefined;
    this.#totalVotesDemocraticPercent = value;
    return value;
  }

  // % shift to republicans in early voting
  get perShiftRepublicanEarly(): number | undefined {
    if (this.#perShiftRepublicanEarly !== undefined) return this.#perShiftRepublicanEarly;
    const baseMargin = this.baseElection?.marginEarlyPerRepublican;
    const previousMargin = this.previousElection?.marginEarlyPerRepublican;
    const value = baseMargin !== undefined && previousMargin !== undefined ? baseMargin - previousMargin : undefined;
    this.#perShiftRepublicanEarly = value;
    return value;
  }
}
