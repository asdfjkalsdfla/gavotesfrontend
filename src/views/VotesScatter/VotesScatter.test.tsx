// @vitest-environment jsdom
import React, { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import VotesScatterPlot from "./index.jsx";
import { ElectionDataContext } from "../../context/ElectionDataProvider.tsx";
import { ElectionSelectionContextProvider } from "../../context/ElectionSelectionContext.tsx";
import { ScatterContext, ScatterPlotPreferenceContextProvider } from "./PreferenceContext.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type CombinedElectionRow from "../../lib/electionResults/CombinedElectionRow.ts";

vi.mock("@tanstack/react-router", () => ({
  useSearch: () => ({}),
  useLocation: () => ({ pathname: "/scatter" }),
  useParams: () => ({}),
  useNavigate: () => vi.fn(),
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

// Mock resize observer
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const createMockElectionContext = (locationResults = new Map<string, CombinedElectionRow>()) => ({
  elections: [],
  statewideResults: { id: "GA", CTYNAME: "Georgia" } as CombinedElectionRow,
  locationResults,
  countyResults: new Map<string, CombinedElectionRow>(),
  isLoading: false,
  isError: false,
  error: null,
});

describe("VotesScatterPlot", () => {
  it("renders without crashing on initial mount with empty dataset", () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ElectionSelectionContextProvider>
          <ElectionDataContext.Provider value={createMockElectionContext(new Map())}>
            <ScatterPlotPreferenceContextProvider>
              <VotesScatterPlot isCountyLevel={true} updateActiveHover={() => {}} updateActiveSelection={() => {}} />
            </ScatterPlotPreferenceContextProvider>
          </ElectionDataContext.Provider>
        </ElectionSelectionContextProvider>
      </QueryClientProvider>,
    );
    expect(screen.getByTestId("scatterPlot")).toBeDefined();
  });

  it("handles transitions between county and precinct levels without infinite re-renders", () => {
    const queryClient = new QueryClient();
    function DynamicWrapper() {
      const [isCounty, setIsCounty] = useState(true);
      return (
        <div>
          <button type="button" onClick={() => setIsCounty(!isCounty)}>
            Toggle Level
          </button>
          <VotesScatterPlot isCountyLevel={isCounty} updateActiveHover={() => {}} updateActiveSelection={() => {}} />
        </div>
      );
    }

    render(
      <QueryClientProvider client={queryClient}>
        <ElectionSelectionContextProvider>
          <ElectionDataContext.Provider value={createMockElectionContext(new Map())}>
            <ScatterPlotPreferenceContextProvider>
              <DynamicWrapper />
            </ScatterPlotPreferenceContextProvider>
          </ElectionDataContext.Provider>
        </ElectionSelectionContextProvider>
      </QueryClientProvider>,
    );

    const toggleButton = screen.getByText("Toggle Level");
    fireEvent.click(toggleButton);
    expect(screen.getByTestId("scatterPlot")).toBeDefined();
  });

  it("handles axis metric changes from context cleanly", () => {
    const queryClient = new QueryClient();

    function ContextConsumer() {
      const ctx = React.useContext(ScatterContext);
      return (
        <div>
          <button type="button" onClick={() => ctx?.updateScatterXAxis("whitePer")}>
            Change Axis
          </button>
          <VotesScatterPlot isCountyLevel={true} updateActiveHover={() => {}} updateActiveSelection={() => {}} />
        </div>
      );
    }

    render(
      <QueryClientProvider client={queryClient}>
        <ElectionSelectionContextProvider>
          <ElectionDataContext.Provider value={createMockElectionContext(new Map())}>
            <ScatterPlotPreferenceContextProvider>
              <ContextConsumer />
            </ScatterPlotPreferenceContextProvider>
          </ElectionDataContext.Provider>
        </ElectionSelectionContextProvider>
      </QueryClientProvider>,
    );

    const changeAxisButton = screen.getByText("Change Axis");
    fireEvent.click(changeAxisButton);
    expect(screen.getByTestId("scatterPlot")).toBeDefined();
  });

  it("renders with populated election data and regression line", () => {
    const mockData = new Map<string, CombinedElectionRow>([
      [
        "FULTON",
        {
          id: "FULTON",
          CTYNAME: "Fulton",
          electionResultsCurrent: { perRepublican: 27.5, totalVotes: 500000 },
          absenteeBallotComparison: { turnoutAbsenteeBallotsSameDay: 1.2 },
        } as unknown as CombinedElectionRow,
      ],
      [
        "GWINNETT",
        {
          id: "GWINNETT",
          CTYNAME: "Gwinnett",
          electionResultsCurrent: { perRepublican: 41.2, totalVotes: 380000 },
          absenteeBallotComparison: { turnoutAbsenteeBallotsSameDay: 0.9 },
        } as unknown as CombinedElectionRow,
      ],
    ]);

    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ElectionSelectionContextProvider>
          <ElectionDataContext.Provider value={createMockElectionContext(mockData)}>
            <ScatterPlotPreferenceContextProvider>
              <VotesScatterPlot isCountyLevel={true} updateActiveHover={() => {}} updateActiveSelection={() => {}} />
            </ScatterPlotPreferenceContextProvider>
          </ElectionDataContext.Provider>
        </ElectionSelectionContextProvider>
      </QueryClientProvider>,
    );

    expect(screen.getByTestId("scatterPlot")).toBeDefined();
  });

  it("handles double-click zoom reset interaction", () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ElectionSelectionContextProvider>
          <ElectionDataContext.Provider value={createMockElectionContext(new Map())}>
            <ScatterPlotPreferenceContextProvider>
              <VotesScatterPlot isCountyLevel={true} updateActiveHover={() => {}} updateActiveSelection={() => {}} />
            </ScatterPlotPreferenceContextProvider>
          </ElectionDataContext.Provider>
        </ElectionSelectionContextProvider>
      </QueryClientProvider>,
    );

    const scatterPlot = screen.getByTestId("scatterPlot");
    fireEvent.doubleClick(scatterPlot.firstChild as Element);
    expect(screen.getByTestId("scatterPlot")).toBeDefined();
  });
});
