import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import ElectionResult from "../Models/ElectionResult";
import ElectionResultComparison from "../Models/ElectionResultComparison";
import AbsenteeBallots from "../Models/AbsenteeBallots";
import AbsenteeBallotsComparison from "../Models/AbsenteeBallotsComparison";
import Demographics from "../Models/Demographics";
import type { ElectionInfo, RaceInfo, UseElectionDataReturn, ElectionDataEntry } from "../types/useElectionData";

// Helper function to build API URLs
const buildApiUrl = (category: string, prefix: string, name: string | undefined, level: string): string | null => {
  if (!name) return null;
  return `${import.meta.env.VITE_API_URL_BASE}static/${category}/${prefix}-${name}-${level}.json`;
};

// Helper function to fetch data with error handling
const fetchData = async (url: string, description: string): Promise<unknown> => {
  if (!url) return null;

  const response = await fetch(url);
  if (!response.ok) {
    console.error(`ERROR loading ${description} from ${url}: ${response.statusText}`);
    throw new Error(`Failed to load ${description}: ${response.statusText}`);
  }
  return response.json();
};

// Custom hook for fetching a single data file
const useDataFile = (url: string | null, description: string, enabled = true) => {
  return useQuery({
    queryKey: ["dataFile", url],
    queryFn: () => (url ? fetchData(url, description) : null),
    enabled: enabled && !!url,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Custom hook for fetching and combining election data
export const useElectionData = (
  absenteeElectionCurrent: ElectionInfo | null | undefined,
  absenteeElectionBase: ElectionInfo | null | undefined,
  resultsElectionRaceCurrent: RaceInfo | null | undefined,
  resultsElectionRacePervious: RaceInfo | null | undefined,
  level: string,
  isCountyLevel: boolean,
): UseElectionDataReturn => {
  const absenteeCurrentFileLocation = buildApiUrl("absentee", "absenteeSummary", absenteeElectionCurrent?.name, level);
  const absenteeBaseFileLocation = buildApiUrl("absentee", "absenteeSummary", absenteeElectionBase?.name, level);
  const electionResultsCurrentFileLocation = buildApiUrl("electionResults", "electionResultsSummary", resultsElectionRaceCurrent?.election?.name, level);
  const electionResultBaseFileLocation = resultsElectionRacePervious
    ? buildApiUrl("electionResults", "electionResultsSummary", resultsElectionRacePervious?.election?.name, level)
    : null;
  const demographicsFileLocation = `${import.meta.env.VITE_API_URL_BASE}static/demographics/demographics-${level}-2020.json`;

  // Fetch all data files
  const absenteeCurrentQuery = useDataFile(absenteeCurrentFileLocation, "Absentee Current");
  const absenteeBaseQuery = useDataFile(absenteeBaseFileLocation, "Absentee Base");
  const electionResultsCurrentQuery = useDataFile(electionResultsCurrentFileLocation, "Election Results Current");
  const electionResultBaseQuery = useDataFile(electionResultBaseFileLocation, "Election Result Base", !!electionResultBaseFileLocation);
  const demographicsQuery = useDataFile(demographicsFileLocation, "Demographics");

  // Check if any critical queries are loading or have errors
  const isLoading = absenteeCurrentQuery.isLoading || absenteeBaseQuery.isLoading || electionResultsCurrentQuery.isLoading || demographicsQuery.isLoading;

  const isError = absenteeCurrentQuery.isError || absenteeBaseQuery.isError || electionResultsCurrentQuery.isError || demographicsQuery.isError;

  // Combine the data when all queries are successful
  const combinedData = useMemo(() => {
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

    const combinedElectionData = new Map<string, ElectionDataEntry>();

    const filterResultAndAddToCombinedData = (dataJSON: unknown, callback: (electionDataForRow: ElectionDataEntry, row: unknown) => void): void => {
      if (!dataJSON || !Array.isArray(dataJSON)) {
        console.warn("Skipping data processing due to missing or invalid dataJSON.");
        return;
      }
      dataJSON
        .filter((row: unknown) => (row as any).county !== "FAKECOUNTY")
        .forEach((row: unknown) => {
          const rowData = row as any;
          const id = isCountyLevel ? rowData.county : `${rowData.county}##${rowData.precinct}`;
          const electionDataForRow = combinedElectionData.get(id) || { id, CTYNAME: rowData.county, PRECINCT_N: rowData.precinct };
          callback(electionDataForRow, row);
          combinedElectionData.set(id, electionDataForRow);
        });
    };

    filterResultAndAddToCombinedData(absenteeCurrentJSON, (electionDataForRow: ElectionDataEntry, row: unknown) => {
      electionDataForRow.absenteeCurrent = new AbsenteeBallots(row);
    });

    filterResultAndAddToCombinedData(absenteeBaseJSON, (electionDataForRow: ElectionDataEntry, row: unknown) => {
      electionDataForRow.absenteeBase = new AbsenteeBallots(row);
    });

    let rdStateVotesTotalCurrent = 0;
    if (resultsElectionRaceCurrent) {
      filterResultAndAddToCombinedData(electionResultsCurrentJSON, (electionDataForRow, row) => {
        const rowData = row as any;
        electionDataForRow.electionResultsAllCurrent = rowData.races.map((race: unknown) => new ElectionResult(race));
        electionDataForRow.electionResultsCurrent = electionDataForRow.electionResultsAllCurrent?.find(
          (election: unknown) => (election as any).race === resultsElectionRaceCurrent.name,
        );
        rdStateVotesTotalCurrent += (electionDataForRow?.electionResultsCurrent as any)?.totalVotesRD || 0;
      });
    }

    let rdStateVotesTotalBase = 0;
    if (electionResultBaseJSON && resultsElectionRacePervious) {
      filterResultAndAddToCombinedData(electionResultBaseJSON, (electionDataForRow, row) => {
        const rowData = row as any;
        electionDataForRow.electionResultsAllBase = rowData.races.map((race: unknown) => new ElectionResult(race));
        electionDataForRow.electionResultsBase = electionDataForRow.electionResultsAllBase?.find(
          (election: unknown) => (election as any).race === resultsElectionRacePervious.name,
        );
        rdStateVotesTotalBase += (electionDataForRow?.electionResultsBase as any)?.totalVotesRD || 0;
      });
    }

    const scaleFactor = rdStateVotesTotalBase !== 0 && rdStateVotesTotalCurrent !== 0 ? rdStateVotesTotalCurrent / rdStateVotesTotalBase : 1;

    [...combinedElectionData.values()].forEach((result) => {
      result.electionResultsComparison = new ElectionResultComparison(result.electionResultsCurrent, result.electionResultsBase, scaleFactor);
      result.absenteeBallotComparison =
        result.absenteeCurrent && result.absenteeBase ? new AbsenteeBallotsComparison(result.absenteeCurrent, result.absenteeBase) : null;
    });

    if (demographicsJSON && Array.isArray(demographicsJSON)) {
      demographicsJSON.forEach((row: unknown) => {
        const rowData = row as any;
        const id = rowData.id; // Use 'id' from demographics data as the key
        if (!id) {
          console.warn("Skipping demographics row due to missing id:", row);
          return;
        }
        const properties = combinedElectionData.get(id) || { id, CTYNAME: rowData.county, PRECINCT_N: rowData.precinct };
        (properties as any).demographics = new Demographics(row);
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
