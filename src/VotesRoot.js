import React, { useState, useEffect, useMemo } from "react";
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
import ElectionsJSON from "./elections.json"
import './VoteRoot.css';

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

// scatter plot
const scatterParam = params.get("scatter");
const scatterShowInitial = scatterParam ? true : false;

// TODO - move the parameter keeping to the context API
export default function VotesRoot() {
  // ************************************************
  // Determine the Data To Show
  // ************************************************
  const elections = ElectionsJSON;
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

  const [allElectionData, updateAllElectionData] = useState(new Map());

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [absenteeElectionBaseID, absenteeElectionCurrentID, resultsElectionRaceCurrentID, resultsElectionRacePerviousID]);

  // **************************************************
  // Active Data Point
  // **************************************************
  // TODO - fully refactor this so we don't pass the geoJSON into the selection
  // short-term challenge is the demographic data is only on the geo json
  const [activeHover, updateActiveHover] = useState(null);
  const [activeSelection, updateActiveSelection] = useState(null);

  const activeDataPoint = useMemo(() => {
    const source = activeHover ? activeHover : activeSelection;
    if (source && source.properties)
      return source;
    if (source && allElectionData.has(source))
      return { properties: allElectionData.get(source) };
    if (county && allElectionData.has(county)) // won't work yet because we get precinct level data
      return { properties: allElectionData.get(county) };

    return { properties: voteTotals };
  }, [activeHover, activeSelection, allElectionData, county, voteTotals]);

  // ************************************************
  // Data Display Controls
  // ************************************************
  const [elevationApproach, updateElevationApproach] = useState(elevationApproachInitial);
  const [colorApproach, updateColorApproach] = useState(colorApproachInitial);

  const [showVoteMode, updateShowVoteMode] = useState(false);
  const [showAbsentee, updateShowAbsentee] = useState(false);
  const [showDemographics, updateShowDemographics] = useState(true);

  // ************************************************
  // Basic UI Events / Controls
  // ************************************************
  const [showOptions, updateShowOptions] = useState(showOptionsOnLoad);
  const [showWelcome, updateShowWelcome] = useState(showWelcomeOnLoad);
  const [showScatterPlot] = useState(scatterShowInitial);

  return (
    <div className="container">
      <div className="header">
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

      <div className="one">
        {showScatterPlot ? (<VotesScatterPlot
          elevationApproach={elevationApproach}
          colorApproach={colorApproach}
          allElectionData={allElectionData}
          isCountyLevel={isCountyLevel}
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
      </div>
      <div className="two">
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
          geoJSONVote={activeDataPoint}
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
    </div>
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
      : { CTYNAME: row.county, PRECINCT_N: row.precinct };
    properties.absenteeCurrent = new AbsenteeBallots(row);
    updatedElectionData.set(id, properties)
  })
  absenteeBaseJSON.forEach(row => {
    const id = isCountyLevel ? row.county : `${row.county}##${row.precinct}`
    const properties = updatedElectionData.has(id)
      ? updatedElectionData.get(id)
      : { CTYNAME: row.county, PRECINCT_N: row.precinct };
    properties.absenteeBase = new AbsenteeBallots(row);
    updatedElectionData.set(id, properties)
  });

  let rdStateVotesTotalCurrent = 0;
  electionResultsCurrentJSON.forEach(row => {
    const id = isCountyLevel ? row.county : `${row.county}##${row.precinct}`
    const properties = updatedElectionData.has(id)
      ? updatedElectionData.get(id)
      : { CTYNAME: row.county, PRECINCT_N: row.precinct };
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

// const getAxisYDomain = (from, to, ref, offset) => {
//   const refData = initialData.slice(from - 1, to);
//   let [bottom, top] = [refData[0][ref], refData[0][ref]];
//   refData.forEach((d) => {
//     if (d[ref] > top) top = d[ref];
//     if (d[ref] < bottom) bottom = d[ref];
//   });

//   return [(bottom | 0) - offset, (top | 0) + offset];
// };

// const initialState = {
//   data: initialData,
//   left: 'dataMin',
//   right: 'dataMax',
//   refAreaLeft: '',
//   refAreaRight: '',
//   top: 'dataMax+1',
//   bottom: 'dataMin-1',
//   top2: 'dataMax+20',
//   bottom2: 'dataMin-20',
//   animation: true,
// };

// if (refAreaLeft === refAreaRight || refAreaRight === '') {
//   this.setState(() => ({
//     refAreaLeft: '',
//     refAreaRight: '',
//   }));
//   return;
// }

// // xAxis domain
// if (refAreaLeft > refAreaRight) [refAreaLeft, refAreaRight] = [refAreaRight, refAreaLeft];

// // yAxis domain
// const [bottom, top] = getAxisYDomain(refAreaLeft, refAreaRight, 'cost', 1);
// const [bottom2, top2] = getAxisYDomain(refAreaLeft, refAreaRight, 'impression', 50);
