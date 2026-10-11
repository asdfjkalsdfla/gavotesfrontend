import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import ElectionResult from "../lib/electionResults/ElectionResult";
import ElectionResultComparison from "../lib/electionResults/ElectionResultComparison";
import AbsenteeBallots from "../lib/electionResults/AbsenteeBallots";
import AbsenteeBallotsComparison from "../lib/electionResults/AbsenteeBallotsComparison";
import Demographics from "../lib/electionResults/Demographics";
import type { AbsenteeBallotsData, ElectionResultData, DemographicsData, Election, ElectionRace, VotesByDay } from "../lib/electionResults/types";
import type CombinedElectionRow from "../lib/electionResults/CombinedElectionRow";
import { getMostRecentDate } from "../Utils.jsx";

// Extend ImportMeta for Vite environment variables
declare global {
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

interface ImportMetaEnv {
  readonly VITE_API_URL_BASE: string;
  [key: string]: unknown;
}

interface RawDataRow {
  county: string;
  precinct?: string;
  races?: ElectionResultData[];
  votesByDay?: VotesByDay[];
  id?: string;
  lastUpdated?: string;
  [key: string]: unknown;
}

// Helper function to build API URLs
const buildApiUrl = (category: string, prefix: string, name: string, level: string): string | null => {
  if (!name) return null;
  return `${import.meta.env.VITE_API_URL_BASE}static/${category}/${prefix}-${name}-${level}.json`;
};

// Helper function to fetch data with graceful 404 handling
const fetchData = async <T = unknown>(url: string, description: string): Promise<T | null> => {
  if (!url) return null;

  const response = await fetch(url);
  if (!response.ok) {
    // If a dataset (such as future election results) is not yet available, handle gracefully
    if (response.status === 404) {
      console.warn(`Data file not available for ${description} (${url}). Skipping.`);
      return null;
    }
    console.error(`ERROR loading ${description} from ${url}: ${response.statusText}`);
    throw new Error(`Failed to load ${description}: ${response.statusText}`);
  }
  return response.json();
};

// Custom hook for fetching a single data file
const useDataFile = <T = RawDataRow[]>(url: string | null, description: string, enabled = true) => {
  return useQuery({
    queryKey: ["dataFile", url],
    queryFn: () => {
      if (!url) return null;
      return fetchData<T | null>(url, description);
    },
    enabled: enabled && !!url,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes("404")) return false;
      return failureCount < 2;
    },
  });
};

