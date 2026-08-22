// @vitest-environment jsdom
import React from "react";
import { describe, it, vi } from "vitest";
import { render } from "@testing-library/react";
import VotesScatterPlot from "./index.jsx";
import { ElectionDataProvider } from "../../context/ElectionDataProvider.tsx";
import { ElectionSelectionContextProvider } from "../../context/ElectionSelectionContext.tsx";
import { ScatterPlotPreferenceContextProvider } from "./PreferenceContext.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

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

describe("VotesScatterPlot", () => {
  it("renders without crashing", () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ElectionSelectionContextProvider>
          <ElectionDataProvider isCountyLevel={true}>
            <ScatterPlotPreferenceContextProvider>
              <VotesScatterPlot isCountyLevel={true} updateActiveHover={() => {}} updateActiveSelection={() => {}} />
            </ScatterPlotPreferenceContextProvider>
          </ElectionDataProvider>
        </ElectionSelectionContextProvider>
      </QueryClientProvider>,
    );
  });
});
