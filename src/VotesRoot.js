import React, { useState, useEffect } from "react";
import { Divider } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import Protobuf from "protobufjs";

import VotesMap from "./VotesMap";
import VotesSummary from "./VotesSummary";
import WelcomeText from "./WelcomeText";
import VoteMapOptions from "./VoteMapOptions";
import VotingResult from "./VotingResults";

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
  : "turnoutAbsSameDayVs2020";
// chance the bearing and pitch based upon the elevation approach (i.e. make it straight up vs. 3D)
const initialPitch = elevationApproachInitial === "none" ? 0 : 45;
const initialBearing = elevationApproachInitial === "none" ? 0 : 350;

// color approach
const colorApproachParam = params.get("colorApproach");
const colorApproachInitial = colorApproachParam
  ? colorApproachParam
  : "perRepublican2020";

// Change the zoom level based upon the size of the viewport
const sizeParam = params.get("size");
const initialZoom = countyParam
  ? 10
  : sizeParam === "small" || sizeParam === "small…"
  ? 6
  : 7;
const initialLatLong = countyParam
  ? {
      latitude: 33.9999,
      longitude: -84.5641,
    }
  : {
      latitude: 32.249,
      longitude: -83.388,
    }; // TODO - fix this to use the county's centroid when county is passed in

export const INITIAL_VIEW_STATE = {
  ...initialLatLong,
  zoom: initialZoom,
  minZoom: 5,
  maxZoom: 20,
  pitch: initialPitch,
  bearing: initialBearing,
  width: window.innerWidth - 200,
  height: window.innerHeight - 200,
};

