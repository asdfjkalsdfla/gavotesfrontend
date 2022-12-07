import { createContext, useContext, useState, useEffect, useMemo } from "react";

import ElectionResult from "./Models/ElectionResult";
import ElectionResultComparison from "./Models/ElectionResultComparison";
import AbsenteeBallots from "./Models/AbsenteeBallots";
import AbsenteeBallotsComparison from "./Models/AbsenteeBallotsComparison";
import Demographics from "./Models/Demographics";

import elections from "./elections.json";

export const ElectionDataContext = createContext(null);
export const ElectionDispatchContext = createContext(null);

export function ElectionDataProvider({
  isCountyLevel,
  countyFilter,
  absenteeElectionBaseID,
  absenteeElectionCurrentID,
  resultsElectionRaceCurrentID,
  resultsElectionRacePerviousID,
  children,
}) {
  const baseAbsenteeElection = convertElectionIDToObject(absenteeElectionBaseID);
  const currentAbsenteeElection = convertElectionIDToObject(absenteeElectionCurrentID);
  const currentElectionRace = convertElectionRaceIDToObject(resultsElectionRaceCurrentID);
  const previousElectionRace = convertElectionRaceIDToObject(resultsElectionRacePerviousID);

  // Data
  const [statewideElectionData, updateStatewideTotals] = useState({});
  const [countyElectionData, updateCountyElectionData] = useState(new Map());
  const [locationElectionData, updateLocationElectionData] = useState(new Map());

  // Load all levels of election data
  useEffect(() => {
    const load = async (level, updateFunctions) => {
      const absenteeCurrentFileLocation = `/static/absenteeSummary-${absenteeElectionCurrentID}-${level}.json`;
      const absenteeBaseFileLocation = `/static/absenteeSummary-${absenteeElectionBaseID}-${level}.json`;
      const electionResultsCurrentFileLocation = `/static/electionResultsSummary-${currentElectionRace.election.name}-${level}.json`;
      const electionResultBaseFileLocation = previousElectionRace ? `/static/electionResultsSummary-${previousElectionRace.election.name}-${level}.json` : null;
      const demographicsFileLocation = `/static/demographics-${level}-2020.json`;

      const updatedElectionData = await loadAndCombineElectionDataFiles(
        absenteeCurrentFileLocation,
        absenteeBaseFileLocation,
        electionResultsCurrentFileLocation,
        electionResultBaseFileLocation,
        demographicsFileLocation,
        level === "county",
        currentElectionRace,
        previousElectionRace
      );
      updateFunctions.forEach((updateFunction) => {
        if (level === "state") {
          updateFunction([...updatedElectionData.values()][0]);
          return;
        }
        updateFunction(updatedElectionData);
      });
    };

    if (!absenteeElectionBaseID || !absenteeElectionCurrentID || !currentElectionRace) return; // fail if we don't have the required info
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

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [absenteeElectionBaseID, absenteeElectionCurrentID, currentElectionRace, previousElectionRace, isCountyLevel]);

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
      currentAbsenteeElection,
      baseAbsenteeElection,
      currentElectionRace,
      previousElectionRace,
      elections,
      statewideResults: statewideElectionData,
      locationResults: activeLocationResults,
      countyResults: countyElectionData,
    };
  }, [statewideElectionData, activeLocationResults, countyElectionData]);

  return (
    <ElectionDataContext.Provider value={electionData}>
      {children}
      {/* <ElectionDispatchContext.Provider value={dispatch}></ElectionDispatchContext.Provider> */}
    </ElectionDataContext.Provider>
  );
}

export function useElectionData() {
  return useContext(ElectionDataContext);
}

export function useElectionDispatch() {
  return useContext(ElectionDispatchContext);
}

