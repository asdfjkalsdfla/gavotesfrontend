// Data property accessors for different metrics - used by VotesScatter and other components
export const DATA_PROPERTY_ACCESSORS = {
  // Election results
  perRepublican: (dataPoint) => dataPoint?.electionResultsCurrent?.perRepublican * 100,
  perDemocratic: (dataPoint) => dataPoint?.electionResultsCurrent?.perDemocratic * 100,
  perRBase: (dataPoint) => dataPoint?.electionResultsBase?.perRepublican * 100,
  perShiftRepublican: (dataPoint) => dataPoint?.electionResultsComparison?.perShiftRepublican * 100,
  perShiftRepublicanEarly: (dataPoint) => dataPoint?.electionResultsComparison?.perShiftRepublicanEarly * 100,
  totalVotesRepublicanPercent: (dataPoint) => dataPoint?.electionResultsComparison?.totalVotesRepublicanPercent * 100,
  totalVotesDemocraticPercent: (dataPoint) => dataPoint?.electionResultsComparison?.totalVotesDemocraticPercent * 100,
  totalVotesPercent: (dataPoint) => dataPoint?.electionResultsComparison?.totalVotesRDPercent * 100,

  // Absentee ballots
  turnoutAbsSameDay: (dataPoint) => dataPoint?.absenteeBallotComparison?.turnoutAbsenteeBallotsSameDay * 100,
  turnoutAbsenteeBallots: (dataPoint) => dataPoint?.absenteeBallotComparison?.turnoutAbsenteeBallots * 100,

  // Demographics
  whitePer: (dataPoint) => dataPoint?.demographics?.whitePer * 100,
  blackPer: (dataPoint) => dataPoint?.demographics?.blackPer * 100,
  hispanicPer: (dataPoint) => dataPoint?.demographics?.hispanicPer * 100,
};
