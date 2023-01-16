import React from "react";
import { describe, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import App from "./App.jsx";

describe.concurrent("no crashes!", () => {
  it("renders main load without crashing", async () => {
    render(<App />);
    await screen.findAllByText("Georgia Votes Visual", undefined, { timeout: 5000 });
    await screen.getByText("Georgia Votes Visual");
  });
  it("renders scatter plot without crashing", async () => {
    render(<App />);
    await screen.findAllByText("Georgia Votes Visual", undefined, { timeout: 5000 });
    const button = screen.getByText("Scatter Plot");
    fireEvent.click(button);
    await screen.findByTestId("scatterPlot", undefined, { timeout: 5000 });
  });
  it("renders table without crashing", async () => {
    render(<App />);
    await screen.findAllByText("Georgia Votes Visual", undefined, { timeout: 5000 });
    fireEvent.click(screen.getByText("Table"));
    await screen.findByTestId("electionResultTable", undefined, { timeout: 5000 });
  });
});
