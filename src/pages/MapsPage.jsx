import React, { Suspense } from "react";
import VotesMap from "../Views/VotesMap/index.jsx";
import ErrorBoundary from "../ErrorBoundary.jsx";

export default function MapsPage({
  isCountyLevel,
  countyFilter,
  updateActiveSelection,
  updateActiveHover,
  userHasSetLevel,
  updateIsCountyLevel,
}) {
  return (
    <ErrorBoundary fallback={<p>Something went wrong</p>}>
      <Suspense fallback={<div>Loading...</div>}>
        <VotesMap
          isCountyLevel={isCountyLevel}
          countyFilter={countyFilter}
          updateActiveSelection={updateActiveSelection}
          updateActiveHover={updateActiveHover}
          userHasSetLevel={userHasSetLevel}
          updateIsCountyLevel={updateIsCountyLevel}
        />
      </Suspense>
    </ErrorBoundary>
  );
}