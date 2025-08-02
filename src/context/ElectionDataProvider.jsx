import React, { createContext, useContext, useMemo } from "react";

import { useElectionSelection } from "./ElectionSelectionContext.tsx";
import { useElectionData as useElectionDataQuery } from "../hooks/useElectionData.js";

import elections from "../elections.json";

export const ElectionDataContext = createContext(null);

export function ElectionDataProvider({ isCountyLevel, countyFilter, children }) {
  const { absenteeElectionBaseID, absenteeElectionCurrentID, resultsElectionRaceCurrentID, resultsElectionRacePerviousID } = useElectionSelection();
  const absenteeElectionCurrent = useMemo(() => convertElectionIDToObject(absenteeElectionCurrentID), [absenteeElectionCurrentID]);
  const absenteeElectionBase = useMemo(() => convertElectionIDToObject(absenteeElectionBaseID), [absenteeElectionBaseID]);
  const resultsElectionRaceCurrent = useMemo(() => convertElectionRaceIDToObject(resultsElectionRaceCurrentID), [resultsElectionRaceCurrentID]);
  const resultsElectionRacePervious = useMemo(() => convertElectionRaceIDToObject(resultsElectionRacePerviousID), [resultsElectionRacePerviousID]);

  // Use TanStack Query hooks for data fetching
  const stateQuery = useElectionDataQuery(
    absenteeElectionCurrent,
    absenteeElectionBase,
    resultsElectionRaceCurrent,
    resultsElectionRacePervious,
    "state",
    false,
  );

  const countyQuery = useElectionDataQuery(
    absenteeElectionCurrent,
    absenteeElectionBase,
    resultsElectionRaceCurrent,
    resultsElectionRacePervious,
    "county",
    true,
  );

  const locationQuery = useElectionDataQuery(
    absenteeElectionCurrent,
    absenteeElectionBase,
    resultsElectionRaceCurrent,
    resultsElectionRacePervious,
    isCountyLevel ? "county" : "precinct",
    isCountyLevel,
  );

  // Extract data from queries
  const statewideElectionData = stateQuery.data instanceof Map && stateQuery.data.size > 0 ? [...stateQuery.data.values()][0] : {};
  const countyElectionData = countyQuery.data || new Map();
  const locationElectionData = locationQuery.data || new Map();

  const activeLocationResults = useMemo(() => {
    if (isCountyLevel || !countyFilter) return locationElectionData; // at county level, we don't filter or when using all precincts
    // filter the precincts
    const activeResults = new Map();
    locationElectionData.forEach((value, key) => {
      if (value.CTYNAME === countyFilter) activeResults.set(key, value);
    });
    return activeResults;
  }, [isCountyLevel, countyFilter, locationElectionData]);

  const electionData = useMemo(() => {
    return {
      currentAbsenteeElection: absenteeElectionCurrent,
      baseAbsenteeElection: absenteeElectionBase,
      currentElectionRace: resultsElectionRaceCurrent,
      previousElectionRace: resultsElectionRacePervious,
      elections,
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

export function useElectionData() {
  return useContext(ElectionDataContext);
}

const findElectionByName = (electionID) => {
  if (!electionID) return undefined;
  const electionMatches = elections.filter((election) => election.name === electionID);
  return electionMatches.length === 1 ? electionMatches[0] : undefined;
};

const convertElectionRaceIDToObject = (electionRaceID) => {
  if (!electionRaceID || !electionRaceID.includes("||")) return undefined;
  const [electionID, raceID] = electionRaceID.split("||");
  if (!electionID || !raceID) return undefined;

  const election = findElectionByName(electionID);
  if (!election) return undefined;

  const raceMatches = election.races.filter((race) => race.name === raceID);
  if (raceMatches.length !== 1) return undefined;

  const race = raceMatches[0];
  race.election = election;
  return race;
};

const convertElectionIDToObject = (electionID) => {
  return findElectionByName(electionID);
};
