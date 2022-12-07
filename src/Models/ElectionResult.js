export default class ElectionResult {
  // These are used to store pre-computed values of the property; basically, a minor efficiency item
  #totalVotes;
  #totalVotesRD;
  #perRepublican;
  #perDemocratic;
  #perOther;
  #marginRepublican;
  #marginDemocratic;
  #marginPerRepublican;
  #marginPerPerDemocratic;
  #marginEarlyPerRepublican;

  // Dumb assignment constructor, but it works for this very simple app
  constructor(template) {
    if (template) Object.assign(this, template);
    if (template.resultsByMode) {
      this.resultsByMode = template.resultsByMode.map((modeResult) => new ElectionResult(modeResult));
    }
  }

  // total # of votes cast in the contest
  get totalVotes() {
    if (this.#totalVotes) return this.#totalVotes;
    const value = (this.democratic || 0) + (this.republican || 0) + (this.other || 0);
    this.#totalVotes = value;
    return value;
  }

  // total # of R and D votes cast in the contest
  get totalVotesRD() {
    if (this.#totalVotesRD) return this.#totalVotesRD;
    const value = (this.democratic || 0) + (this.republican || 0);
    this.#totalVotesRD = value;
    return value;
  }

  // % of voters that voted for a republican candidate
  get perRepublican() {
    if (this.#perRepublican) return this.#perRepublican;
    const value = this.totalVotes > 0 ? (this.republican || 0) / this.totalVotes : undefined;
    this.#perRepublican = value;
    return value;
  }

  // % of voters that voted for a democratic candidate
  get perDemocratic() {
    if (this.#perDemocratic) return this.#perDemocratic;
    const value = this.totalVotes > 0 ? (this.democratic || 0) / this.totalVotes : undefined;
    this.#perDemocratic = value;
    return value;
  }

  // % of voters that voted for a 3rd party candidate
  get perOther() {
    if (this.#perOther) return this.#perOther;
    const value = this.totalVotes > 0 ? (this.other || 0) / this.totalVotes : undefined;
    this.#perOther = value;
    return value;
  }

  // # of votes contributing to a republican lead
  get marginRepublican() {
    if (this.#marginRepublican) return this.#marginRepublican;
    const value = (this.republican || 0) - (this.democratic || 0);
    this.#marginRepublican = value;
    return value;
  }

  // # of votes contributing to a dem lead
  get marginDemocratic() {
    if (this.#marginDemocratic) return this.#marginDemocratic;
    const value = -1 * this.marginRepublican;
    this.#marginDemocratic = value;
    return value;
  }

  // % of votes in the republican favor
  get marginPerRepublican() {
    if (this.#marginPerRepublican) return this.#marginPerRepublican;
    const value = this.perRepublican && this.perDemocratic ? this.perRepublican - this.perDemocratic : undefined;
    this.#marginPerRepublican = value;
    return value;
  }

  // % of votes in the dems favor
  get marginPerPerDemocratic() {
    if (this.#marginPerPerDemocratic) return this.#marginPerPerDemocratic;
    const value = this.perRepublican && this.perDemocratic ? -1 * this.marginPerRepublican : undefined;
    this.#marginPerPerDemocratic = value;
    return value;
  }

  // % of votes in the dems favor
  get marginEarlyPerRepublican() {
    if (this.#marginEarlyPerRepublican) return this.#marginEarlyPerRepublican;
    const earlyVoteRecords = this.resultsByMode.filter((mode) => ["Advance Voting Votes", "Absentee by Mail Votes"].includes(mode.mode));
    const republicanVotes = earlyVoteRecords.reduce((accumulator, mode) => {
      return accumulator + mode.republican;
    }, 0);
    const democraticVotes = earlyVoteRecords.reduce((accumulator, mode) => {
      return accumulator + mode.democratic;
    }, 0);
    const totalRDVotes = (republicanVotes || 0) + (democraticVotes || 0);
    const perRepublican = (republicanVotes || 0) / totalRDVotes;
    const perDemocratic = (democraticVotes || 0) / totalRDVotes;
    const value = perRepublican && perDemocratic ? perRepublican - perDemocratic : undefined;
    this.#marginEarlyPerRepublican = value;
    return value;
  }
}
