import VotesTable from "../Views/VotesTable/index.jsx";
import ErrorBoundary from "../ErrorBoundary.jsx";

export default function TablePage({
  isCountyLevel,
  countyFilter,
  updateIsCountyLevel,
  updateActiveSelection,
}) {
  return (
    <ErrorBoundary fallback={<p>Something went wrong</p>}>
      <VotesTable
        isCountyLevel={isCountyLevel}
        countyFilter={countyFilter}
        updateCountyFilter={() => {}} // Navigation handles this now
        updateIsCountyLevel={updateIsCountyLevel}
        updateActiveSelection={updateActiveSelection}
      />
    </ErrorBoundary>
  );
}