const loadAndCombineElectionDataFiles = async (
  absenteeCurrentFileLocation,
  absenteeBaseFileLocation,
  electionResultsCurrentFileLocation,
  electionResultBaseFileLocation,
  demographicsFileLocation,
  isCountyLevel,
  currentElectionRace,
  previousElectionRace
) => {
  // console.log(`fetching data`);
  const fetchPromises = [];
  fetchPromises.push(fetch(absenteeCurrentFileLocation));
  fetchPromises.push(fetch(absenteeBaseFileLocation));
  fetchPromises.push(fetch(electionResultsCurrentFileLocation));
  fetchPromises.push(fetch(demographicsFileLocation));
  if (electionResultBaseFileLocation) fetchPromises.push(fetch(electionResultBaseFileLocation));

  const [responseAbsenteeCurrent, responseAbsenteeBase, responseElectionResultsCurrent, responseDemographics, electionResultBase] = await Promise.all(
    fetchPromises
  );

  if (!responseAbsenteeCurrent.ok) {
    console.log("ERROR loading absentee current");
    return new Map();
  }
  if (!responseAbsenteeBase.ok) {
    console.log("ERROR loading absentee base");
    return new Map();;
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
    return;
  }

  const jsonPromises = [responseAbsenteeCurrent.json(), responseAbsenteeBase.json(), responseElectionResultsCurrent.json(), responseDemographics.json()];
  if (electionResultBaseFileLocation) {
    jsonPromises.push(electionResultBase.json());
  }
  const [absenteeCurrentJSON, absenteeBaseJSON, electionResultsCurrentJSON, demographicsJSON, electionResultBaseJSON] = await Promise.all(jsonPromises);

  const combinedElectionData = new Map();

  absenteeCurrentJSON.forEach((row) => {
    const id = isCountyLevel ? row.county : `${row.county}##${row.precinct}`;
    const properties = combinedElectionData.has(id) ? combinedElectionData.get(id) : { id, CTYNAME: row.county, PRECINCT_N: row.precinct };
    properties.absenteeCurrent = new AbsenteeBallots(row);
    combinedElectionData.set(id, properties);
  });
  absenteeBaseJSON.forEach((row) => {
    const id = isCountyLevel ? row.county : `${row.county}##${row.precinct}`;
    const properties = combinedElectionData.has(id) ? combinedElectionData.get(id) : { id, CTYNAME: row.county, PRECINCT_N: row.precinct };
    properties.absenteeBase = new AbsenteeBallots(row);
    combinedElectionData.set(id, properties);
  });

  let rdStateVotesTotalCurrent = 0;
  electionResultsCurrentJSON.forEach((row) => {
    const id = isCountyLevel ? row.county : `${row.county}##${row.precinct}`;
    const properties = combinedElectionData.has(id) ? combinedElectionData.get(id) : { id, CTYNAME: row.county, PRECINCT_N: row.precinct };
    properties.electionResultsAllCurrent = row.races.map((race) => new ElectionResult(race));
    // Find the current race
    properties.electionResultsCurrent = properties.electionResultsAllCurrent?.filter((election) => election.race === currentElectionRace.name)[0];
    combinedElectionData.set(id, properties);
    rdStateVotesTotalCurrent += properties.electionResultsCurrent.totalVotesRD || 0;
  });
  let rdStateVotesTotalBase = 0;
  if (electionResultBaseFileLocation) {
    electionResultBaseJSON.forEach((row) => {
      const id = isCountyLevel ? row.county : `${row.county}##${row.precinct}`;

      const properties = combinedElectionData.has(id) ? combinedElectionData.get(id) : { id, CTYNAME: row.county, PRECINCT_N: row.precinct };
      properties.electionResultsAllBase = row.races.map((race) => new ElectionResult(race));
      properties.electionResultsBase = properties.electionResultsAllBase.filter((election) => election.race === previousElectionRace.name)[0];
      combinedElectionData.set(id, properties);
      rdStateVotesTotalBase += properties.electionResultsBase.totalVotesRD || 0;
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
    const id = row.id;
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
