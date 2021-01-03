// ************************************************
// Calculate Properties Using Voting Results
// ************************************************

// TODO - create a class for each election contest so we don't add properties for each election and contest
// TODO - add generic comparison between election contest

const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const yesterdayString = yesterday
  .toLocaleDateString("de", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  })
  .split(".")
  .reverse()
  .join("-");

export default class VotingResult {
    // These are used to store pre-computed values of the property; basically, a minor efficiency item
    #totalVotes2016;
    #totalVotes2018;
    #totalVotes2020;
    #totalVotes2021;
    #turnoutVs2016;
    #turnoutVs2018;
    #turnoutVs2020;
    #turnout2018Vs2016;
    #turnoutAbsSameDayVs2018;
    #turnoutAbsSameDayVs2020;
    #perRepublican2016;
    #perRepublican2018;
    #perRepublican2020;
    #shift2018To2016;
    #shift2020To2016;
    #shift2020To2018;
    #margin2016;
    #margin2018;
    #margin2020;
    #marginShift2020To2016;
    #marginShift2020To2018;
    #absVotesYesterday;
    #absVotesRemaining;
    #republicanTurnoutVs2016;
    #democratTurnoutVs2016;
    #republicanTurnoutVs2018;
    #democratTurnoutVs2018;
  
    constructor(template) {
      if (template) Object.assign(this, template);
    }
  
