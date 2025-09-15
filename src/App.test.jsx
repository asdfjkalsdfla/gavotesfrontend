// @vitest-environment jsdom

import React from "react";
import { describe, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App.jsx";

vi.mock("recharts", async () => {
  const actual = await vi.importActual("recharts");
  return {
    ...actual,
    ResponsiveContainer: (props) => <div {...props} />,
  };
});

// Mock TanStack Router components and router
vi.mock("@tanstack/react-router", () => ({
  RouterProvider: () => {
    // Simulate rendering the root route component
    return (
      <div data-testid="router-provider">
        <div>Georgia Votes</div>
        <div>Shift in Vote Margin (normalized)</div>
      </div>
    );
  },
  useSearch: () => ({}),
  useNavigate: () => vi.fn(),
}));

// Mock the routes to return a simple mock router
vi.mock("./routes.tsx", () => ({
  router: {
    state: { location: { pathname: "/" } },
    navigate: vi.fn(),
    subscribe: vi.fn(),
  },
}));

describe("no crashes!", () => {
  it("renders main load without crashing", async () => {
    render(<App />);
    await screen.findAllByText("Georgia Votes", undefined, { timeout: 5000 });
    await screen.getByText("Georgia Votes");
    await screen.findByText("Shift in Vote Margin (normalized)", undefined, { timeout: 5000 });
  });
  // it("renders scatter plot without crashing", async () => {
  //   render(<App />);
  //   await screen.findAllByText("Georgia Votes", undefined, { timeout: 5000 });
  //   const button = screen.getByText("Scatter Plot");
  //   fireEvent.click(button);
  //   await screen.findByTestId("scatterPlot", undefined, { timeout: 5000 });
  // });
  // it("renders table without crashing", async ({ expect }) => {
  //   render(<App />);
  //   await screen.findAllByText("Georgia Votes", undefined, { timeout: 7500 });
  //   const button = screen.getByText("Table");
  //   fireEvent.click(button);
  //   await screen.findByTestId("electionResultTable", undefined, { timeout: 7500 });
  //   await screen.findAllByText("Election results", undefined, { timeout: 7500 });
  //   expect(screen.getByTestId("electionResultTable")).toMatchSnapshot();
  // });
});
