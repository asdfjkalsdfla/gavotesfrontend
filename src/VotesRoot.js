import React, { useState, useEffect } from "react";
import { Divider } from "antd";
import { SettingOutlined } from "@ant-design/icons";
// import Protobuf from "protobufjs";

import VotesMap from "./VotesMap";
import VotesScatterPlot from "./VotesScatterPlot";
import VotesSummary from "./VotesSummary";
import WelcomeText from "./WelcomeText";
import VoteMapOptions from "./VoteMapOptions";
import ElectionResult from "./Models/ElectionResult";
import ElectionResultComparison from "./Models/ElectionResultComparison";
import AbsenteeBallots from "./Models/AbsenteeBallots";
import AbsenteeBallotsComparison from "./Models/AbsenteeBallotsComparison";

// ************************************************
// Pull the initial values from the URL params
// ************************************************
const url = new URL(window.location.href);
const params = new URLSearchParams(url.search);

// What data to show
const countyParam = params.get("CTYNAME");
const levelParam = params.get("level");
const isCountyLevelInitial = levelParam
  ? levelParam === "county"
  : countyParam
    ? false
    : true;

// only show welcome when it's not been shown before
const welcomeMessageShown = localStorage.getItem("welcomeShown");
const hideWelcomeParam = params.get("hideWelcome");
const showWelcomeOnLoad =
  hideWelcomeParam === "true" || welcomeMessageShown ? false : true;

// hide the options parameter?
const hideOptionsParam = params.get("hideOptions");
const showOptionsOnLoad = hideOptionsParam !== "true";

// elevation approach
const elevationApproachParam = params.get("elevationApproach");
const elevationApproachInitial = elevationApproachParam
  ? elevationApproachParam
  : "none";

// color approach
const colorApproachParam = params.get("colorApproach");
const colorApproachInitial = colorApproachParam
  ? colorApproachParam
  : "electionResultPerRepublicanPer";

// races
const resultsElectionRaceCurrentIDParam = params.get("resultsElectionRaceCurrentID");
const resultsElectionRaceCurrentIDInitial = resultsElectionRaceCurrentIDParam ? resultsElectionRaceCurrentIDParam : "2022_general##US Senate";
const resultsElectionRacePerviousIDParam = params.get("resultsElectionRacePerviousID");
const resultsElectionRacePerviousIDInitial = resultsElectionRacePerviousIDParam ? resultsElectionRacePerviousIDParam : "2020_general##President of the United States";

