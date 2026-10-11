// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useElectionData } from "./useElectionData";
import type { Election, ElectionRace } from "../lib/electionResults/types";

const mockElectionCurrent: Election = {
  name: "2026_general",
  label: "2026 General",
  date: "2026-11-03",
  isCurrentElection: true,
  races: [{ name: "Governor", republican: "Jackson", democratic: "Lance Bottoms" }],
};

const mockElectionBase: Election = {
  name: "2022_general",
  label: "2022 General",
  date: "2022-11-08",
  isCurrentElection: false,
  races: [{ name: "Governor", republican: "Kemp", democratic: "Abrams" }],
};

const mockRaceCurrent: ElectionRace = {
  name: "Governor",
  republican: "Jackson",
  democratic: "Lance Bottoms",
  election: mockElectionCurrent,
};

const mockRacePrevious: ElectionRace = {
  name: "Governor",
  republican: "Kemp",
  democratic: "Abrams",
  election: mockElectionBase,
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useElectionData Hook", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads and populates absentee data even when election results return 404 (upcoming election)", async () => {
    const mockAbsenteeData = [
      {
        county: "FULTON",
        votesByDay: [{ DaysFromElection: -10, DateDT: "2026-10-24", votesToDate: 5000, votesOnDate: 500 }],
        lastUpdated: "2026-10-24T12:00:00Z",
      },
    ];

    const mockBaseAbsenteeData = [
      {
        county: "FULTON",
        votesByDay: [{ DaysFromElection: -10, DateDT: "2022-10-29", votesToDate: 4500, votesOnDate: 450 }],
        lastUpdated: "2022-10-29T12:00:00Z",
      },
    ];

    // Mock fetch to return absentee data, but 404 for election results
    vi.spyOn(global, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("absenteeSummary-2026_general-county.json")) {
        return new Response(JSON.stringify(mockAbsenteeData), { status: 200 });
      }
      if (url.includes("absenteeSummary-2022_general-county.json")) {
        return new Response(JSON.stringify(mockBaseAbsenteeData), { status: 200 });
      }
      if (url.includes("electionResultsSummary-2026_general-county.json")) {
        // 404 because election has not taken place yet!
        return new Response("Not Found", { status: 404 });
      }
      if (url.includes("demographics-county-2020.json")) {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      return new Response("Not Found", { status: 404 });
    });

    const { result } = renderHook(
      () =>
        useElectionData(
          mockElectionCurrent,
          mockElectionBase,
          mockRaceCurrent,
          mockRacePrevious,
          "county",
          true,
          true,
        ),
      { wrapper: createWrapper() },
    );

    // Wait until data is populated
    await waitFor(() => {
      expect(result.current.data.size).toBeGreaterThan(0);
    });

    expect(result.current.isError).toBe(false);
    const fulton = result.current.data.get("FULTON");
    expect(fulton).toBeDefined();
    expect(fulton?.CTYNAME).toBe("FULTON");
    expect(fulton?.absenteeCurrent?.totalAbsenteeVotes).toBe(5000);
    expect(fulton?.absenteeBase?.totalAbsenteeVotes).toBe(4500);
    expect(fulton?.absenteeBallotComparison).toBeDefined();
    // Election results should be undefined without crashing the hook
    expect(fulton?.electionResultsCurrent).toBeUndefined();
    expect(fulton?.electionResultsComparison).toBeUndefined();
  });

  it("does not fetch or process when enabled is false", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(
      () =>
        useElectionData(
          mockElectionCurrent,
          mockElectionBase,
          mockRaceCurrent,
          mockRacePrevious,
          "precinct",
          false,
          false, // enabled = false
        ),
      { wrapper: createWrapper() },
    );

    expect(result.current.data.size).toBe(0);
    expect(result.current.isLoading).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("applies targetDaysOut to comparison for precincts missing latest day data", async () => {
    const mockAbsenteeData = [
      {
        county: "FULTON",
        precinct: "01A",
        // Precinct only reported up to Day -28
        votesByDay: [{ DaysFromElection: -28, DateDT: "2026-10-06", votesToDate: 100, votesOnDate: 100 }],
        lastUpdated: "2026-10-06T12:00:00Z",
      },
    ];

    const mockBaseAbsenteeData = [
      {
        county: "FULTON",
        precinct: "01A",
        // Baseline has 80 votes on Day -28 and 150 votes on Day -25
        votesByDay: [
          { DaysFromElection: -28, DateDT: "2022-10-11", votesToDate: 80, votesOnDate: 80 },
          { DaysFromElection: -25, DateDT: "2022-10-14", votesToDate: 150, votesOnDate: 70 },
        ],
        lastUpdated: "2022-10-14T12:00:00Z",
      },
    ];

    vi.spyOn(global, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("absenteeSummary-2026_general-precinct.json")) {
        return new Response(JSON.stringify(mockAbsenteeData), { status: 200 });
      }
      if (url.includes("absenteeSummary-2022_general-precinct.json")) {
        return new Response(JSON.stringify(mockBaseAbsenteeData), { status: 200 });
      }
      return new Response("Not Found", { status: 404 });
    });

    const { result } = renderHook(
      () =>
        useElectionData(
          mockElectionCurrent,
          mockElectionBase,
          null,
          null,
          "precinct",
          false,
          true,
          -25, // targetDaysOut = -25 (statewide date)
        ),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.data.size).toBeGreaterThan(0);
    });

    const precinctRow = result.current.data.get("FULTON##01A");
    expect(precinctRow).toBeDefined();
    // Baseline votes should be queried as of Day -25 (150 votes, not Day -28's 80 votes)
    expect(precinctRow?.absenteeBallotComparison?.previousVotesSameDay).toBe(150);
  });
});
