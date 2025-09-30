import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import ElectionResult from "../lib/electionResults/ElectionResult";
import ElectionResultComparison from "../lib/electionResults/ElectionResultComparison";
import AbsenteeBallots from "../lib/electionResults/AbsenteeBallots";
import AbsenteeBallotsComparison from "../lib/electionResults/AbsenteeBallotsComparison";
import Demographics from "../lib/electionResults/Demographics";
import type { AbsenteeBallotsData, ElectionResultData, DemographicsData, Election, ElectionRace, VotesByDay } from "../lib/electionResults/types";
import type CombinedElectionRow from "../lib/electionResults/CombinedElectionRow";

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
  [key: string]: unknown;
}

// Helper function to build API URLs
const buildApiUrl = (category: string, prefix: string, name: string, level: string): string | null => {
  if (!name) return null;
  return `${import.meta.env.VITE_API_URL_BASE}static/${category}/${prefix}-${name}-${level}.json`;
};

// Helper function to fetch data with error handling
const fetchData = async <T = unknown>(url: string, description: string): Promise<T> => {
  if (!url) return null as T;

  const response = await fetch(url);
  if (!response.ok) {
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
      if (!url) throw new Error("URL is required");
      return fetchData<T | null>(url, description);
    },
    enabled: enabled && !!url,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
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
) => {
  const absenteeCurrentFileLocation = buildApiUrl("absentee", "absenteeSummary", absenteeElectionCurrent?.name || "", level);
  const absenteeBaseFileLocation = buildApiUrl("absentee", "absenteeSummary", absenteeElectionBase?.name || "", level);
  const electionResultsCurrentFileLocation = buildApiUrl("electionResults", "electionResultsSummary", resultsElectionRaceCurrent?.election?.name || "", level);
  const electionResultBaseFileLocation = resultsElectionRacePervious
    ? buildApiUrl("electionResults", "electionResultsSummary", resultsElectionRacePervious?.election?.name || "", level)
    : null;
  const demographicsFileLocation = `${import.meta.env.VITE_API_URL_BASE}static/demographics/demographics-${level}-2020.json`;

  // Fetch all data files
  const absenteeCurrentQuery = useDataFile<RawDataRow[]>(absenteeCurrentFileLocation, "Absentee Current");
  const absenteeBaseQuery = useDataFile<RawDataRow[]>(absenteeBaseFileLocation, "Absentee Base");
  const electionResultsCurrentQuery = useDataFile<RawDataRow[]>(electionResultsCurrentFileLocation, "Election Results Current");
  const electionResultBaseQuery = useDataFile<RawDataRow[]>(electionResultBaseFileLocation, "Election Result Base", !!electionResultBaseFileLocation);
  const demographicsQuery = useDataFile<RawDataRow[]>(demographicsFileLocation, "Demographics");

  // Check if any critical queries are loading or have errors
  const isLoading = absenteeCurrentQuery.isLoading || absenteeBaseQuery.isLoading || electionResultsCurrentQuery.isLoading || demographicsQuery.isLoading;

  const isError = absenteeCurrentQuery.isError || absenteeBaseQuery.isError || electionResultsCurrentQuery.isError || demographicsQuery.isError;

  // Combine the data when all queries are successful
  const combinedData = useMemo((): Map<string, CombinedElectionRow> => {
    if (isLoading || isError) return new Map();

    const absenteeCurrentJSON = absenteeCurrentQuery.data;
    const absenteeBaseJSON = absenteeBaseQuery.data;
    const electionResultsCurrentJSON = electionResultsCurrentQuery.data;
    const electionResultBaseJSON = electionResultBaseQuery.data;
    const demographicsJSON = demographicsQuery.data;

    if (!absenteeCurrentJSON || !absenteeBaseJSON || !electionResultsCurrentJSON || !demographicsJSON) {
      console.error("Essential JSON data is missing after fetch. Aborting data combination.");
      return new Map();
    }

    const combinedElectionData = new Map<string, CombinedElectionRow>();

    const filterResultAndAddToCombinedData = (
      dataJSON: RawDataRow[] | null,
      callback: (electionDataForRow: CombinedElectionRow, row: RawDataRow) => void,
    ): void => {
      if (!dataJSON || !Array.isArray(dataJSON)) {
        console.warn("Skipping data processing due to missing or invalid dataJSON.");
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

    filterResultAndAddToCombinedData(absenteeCurrentJSON, (electionDataForRow, row) => {
      electionDataForRow.absenteeCurrent = new AbsenteeBallots(row as AbsenteeBallotsData);
    });

    filterResultAndAddToCombinedData(absenteeBaseJSON, (electionDataForRow, row) => {
      electionDataForRow.absenteeBase = new AbsenteeBallots(row as AbsenteeBallotsData);
    });

    let rdStateVotesTotalCurrent = 0;
    if (resultsElectionRaceCurrent) {
      filterResultAndAddToCombinedData(electionResultsCurrentJSON, (electionDataForRow, row) => {
        electionDataForRow.electionResultsAllCurrent = row.races?.map((race) => new ElectionResult(race)) || [];
        electionDataForRow.electionResultsCurrent = electionDataForRow.electionResultsAllCurrent?.find(
          (election) => election.race === resultsElectionRaceCurrent.name,
        );
        rdStateVotesTotalCurrent += electionDataForRow?.electionResultsCurrent?.totalVotesRD || 0;
      });
    }

    let rdStateVotesTotalBase = 0;
    if (electionResultBaseJSON && resultsElectionRacePervious) {
      filterResultAndAddToCombinedData(electionResultBaseJSON, (electionDataForRow, row) => {
        electionDataForRow.electionResultsAllBase = row.races?.map((race) => new ElectionResult(race)) || [];
        electionDataForRow.electionResultsBase = electionDataForRow.electionResultsAllBase?.find(
          (election) => election.race === resultsElectionRacePervious.name,
        );
        rdStateVotesTotalBase += electionDataForRow?.electionResultsBase?.totalVotesRD || 0;
      });
    }

    const scaleFactor = rdStateVotesTotalBase !== 0 && rdStateVotesTotalCurrent !== 0 ? rdStateVotesTotalCurrent / rdStateVotesTotalBase : 1;

    [...combinedElectionData.values()].forEach((result) => {
      if (result.electionResultsCurrent && result.electionResultsBase) {
        result.electionResultsComparison = new ElectionResultComparison(result.electionResultsCurrent, result.electionResultsBase, scaleFactor);
      }
      result.absenteeBallotComparison =
        result.absenteeCurrent && result.absenteeBase ? new AbsenteeBallotsComparison(result.absenteeCurrent, result.absenteeBase) : null;
    });

    if (demographicsJSON && Array.isArray(demographicsJSON)) {
      demographicsJSON.forEach((row) => {
        const id = row.id; // Use 'id' from demographics data as the key
        if (!id) {
          console.warn("Skipping demographics row due to missing id:", row);
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
    } else {
      console.warn("Demographics data is missing or not an array. Skipping demographics processing.");
    }

    return combinedElectionData;
  }, [
    isLoading,
    isError,
    absenteeCurrentQuery.data,
    absenteeBaseQuery.data,
    electionResultsCurrentQuery.data,
    electionResultBaseQuery.data,
    demographicsQuery.data,
    isCountyLevel,
    resultsElectionRaceCurrent,
    resultsElectionRacePervious,
  ]);

  return {
    data: combinedData,
    isLoading,
    isError,
    error: absenteeCurrentQuery.error || absenteeBaseQuery.error || electionResultsCurrentQuery.error || demographicsQuery.error,
  };
};