// TODO - move the parameter keeping to the context API
export default function VotesRoot() {
  // ************************************************
  // Determine the Data To Show
  // ************************************************
  const elections = [
    {
      "name": "2022_general",
      "label": "2022 General",
      "date": "2022-11-08",
      "isCurrentElection": false,
      "races": [{ "name": "Governor", "republican": "Kemp", "democratic": "Abrams" }, { "name": "US Senate", "republican": "Walker", "democratic": "Warnock" }],

    },
    {
      "name": "2021_senate_runoff",
      "label": "2021 Runoff",
      "date": "2021-01-05",
      "races": [{ "name": "US Senate (Loeffler) - Special", "republican": "Loeffler", "democratic": "Warnock" }, { "name": "US Senate (Perdue)", "republican": "Perdue", "democratic": "Ossoff" }],
    },
    {
      "name": "2020_general",
      "label": "2020 General",
      "date": "2020-11-03",
      "races": [{ "name": "President of the United States", "republican": "Trump", "democratic": "Biden" }, { "name": "US Senate (Loeffler) - Special", "republican": "Loeffler/Collins/etc.", "democratic": "Warnock/Jackson/etc." }, { "name": "US Senate (Perdue)", "republican": "Perdue", "democratic": "Ossoff" }],
    },
    {
      "name": "2018_general",
      "label": "2018 General",
      "date": "2018-11-06",
      "races": [{ "name": "Governor", "republican": "Kemp", "democratic": "Abrams" }]
    },
    {
      "name": "2016_general",
      "label": "2016 General",
      "date": "2016-11-08",
      "races": [{ "name": "President of the United States", "republican": "Trump", "democratic": "Clinton" }]
    }
  ]
  const [absenteeElectionCurrentID, updateAbsenteeElectionCurrentID] = useState(elections[0].name);
  const [absenteeElectionBaseID, updateAbsenteeElectionBaseID] = useState(elections[2].name);
  const [resultsElectionRaceCurrentID, updateResultsElectionRaceCurrentID] = useState(resultsElectionRaceCurrentIDInitial);
  const [resultsElectionRacePerviousID, updateResultsElectionRacePerviousID] = useState(resultsElectionRacePerviousIDInitial);

  const resultsElectionCurrentID = (resultsElectionRaceCurrentID && resultsElectionRaceCurrentID.includes("##")) ? resultsElectionRaceCurrentID.split("##")[0] : null;
  const resultsRaceCurrentID = (resultsElectionRaceCurrentID && resultsElectionRaceCurrentID.includes("##")) ? resultsElectionRaceCurrentID.split("##")[1] : null;
  const resultsElectionCurrent = resultsRaceCurrentID ? elections.filter(election => election.name === resultsElectionCurrentID)[0] : null; // should never not match
  const resultsRaceCurrent = resultsRaceCurrentID ? resultsElectionCurrent.races.filter(race => race.name === resultsRaceCurrentID)[0] : null; // should never not match


  const resultsElectionPreviousID = (resultsElectionRacePerviousID && resultsElectionRacePerviousID.includes("##")) ? resultsElectionRacePerviousID.split("##")[0] : null;
  const resultsRacePreviousID = (resultsElectionRacePerviousID && resultsElectionRacePerviousID.includes("##")) ? resultsElectionRacePerviousID.split("##")[1] : null;
  const resultsElectionPrevious = resultsRacePreviousID ? elections.filter(election => election.name === resultsElectionPreviousID)[0] : null; // should never not match
  const resultsRacePrevious = resultsRacePreviousID ? resultsElectionPrevious.races.filter(race => race.name === resultsRacePreviousID)[0] : null; // should never not match


  // ************************************************
  // Get the Data
  // ************************************************
  const [userHasSetLevel, updateUserHasSetLevel] = useState(!isCountyLevelInitial);
  const [county, updateCountySelected] = useState(countyParam);
  const [isCountyLevel, updateIsCountyLevel] = useState(isCountyLevelInitial);

  const [allElectionData, updateAllElectionData] = useState();

  // Load county or precinct level election data
  useEffect(() => {
    const level = isCountyLevel ? "county" : "precinct";
    const absenteeCurrentFileLocation = `/static/absenteeSummary-${absenteeElectionCurrentID}-${level}.json`;
    const absenteeBaseFileLocation = `/static/absenteeSummary-${absenteeElectionBaseID}-${level}.json`;
    const electionResultsCurrentFileLocation = `/static/electionResultsSummary-${resultsElectionCurrentID}-${level}.json`;
    const electionResultBaseFileLocation = resultsElectionPreviousID ? `/static/electionResultsSummary-${resultsElectionPreviousID}-${level}.json` : null;

    const load = async () => {
      const updatedElectionData = await loadAndCombineElectionDataFiles(absenteeCurrentFileLocation, absenteeBaseFileLocation, electionResultsCurrentFileLocation, electionResultBaseFileLocation, isCountyLevel, resultsRaceCurrentID, resultsRacePreviousID);
      await updateAllElectionData(updatedElectionData);
    };

    load();
  }, [absenteeElectionBaseID, absenteeElectionCurrentID, resultsElectionRaceCurrentID, resultsElectionRacePerviousID, isCountyLevel]);

  // Load statewide election data
  const [voteTotals, updateVoteTotals] = useState(null);

  useEffect(() => {
    const absenteeCurrentFileLocation = `/static/absenteeSummary-${absenteeElectionCurrentID}-state.json`;
    const absenteeBaseFileLocation = `/static/absenteeSummary-${absenteeElectionBaseID}-state.json`;
    const electionResultsCurrentFileLocation = `/static/electionResultsSummary-${resultsElectionCurrentID}-state.json`;
    const electionResultBaseFileLocation = resultsElectionPreviousID ? `/static/electionResultsSummary-${resultsElectionPreviousID}-state.json` : null;

    const load = async () => {
      const votingResultTotalMap = await loadAndCombineElectionDataFiles(absenteeCurrentFileLocation, absenteeBaseFileLocation, electionResultsCurrentFileLocation, electionResultBaseFileLocation, isCountyLevel, resultsRaceCurrentID, resultsRacePreviousID);
      updateVoteTotals(([...votingResultTotalMap.values()])[0]);
    };

    load();
  }, [absenteeElectionBaseID, absenteeElectionCurrentID, resultsElectionRaceCurrentID, resultsElectionRacePerviousID]);




  // ************************************************
  // Map Controls
  // ************************************************
  const [elevationApproach, updateElevationApproach] = useState(
    elevationApproachInitial
  );
  const [colorApproach, updateColorApproach] = useState(colorApproachInitial);

  const [showVoteMode, updateShowVoteMode] = useState(false);
  const [showAbsentee, updateShowAbsentee] = useState(false);
  const [showDemographics, updateShowDemographics] = useState(true);

  // ************************************************
  // Basic UI Events / Controls
  // ************************************************

  const [activeHover, updateActiveHover] = useState(null);
  const [activeSelection, updateActiveSelection] = useState(null);
  const [showOptions, updateShowOptions] = useState(showOptionsOnLoad);
  const [showWelcome, updateShowWelcome] = useState(showWelcomeOnLoad);

  const [showScatterPlot, updateShowScatterPlot] = useState(false);

  const activeVoteGeoJSON = activeHover ? activeHover : activeSelection;
  const sidebarWidth = Math.max(window.innerWidth * 0.25, 300);

  return (
    <div>
      <div
        style={{
          position: "absolute",
          zIndex: "99",
          width: "100%",
          padding: "10px",
          color: "#ffffff",
          backgroundColor: "#000000",
        }}
      >
        Georgia Votes Visual
        <span style={{ float: "right" }}>
          <SettingOutlined
            size="large"
            onClick={() => {
              updateShowOptions(!showOptions);
            }}
          />
        </span>
      </div>
      {showScatterPlot ? (<VotesScatterPlot
        elevationApproach={elevationApproach}
        colorApproach={colorApproach}
        allElectionData={allElectionData}
        updateActiveSelection={updateActiveSelection}
        updateActiveHover={updateActiveHover}
      />) :
        (<VotesMap
          isCountyLevel={isCountyLevel}
          county={county}
          elevationApproach={elevationApproach}
          colorApproach={colorApproach}
          allElectionData={allElectionData}
          updateActiveSelection={updateActiveSelection}
          updateActiveHover={updateActiveHover}
          userHasSetLevel={userHasSetLevel}
          updateIsCountyLevel={updateIsCountyLevel}
        />)}
      <div
        style={{
          marginTop: "40px",
          zIndex: "900",
          padding: "15px",
          height: "90%",
          float: "right",
          width: sidebarWidth,
          backgroundColor: "#ffffff",
          overflowY: "scroll",
          overflow: "scroll"
        }}
      >
        {showWelcome && (
          <>
            <WelcomeText updateShowWelcome={updateShowWelcome} />
            <Divider />
          </>)}
        {(showOptions || showWelcome) && (<>
          <VoteMapOptions
            elevationApproach={elevationApproach}
            updateElevationApproach={updateElevationApproach}
            updateShowOptions={updateShowOptions}
            colorApproach={colorApproach}
            updateColorApproach={updateColorApproach}
            elections={elections}
            absenteeCurrent={absenteeElectionCurrentID}
            updateAbsenteeCurrent={updateAbsenteeElectionCurrentID}
            absenteeBase={absenteeElectionBaseID}
            updateAbsenteeBase={updateAbsenteeElectionBaseID}
            electionResultCurrent={resultsElectionRaceCurrentID}
            updateElectionResultCurrent={updateResultsElectionRaceCurrentID}
            electionResultBase={resultsElectionRacePerviousID}
            updateElectionResultBase={updateResultsElectionRacePerviousID}
            showVoteMode={showVoteMode}
            updateShowVoteMode={updateShowVoteMode}
            showDemographics={showDemographics}
            updateShowDemographics={updateShowDemographics}
            showAbsentee={showAbsentee}
            updateShowAbsentee={updateShowAbsentee}
          />
          <Divider /></>
        )}
        <VotesSummary
          geoJSONVote={activeVoteGeoJSON ? activeVoteGeoJSON : { properties: voteTotals }}
          activeSelection={activeSelection}
          updateUserHasSetLevel={updateUserHasSetLevel}
          updateCountySelected={updateCountySelected}
          updateActiveSelection={updateActiveSelection}
          isCountyLevel={isCountyLevel}
          updateIsCountyLevel={updateIsCountyLevel}
          elections={elections}
          electionResultCurrentElection={resultsElectionCurrent}
          electionResultCurrentRace={resultsRaceCurrent}
          electionResultBaseElection={resultsElectionPrevious}
          electionResultBaseRace={resultsRacePrevious}
          absenteeElectionBaseID={absenteeElectionBaseID}
          showVoteMode={showVoteMode}
          showDemographics={showDemographics}
          showAbsentee={showAbsentee}
        />
      </div>
    </div >
  );
}

