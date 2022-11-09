export default class ElectionResultComparison {
    // These are used to store pre-computed values of the property; basically, a minor efficiency item
    #voteShiftRepublican;
    #voteShiftDemocratic;
    #perShiftRepublican;
    #perShiftDemocratic;

    constructor(baseElection,previousElection) {
        this.baseElection = baseElection;
        this.previousElection = previousElection;
    }

    // # of votes gained by republican
    get voteShiftRepublican() {
        if (this.#voteShiftRepublican) return this.#voteShiftRepublican;
        const value = this.baseElection?.marginRepublican-this.previousElection?.marginRepublican;
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

    // % shift to republicans
    get perShiftRepublican() {
        if (this.#perShiftRepublican) return this.#perShiftRepublican;
        const value = this.baseElection?.marginPerRepublican-this.previousElection?.marginPerRepublican;
        this.#perShiftRepublican = value;
        return value
    }

    // % shift to democrats
    get perShiftDemocratic() {
        if (this.#perShiftDemocratic) return this.#perShiftDemocratic;
        const value = this.baseElection?.marginPerPerDemocratic-this.previousElection?.marginPerPerDemocratic;
        this.#perShiftDemocratic = value;
        return value
    }
}
