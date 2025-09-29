import type CombinedElectionRow from "../../Models/CombinedElectionRow";

// Data property accessors for different metrics - used by VotesScatter and other components
export const DATA_PROPERTY_ACCESSORS = {
  // Election results
  perRepublican: (dataPoint: CombinedElectionRow): number => (dataPoint?.electionResultsCurrent?.perRepublican ?? 0) * 100,
  perDemocratic: (dataPoint: CombinedElectionRow): number => (dataPoint?.electionResultsCurrent?.perDemocratic ?? 0) * 100,
  perRBase: (dataPoint: CombinedElectionRow): number => (dataPoint?.electionResultsBase?.perRepublican ?? 0) * 100,
  perShiftRepublican: (dataPoint: CombinedElectionRow): number => (dataPoint?.electionResultsComparison?.perShiftRepublican ?? 0) * 100,
  perShiftRepublicanEarly: (dataPoint: CombinedElectionRow): number => (dataPoint?.electionResultsComparison?.perShiftRepublicanEarly ?? 0) * 100,
  totalVotesRepublicanPercent: (dataPoint: CombinedElectionRow): number => (dataPoint?.electionResultsComparison?.totalVotesRepublicanPercent ?? 0) * 100,
  totalVotesDemocraticPercent: (dataPoint: CombinedElectionRow): number => (dataPoint?.electionResultsComparison?.totalVotesDemocraticPercent ?? 0) * 100,
  totalVotesPercent: (dataPoint: CombinedElectionRow): number => (dataPoint?.electionResultsComparison?.totalVotesRDPercent ?? 0) * 100,

  // Absentee ballots
  turnoutAbsSameDay: (dataPoint: CombinedElectionRow): number => (dataPoint?.absenteeBallotComparison?.turnoutAbsenteeBallotsSameDay ?? 0) * 100,
  turnoutAbsenteeBallots: (dataPoint: CombinedElectionRow): number => (dataPoint?.absenteeBallotComparison?.turnoutAbsenteeBallots ?? 0) * 100,

  // Demographics
  whitePer: (dataPoint: CombinedElectionRow): number => (dataPoint?.demographics?.whitePer ?? 0) * 100,
  blackPer: (dataPoint: CombinedElectionRow): number => (dataPoint?.demographics?.blackPer ?? 0) * 100,
  hispanicPer: (dataPoint: CombinedElectionRow): number => (dataPoint?.demographics?.hispanicPer ?? 0) * 100,
};
