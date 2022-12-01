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
  county,
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
  // const [countyElectionData, updateCountyElectionData] = useState(new Map());
  const [locationElectionData, updateLocationElectionData] = useState(new Map());

  // Load county or precinct level election data
  useEffect(() => {
    const level = isCountyLevel ? "county" : "precinct";
    const absenteeCurrentFileLocation = `/static/absenteeSummary-${absenteeElectionCurrentID}-${level}.json`;
    const absenteeBaseFileLocation = `/static/absenteeSummary-${absenteeElectionBaseID}-${level}.json`;
    const electionResultsCurrentFileLocation = `/static/electionResultsSummary-${currentElectionRace.election.name}-${level}.json`;
    const electionResultBaseFileLocation = previousElectionRace ? `/static/electionResultsSummary-${previousElectionRace.election.name}-${level}.json` : null;
    const demographicsFileLocation = `/static/demographics-${level}-2020.json`;

    const load = async () => {
      const updatedElectionData = await loadAndCombineElectionDataFiles(
        absenteeCurrentFileLocation,
        absenteeBaseFileLocation,
        electionResultsCurrentFileLocation,
        electionResultBaseFileLocation,
        demographicsFileLocation,
        isCountyLevel,
        currentElectionRace,
        previousElectionRace
      );
      updateLocationElectionData(updatedElectionData);
      // if (isCountyLevel) updateCountyElectionData(updatedElectionData);
    };

    if (!absenteeElectionBaseID || !absenteeElectionCurrentID || !currentElectionRace) return; // fail if we don't have the required info
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [absenteeElectionBaseID, absenteeElectionCurrentID, currentElectionRace, previousElectionRace, isCountyLevel]);

  // Load statewide election data
  const [statewideElectionData, updateStatewideTotals] = useState({});

  useEffect(() => {
    const absenteeCurrentFileLocation = `/static/absenteeSummary-${absenteeElectionCurrentID}-state.json`;
    const absenteeBaseFileLocation = `/static/absenteeSummary-${absenteeElectionBaseID}-state.json`;
    const electionResultsCurrentFileLocation = `/static/electionResultsSummary-${currentElectionRace.election.name}-state.json`;
    const electionResultBaseFileLocation = previousElectionRace ? `/static/electionResultsSummary-${previousElectionRace.election.name}-state.json` : null;
    const demographicsFileLocation = `/static/demographics-state.json`;

    const load = async () => {
      const votingResultTotalMap = await loadAndCombineElectionDataFiles(
        absenteeCurrentFileLocation,
        absenteeBaseFileLocation,
        electionResultsCurrentFileLocation,
        electionResultBaseFileLocation,
        demographicsFileLocation,
        isCountyLevel,
        currentElectionRace,
        previousElectionRace
      );
      updateStatewideTotals([...votingResultTotalMap.values()][0]);
    };

    if (!absenteeElectionBaseID || !absenteeElectionCurrentID || !currentElectionRace) return; // fail if we don't have the required info
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [absenteeElectionBaseID, absenteeElectionCurrentID, currentElectionRace, previousElectionRace]);

  const activeLocationResults = useMemo(() => {
    if (isCountyLevel || !county) return locationElectionData; // at county level, we don't filter or when using all precincts
    // filter the precincts
    const activeResults = new Map();
    locationElectionData.forEach((value, key) => {
      if (value.CTYNAME === county) activeResults.set(key, value);
    });
    return activeResults;
  }, [isCountyLevel, county, locationElectionData]);

  const electionData = useMemo(() => {
    return {
      currentAbsenteeElection,
      baseAbsenteeElection,
      currentElectionRace,
      previousElectionRace,
      elections,
      statewideResults: statewideElectionData,
      locationResults: activeLocationResults,
    };
  }, [statewideElectionData, locationElectionData]);

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
    return;
  }
  if (!responseAbsenteeBase.ok) {
    console.log("ERROR loading absentee base");
    return;
  }
  if (!responseElectionResultsCurrent.ok) {
    console.log("ERROR loading election result current");
    return;
  }
  if (!responseDemographics.ok) {
    console.log("ERROR loading demographics");
    return;
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

  const updatedElectionData = new Map();

  absenteeCurrentJSON.forEach((row) => {
    const id = isCountyLevel ? row.county : `${row.county}##${row.precinct}`;

    const properties = updatedElectionData.has(id) ? updatedElectionData.get(id) : { id, CTYNAME: row.county, PRECINCT_N: row.precinct };
    properties.absenteeCurrent = new AbsenteeBallots(row);
    updatedElectionData.set(id, properties);
  });
  absenteeBaseJSON.forEach((row) => {
    const id = isCountyLevel ? row.county : `${row.county}##${row.precinct}`;
    const properties = updatedElectionData.has(id) ? updatedElectionData.get(id) : { id, CTYNAME: row.county, PRECINCT_N: row.precinct };
    properties.absenteeBase = new AbsenteeBallots(row);
    updatedElectionData.set(id, properties);
  });

  demographicsJSON.forEach((row) => {
    const id = row.id;
    const properties = updatedElectionData.has(id) ? updatedElectionData.get(id) : { id, CTYNAME: row.county, PRECINCT_N: row.precinct };
    properties.demographics = new Demographics(row);
    updatedElectionData.set(id, properties);
  });

  let rdStateVotesTotalCurrent = 0;
  electionResultsCurrentJSON.forEach((row) => {
    const id = isCountyLevel ? row.county : `${row.county}##${row.precinct}`;
    const properties = updatedElectionData.has(id) ? updatedElectionData.get(id) : { id, CTYNAME: row.county, PRECINCT_N: row.precinct };
    properties.electionResultsAllCurrent = row.races.map((race) => new ElectionResult(race));
    // Find the current race
    properties.electionResultsCurrent = properties.electionResultsAllCurrent?.filter((election) => election.race === currentElectionRace.name)[0];
    updatedElectionData.set(id, properties);
    rdStateVotesTotalCurrent += properties.electionResultsCurrent.totalVotesRD || 0;
  });
  let rdStateVotesTotalBase = 0;
  if (electionResultBaseFileLocation) {
    electionResultBaseJSON.forEach((row) => {
      const id = isCountyLevel ? row.county : `${row.county}##${row.precinct}`;
      const properties = updatedElectionData.has(id) ? updatedElectionData.get(id) : {};
      properties.electionResultsAllBase = row.races.map((race) => new ElectionResult(race));
      properties.electionResultsBase = properties.electionResultsAllBase.filter((election) => election.race === previousElectionRace.name)[0];
      updatedElectionData.set(id, properties);
      rdStateVotesTotalBase += properties.electionResultsBase.totalVotesRD || 0;
    });
  }

  const scaleFactor = rdStateVotesTotalCurrent / rdStateVotesTotalBase;

  // Set the comparisons between the results
  [...updatedElectionData.values()].forEach((result) => {
    result.electionResultsComparison = new ElectionResultComparison(result.electionResultsCurrent, result.electionResultsBase, scaleFactor);

    if (result.absenteeCurrent && result.absenteeBase) {
      result.absenteeBallotComparison = new AbsenteeBallotsComparison(result.absenteeCurrent, result.absenteeBase);
    } else {
      result.absenteeBallotComparison = null;
    }
  });

  return updatedElectionData;
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
