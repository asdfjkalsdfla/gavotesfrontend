interface ElectionResultTemplate {
  democratic?: number;
  republican?: number;
  other?: number;
  mode?: string;
  resultsByMode?: ElectionResultTemplate[];
}

export default class ElectionResult {
  // These are used to store pre-computed values of the property; basically, a minor efficiency item
  #totalVotes: number | undefined;
  #totalVotesRD: number | undefined;
  #perRepublican: number | undefined;
  #perDemocratic: number | undefined;
  #perOther: number | undefined;
  #marginRepublican: number | undefined;
  #marginDemocratic: number | undefined;
  #marginPerRepublican: number | undefined;
  #marginPerPerDemocratic: number | undefined;
  #marginEarlyPerRepublican: number | undefined;

  // Election result data fields
  democratic?: number;
  republican?: number;
  other?: number;
  mode?: string;
  resultsByMode: ElectionResult[] = [];

  // Dumb assignment constructor, but it works for this very simple app
  constructor(template?: ElectionResultTemplate) {
    if (template) Object.assign(this, template);
    if (template?.resultsByMode) {
      this.resultsByMode = template.resultsByMode.map((modeResult: ElectionResultTemplate) => new ElectionResult(modeResult));
    }
  }

  // total # of votes cast in the contest
  get totalVotes(): number {
    if (this.#totalVotes) return this.#totalVotes;
    const value = (this.democratic || 0) + (this.republican || 0) + (this.other || 0);
    this.#totalVotes = value;
    return value;
  }

  // total # of R and D votes cast in the contest
  get totalVotesRD(): number {
    if (this.#totalVotesRD) return this.#totalVotesRD;
    const value = (this.democratic || 0) + (this.republican || 0);
    this.#totalVotesRD = value;
    return value;
  }

  // % of voters that voted for a republican candidate
  get perRepublican(): number | undefined {
    if (this.#perRepublican) return this.#perRepublican;
    const value = this.totalVotes > 0 ? (this.republican || 0) / this.totalVotes : undefined;
    this.#perRepublican = value;
    return value;
  }

  // % of voters that voted for a democratic candidate
  get perDemocratic(): number | undefined {
    if (this.#perDemocratic) return this.#perDemocratic;
    const value = this.totalVotes > 0 ? (this.democratic || 0) / this.totalVotes : undefined;
    this.#perDemocratic = value;
    return value;
  }

  // % of voters that voted for a 3rd party candidate
  get perOther(): number | undefined {
    if (this.#perOther) return this.#perOther;
    const value = this.totalVotes > 0 ? (this.other || 0) / this.totalVotes : undefined;
    this.#perOther = value;
    return value;
  }

  // # of votes contributing to a republican lead
  get marginRepublican(): number {
    if (this.#marginRepublican) return this.#marginRepublican;
    const value = (this.republican || 0) - (this.democratic || 0);
    this.#marginRepublican = value;
    return value;
  }

  // # of votes contributing to a dem lead
  get marginDemocratic(): number {
    if (this.#marginDemocratic) return this.#marginDemocratic;
    const value = -1 * this.marginRepublican;
    this.#marginDemocratic = value;
    return value;
  }

  // % of votes in the republican favor
  get marginPerRepublican(): number | undefined {
    if (this.#marginPerRepublican) return this.#marginPerRepublican;
    const value =
      (this.perRepublican || this.perRepublican === 0) && (this.perDemocratic || this.perDemocratic === 0)
        ? this.perRepublican - this.perDemocratic
        : undefined;
    this.#marginPerRepublican = value;
    return value;
  }

  // % of votes in the dems favor
  get marginPerPerDemocratic(): number | undefined {
    if (this.#marginPerPerDemocratic) return this.#marginPerPerDemocratic;
    const value =
      (this.perRepublican || this.perRepublican === 0) && (this.perDemocratic || this.perDemocratic === 0) ? -1 * (this.marginPerRepublican || 0) : undefined;
    this.#marginPerPerDemocratic = value;
    return value;
  }

  // % of votes in the dems favor
  get marginEarlyPerRepublican(): number | undefined {
    if (this.#marginEarlyPerRepublican) return this.#marginEarlyPerRepublican;
    const earlyVoteRecords = this.resultsByMode.filter((mode: ElectionResult) => ["Advance Voting Votes", "Absentee by Mail Votes"].includes(mode.mode || ""));
    const republicanVotes = earlyVoteRecords.reduce((accumulator: number, mode: ElectionResult) => accumulator + (mode.republican || 0), 0);
    const democraticVotes = earlyVoteRecords.reduce((accumulator: number, mode: ElectionResult) => accumulator + (mode.democratic || 0), 0);
    const totalRDVotes = (republicanVotes || 0) + (democraticVotes || 0);
    const perRepublican = (republicanVotes || 0) / totalRDVotes;
    const perDemocratic = (democraticVotes || 0) / totalRDVotes;
    const value = perRepublican && perDemocratic ? perRepublican - perDemocratic : undefined;
    this.#marginEarlyPerRepublican = value;
    return value;
  }
}
