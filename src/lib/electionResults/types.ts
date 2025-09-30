// Type definitions for the Election Models

export interface Election {
  name: string;
  label: string;
  date: string;
  isCurrentElection?: boolean;
  races: ElectionRace[];
}

export interface ElectionRace {
  name: string;
  republican: string;
  democratic: string;
  election: Election;
}

export interface ElectionResultData {
  race?: string;
  democratic?: number;
  republican?: number;
  other?: number;
  mode?: string;
  resultsByMode?: ElectionResultData[];
}

export interface VotesByDay {
  DaysFromElection: number;
  DateDT: string;
  votesToDate: number;
  votesOnDate: number;
}

export interface AbsenteeBallotsData {
  votesByDay: VotesByDay[];
}

export interface DemographicsData {
  REG20?: number;
  WMREG20?: number;
  WFMREG20?: number;
  WUKNREG20?: number;
  BLMREG20?: number;
  BLFREG20?: number;
  BLUKNREG20?: number;
  ASIANMREG2?: number;
  ASIANFMREG?: number;
  ASIANUKNRE?: number;
  HISPMREG20?: number;
  HISPFMREG2?: number;
  HSPUKNREG2?: number;
  OTHERMREG2?: number;
  OTHERFMREG?: number;
  OTHERUKNRE?: number;
  UKNMALEREG?: number;
  UKNFMREG20?: number;
  UKNOWNREG2?: number;
}

// Combined election data row interface - used for processed election data
// Note: Uses 'unknown' to avoid circular imports with model classes
export interface CombinedElectionRow {
  id: string;
  CTYNAME: string;
  PRECINCT_N?: string;
  absenteeCurrent?: unknown; // AbsenteeBallots instance
  absenteeBase?: unknown; // AbsenteeBallots instance
  electionResultsAllCurrent?: unknown[]; // ElectionResult[] instances
  electionResultsCurrent?: unknown; // ElectionResult instance
  electionResultsAllBase?: unknown[]; // ElectionResult[] instances
  electionResultsBase?: unknown; // ElectionResult instance
  electionResultsComparison?: unknown; // ElectionResultComparison instance
  absenteeBallotComparison?: unknown | null; // AbsenteeBallotsComparison instance
  demographics?: unknown; // Demographics instance
}
