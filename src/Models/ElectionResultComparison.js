export default class ElectionResultComparison {
    // These are used to store pre-computed values of the property; basically, a minor efficiency item
    #voteShiftRepublican;
    #voteShiftDemocratic;
    #voteShiftRepublicanNormalized;
    #voteShiftDemocraticNormalized;
    #perShiftRepublican;
    #perShiftDemocratic;
    #totalVotesPercent;
    #totalVotesRDPercent;
    #totalVotesRepublicanPercent;
    #totalVotesDemocraticPercent;

    constructor(baseElection, previousElection, statewideTurnoutFactor) {
        this.baseElection = baseElection;
        this.previousElection = previousElection;
        this.statewideTurnoutFactor = statewideTurnoutFactor;
    }

    // # of votes gained by republican
    get voteShiftRepublican() {
        if (this.#voteShiftRepublican) return this.#voteShiftRepublican;
        const value = this.baseElection?.marginRepublican - this.previousElection?.marginRepublican;
        this.#voteShiftRepublican = value;
        return value
    }

    // # of votes gained by democrats
    get voteShiftDemocratic() {
        if (this.#voteShiftDemocratic) return this.#voteShiftDemocratic;
        const value = -1 * this.voteShiftRepublican;
        this.#voteShiftDemocratic = value;
        return value
    }

    // normalized # of votes gained by republican
    // adjusts for differences in the statewide R/D turnout
    get voteShiftRepublicanNormalized() {
        if (this.#voteShiftRepublicanNormalized) return this.#voteShiftRepublicanNormalized;
        const value = this.baseElection?.marginRepublican - this.statewideTurnoutFactor * this.previousElection?.marginRepublican;
        this.#voteShiftRepublicanNormalized = value;
        return value
    }

    // normalized # of votes gained by democrats
    // adjusts for differences in the statewide R/D turnout
    get voteShiftDemocraticNormalized() {
        if (this.#voteShiftDemocraticNormalized) return this.#voteShiftDemocraticNormalized;
        const value = -1 * this.voteShiftRepublicanNormalized;
        this.#voteShiftDemocraticNormalized = value;
        return value
    }

    // % shift to republicans
    get perShiftRepublican() {
        if (this.#perShiftRepublican) return this.#perShiftRepublican;
        const value = this.baseElection?.marginPerRepublican - this.previousElection?.marginPerRepublican;
        this.#perShiftRepublican = value;
        return value
    }

    // % shift to democrats
    get perShiftDemocratic() {
        if (this.#perShiftDemocratic) return this.#perShiftDemocratic;
        const value = this.baseElection?.marginPerPerDemocratic - this.previousElection?.marginPerPerDemocratic;
        this.#perShiftDemocratic = value;
        return value
    }

    // % change in total votes
    get totalVotesPercent() {
        if (this.#totalVotesPercent) return this.#totalVotesPercent;
        const value = this.baseElection?.totalVotes / this.previousElection?.totalVotes;
        this.#totalVotesPercent = value;
        return value
    }

    // % change in total R/D votes
    get totalVotesRDPercent() {
        if (this.#totalVotesRDPercent) return this.#totalVotesRDPercent;
        const value = this.baseElection?.totalVotesRD / this.previousElection?.totalVotesRD;
        this.#totalVotesRDPercent = value;
        return value
    }

    // % change in republican votes
    get totalVotesRepublicanPercent() {
        if (this.#totalVotesRepublicanPercent) return this.#totalVotesRepublicanPercent;
        const value = this.baseElection?.republican / this.previousElection?.republican;
        this.#totalVotesRepublicanPercent = value;
        return value
    }

    // % change in democratic votes
    get totalVotesDemocraticPercent() {
        if (this.#totalVotesDemocraticPercent) return this.#totalVotesDemocraticPercent;
        const value = this.baseElection?.democratic / this.previousElection?.democratic;
        this.#totalVotesDemocraticPercent = value;
        return value
    }
}
