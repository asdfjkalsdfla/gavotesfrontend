import React, { createContext, useContext, useState, useEffect, useMemo } from "react";

import ElectionResult from "../Models/ElectionResult";
import ElectionResultComparison from "../Models/ElectionResultComparison";
import AbsenteeBallots from "../Models/AbsenteeBallots";
import AbsenteeBallotsComparison from "../Models/AbsenteeBallotsComparison";
import Demographics from "../Models/Demographics";
import { useElectionSelection } from "./ElectionSelectionContext.tsx";

import elections from "../elections.json";

export const ElectionDataContext = createContext(null);

// Helper function to build API URLs
const buildApiUrl = (category, prefix, name, level) => {
  if (!name) return null;
  return `${import.meta.env.VITE_API_URL_BASE}static/${category}/${prefix}-${name}-${level}.json`;
};

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
      const absenteeCurrentFileLocation = buildApiUrl("absentee", "absenteeSummary", absenteeElectionCurrent?.name, level);
      const absenteeBaseFileLocation = buildApiUrl("absentee", "absenteeSummary", absenteeElectionBase?.name, level);
      const electionResultsCurrentFileLocation = buildApiUrl("electionResults", "electionResultsSummary", resultsElectionRaceCurrent?.election?.name, level);
      const electionResultBaseFileLocation = resultsElectionRacePervious
        ? buildApiUrl("electionResults", "electionResultsSummary", resultsElectionRacePervious?.election?.name, level)
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
          const stateData = updatedElectionData instanceof Map && updatedElectionData.size > 0 ? [...updatedElectionData.values()][0] : {};
          updateFunction(stateData);
        } else {
          updateFunction(updatedElectionData);
        }
      });
    };

    if (!absenteeElectionBase || !absenteeElectionCurrent || !resultsElectionRaceCurrent) {
      console.warn("Required election selection data is missing. Skipping data load.");
      return;
    }

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
  electionResultBaseFileLocation, // Can be null
  demographicsFileLocation,
  isCountyLevel,
  currentElectionRace,
  previousElectionRace,
) => {
  const filesToFetchConfig = [
    { url: absenteeCurrentFileLocation, description: "Absentee Current", key: "absenteeCurrentJSON", critical: true },
    { url: absenteeBaseFileLocation, description: "Absentee Base", key: "absenteeBaseJSON", critical: true },
    { url: electionResultsCurrentFileLocation, description: "Election Results Current", key: "electionResultsCurrentJSON", critical: true },
    { url: demographicsFileLocation, description: "Demographics", key: "demographicsJSON", critical: true },
  ];

  if (electionResultBaseFileLocation) {
    filesToFetchConfig.push({ url: electionResultBaseFileLocation, description: "Election Result Base", key: "electionResultBaseJSON", critical: false });
  }

  const fetchPromises = filesToFetchConfig
    .filter((file) => file.url)
    .map((file) =>
      fetch(file.url)
        .then((response) => {
          if (!response.ok) {
            console.error(`ERROR loading ${file.description} from ${file.url}: ${response.statusText}`);
            return { key: file.key, error: true, status: response.status, critical: file.critical, description: file.description };
          }
          return response.json().then((data) => ({ key: file.key, data, error: false, critical: file.critical, description: file.description }));
        })
        .catch((error) => {
          console.error(`Network error loading ${file.description} from ${file.url}: ${error.message}`);
          return { key: file.key, error: true, critical: file.critical, description: file.description };
        }),
    );

  const fetchedResults = await Promise.all(fetchPromises);

  const jsonData = {};
  let hasCriticalError = false;
  fetchedResults.forEach((result) => {
    if (result.error) {
      jsonData[result.key] = null;
      if (result.critical) {
        hasCriticalError = true;
        console.error(`Critical file ${result.description} failed to load.`);
      }
    } else {
      jsonData[result.key] = result.data;
    }
  });

  if (hasCriticalError) {
    console.error("One or more critical data files failed to load. Returning empty data.");
    return new Map();
  }

  const {
    absenteeCurrentJSON,
    absenteeBaseJSON,
    electionResultsCurrentJSON,
    demographicsJSON,
    electionResultBaseJSON, // Will be null if not fetched or if fetch failed (and not critical)
  } = jsonData;

  if (!absenteeCurrentJSON || !absenteeBaseJSON || !electionResultsCurrentJSON || !demographicsJSON) {
    console.error("Essential JSON data is missing after fetch. Aborting data combination.");
    return new Map();
  }

  const combinedElectionData = new Map();
  const filterResultAndAddToCombinedData = (dataJSON, callback) => {
    if (!dataJSON || !Array.isArray(dataJSON)) {
      console.warn("Skipping data processing due to missing or invalid dataJSON.");
      return;
    }
    dataJSON
      .filter((row) => row.county !== "FAKECOUNTY")
      .forEach((row) => {
        const id = isCountyLevel ? row.county : `${row.county}##${row.precinct}`;
        const electionDataForRow = combinedElectionData.get(id) || { id, CTYNAME: row.county, PRECINCT_N: row.precinct };
        callback(electionDataForRow, row);
        combinedElectionData.set(id, electionDataForRow);
      });
  };

  filterResultAndAddToCombinedData(absenteeCurrentJSON, (electionDataForRow, row) => {
    electionDataForRow.absenteeCurrent = new AbsenteeBallots(row);
  });
  filterResultAndAddToCombinedData(absenteeBaseJSON, (electionDataForRow, row) => {
    electionDataForRow.absenteeBase = new AbsenteeBallots(row);
  });

  let rdStateVotesTotalCurrent = 0;
  if (currentElectionRace) {
    // Ensure currentElectionRace is defined
    filterResultAndAddToCombinedData(electionResultsCurrentJSON, (electionDataForRow, row) => {
      electionDataForRow.electionResultsAllCurrent = row.races.map((race) => new ElectionResult(race));
      electionDataForRow.electionResultsCurrent = electionDataForRow.electionResultsAllCurrent?.find((election) => election.race === currentElectionRace.name);
      rdStateVotesTotalCurrent += electionDataForRow?.electionResultsCurrent?.totalVotesRD || 0;
    });
  }

  let rdStateVotesTotalBase = 0;
  if (electionResultBaseJSON && previousElectionRace) {
    // Ensure data and race info are available
    filterResultAndAddToCombinedData(electionResultBaseJSON, (electionDataForRow, row) => {
      electionDataForRow.electionResultsAllBase = row.races.map((race) => new ElectionResult(race));
      electionDataForRow.electionResultsBase = electionDataForRow.electionResultsAllBase?.find((election) => election.race === previousElectionRace.name);
      rdStateVotesTotalBase += electionDataForRow?.electionResultsBase?.totalVotesRD || 0;
    });
  }

  const scaleFactor = rdStateVotesTotalBase !== 0 && rdStateVotesTotalCurrent !== 0 ? rdStateVotesTotalCurrent / rdStateVotesTotalBase : 1;

  [...combinedElectionData.values()].forEach((result) => {
    result.electionResultsComparison = new ElectionResultComparison(result.electionResultsCurrent, result.electionResultsBase, scaleFactor);
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
      const properties = combinedElectionData.get(id) || { id, CTYNAME: row.county, PRECINCT_N: row.precinct };
      properties.demographics = new Demographics(row);
      combinedElectionData.set(id, properties);
    });
  } else {
    console.warn("Demographics data is missing or not an array. Skipping demographics processing.");
  }

  return combinedElectionData;
};

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
