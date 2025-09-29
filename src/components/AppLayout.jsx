import React, { useState, Suspense } from "react";
import { useParams, useSearch, useLocation, Link } from "@tanstack/react-router";
import Navigation from "../Navigation.jsx";
import WelcomeText from "../WelcomeText.jsx";
import VoteMapOptions from "../Views/VoteMapOptions.jsx";
import VotesSummary from "../Views/VotesSummary/index.jsx";
import { ElectionSelectionContextProvider } from "../context/ElectionSelectionContext.tsx";
import { ElectionDataProvider } from "../context/ElectionDataProvider.jsx";
import { ScatterPlotPreferenceContextProvider } from "../Views/VotesScatter/PreferenceContext.tsx";
import { MapsPreferenceContextProvider } from "../Views/VotesMap/PreferenceContext.tsx";
import { SummaryPreferenceContextProvider } from "../Views/VotesSummary/PreferenceContext.tsx";
import { VoterSelectionProvider } from "../context/VoterSelectionContext.tsx";
import "../VotesRoot.css";

export default function AppLayout({ children }) {
  const location = useLocation();
  const params = useParams({ strict: false });
  const search = useSearch({ strict: false });

  // Get county from URL params if it exists
  const countyFilter = params.county ? decodeURIComponent(params.county) : null;
  const levelParam = search?.level;
  const isCountyLevelInitial = levelParam ? levelParam === "county" : !countyFilter;

  // only show welcome when it's not been shown before
  const welcomeMessageShown = localStorage.getItem("welcomeShown");
  const hideWelcomeParam = search?.hideWelcome;
  const showWelcomeOnLoad = !(hideWelcomeParam === "true" || welcomeMessageShown);

  // hide the options parameter?
  const hideOptionsParam = search?.hideOptions;
  const showOptionsOnLoad = hideOptionsParam !== "true";

  // Determine display type from current route
  const getDisplayType = () => {
    const pathname = location.pathname;
    if (pathname.endsWith("/scatter") || pathname === "/scatter") return "scatter";
    if (pathname.endsWith("/table") || pathname === "/table") return "table";
    return "map"; // default for /maps or root
  };

  const displayType = getDisplayType();

  // **************************************************
  // Active Data Point State (moved from individual pages)
  // **************************************************
  const [activeHover, updateActiveHover] = useState(null);
  const [activeSelection, updateActiveSelectionState] = useState(countyFilter);
  const [userHasSetLevel, updateUserHasSetLevel] = useState(!isCountyLevelInitial);
  const [isCountyLevel, updateIsCountyLevel] = useState(isCountyLevelInitial);

  const updateActiveSelection = (activeSelection) => {
    updateActiveSelectionState(activeSelection);
    const elementRegionSummary = document.getElementById("regionSummaryName");
    if (elementRegionSummary) elementRegionSummary.scrollIntoView(true);
  };

  // ************************************************
  // Basic UI Events / Controls
  // ************************************************
  const [showOptions, updateShowOptions] = useState(showOptionsOnLoad);
  const [showWelcome, updateShowWelcome] = useState(showWelcomeOnLoad);

  // Create the summary component here instead of in each page
  const summaryComponent = (
    <Suspense fallback={<div>Loading...</div>}>
      <VotesSummary
        activeSelection={activeSelection}
        updateActiveSelection={updateActiveSelection}
        activeHover={activeHover}
        isCountyLevel={isCountyLevel}
        countyFilter={countyFilter}
        updateUserHasSetLevel={updateUserHasSetLevel}
        updateIsCountyLevel={updateIsCountyLevel}
      />
    </Suspense>
  );

  return (
    <ElectionSelectionContextProvider>
      <ElectionDataProvider isCountyLevel={isCountyLevel} countyFilter={countyFilter}>
        <MapsPreferenceContextProvider>
          <ScatterPlotPreferenceContextProvider>
            <SummaryPreferenceContextProvider>
              <div className="container">
                <header className="header bg-black py-2 px-5 h-auto top-0 bg-slate-950 text-white text-lg leading-5">
                  <nav className="mx-auto h-full flex items-center justify-between" aria-label="Global">
                    <div className="flex lg:flex-1">
                      <Link to="/" className="headerLogoArea">
                        <span className="pr-3">
                          <img src="peach.webp" height="20px" width="20px" alt="Georgia peach logo" />
                        </span>
                        Georgia Votes <span className="uppercase font-bold">Visual</span>
                      </Link>
                    </div>

                    <Navigation updateShowOptions={updateShowOptions} showOptions={showOptions} />
                  </nav>
                </header>
                <div className="pageGrid">
                  <div className={displayType === "table" && !showOptions ? "full" : "one"}>
                    <VoterSelectionProvider
                      value={{
                        isCountyLevel,
                        updateActiveSelection,
                        updateActiveHover,
                        activeHover,
                        activeSelection,
                        userHasSetLevel,
                        updateIsCountyLevel,
                      }}
                    >
                      {children}
                    </VoterSelectionProvider>
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
                          <VoteMapOptions updateShowOptions={updateShowOptions} displayType={displayType} />
                        </>
                      )}
                      {summaryComponent}
                    </div>
                  )}
                </div>
              </div>
            </SummaryPreferenceContextProvider>
          </ScatterPlotPreferenceContextProvider>
        </MapsPreferenceContextProvider>
      </ElectionDataProvider>
    </ElectionSelectionContextProvider>
  );
}