// TODO - move the parameter keeping to the context API
export default function VotesRoot() {
  // ************************************************
  // Get the Data
  // ************************************************
  const [userHasSetLevel, updateUserHasSetLevel] = useState(
    !isCountyLevelInitial
  );
  const [county, updateCountySelected] = useState(countyParam);
  const [isCountyLevel, updateIsCountyLevel] = useState(isCountyLevelInitial);

  const [dataGeoJSON, updateDataGeoJSON] = useState();
  const [dataPropsOnly, updateDataPropsOnly] = useState();

  // If the user sets a specific county, we show only that counties data @ precinct level
  // Otherwise, we determine if we show counties or precinct state wide data
  const geoJSONFile = county
    ? `/static/GA_precincts18_${county}_simple.json`
    : isCountyLevel
    ? "/static/GA_counties_simple.json"
    : "/static/GA_precincts18_simple.json";
  const resultsFile = county
    ? `/static/GA_precincts18_${county}_data.bin`
    : isCountyLevel
    ? "/static/GA_counties_data.bin"
    : "/static/GA_precincts18_data.bin";

  useEffect(() => {
    const load = async () => {
      // Load proto data
      const protoFile = await Protobuf.load("/static/results.proto");
      const VotingResultMessages = protoFile.lookupType(
        "voteResults.VoteResultsMessage"
      );
      const responsePromises = [fetch(geoJSONFile), fetch(resultsFile)];
      const [responseGeo, responseResults] = await Promise.all(
        responsePromises
      );
      if (!responseGeo.ok) {
        console.log("ERROR loading GEO JSON file");
        return;
      }
      if (!responseResults.ok) {
        console.log("ERROR loading data JSON file");
        return;
      }
      const jsonPromises = [responseGeo.json(), responseResults.arrayBuffer()];
      const [geoJSON, electionResultsArrayBuf] = await Promise.all(jsonPromises);
      let electionResults;
      try {
        electionResults = VotingResultMessages.decode(Buffer.from(electionResultsArrayBuf)).data;
      } catch (e) {
        console.log(e);
        return;
      }

      // Convert the properties to a voting result class
      // The voting result class performs standard calculations on the results
      const electionResultsMap = new Map();
      electionResults.forEach((precinctResult) => {
        // const id = `${precinctResult.County}##${precinctResult["County Precinct"]}`;
        const votingResult = new VotingResult(precinctResult);
        electionResultsMap.set(precinctResult.id, votingResult);
      });

      // Merge the values together into a single file
      geoJSON.features.forEach((feature) => {
        const votingResultRaw = feature.properties;
        // const id = `${votingResultRaw.CTYNAME}##${votingResultRaw.PRECINCT_I}`;
        const properties = electionResultsMap.has(votingResultRaw.id)
          ? electionResultsMap.get(votingResultRaw.id)
          : {};
          feature.properties = new VotingResult({...feature.properties, ...properties});
      });
      updateDataGeoJSON(geoJSON);

      // For the scatter plot, we just need the center coordinates and not the full geoJSON
      // The simplest way to get that is to just pull it out of the geoJSON
      // It's worth considering splitting these from the geoJSON in the future (i.e. load the data and then merge w/ the geoJSON)
      // That would enable caching of the big geoJSON shape definition since the properties won't change
      const simpleData = geoJSON.features.map((feature) => feature.properties);
      updateDataPropsOnly(simpleData);
    };

    load();
  }, [geoJSONFile, resultsFile]);

  // Simple load of the statewide result file
  const [voteTotals, updateVoteTotals] = useState(null);

  useEffect(() => {
    const load = async () => {
      const response = await fetch(`/static/GA_totals.json`);
      if (!response.ok) {
        console.log("ERROR loading totals");
        return;
      }
      const votingResultTotalRaw = await response.json();
      const votingResultTotal = new VotingResult(votingResultTotalRaw[0]);
      updateVoteTotals(votingResultTotal);
    };

    load();
  }, []);

  // ************************************************
  // Map Controls
  // ************************************************
  const [elevationApproach, updateElevationApproach] = useState(
    elevationApproachInitial
  );
  const [colorApproach, updateColorApproach] = useState(colorApproachInitial);

  // ************************************************
  // Basic UI Events / Controls
  // ************************************************

  const [activeHover, updateActiveHover] = useState(null);
  const [activeSelection, updateActiveSelection] = useState(null);
  const [showOptions, updateShowOptions] = useState(showOptionsOnLoad);
  const [showWelcome, updateShowWelcome] = useState(showWelcomeOnLoad);
  const [show2016Data, updateShow2016Data] = useState(false);
  const [show2018Data, updateShow2018Data] = useState(false);

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
      <VotesMap
        isCountyLevel={isCountyLevel}
        elevationApproach={elevationApproach}
        colorApproach={colorApproach}
        data={dataGeoJSON}
        dataSimple={dataPropsOnly}
        updateActiveSelection={updateActiveSelection}
        updateActiveHover={updateActiveHover}
        INITIAL_VIEW_STATE={INITIAL_VIEW_STATE}
        initialZoom={initialZoom}
        userHasSetLevel={userHasSetLevel}
        updateIsCountyLevel={updateIsCountyLevel}
      />
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
        }}
      >
        {showOptions && (
          <VoteMapOptions
            elevationApproach={elevationApproach}
            updateElevationApproach={updateElevationApproach}
            updateShowOptions={updateShowOptions}
            colorApproach={colorApproach}
            updateColorApproach={updateColorApproach}
            show2016Data={show2016Data}
            updateShow2016Data={updateShow2016Data}
            show2018Data={show2018Data}
            updateShow2018Data={updateShow2018Data}
          />
        )}
        {activeVoteGeoJSON ? (
          <VotesSummary
            geoJSONVote={activeVoteGeoJSON}
            activeSelection={activeSelection}
            updateUserHasSetLevel={updateUserHasSetLevel}
            updateCountySelected={updateCountySelected}
            updateActiveSelection={updateActiveSelection}
            isCountyLevel={isCountyLevel}
            updateIsCountyLevel={updateIsCountyLevel}
            show2016Data={show2016Data}
            show2018Data={show2018Data}
          />
        ) : (
          <div>
            {showWelcome ? (
              <React.Fragment>
                <WelcomeText updateShowWelcome={updateShowWelcome} />

                <Divider />
                <VotesSummary
                  geoJSONVote={{ properties: voteTotals }}
                  isCountyLevel={isCountyLevel}
                  updateIsCountyLevel={updateIsCountyLevel}
                  updateUserHasSetLevel={updateUserHasSetLevel}
                  show2016Data={show2016Data}
                  show2018Data={show2018Data}
                />

                <Divider />
                <VoteMapOptions
                  elevationApproach={elevationApproach}
                  updateElevationApproach={updateElevationApproach}
                  colorApproach={colorApproach}
                  updateColorApproach={updateColorApproach}
                  show2016Data={show2016Data}
                  updateShow2016Data={updateShow2016Data}
                  show2018Data={show2018Data}
                  updateShow2018Data={updateShow2018Data}
                />
              </React.Fragment>
            ) : (
              <VotesSummary
                geoJSONVote={{ properties: voteTotals }}
                isCountyLevel={isCountyLevel}
                updateIsCountyLevel={updateIsCountyLevel}
                updateUserHasSetLevel={updateUserHasSetLevel}
                show2016Data={show2016Data}
                show2018Data={show2018Data}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
