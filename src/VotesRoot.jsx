import React, { useState } from "react";
import { Divider } from "antd";
import { SettingOutlined } from "@ant-design/icons";

import { ElectionDataProvider } from "./ElectionDataProvider.jsx";

import WelcomeText from "./WelcomeText.jsx";
import VoteMapOptions from "./VoteMapOptions.jsx";
import "./VotesRoot.css";

// import VotesMap from "./VotesMap";
const VotesMap = React.lazy(() => import("./VotesMap.jsx"));
// import VotesScatterPlot from "./VotesScatterPlot";
const VotesScatterPlot = React.lazy(() => import("./VotesScatterPlot.jsx"));
// import VotesTable from "./VotesTable";
const VotesTable = React.lazy(() => import("./VotesTable.jsx"));
// import VotesSummary from "./VotesSummary.jsx";
const VotesSummary = React.lazy(() => import("./VotesSummary.jsx"));

// ************************************************
// Pull the initial values from the URL params
// ************************************************
const url = new URL(window.location.href);
const params = new URLSearchParams(url.search);

// What data to show
const countyParam = params.get("CTYNAME");
const levelParam = params.get("level");
const isCountyLevelInitial = levelParam ? levelParam === "county" : !countyParam;

// only show welcome when it's not been shown before
const welcomeMessageShown = localStorage.getItem("welcomeShown");
const hideWelcomeParam = params.get("hideWelcome");
const showWelcomeOnLoad = !(hideWelcomeParam === "true" || welcomeMessageShown);

// hide the options parameter?
const hideOptionsParam = params.get("hideOptions");
const showOptionsOnLoad = hideOptionsParam !== "true";

// elevation approach
const elevationApproachParam = params.get("elevationApproach");
const elevationApproachInitial = elevationApproachParam || "none";

// color approach
const colorApproachParam = params.get("colorApproach");
const colorApproachInitial = colorApproachParam || "electionResultPerRepublicanPer";

// races
const resultsElectionRaceCurrentIDParam = params.get("resultsElectionRaceCurrentID");
const resultsElectionRaceCurrentIDInitial = resultsElectionRaceCurrentIDParam || "2022_runoff||US Senate";
const resultsElectionRacePerviousIDParam = params.get("resultsElectionRacePerviousID");
const resultsElectionRacePerviousIDInitial = resultsElectionRacePerviousIDParam || "2022_general||US Senate";

// scatter plot
const scatterParam = params.get("scatter");
let displayModeInitial = scatterParam ? "scatter" : "map";

const displayModeParam = params.get("displayMode");
if (displayModeParam) displayModeInitial = displayModeParam;

// TODO - move the parameter keeping to the context API
export default function VotesRoot() {
  // ************************************************
  // Determine the Data To Show
  // ************************************************
  const [absenteeElectionCurrentID, updateAbsenteeElectionCurrentID] = useState("2022_runoff");
  const [absenteeElectionBaseID, updateAbsenteeElectionBaseID] = useState("2022_general");
  const [resultsElectionRaceCurrentID, updateResultsElectionRaceCurrentID] = useState(resultsElectionRaceCurrentIDInitial);
  const [resultsElectionRacePerviousID, updateResultsElectionRacePerviousID] = useState(resultsElectionRacePerviousIDInitial);
  const [countyFilter, updateCountyFilter] = useState(countyParam);
  const [isCountyLevel, updateIsCountyLevel] = useState(isCountyLevelInitial);

  // **************************************************
  // Active Data Point
  // **************************************************
  const [activeHover, updateActiveHover] = useState(null);
  const [activeSelection, updateActiveSelection] = useState(countyParam);

  // ************************************************
  // Data Display Controls
  // ************************************************
  const [elevationApproach, updateElevationApproach] = useState(elevationApproachInitial);
  const [colorApproach, updateColorApproach] = useState(colorApproachInitial);

  const [scatterXAxis, updateScatterXAxis] = useState("electionResultPerRepublicanPer");
  const [scatterYAxis, updateScatterYAxis] = useState("turnoutAbsSameDay");

  const [showVoteMode, updateShowVoteMode] = useState(false);
  const [showAbsentee, updateShowAbsentee] = useState(false);
  const [showDemographics, updateShowDemographics] = useState(true);

  // ************************************************
  // Basic UI Events / Controls
  // ************************************************
  const [showOptions, updateShowOptions] = useState(showOptionsOnLoad);
  const [showWelcome, updateShowWelcome] = useState(showWelcomeOnLoad);
  const [displayType, updateDisplayType] = useState(displayModeInitial);

  const [userHasSetLevel, updateUserHasSetLevel] = useState(!isCountyLevelInitial);

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
      <ElectionDataProvider
        isCountyLevel={isCountyLevel}
        countyFilter={countyFilter}
        absenteeElectionBaseID={absenteeElectionBaseID}
        absenteeElectionCurrentID={absenteeElectionCurrentID}
        resultsElectionRaceCurrentID={resultsElectionRaceCurrentID}
        resultsElectionRacePerviousID={resultsElectionRacePerviousID}
      >
        <div className={displayType === "table" && !showOptions ? "full" : "one"}>
          {displayType === "scatter" && (
            <VotesScatterPlot
              isCountyLevel={isCountyLevel}
              updateActiveSelection={updateActiveSelection}
              updateActiveHover={updateActiveHover}
              scatterXAxis={scatterXAxis}
              scatterYAxis={scatterYAxis}
            />
          )}
          {displayType === "map" && (
            <VotesMap
              isCountyLevel={isCountyLevel}
              countyFilter={countyFilter}
              elevationApproach={elevationApproach}
              colorApproach={colorApproach}
              updateActiveSelection={updateActiveSelection}
              updateActiveHover={updateActiveHover}
              userHasSetLevel={userHasSetLevel}
              updateIsCountyLevel={updateIsCountyLevel}
            />
          )}
          {displayType === "table" && (
            <VotesTable
              isCountyLevel={isCountyLevel}
              countyFilter={countyFilter}
              updateCountyFilter={updateCountyFilter}
              updateIsCountyLevel={updateIsCountyLevel}
              updateActiveSelection={updateActiveSelection}
            />
          )}
        </div>
        {(displayType !== "table" || showOptions) && (
          <div className="two">
            {showWelcome && (
              <>
                <WelcomeText updateShowWelcome={updateShowWelcome} />
                <Divider />
              </>
            )}
            {(showOptions || showWelcome) && (
              <>
                <VoteMapOptions
                  updateShowOptions={updateShowOptions}
                  displayType={displayType}
                  updateDisplayType={updateDisplayType}
                  elevationApproach={elevationApproach}
                  updateElevationApproach={updateElevationApproach}
                  colorApproach={colorApproach}
                  updateColorApproach={updateColorApproach}
                  scatterXAxis={scatterXAxis}
                  updateScatterXAxis={updateScatterXAxis}
                  scatterYAxis={scatterYAxis}
                  updateScatterYAxis={updateScatterYAxis}
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
                <Divider />
              </>
            )}
            <VotesSummary
              activeSelection={activeSelection}
              updateActiveSelection={updateActiveSelection}
              activeHover={activeHover}
              countyFilter={countyFilter}
              updateCountyFilter={updateCountyFilter}
              isCountyLevel={isCountyLevel}
              updateUserHasSetLevel={updateUserHasSetLevel}
              updateIsCountyLevel={updateIsCountyLevel}
              showVoteMode={showVoteMode}
              showDemographics={showDemographics}
              showAbsentee={showAbsentee}
            />
          </div>
        )}
      </ElectionDataProvider>
    </div>
  );
}