// Custom hook for fetching and combining election data
export const useElectionData = (
  absenteeElectionCurrent: Election | null,
  absenteeElectionBase: Election | null,
  resultsElectionRaceCurrent: ElectionRace | null,
  resultsElectionRacePervious: ElectionRace | null,
  level: string,
  isCountyLevel: boolean,
  enabled = true,
  targetDaysOut?: number,
) => {
  const absenteeCurrentFileLocation = buildApiUrl("absentee", "absenteeSummary", absenteeElectionCurrent?.name || "", level);
  const absenteeBaseFileLocation = buildApiUrl("absentee", "absenteeSummary", absenteeElectionBase?.name || "", level);
  const electionResultsCurrentFileLocation = buildApiUrl(
    "electionResults",
    "electionResultsSummary",
    resultsElectionRaceCurrent?.election?.name || "",
    level,
  );
  const electionResultBaseFileLocation = resultsElectionRacePervious
    ? buildApiUrl("electionResults", "electionResultsSummary", resultsElectionRacePervious?.election?.name || "", level)
    : null;
  const demographicsFileLocation = `${import.meta.env.VITE_API_URL_BASE}static/demographics/demographics-${level}-2020.json`;

  // Fetch all data files independently
  const absenteeCurrentQuery = useDataFile<RawDataRow[]>(absenteeCurrentFileLocation, "Absentee Current", enabled);
  const absenteeBaseQuery = useDataFile<RawDataRow[]>(absenteeBaseFileLocation, "Absentee Base", enabled);
  const electionResultsCurrentQuery = useDataFile<RawDataRow[]>(
    electionResultsCurrentFileLocation,
    "Election Results Current",
    enabled,
  );
  const electionResultBaseQuery = useDataFile<RawDataRow[]>(
    electionResultBaseFileLocation,
    "Election Result Base",
    enabled && !!electionResultBaseFileLocation,
  );
  const demographicsQuery = useDataFile<RawDataRow[]>(demographicsFileLocation, "Demographics", enabled);

  // Critical loading: only consider active primary queries
  const isPrimaryAbsenteeLoading = !!absenteeCurrentFileLocation && absenteeCurrentQuery.isLoading;
  const isPrimaryResultsLoading = !!electionResultsCurrentFileLocation && electionResultsCurrentQuery.isLoading;
  const isLoading = enabled && (isPrimaryAbsenteeLoading || isPrimaryResultsLoading);

  const isError = enabled && (absenteeCurrentQuery.isError || electionResultsCurrentQuery.isError);
  const error = absenteeCurrentQuery.error || electionResultsCurrentQuery.error || demographicsQuery.error || null;

  // Combine data progressively as domains arrive
  const combinedData = useMemo((): Map<string, CombinedElectionRow> => {
    if (!enabled) return new Map();

    const absenteeCurrentJSON = absenteeCurrentQuery.data;
    const absenteeBaseJSON = absenteeBaseQuery.data;
    const electionResultsCurrentJSON = electionResultsCurrentQuery.data;
    const electionResultBaseJSON = electionResultBaseQuery.data;
    const demographicsJSON = demographicsQuery.data;

    // As long as any dataset has arrived, construct the combined map
    const hasAnyData =
      (absenteeCurrentJSON && absenteeCurrentJSON.length > 0) ||
      (electionResultsCurrentJSON && electionResultsCurrentJSON.length > 0) ||
      (demographicsJSON && demographicsJSON.length > 0);

    if (!hasAnyData) {
      return new Map();
    }

    const combinedElectionData = new Map<string, CombinedElectionRow>();

    const filterResultAndAddToCombinedData = (
      dataJSON: RawDataRow[] | null | undefined,
      callback: (electionDataForRow: CombinedElectionRow, row: RawDataRow) => void,
    ): void => {
      if (!dataJSON || !Array.isArray(dataJSON)) {
        return;
      }
      dataJSON
        .filter((row) => row.county !== "FAKECOUNTY")
        .forEach((row) => {
          const id = isCountyLevel ? row.county : `${row.county}##${row.precinct}`;
          const electionDataForRow = combinedElectionData.get(id) || {
            id,
            CTYNAME: row.county,
            PRECINCT_N: row.precinct,
          };
          callback(electionDataForRow, row);
          combinedElectionData.set(id, electionDataForRow);
        });
    };

    // 1. Process Current Absentee
    if (absenteeCurrentJSON) {
      filterResultAndAddToCombinedData(absenteeCurrentJSON, (electionDataForRow, row) => {
        electionDataForRow.absenteeCurrent = new AbsenteeBallots(row as AbsenteeBallotsData);
        if (row.lastUpdated) {
          electionDataForRow.absenteeLastUpdated = row.lastUpdated;
        }
      });
    }

    // 2. Process Baseline Absentee
    if (absenteeBaseJSON) {
      filterResultAndAddToCombinedData(absenteeBaseJSON, (electionDataForRow, row) => {
        electionDataForRow.absenteeBase = new AbsenteeBallots(row as AbsenteeBallotsData);
      });
    }

    // 3. Process Current Election Results
    let rdStateVotesTotalCurrent = 0;
    if (resultsElectionRaceCurrent && electionResultsCurrentJSON) {
      filterResultAndAddToCombinedData(electionResultsCurrentJSON, (electionDataForRow, row) => {
        electionDataForRow.electionResultsAllCurrent =
          row.races?.map((race) => {
            const res = new ElectionResult(race);
            if (row.lastUpdated && !res.lastUpdated) {
              res.lastUpdated = row.lastUpdated;
            }
            return res;
          }) || [];
        electionDataForRow.electionResultsCurrent = electionDataForRow.electionResultsAllCurrent?.find(
          (election) => election.race === resultsElectionRaceCurrent.name,
        );
        rdStateVotesTotalCurrent += electionDataForRow?.electionResultsCurrent?.totalVotesRD || 0;
        if (row.lastUpdated) {
          electionDataForRow.electionResultsLastUpdated = row.lastUpdated;
        }
      });
    }

    // 4. Process Baseline Election Results
    let rdStateVotesTotalBase = 0;
    if (resultsElectionRacePervious && electionResultBaseJSON) {
      filterResultAndAddToCombinedData(electionResultBaseJSON, (electionDataForRow, row) => {
        electionDataForRow.electionResultsAllBase = row.races?.map((race) => new ElectionResult(race)) || [];
        electionDataForRow.electionResultsBase = electionDataForRow.electionResultsAllBase?.find(
          (election) => election.race === resultsElectionRacePervious.name,
        );
        rdStateVotesTotalBase += electionDataForRow?.electionResultsBase?.totalVotesRD || 0;
      });
    }

    // 5. Compute Comparisons when paired data exists
    const scaleFactor =
      rdStateVotesTotalBase !== 0 && rdStateVotesTotalCurrent !== 0 ? rdStateVotesTotalCurrent / rdStateVotesTotalBase : 1;

    // Determine target days out for absentee comparison (use provided statewide days out, or compute max from current absentee dataset)
    let effectiveDaysOut = targetDaysOut;
    if (effectiveDaysOut === undefined && absenteeCurrentJSON && Array.isArray(absenteeCurrentJSON)) {
      let maxDay = -9000;
      combinedElectionData.forEach((result) => {
        const day = result.absenteeCurrent?.latestDaysFromElection;
        if (day !== undefined && day > maxDay) {
          maxDay = day;
        }
      });
      if (maxDay !== -9000) {
        effectiveDaysOut = maxDay;
      }
    }

    combinedElectionData.forEach((result) => {
      if (result.electionResultsCurrent && result.electionResultsBase) {
        result.electionResultsComparison = new ElectionResultComparison(
          result.electionResultsCurrent,
          result.electionResultsBase,
          scaleFactor,
        );
      } else {
        result.electionResultsComparison = undefined;
      }

      if (result.absenteeBase && (result.absenteeCurrent || (absenteeCurrentJSON && absenteeCurrentJSON.length > 0))) {
        const currentBallots = result.absenteeCurrent ?? new AbsenteeBallots({ votesByDay: [] });
        result.absenteeBallotComparison = new AbsenteeBallotsComparison(
          currentBallots,
          result.absenteeBase,
          effectiveDaysOut,
        );
      } else {
        result.absenteeBallotComparison = null;
      }

      const absenteeDate = result.absenteeLastUpdated || (result.absenteeCurrent as AbsenteeBallots)?.lastUpdated;
      const resultsDate = result.electionResultsLastUpdated || (result.electionResultsCurrent as ElectionResult)?.lastUpdated;
      result.lastUpdated = getMostRecentDate(absenteeDate, resultsDate);
    });

    // 6. Process Demographics
    if (demographicsJSON && Array.isArray(demographicsJSON)) {
      demographicsJSON.forEach((row) => {
        const id = row.id;
        if (!id) {
          return;
        }
        const properties = combinedElectionData.get(id) || {
          id,
          CTYNAME: row.county,
          PRECINCT_N: row.precinct,
        };
        properties.demographics = new Demographics(row as DemographicsData);
        combinedElectionData.set(id, properties);
      });
    }

    return combinedElectionData;
  }, [
    enabled,
    absenteeCurrentQuery.data,
    absenteeBaseQuery.data,
    electionResultsCurrentQuery.data,
    electionResultBaseQuery.data,
    demographicsQuery.data,
    isCountyLevel,
    resultsElectionRaceCurrent,
    resultsElectionRacePervious,
    targetDaysOut,
  ]);

  return {
    data: combinedData,
    isLoading,
    isError,
    error,
  };
};
