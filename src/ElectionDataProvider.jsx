import React, { createContext, useContext, useState, useEffect, useMemo } from "react";

import ElectionResult from "./Models/ElectionResult";
import ElectionResultComparison from "./Models/ElectionResultComparison";
import AbsenteeBallots from "./Models/AbsenteeBallots";
import AbsenteeBallotsComparison from "./Models/AbsenteeBallotsComparison";
import Demographics from "./Models/Demographics";
import { useElectionSelection } from "./ElectionSelectionContext.tsx";

import elections from "./elections.json";

export const ElectionDataContext = createContext(null);

export function ElectionDataProvider({ isCountyLevel, countyFilter, children }) {
  const { absenteeElectionBaseID, absenteeElectionCurrentID, resultsElectionRaceCurrentID, resultsElectionRacePerviousID } = useElectionSelection();
  const absenteeElectionCurrent = useMemo(() => convertElectionIDToObject(absenteeElectionCurrentID), [absenteeElectionCurrentID]);
  const absenteeElectionBase = useMemo(() => convertElectionIDToObject(absenteeElectionBaseID), [absenteeElectionBaseID]);
  const resultsElectionRaceCurrent = useMemo(() => convertElectionRaceIDToObject(resultsElectionRaceCurrentID), [resultsElectionRaceCurrentID]);
  const resultsElectionRacePervious = useMemo(() => convertElectionRaceIDToObject(resultsElectionRacePerviousID), [resultsElectionRacePerviousID]);

  // Data
  const [statewideElectionData, updateStatewideTotals] = useState({});
  const [countyElectionData, updateCountyElectionData] = useState(new Map());
  const [locationElectionData, updateLocationElectionData] = useState(new Map());

  // Load all levels of election data
  useEffect(() => {
    const load = async (level, updateFunctions) => {
      const absenteeCurrentFileLocation = `${import.meta.env.VITE_API_URL_BASE}static/absentee/absenteeSummary-${absenteeElectionCurrent.name}-${level}.json`;
      const absenteeBaseFileLocation = `${import.meta.env.VITE_API_URL_BASE}static/absentee/absenteeSummary-${absenteeElectionBase.name}-${level}.json`;
      const electionResultsCurrentFileLocation = `${import.meta.env.VITE_API_URL_BASE}static/electionResults/electionResultsSummary-${
        resultsElectionRaceCurrent.election.name
      }-${level}.json`;
      const electionResultBaseFileLocation = resultsElectionRacePervious
        ? `${import.meta.env.VITE_API_URL_BASE}static/electionResults/electionResultsSummary-${resultsElectionRacePervious.election.name}-${level}.json`
        : null;
      const demographicsFileLocation = `${import.meta.env.VITE_API_URL_BASE}static/demographics/demographics-${level}-2020.json`;

      const updatedElectionData = await loadAndCombineElectionDataFiles(
        absenteeCurrentFileLocation,
        absenteeBaseFileLocation,
        electionResultsCurrentFileLocation,
        electionResultBaseFileLocation,
        demographicsFileLocation,
        level === "county",
        resultsElectionRaceCurrent,
        resultsElectionRacePervious,
      );
      updateFunctions.forEach((updateFunction) => {
        if (level === "state") {
          updateFunction([...updatedElectionData.values()][0]);
          return;
        }
        updateFunction(updatedElectionData);
      });
    };

    if (!absenteeElectionBase || !absenteeElectionCurrent || !resultsElectionRaceCurrent) return; // fail if we don't have the required info
    const levels = [
      { name: "state", updateFunctions: [updateStatewideTotals] },
      { name: "county", updateFunctions: isCountyLevel ? [updateCountyElectionData, updateLocationElectionData] : [updateCountyElectionData] },
    ];
    if (!isCountyLevel) {
      levels.push({ name: "precinct", updateFunctions: [updateLocationElectionData] });
    }
    levels.forEach((level) => {
      load(level.name, level.updateFunctions);
    });
  }, [absenteeElectionBase, absenteeElectionCurrent, resultsElectionRaceCurrent, resultsElectionRacePervious, isCountyLevel]);

  const activeLocationResults = useMemo(() => {
    if (isCountyLevel || !countyFilter) return locationElectionData; // at county level, we don't filter or when using all precincts
    // filter the precincts
    const activeResults = new Map();
    locationElectionData.forEach((value, key) => {
      if (value.CTYNAME === countyFilter) activeResults.set(key, value);
      // if (value?.electionResultsComparison?.totalVotesPercent > 0.80) activeResults.set(key, value);
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
    };
  }, [statewideElectionData, activeLocationResults, countyElectionData]);

  return <ElectionDataContext.Provider value={electionData}>{children}</ElectionDataContext.Provider>;
}

export function useElectionData() {
  return useContext(ElectionDataContext);
}

const loadAndCombineElectionDataFiles = async (
  absenteeCurrentFileLocation,
  absenteeBaseFileLocation,
  electionResultsCurrentFileLocation,
  electionResultBaseFileLocation,
  demographicsFileLocation,
  isCountyLevel,
  currentElectionRace,
  previousElectionRace,
) => {
  console.log(`fetching data`);
  const fetchPromises = [];
  fetchPromises.push(fetch(absenteeCurrentFileLocation));
  fetchPromises.push(fetch(absenteeBaseFileLocation));
  fetchPromises.push(fetch(electionResultsCurrentFileLocation));
  fetchPromises.push(fetch(demographicsFileLocation));
  if (electionResultBaseFileLocation) fetchPromises.push(fetch(electionResultBaseFileLocation));

  const [responseAbsenteeCurrent, responseAbsenteeBase, responseElectionResultsCurrent, responseDemographics, electionResultBase] =
    await Promise.all(fetchPromises);

  if (!responseAbsenteeCurrent.ok) {
    console.log("ERROR loading absentee current");
    return new Map();
  }
  if (!responseAbsenteeBase.ok) {
    console.log("ERROR loading absentee base");
    return new Map();
  }
  if (!responseElectionResultsCurrent.ok) {
    console.log("ERROR loading election result current");
    return new Map();
  }
  if (!responseDemographics.ok) {
    console.log("ERROR loading demographics");
    return new Map();
  }

  if (electionResultBaseFileLocation && !electionResultBase.ok) {
    console.log("ERROR loading election result base");
    return new Map();
  }

  const jsonPromises = [responseAbsenteeCurrent.json(), responseAbsenteeBase.json(), responseElectionResultsCurrent.json(), responseDemographics.json()];
  if (electionResultBaseFileLocation) {
    jsonPromises.push(electionResultBase.json());
  }
  const [absenteeCurrentJSON, absenteeBaseJSON, electionResultsCurrentJSON, demographicsJSON, electionResultBaseJSON] = await Promise.all(jsonPromises);

  const combinedElectionData = new Map();

  absenteeCurrentJSON
    .filter((row) => row.county !== "FAKECOUNTY")
    .forEach((row) => {
      const id = isCountyLevel ? row.county : `${row.county}##${row.precinct}`;
      const properties = combinedElectionData.has(id) ? combinedElectionData.get(id) : { id, CTYNAME: row.county, PRECINCT_N: row.precinct };
      properties.absenteeCurrent = new AbsenteeBallots(row);
      combinedElectionData.set(id, properties);
    });
  absenteeBaseJSON
    .filter((row) => row.county !== "FAKECOUNTY")
    .forEach((row) => {
      const id = isCountyLevel ? row.county : `${row.county}##${row.precinct}`;
      const properties = combinedElectionData.has(id) ? combinedElectionData.get(id) : { id, CTYNAME: row.county, PRECINCT_N: row.precinct };
      properties.absenteeBase = new AbsenteeBallots(row);
      combinedElectionData.set(id, properties);
    });

  let rdStateVotesTotalCurrent = 0;
  electionResultsCurrentJSON
    .filter((row) => row.county !== "FAKECOUNTY")
    .forEach((row) => {
      const id = isCountyLevel ? row.county : `${row.county}##${row.precinct}`;
      const properties = combinedElectionData.has(id) ? combinedElectionData.get(id) : { id, CTYNAME: row.county, PRECINCT_N: row.precinct };
      properties.electionResultsAllCurrent = row.races.map((race) => new ElectionResult(race));
      // Find the current race
      properties.electionResultsCurrent = properties.electionResultsAllCurrent?.filter((election) => election.race === currentElectionRace.name)[0];
      combinedElectionData.set(id, properties);
      rdStateVotesTotalCurrent += properties?.electionResultsCurrent?.totalVotesRD || 0;
    });
  let rdStateVotesTotalBase = 0;
  if (electionResultBaseFileLocation) {
    electionResultBaseJSON
      .filter((row) => row.county !== "FAKECOUNTY")
      .forEach((row) => {
        const id = isCountyLevel ? row.county : `${row.county}##${row.precinct}`;

        const properties = combinedElectionData.has(id) ? combinedElectionData.get(id) : { id, CTYNAME: row.county, PRECINCT_N: row.precinct };
        properties.electionResultsAllBase = row.races.map((race) => new ElectionResult(race));

        properties.electionResultsBase = properties.electionResultsAllBase.filter((election) => election.race === previousElectionRace.name)[0];
        combinedElectionData.set(id, properties);
        rdStateVotesTotalBase += properties?.electionResultsBase?.totalVotesRD || 0;
      });
  }

  const scaleFactor = rdStateVotesTotalCurrent / rdStateVotesTotalBase;

  // Set the comparisons between the results
  [...combinedElectionData.values()].forEach((result) => {
    result.electionResultsComparison = new ElectionResultComparison(result.electionResultsCurrent, result.electionResultsBase, scaleFactor);

    result.absenteeBallotComparison =
      result.absenteeCurrent && result.absenteeBase ? new AbsenteeBallotsComparison(result.absenteeCurrent, result.absenteeBase) : null;
  });

  demographicsJSON.forEach((row) => {
    const { id } = row;
    const properties = combinedElectionData.has(id) ? combinedElectionData.get(id) : { id, CTYNAME: row.county, PRECINCT_N: row.precinct };
    properties.demographics = new Demographics(row);
    combinedElectionData.set(id, properties);
  });

  return combinedElectionData;
};

const convertElectionRaceIDToObject = (electionRaceID) => {
  const splitToIDs = electionRaceID && electionRaceID.includes("||") && electionRaceID.split("||");
  if (!splitToIDs || splitToIDs.length !== 2) return;
  const electionID = splitToIDs[0];
  const raceID = splitToIDs[1];
  const electionMatches = elections.filter((election) => election.name === electionID);
  if (!electionMatches || electionMatches.length !== 1) return;
  const election = electionMatches[0];
  const raceMatches = election.races.filter((race) => race.name === raceID);
  if (!raceMatches || raceMatches.length !== 1) return;
  const race = raceMatches[0];
  race.election = election; // linking the values back to each other
  return race;
};

const convertElectionIDToObject = (electionID) => {
  const electionMatches = elections.filter((election) => election.name === electionID);
  if (!electionMatches || electionMatches.length !== 1) return;
  const election = electionMatches[0];
  return election;
};