    get totalVotes2016() {
      if (this.#totalVotes2016) return this.#totalVotes2016;
      const value =
        this["democratic2016"] || this["republican2016"]
          ? (this["republican2016"] || 0) + (this["democratic2016"] || 0)
          : undefined;
      this.#totalVotes2016 = value;
      return value;
    }
  
    get totalVotes2018() {
      if (this.#totalVotes2018) return this.#totalVotes2018;
      const value =
        this["democratic2018"] || this["republican2018"]
          ? (this["republican2018"] || 0) + (this["democratic2018"] || 0)
          : undefined;
      this.#totalVotes2018 = value;
      return value;
    }
  
    get totalVotes2020() {
      if (this.#totalVotes2020) return this.#totalVotes2020;
      const value =
        this["democratic2020"] || this["republican2020"]
          ? (this["republican2020"] || 0) + (this["democratic2020"] || 0)
          : undefined;
      this.#totalVotes2020 = value;
      return value;
    }
  
    get totalVotes2021() {
      if (this.#totalVotes2021) return this.#totalVotes2021;
      const value = this["TotalVoters2021"] ? this["TotalVoters2021"] : undefined;
      this.#totalVotes2021 = value;
      return value;
    }
  
    get turnoutVs2016() {
      if (this.#turnoutVs2016) return this.#turnoutVs2016;
      const value =
        this["totalVotes2021"] && this["totalVotes2016"] > 25
          ? this["totalVotes2021"] / this["totalVotes2016"]
          : undefined;
      this.#turnoutVs2016 = value;
      return value;
    }
  
    get turnoutVs2018() {
      if (this.#turnoutVs2018) return this.#turnoutVs2018;
      const value =
        this["totalVotes2021"] && this["totalVotes2018"] > 25
          ? this["totalVotes2021"] / this["totalVotes2018"]
          : undefined;
      this.#turnoutVs2018 = value;
      return value;
    }
  
    get turnoutVs2020() {
      if (this.#turnoutVs2020) return this.#turnoutVs2020;
      const value =
        this["totalVotes2021"] && this["totalVotes2020"] > 25
          ? this["totalVotes2021"] / this["totalVotes2020"]
          : undefined;
      this.#turnoutVs2020 = value;
      return value;
    }
  
    get turnout2018Vs2016() {
      if (this.#turnout2018Vs2016) return this.#turnout2018Vs2016;
      const value =
        this["totalVotes2018"] && this["totalVotes2016"] > 25
          ? this["totalVotes2018"] / this["totalVotes2016"]
          : undefined;
      this.#turnout2018Vs2016 = value;
      return value;
    }
  
    get turnoutAbsSameDayVs2018() {
      if (this.#turnoutAbsSameDayVs2018) return this.#turnoutAbsSameDayVs2018;
      const value =
        this["TotalVoters2021"] && this["TotalVoters2018"] > 25
          ? this["TotalVoters2021"] / this["TotalVoters2018"]
          : undefined;
      this.#turnoutAbsSameDayVs2018 = value;
      return value;
    }
  
    get turnoutAbsSameDayVs2020() {
      if (this.#turnoutAbsSameDayVs2020) return this.#turnoutAbsSameDayVs2020;
      const value =
        this["TotalVoters2021"] && this["TotalVoters2020"] > 25
          ? this["TotalVoters2021"] / this["TotalVoters2020"]
          : undefined;
      this.#turnoutAbsSameDayVs2020 = value;
      return value;
    }
  
    get perRepublican2016() {
      if (this.#perRepublican2016) return this.#perRepublican2016;
      const value =
        this["totalVotes2016"] > 0
          ? this["republican2016"] / this["totalVotes2016"] || 0
          : undefined;
      this.#perRepublican2016 = value;
      return value;
    }
  
    get perRepublican2018() {
      if (this.#perRepublican2018) return this.#perRepublican2018;
      const value =
        this["totalVotes2018"] > 0
          ? this["republican2018"] / this["totalVotes2018"] || 0
          : undefined;
      this.#perRepublican2018 = value;
      return value;
    }
  
    get perRepublican2020() {
      if (this.#perRepublican2020) return this.#perRepublican2020;
      const value =
        this["totalVotes2020"] > 0
          ? this["republican2020"] / this["totalVotes2020"] || 0
          : undefined;
      this.#perRepublican2020 = value;
      return value;
    }
  
    get shift2018To2016() {
      if (this.#shift2018To2016) return this.#shift2018To2016;
      const value =
        this["totalVotes2018"] > 25 && this["totalVotes2016"] > 25
          ? this["perRepublican2016"] - this["perRepublican2018"]
          : undefined;
      this.#shift2018To2016 = value;
      return value;
    }
  
    get shift2020To2016() {
      if (this.#shift2020To2016) return this.#shift2020To2016;
      const value =
        this["totalVotes2020"] > 25 && this["totalVotes2016"] > 25
          ? this["perRepublican2016"] - this["perRepublican2020"]
          : undefined;
      this.#shift2020To2016 = value;
      return value;
    }
  
    get shift2020To2018() {
      if (this.#shift2020To2018) return this.#shift2020To2018;
      const value =
        this["totalVotes2020"] > 25 && this["totalVotes2018"] > 25
          ? this["perRepublican2018"] - this["perRepublican2020"]
          : undefined;
      this.#shift2020To2018 = value;
      return value;
    }
  
    get absVotesYesterday() {
      if (this.#absVotesYesterday) return this.#absVotesYesterday;
      const votesDataForYesterday =
        this["2021votes"] &&
        this["2021votes"].filter((day) => day["Date DT"] === yesterdayString);
      const value =
        (Array.isArray(votesDataForYesterday) &&
          votesDataForYesterday.length > 0 &&
          votesDataForYesterday[0].votesOnDate) ||
        0;
      this.#absVotesYesterday = value;
      return value;
    }
  
    get absVotesRemaining() {
      if (this.#absVotesRemaining) return this.#absVotesRemaining;
      const votesEarlyOrAbs =
        this["2020resultsByMode"] &&
        this["2020resultsByMode"]
          .filter(
            (resByMode) =>
              resByMode["mode"] === "Absentee by Mail Votes" ||
              resByMode["mode"] === "Advanced Voting Votes"
          )
          .reduce(
            (prev, resByMode) =>
              prev +
              (resByMode["democratic2020"] || 0) +
              (resByMode["republican2020"] || 0) +
              (resByMode["2020other"] || 0),
            0
          );
      const value = Math.max(0, this["TotalVoters2020"] - votesEarlyOrAbs);
      this.#absVotesRemaining = value;
      return value;
    }
  
    get democratTurnoutVs2018() {
      if (this.#democratTurnoutVs2018) return this.#democratTurnoutVs2018;
      const value =
        this["democratic2020"] > 10 || this["democratic2018"] > 10
          ? this["democratic2020"] / this["democratic2018"] - 1
          : undefined;
      this.#democratTurnoutVs2018 = value;
      return value;
    }
  
    get democratTurnoutVs2016() {
      if (this.#democratTurnoutVs2016) return this.#democratTurnoutVs2016;
      const value =
        this["democratic2020"] > 10 || this["democratic2016"] > 10
          ? this["democratic2020"] / this["democratic2016"] - 1
          : undefined;
      this.#democratTurnoutVs2016 = value;
      return value;
    }
  
    get republicanTurnoutVs2016() {
      if (this.#republicanTurnoutVs2016) return this.#republicanTurnoutVs2016;
      const value =
        this["republican2020"] > 10 || this["republican2018"] > 10
          ? this["republican2020"] / this["republican2018"] - 1
          : undefined;
      this.#republicanTurnoutVs2016 = value;
      return value;
    }
  
    get republicanTurnoutVs2018() {
      if (this.#republicanTurnoutVs2018) return this.#republicanTurnoutVs2018;
      const value =
        this["republican2020"] > 10 || this["republican2016"] > 10
          ? this["republican2020"] / this["republican2016"] - 1
          : undefined;
      this.#republicanTurnoutVs2018 = value;
      return value;
    }
  
    get margin2016() {
      if (this.#margin2016) return this.#margin2016;
      const value =
        this["republican2016"] > 10 || this["democratic2016"] > 10
          ? this["republican2016"] - this["democratic2016"]
          : undefined;
      this.#margin2016 = value;
      return value;
    }
  
    get margin2018() {
      if (this.#margin2018) return this.#margin2018;
      const value =
        this["republican2018"] > 10 || this["democratic2018"] > 10
          ? this["republican2018"] - this["democratic2018"]
          : undefined;
      this.#margin2018 = value;
      return value;
    }
  
    get margin2020() {
      if (this.#margin2020) return this.#margin2020;
      const value =
        this["republican2020"] > 10 || this["democratic2020"] > 10
          ? this["republican2020"] - this["democratic2020"]
          : undefined;
      this.#margin2020 = value;
      return value;
    }
  
    get marginShift2020To2016() {
      if (this.#marginShift2020To2016) return this.#marginShift2020To2016;
      const value =
        typeof this["margin2020"] !== "undefined" ||
        typeof this["margin2016"] !== "undefined"
          ? this["margin2020"] - this["margin2016"]
          : undefined;
      this.#marginShift2020To2016 = value;
      return value;
    }
  
    get marginShift2020To2018() {
      if (this.#marginShift2020To2018) return this.#marginShift2020To2018;
      const value =
        typeof this["margin2020"] !== "undefined" ||
        typeof this["margin2018"] !== "undefined"
          ? this["margin2020"] - this["margin2018"]
          : undefined;
      this.#marginShift2020To2018 = value;
      return value;
    }
  }
  