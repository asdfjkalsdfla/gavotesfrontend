import type ElectionResult from "./ElectionResult.ts";

export default class ElectionResultComparison {
  // These are used to store pre-computed values of the property; basically, a minor efficiency item
  #voteShiftRepublican: number | undefined;
  #voteShiftDemocratic: number | undefined;
  #voteShiftRepublicanNormalized: number | undefined;
  #voteShiftDemocraticNormalized: number | undefined;
  #perShiftRepublican: number | undefined;
  #perShiftDemocratic: number | undefined;
  #totalVotesPercent: number | undefined;
  #totalVotesRDPercent: number | undefined;
  #totalVotesRepublicanPercent: number | undefined;
  #totalVotesDemocraticPercent: number | undefined;
  #perShiftRepublicanEarly: number | undefined;

  baseElection: ElectionResult;
  previousElection: ElectionResult;
  statewideTurnoutFactor: number;

  constructor(baseElection: ElectionResult, previousElection: ElectionResult, statewideTurnoutFactor: number) {
    this.baseElection = baseElection;
    this.previousElection = previousElection;
    this.statewideTurnoutFactor = statewideTurnoutFactor;
  }

  // # of votes gained by republican
  get voteShiftRepublican(): number {
    if (this.#voteShiftRepublican) return this.#voteShiftRepublican;
    const value = this.baseElection?.marginRepublican - this.previousElection?.marginRepublican;
    this.#voteShiftRepublican = value;
    return value;
  }

  // # of votes gained by democrats
  get voteShiftDemocratic(): number {
    if (this.#voteShiftDemocratic) return this.#voteShiftDemocratic;
    const value = -1 * this.voteShiftRepublican;
    this.#voteShiftDemocratic = value;
    return value;
  }

  // normalized # of votes gained by republican
  // adjusts for differences in the statewide R/D turnout
  get voteShiftRepublicanNormalized(): number {
    if (this.#voteShiftRepublicanNormalized) return this.#voteShiftRepublicanNormalized;
    const value = this.baseElection?.marginRepublican - this.statewideTurnoutFactor * this.previousElection?.marginRepublican;
    this.#voteShiftRepublicanNormalized = value;
    return value;
  }

  // normalized # of votes gained by democrats
  // adjusts for differences in the statewide R/D turnout
  get voteShiftDemocraticNormalized(): number {
    if (this.#voteShiftDemocraticNormalized) return this.#voteShiftDemocraticNormalized;
    const value = -1 * this.voteShiftRepublicanNormalized;
    this.#voteShiftDemocraticNormalized = value;
    return value;
  }

  // % shift to republicans
  get perShiftRepublican(): number | undefined {
    if (this.#perShiftRepublican) return this.#perShiftRepublican;
    const baseValue = this.baseElection?.marginPerRepublican;
    const previousValue = this.previousElection?.marginPerRepublican;
    const value = baseValue !== undefined && previousValue !== undefined ? baseValue - previousValue : undefined;
    this.#perShiftRepublican = value;
    return value;
  }

  // % shift to democrats
  get perShiftDemocratic(): number | undefined {
    if (this.#perShiftDemocratic) return this.#perShiftDemocratic;
    const baseValue = this.baseElection?.marginPerPerDemocratic;
    const previousValue = this.previousElection?.marginPerPerDemocratic;
    const value = baseValue !== undefined && previousValue !== undefined ? baseValue - previousValue : undefined;
    this.#perShiftDemocratic = value;
    return value;
  }

  // % change in total votes
  get totalVotesPercent(): number | undefined {
    if (this.#totalVotesPercent) return this.#totalVotesPercent;
    const baseValue = this.baseElection?.totalVotes;
    const previousValue = this.previousElection?.totalVotes;
    const value = baseValue !== undefined && previousValue !== undefined && previousValue > 0 ? baseValue / previousValue : undefined;
    this.#totalVotesPercent = value;
    return value;
  }

  // % change in total R/D votes
  get totalVotesRDPercent(): number | undefined {
    if (this.#totalVotesRDPercent) return this.#totalVotesRDPercent;
    const baseValue = this.baseElection?.totalVotesRD;
    const previousValue = this.previousElection?.totalVotesRD;
    const value = baseValue !== undefined && previousValue !== undefined && previousValue > 0 ? baseValue / previousValue : undefined;
    this.#totalVotesRDPercent = value;
    return value;
  }

  // % change in republican votes
  get totalVotesRepublicanPercent(): number | undefined {
    if (this.#totalVotesRepublicanPercent) return this.#totalVotesRepublicanPercent;
    const baseValue = this.baseElection?.republican;
    const previousValue = this.previousElection?.republican;
    const value = baseValue !== undefined && previousValue !== undefined && previousValue > 0 ? baseValue / previousValue : undefined;
    this.#totalVotesRepublicanPercent = value;
    return value;
  }

  // % change in democratic votes
  get totalVotesDemocraticPercent(): number | undefined {
    if (this.#totalVotesDemocraticPercent) return this.#totalVotesDemocraticPercent;
    const baseValue = this.baseElection?.democratic;
    const previousValue = this.previousElection?.democratic;
    const value = baseValue !== undefined && previousValue !== undefined && previousValue > 0 ? baseValue / previousValue : undefined;
    this.#totalVotesDemocraticPercent = value;
    return value;
  }

  // % shift to republicans
  get perShiftRepublicanEarly(): number | undefined {
    if (this.#perShiftRepublicanEarly) return this.#perShiftRepublicanEarly;
    const baseValue = this.baseElection?.marginEarlyPerRepublican;
    const previousValue = this.previousElection?.marginEarlyPerRepublican;
    const value = baseValue !== undefined && previousValue !== undefined ? baseValue - previousValue : undefined;
    this.#perShiftRepublicanEarly = value;
    return value;
  }
}
