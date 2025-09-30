import type { ElectionResultData } from "./types";

export default class ElectionResult {
  // Public properties from the template
  race?: string;
  democratic?: number;
  republican?: number;
  other?: number;
  mode?: string;
  resultsByMode?: ElectionResult[];

  // These are used to store pre-computed values of the property; basically, a minor efficiency item
  #totalVotes?: number;
  #totalVotesRD?: number;
  #perRepublican?: number;
  #perDemocratic?: number;
  #perOther?: number;
  #marginRepublican?: number;
  #marginDemocratic?: number;
  #marginPerRepublican?: number;
  #marginPerPerDemocratic?: number;
  #marginEarlyPerRepublican?: number;

  // Dumb assignment constructor, but it works for this very simple app
  constructor(template?: ElectionResultData) {
    if (template) Object.assign(this, template);
    if (template?.resultsByMode) {
      this.resultsByMode = template.resultsByMode.map((modeResult) => new ElectionResult(modeResult));
    }
  }

  // total # of votes cast in the contest
  get totalVotes(): number {
    if (this.#totalVotes !== undefined) return this.#totalVotes;
    const value = (this.democratic || 0) + (this.republican || 0) + (this.other || 0);
    this.#totalVotes = value;
    return value;
  }

  // total # of R and D votes cast in the contest
  get totalVotesRD(): number {
    if (this.#totalVotesRD !== undefined) return this.#totalVotesRD;
    const value = (this.democratic || 0) + (this.republican || 0);
    this.#totalVotesRD = value;
    return value;
  }

  // % of voters that voted for a republican candidate
  get perRepublican(): number | undefined {
    if (this.#perRepublican !== undefined) return this.#perRepublican;
    const value = this.totalVotes > 0 ? (this.republican || 0) / this.totalVotes : undefined;
    this.#perRepublican = value;
    return value;
  }

  // % of voters that voted for a democratic candidate
  get perDemocratic(): number | undefined {
    if (this.#perDemocratic !== undefined) return this.#perDemocratic;
    const value = this.totalVotes > 0 ? (this.democratic || 0) / this.totalVotes : undefined;
    this.#perDemocratic = value;
    return value;
  }

  // % of voters that voted for a 3rd party candidate
  get perOther(): number | undefined {
    if (this.#perOther !== undefined) return this.#perOther;
    const value = this.totalVotes > 0 ? (this.other || 0) / this.totalVotes : undefined;
    this.#perOther = value;
    return value;
  }

  // # of votes contributing to a republican lead
  get marginRepublican(): number {
    if (this.#marginRepublican !== undefined) return this.#marginRepublican;
    const value = (this.republican || 0) - (this.democratic || 0);
    this.#marginRepublican = value;
    return value;
  }

  // # of votes contributing to a dem lead
  get marginDemocratic(): number {
    if (this.#marginDemocratic !== undefined) return this.#marginDemocratic;
    const value = -1 * this.marginRepublican;
    this.#marginDemocratic = value;
    return value;
  }

  // % of votes in the republican favor
  get marginPerRepublican(): number | undefined {
    if (this.#marginPerRepublican !== undefined) return this.#marginPerRepublican;
    const value =
      (this.perRepublican !== undefined || this.perRepublican === 0) && (this.perDemocratic !== undefined || this.perDemocratic === 0)
        ? (this.perRepublican || 0) - (this.perDemocratic || 0)
        : undefined;
    this.#marginPerRepublican = value;
    return value;
  }

  // % of votes in the dems favor
  get marginPerPerDemocratic(): number | undefined {
    if (this.#marginPerPerDemocratic !== undefined) return this.#marginPerPerDemocratic;
    const value =
      (this.perRepublican !== undefined || this.perRepublican === 0) && (this.perDemocratic !== undefined || this.perDemocratic === 0)
        ? -1 * (this.marginPerRepublican || 0)
        : undefined;
    this.#marginPerPerDemocratic = value;
    return value;
  }

  // % of votes in the republican favor for early voting
  get marginEarlyPerRepublican(): number | undefined {
    if (this.#marginEarlyPerRepublican !== undefined) return this.#marginEarlyPerRepublican;

    if (!this.resultsByMode) {
      this.#marginEarlyPerRepublican = undefined;
      return undefined;
    }

    const earlyVoteRecords = this.resultsByMode.filter((mode) => ["Advance Voting Votes", "Absentee by Mail Votes"].includes(mode.mode || ""));
    const republicanVotes = earlyVoteRecords.reduce((accumulator, mode) => accumulator + (mode.republican || 0), 0);
    const democraticVotes = earlyVoteRecords.reduce((accumulator, mode) => accumulator + (mode.democratic || 0), 0);
    const totalRDVotes = republicanVotes + democraticVotes;

    if (totalRDVotes === 0) {
      this.#marginEarlyPerRepublican = undefined;
      return undefined;
    }

    const perRepublican = republicanVotes / totalRDVotes;
    const perDemocratic = democraticVotes / totalRDVotes;
    const value = perRepublican && perDemocratic ? perRepublican - perDemocratic : undefined;
    this.#marginEarlyPerRepublican = value;
    return value;
  }
}
