import React, { useState, lazy, Suspense } from "react";
import { ElectionSelectionContextProvider } from "./context/ElectionSelectionContext.tsx";
import { ElectionDataProvider } from "./context/ElectionDataProvider.jsx";
import { MapsPreferenceContextProvider } from "./Views/VotesMap/PreferenceContext.tsx";
import { ScatterPlotPreferenceContextProvider } from "./Views/VotesScatter/PreferenceContext.tsx";
import ErrorBoundary from "./ErrorBoundary.jsx";

import Navigation from "./Navigation.jsx";
import WelcomeText from "./WelcomeText.jsx";
import VoteMapOptions from "./Views/VoteMapOptions.jsx";
import "./VotesRoot.css";

// import VotesMap from "./VotesMap.jsx";
// import VotesSummary from "./VotesSummary.jsx";
// import VotesScatterPlot from "./VotesScatterPlot.jsx";
// import VotesTable from "./VotesTable.jsx";
const VotesSummary = lazy(() => import("./VotesSummary.jsx"));
const VotesMap = lazy(() => import("./Views/VotesMap/index.jsx"));
const VotesScatterPlot = lazy(() => import("./Views/VotesScatter/index.jsx"));
const VotesTable = lazy(() => import("./Views/VotesTable/index.jsx"));

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
  const [countyFilter, updateCountyFilter] = useState(countyParam);
  const [isCountyLevel, updateIsCountyLevel] = useState(isCountyLevelInitial);

  // **************************************************
  // Active Data Point
  // **************************************************
  const [activeHover, updateActiveHover] = useState(null);
  const [activeSelection, updateActiveSelectionState] = useState(countyFilter);

  const updateActiveSelection = (activeSelection) => {
    updateActiveSelectionState(activeSelection);
    const elementRegionSummary = document.getElementById("regionSummaryName");
    if (elementRegionSummary) elementRegionSummary.scrollIntoView(true);
  };

  // ************************************************
  // Data Display Controls
  // ************************************************
  const [showVoteMode, updateShowVoteMode] = useState(false);
  const [showAbsentee, updateShowAbsentee] = useState(false);
  const [showDemographics, updateShowDemographics] = useState(false);

  // ************************************************
  // Basic UI Events / Controls
  // ************************************************
  const [showOptions, updateShowOptions] = useState(showOptionsOnLoad);
  const [showWelcome, updateShowWelcome] = useState(showWelcomeOnLoad);
  const [displayType, updateDisplayType] = useState(displayModeInitial);

  const [userHasSetLevel, updateUserHasSetLevel] = useState(!isCountyLevelInitial);

  return (
    <div className="container">
      <header className="header bg-black py-2 px-5 h-auto top-0 bg-slate-950 text-white text-lg leading-5">
        <nav className="mx-auto h-full flex items-center justify-between" aria-label="Global">
          <div className="flex lg:flex-1">
            <span className="headerLogoArea">
              <span className="pr-3">
                <img src="peach.webp" height="20px" width="20px" />
              </span>
              Georgia Votes <span className="uppercase font-bold">Visual</span>
            </span>
          </div>

          <Navigation displayType={displayType} updateDisplayType={updateDisplayType} updateShowOptions={updateShowOptions} showOptions={showOptions} />
        </nav>
      </header>
      <div className="pageGrid">
        <ElectionSelectionContextProvider>
          <ElectionDataProvider isCountyLevel={isCountyLevel} countyFilter={countyFilter}>
            <MapsPreferenceContextProvider>
              <ScatterPlotPreferenceContextProvider>
                <div className={displayType === "table" && !showOptions ? "full" : "one"}>
                  <ErrorBoundary fallback={<p>Something went wrong</p>}>
                    <Suspense fallback={<div>Loading...</div>}>
                      {displayType === "scatter" && (
                        <VotesScatterPlot isCountyLevel={isCountyLevel} updateActiveSelection={updateActiveSelection} updateActiveHover={updateActiveHover} />
                      )}
                      {displayType === "map" && (
                        // <div>test</div>
                        <VotesMap
                          isCountyLevel={isCountyLevel}
                          countyFilter={countyFilter}
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
                    </Suspense>
                  </ErrorBoundary>
                </div>
                {(displayType !== "table" || showOptions) && (
                  <div className="two p-4">
                    {showWelcome && (
                      <>
                        <WelcomeText updateShowWelcome={updateShowWelcome} />
                      </>
                    )}
                    {(showOptions || showWelcome) && (
                      <>
                        <VoteMapOptions
                          updateShowOptions={updateShowOptions}
                          displayType={displayType}
                          showVoteMode={showVoteMode}
                          updateShowVoteMode={updateShowVoteMode}
                          showDemographics={showDemographics}
                          updateShowDemographics={updateShowDemographics}
                          showAbsentee={showAbsentee}
                          updateShowAbsentee={updateShowAbsentee}
                        />
                      </>
                    )}
                    <Suspense fallback={<div>Loading...</div>}>
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
                    </Suspense>
                  </div>
                )}
              </ScatterPlotPreferenceContextProvider>
            </MapsPreferenceContextProvider>
          </ElectionDataProvider>
        </ElectionSelectionContextProvider>
      </div>
    </div>
  );
}
