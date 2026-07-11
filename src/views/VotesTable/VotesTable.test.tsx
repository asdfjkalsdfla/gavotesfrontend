// @vitest-environment jsdom

import { it, describe } from "vitest";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import "@testing-library/jest-dom";
import type { ReactElement } from "react";
import VotesTable from "./index.tsx";
import { ElectionSelectionContext } from "../../context/ElectionSelectionContext.tsx";
import { ElectionDataProvider } from "../../context/ElectionDataProvider.tsx";

// Create a QueryClient for testing
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

// Helper function to render with all necessary providers
const renderWithProviders = (component: ReactElement) => {
  return render(<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>);
};

const electionSelectionValue = {
  absenteeElectionCurrentID: "2022_general",
  absenteeElectionBaseID: "2022_general",
  updateAbsenteeElectionCurrentID: () => {},
  updateAbsenteeElectionBaseID: () => {},
  resultsElectionRaceCurrentID: "2022_general||US Senate",
  resultsElectionRacePerviousID: "2020_general||President of the United States",
  updateResultsElectionRaceCurrentID: () => {},
  updateResultsElectionRacePerviousID: () => {},
};

describe("Votes Table", () => {
  it("renders without crashing", async () => {
    renderWithProviders(
      <ElectionSelectionContext.Provider value={electionSelectionValue}>
        <ElectionDataProvider isCountyLevel={true} countyFilter={undefined}>
          <VotesTable isCountyLevel={true} countyFilter={null} updateIsCountyLevel={() => {}} updateActiveSelection={() => {}} />
        </ElectionDataProvider>
      </ElectionSelectionContext.Provider>,
    );
    await waitFor(() => screen.getByText("State of Georgia"));
  });

  it("Show columns displayed", async () => {
    renderWithProviders(
      <ElectionSelectionContext.Provider value={electionSelectionValue}>
        <ElectionDataProvider isCountyLevel={true} countyFilter={undefined}>
          <VotesTable isCountyLevel={true} countyFilter={null} updateIsCountyLevel={() => {}} updateActiveSelection={() => {}} />
        </ElectionDataProvider>
      </ElectionSelectionContext.Provider>,
    );
    await waitFor(() => screen.getByText("State of Georgia"));
    fireEvent.click(screen.getByTestId("dataElementSettings"));
    await waitFor(() => screen.getByText("Asian %"));
  });
});
