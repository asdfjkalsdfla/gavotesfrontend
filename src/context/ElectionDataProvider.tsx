import type { ReactNode } from "react";
import { createContext, useContext, useMemo } from "react";

import { useElectionSelection } from "./ElectionSelectionContext.tsx";
import { useElectionData as useElectionDataQuery } from "../hooks/useElectionData.ts";
import type { Election, ElectionRace } from "../Models/types.ts";
import type CombinedElectionRow from "../Models/CombinedElectionRow";

import elections from "../elections.json";

// Define the shape of our election data context
interface ElectionDataContextValue {
  currentAbsenteeElection?: Election;
  baseAbsenteeElection?: Election;
  currentElectionRace?: ElectionRace;
  previousElectionRace?: ElectionRace;
  elections: Election[];
  statewideResults: CombinedElectionRow;
  locationResults: Map<string, CombinedElectionRow>;
  countyResults: Map<string, CombinedElectionRow>;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

// Define props for the provider component
interface ElectionDataProviderProps {
  isCountyLevel: boolean;
  countyFilter?: string;
  children: ReactNode;
}

export const ElectionDataContext = createContext<ElectionDataContextValue | null>(null);

export function ElectionDataProvider({ isCountyLevel, countyFilter, children }: ElectionDataProviderProps) {
  const { absenteeElectionBaseID, absenteeElectionCurrentID, resultsElectionRaceCurrentID, resultsElectionRacePerviousID } = useElectionSelection();
  const absenteeElectionCurrent = useMemo(() => convertElectionIDToObject(absenteeElectionCurrentID), [absenteeElectionCurrentID]);
  const absenteeElectionBase = useMemo(() => convertElectionIDToObject(absenteeElectionBaseID), [absenteeElectionBaseID]);
  const resultsElectionRaceCurrent = useMemo(() => convertElectionRaceIDToObject(resultsElectionRaceCurrentID), [resultsElectionRaceCurrentID]);
  const resultsElectionRacePervious = useMemo(() => convertElectionRaceIDToObject(resultsElectionRacePerviousID), [resultsElectionRacePerviousID]);

  // Use TanStack Query hooks for data fetching
  const stateQuery = useElectionDataQuery(
    absenteeElectionCurrent || null,
    absenteeElectionBase || null,
    resultsElectionRaceCurrent || null,
    resultsElectionRacePervious || null,
    "state",
    false,
  );

  const countyQuery = useElectionDataQuery(
    absenteeElectionCurrent || null,
    absenteeElectionBase || null,
    resultsElectionRaceCurrent || null,
    resultsElectionRacePervious || null,
    "county",
    true,
  );

  const locationQuery = useElectionDataQuery(
    absenteeElectionCurrent || null,
    absenteeElectionBase || null,
    resultsElectionRaceCurrent || null,
    resultsElectionRacePervious || null,
    isCountyLevel ? "county" : "precinct",
    isCountyLevel,
  );

  // Extract data from queries
  const statewideElectionData = stateQuery.data instanceof Map && stateQuery.data.size > 0 
    ? [...stateQuery.data.values()][0] 
    : { id: '', CTYNAME: '' } as CombinedElectionRow;
  const countyElectionData = (countyQuery.data || new Map()) as unknown as Map<string, CombinedElectionRow>;
  const locationElectionData = (locationQuery.data || new Map()) as unknown as Map<string, CombinedElectionRow>;

  const activeLocationResults = useMemo(() => {
    if (isCountyLevel || !countyFilter) return locationElectionData; // at county level, we don't filter or when using all precincts
    // filter the precincts
    const activeResults = new Map<string, CombinedElectionRow>();
    locationElectionData.forEach((value, key) => {
      if (value.CTYNAME === countyFilter) activeResults.set(key, value);
    });
    return activeResults;
  }, [isCountyLevel, countyFilter, locationElectionData]);

  const electionData: ElectionDataContextValue = useMemo(() => {
    return {
      currentAbsenteeElection: absenteeElectionCurrent,
      baseAbsenteeElection: absenteeElectionBase,
      currentElectionRace: resultsElectionRaceCurrent,
      previousElectionRace: resultsElectionRacePervious,
      elections: elections as Election[],
      statewideResults: statewideElectionData,
      locationResults: activeLocationResults,
      countyResults: countyElectionData,
      isLoading: stateQuery.isLoading || countyQuery.isLoading || locationQuery.isLoading,
      isError: stateQuery.isError || countyQuery.isError || locationQuery.isError,
      error: stateQuery.error || countyQuery.error || locationQuery.error,
    };
  }, [
    absenteeElectionCurrent,
    absenteeElectionBase,
    resultsElectionRaceCurrent,
    resultsElectionRacePervious,
    statewideElectionData,
    activeLocationResults,
    countyElectionData,
    stateQuery.isLoading,
    countyQuery.isLoading,
    locationQuery.isLoading,
    stateQuery.isError,
    countyQuery.isError,
    locationQuery.isError,
    stateQuery.error,
    countyQuery.error,
    locationQuery.error,
  ]);

  return <ElectionDataContext.Provider value={electionData}>{children}</ElectionDataContext.Provider>;
}

export function useElectionData(): ElectionDataContextValue {
  const context = useContext(ElectionDataContext);
  if (!context) {
    throw new Error("useElectionData must be used within an ElectionDataProvider");
  }
  return context;
}

const findElectionByName = (electionID: string | undefined): Election | undefined => {
  if (!electionID) return undefined;
  const electionMatches = elections.filter((election) => election.name === electionID);
  return electionMatches.length === 1 ? electionMatches[0] as Election : undefined;
};

const convertElectionRaceIDToObject = (electionRaceID: string | undefined): ElectionRace | undefined => {
  if (!electionRaceID || !electionRaceID.includes("||")) return undefined;
  const [electionID, raceID] = electionRaceID.split("||");
  if (!electionID || !raceID) return undefined;

  const election = findElectionByName(electionID);
  if (!election) return undefined;

  const raceMatches = election.races.filter((race) => race.name === raceID);
  if (raceMatches.length !== 1) return undefined;

  const raceData = raceMatches[0];
  const race: ElectionRace = {
    name: raceData.name,
    republican: raceData.republican,
    democratic: raceData.democratic,
    election: election,
  };
  return race;
};

const convertElectionIDToObject = (electionID: string | undefined): Election | undefined => {
  return findElectionByName(electionID);
};