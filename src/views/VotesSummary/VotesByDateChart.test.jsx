// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import VotesByDateChart from "./VotesByDateChart.jsx";
import { SummaryPreferenceContextProvider } from "./PreferenceContext.tsx";

// Mock resize observer
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

let capturedRows = [];

vi.mock("@tanstack/charts", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    lineY: (data, options) => {
      capturedRows = data;
      return actual.lineY(data, options);
    },
  };
});

describe("VotesByDateChart", () => {
  const sampleSummary = {
    absenteeBase: {
      votesByDay: [
        { DaysFromElection: -10, DateDT: "2020-10-24", votesOnDate: 100, votesToDate: 500 },
        { DaysFromElection: -5, DateDT: "2020-10-29", votesOnDate: 200, votesToDate: 700 },
      ],
    },
    absenteeCurrent: {
      votesByDay: [
        { DaysFromElection: -10, DateDT: "2024-10-26", votesOnDate: 150, votesToDate: 600 },
        { DaysFromElection: -5, DateDT: "2024-10-31", votesOnDate: 250, votesToDate: 850 },
      ],
    },
    absenteeBallotComparison: {
      targetDaysOut: -5,
    },
  };

  it("renders with exact votes by default and displays toggle buttons", () => {
    render(<VotesByDateChart resultSummary={sampleSummary} absenteeElectionCurrentLabel="2024 General" absenteeElectionBaseLabel="2020 General" />);

    const exactBtn = screen.getByRole("button", { name: "Exact" });
    const cumulativeBtn = screen.getByRole("button", { name: "Cumulative" });

    expect(exactBtn).toBeDefined();
    expect(cumulativeBtn).toBeDefined();
    expect(exactBtn.getAttribute("aria-pressed")).toBe("true");
    expect(cumulativeBtn.getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByText("Daily votes")).toBeDefined();
  });

  it("switches to cumulative votes when clicking Cumulative button", () => {
    render(<VotesByDateChart resultSummary={sampleSummary} absenteeElectionCurrentLabel="2024 General" absenteeElectionBaseLabel="2020 General" />);

    const exactBtn = screen.getByRole("button", { name: "Exact" });
    const cumulativeBtn = screen.getByRole("button", { name: "Cumulative" });

    fireEvent.click(cumulativeBtn);

    expect(cumulativeBtn.getAttribute("aria-pressed")).toBe("true");
    expect(exactBtn.getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByText("Cumulative votes")).toBeDefined();
  });

  it("passes exact votes vs cumulative votes to chart rows", () => {
    const { rerender } = render(
      <VotesByDateChart
        resultSummary={sampleSummary}
        absenteeElectionCurrentLabel="2024 General"
        absenteeElectionBaseLabel="2020 General"
        isCumulative={false}
      />,
    );

    // In exact mode
    const baseAtDay10 = capturedRows.find((r) => r.DaysFromElection === -10 && r.series === "2020 General Votes");
    expect(baseAtDay10?.votes).toBe(100);

    const currentAtDay10 = capturedRows.find((r) => r.DaysFromElection === -10 && r.series === "2024 General Votes");
    expect(currentAtDay10?.votes).toBe(150);

    // Switch to cumulative
    rerender(
      <VotesByDateChart
        resultSummary={sampleSummary}
        absenteeElectionCurrentLabel="2024 General"
        absenteeElectionBaseLabel="2020 General"
        isCumulative={true}
      />,
    );

    const baseAtDay10Cum = capturedRows.find((r) => r.DaysFromElection === -10 && r.series === "2020 General Votes");
    expect(baseAtDay10Cum?.votes).toBe(500);

    const currentAtDay10Cum = capturedRows.find((r) => r.DaysFromElection === -10 && r.series === "2024 General Votes");
    expect(currentAtDay10Cum?.votes).toBe(600);
  });

  it("updates and synchronizes with SummaryPreferenceContext", () => {
    render(
      <SummaryPreferenceContextProvider>
        <VotesByDateChart resultSummary={sampleSummary} absenteeElectionCurrentLabel="2024 General" absenteeElectionBaseLabel="2020 General" />
      </SummaryPreferenceContextProvider>,
    );

    const cumulativeBtn = screen.getByRole("button", { name: "Cumulative" });
    fireEvent.click(cumulativeBtn);

    expect(screen.getByText("Cumulative votes")).toBeDefined();
    expect(cumulativeBtn.getAttribute("aria-pressed")).toBe("true");

    const exactBtn = screen.getByRole("button", { name: "Exact" });
    fireEvent.click(exactBtn);

    expect(screen.getByText("Daily votes")).toBeDefined();
    expect(exactBtn.getAttribute("aria-pressed")).toBe("true");
  });
});
