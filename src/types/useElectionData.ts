export interface ElectionInfo {
  name?: string;
  election?: {
    name?: string;
  };
}

export interface RaceInfo {
  name: string;
  republican: string;
  democratic: string;
  election?: {
    name: string;
  };
}

export interface UseElectionDataParams {
  absenteeElectionCurrent?: ElectionInfo | null;
  absenteeElectionBase?: ElectionInfo | null;
  resultsElectionRaceCurrent?: RaceInfo | null;
  resultsElectionRacePervious?: RaceInfo | null;
  level: string;
  isCountyLevel: boolean;
}

export interface ElectionDataEntry {
  id: string;
  CTYNAME: string;
  PRECINCT_N?: string;
  absenteeCurrent?: unknown;
  absenteeBase?: unknown;
  electionResultsAllCurrent?: unknown[];
  electionResultsCurrent?: unknown;
  electionResultsAllBase?: unknown[];
  electionResultsBase?: unknown;
  electionResultsComparison?: unknown;
  absenteeBallotComparison?: unknown;
  demographics?: unknown;
}

export interface UseElectionDataReturn {
  data: Map<string, ElectionDataEntry>;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}
