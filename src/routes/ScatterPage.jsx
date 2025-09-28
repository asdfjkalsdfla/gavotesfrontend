import VotesScatterPlot from "../Views/VotesScatter/index.jsx";
import ErrorBoundary from "../ErrorBoundary.jsx";

export default function ScatterPage({
  isCountyLevel,
  countyFilter,
  updateIsCountyLevel,
  updateActiveSelection,
  activeSelection,
  activeHover,
  updateActiveHover,
}) {
  return (
    <ErrorBoundary fallback={<p>Something went wrong</p>}>
      <VotesScatterPlot
        isCountyLevel={isCountyLevel}
        countyFilter={countyFilter}
        updateIsCountyLevel={updateIsCountyLevel}
        updateActiveSelection={updateActiveSelection}
        activeSelection={activeSelection}
        activeHover={activeHover}
        updateActiveHover={updateActiveHover}
      />
    </ErrorBoundary>
  );
}