import type AbsenteeBallots from "../Models/AbsenteeBallots";
import type AbsenteeBallotsComparison from "../Models/AbsenteeBallotsComparison";
import type ElectionResult from "../Models/ElectionResult";
import type ElectionResultComparison from "../Models/ElectionResultComparison";
import type Demographics from "../Models/Demographics";

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
  absenteeCurrent?: AbsenteeBallots;
  absenteeBase?: AbsenteeBallots;
  electionResultsAllCurrent?: ElectionResult[];
  electionResultsCurrent?: ElectionResult;
  electionResultsAllBase?: ElectionResult[];
  electionResultsBase?: ElectionResult;
  electionResultsComparison?: ElectionResultComparison;
  absenteeBallotComparison?: AbsenteeBallotsComparison | null;
  demographics?: Demographics;
}

export interface UseElectionDataReturn {
  data: Map<string, ElectionDataEntry>;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}
