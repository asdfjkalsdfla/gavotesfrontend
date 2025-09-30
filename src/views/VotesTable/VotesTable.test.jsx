// @vitest-environment jsdom

import React from "react";
import { it, describe } from "vitest";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import "@testing-library/jest-dom";
import VotesTable from "./index.jsx";
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
const renderWithProviders = (component) => {
  return render(<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>);
};

describe("Votes Table", () => {
  it("renders without crashing", async () => {
    renderWithProviders(
      <ElectionSelectionContext.Provider
        value={{
          absenteeElectionCurrentID: "2022_general",
          absenteeElectionBaseID: "2022_general",
          resultsElectionRaceCurrentID: "2022_general||US Senate",
          resultsElectionRacePerviousID: "2020_general||President of the United States",
        }}
      >
        <ElectionDataProvider isCountyLevel={true} countyFilter={null}>
          <VotesTable />
        </ElectionDataProvider>
      </ElectionSelectionContext.Provider>,
    );
    await waitFor(() => screen.getByText("State of Georgia"));
  });

  it("Show columns displayed", async () => {
    renderWithProviders(
      <ElectionSelectionContext.Provider
        value={{
          absenteeElectionCurrentID: "2022_general",
          absenteeElectionBaseID: "2022_general",
          resultsElectionRaceCurrentID: "2022_general||US Senate",
          resultsElectionRacePerviousID: "2020_general||President of the United States",
        }}
      >
        <ElectionDataProvider isCountyLevel={true} countyFilter={null}>
          <VotesTable />
        </ElectionDataProvider>
      </ElectionSelectionContext.Provider>,
    );
    await waitFor(() => screen.getByText("State of Georgia"));
    fireEvent.click(screen.getByTestId("dataElementSettings"));
    await waitFor(() => screen.getByText("Asian %"));
  });
});