const loadAndCombineElectionDataFiles = async (absenteeCurrentFileLocation, absenteeBaseFileLocation, electionResultsCurrentFileLocation, electionResultBaseFileLocation, isCountyLevel, resultsRaceCurrentID, resultsRacePreviousID) => {
  // console.log(`fetching data`);
  const fetchPromises = [];
  fetchPromises.push(fetch(absenteeCurrentFileLocation));
  fetchPromises.push(fetch(absenteeBaseFileLocation));
  fetchPromises.push(fetch(electionResultsCurrentFileLocation));
  if (electionResultBaseFileLocation) fetchPromises.push(fetch(electionResultBaseFileLocation));

  const [responseAbsenteeCurrent, responseAbsenteeBase, responseElectionResultsCurrent, electionResultBase] = await Promise.all(fetchPromises);

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
  if (electionResultBaseFileLocation && !electionResultBase.ok) {
    console.log("ERROR loading election result base");
    return;
  }

  const jsonPromises = [responseAbsenteeCurrent.json(), responseAbsenteeBase.json(), responseElectionResultsCurrent.json()];
  if (electionResultBaseFileLocation) {
    jsonPromises.push(electionResultBase.json())
  }
  const [absenteeCurrentJSON, absenteeBaseJSON, electionResultsCurrentJSON, electionResultBaseJSON] = await Promise.all(jsonPromises);

  const updatedElectionData = new Map();

  absenteeCurrentJSON.forEach(row => {
    const id = isCountyLevel ? row.county : `${row.county}##${row.precinct}`

    const properties = updatedElectionData.has(id)
      ? updatedElectionData.get(id)
      : {};
    properties.absenteeCurrent = new AbsenteeBallots(row);
    updatedElectionData.set(id, properties)
  })
  absenteeBaseJSON.forEach(row => {
    const id = isCountyLevel ? row.county : `${row.county}##${row.precinct}`
    const properties = updatedElectionData.has(id)
      ? updatedElectionData.get(id)
      : {};
    properties.absenteeBase = new AbsenteeBallots(row);
    updatedElectionData.set(id, properties)
  });

  let rdStateVotesTotalCurrent = 0;
  electionResultsCurrentJSON.forEach(row => {
    const id = isCountyLevel ? row.county : `${row.county}##${row.precinct}`
    const properties = updatedElectionData.has(id)
      ? updatedElectionData.get(id)
      : {};
    properties.electionResultsAllCurrent = row.races.map(race => new ElectionResult(race));
    // Find the current race
    properties.electionResultsCurrent = properties.electionResultsAllCurrent?.filter(election => election.race === resultsRaceCurrentID)[0];
    updatedElectionData.set(id, properties)
    rdStateVotesTotalCurrent += (properties.electionResultsCurrent.totalVotesRD || 0);

  })
  let rdStateVotesTotalBase = 0;
  if (electionResultBaseFileLocation) {
    electionResultBaseJSON.forEach(row => {
      const id = isCountyLevel ? row.county : `${row.county}##${row.precinct}`
      const properties = updatedElectionData.has(id)
        ? updatedElectionData.get(id)
        : {};
      properties.electionResultsAllBase = row.races.map(race => new ElectionResult(race));
      properties.electionResultsBase = properties.electionResultsAllBase.filter(election => election.race === resultsRacePreviousID)[0];
      updatedElectionData.set(id, properties);
      rdStateVotesTotalBase += (properties.electionResultsBase.totalVotesRD || 0);
    })
  }

  const scaleFactor = rdStateVotesTotalCurrent / rdStateVotesTotalBase;

  // Set the comparisons between the results
  [...updatedElectionData.values()].forEach(result => {
    result.electionResultsComparison = new ElectionResultComparison(result.electionResultsCurrent, result.electionResultsBase, scaleFactor)

    if (result.absenteeCurrent && result.absenteeBase) {
      result.absenteeBallotComparison = new AbsenteeBallotsComparison(result.absenteeCurrent, result.absenteeBase)
    } else {
      result.absenteeBallotComparison = null;
    }

  });
  return updatedElectionData;
}