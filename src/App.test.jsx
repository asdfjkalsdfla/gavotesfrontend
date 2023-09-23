// @vitest-environment jsdom

import React from "react";
import { describe, it, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import App from "./App.jsx";
vi.spyOn(window.URL, "createObjectURL").mockImplementation(() => "http://fake.url");

vi.mock("recharts", async () => {
  const actual = await vi.importActual("recharts");
  return {
    ...actual,
    ResponsiveContainer: (props) => <div {...props} />,
  };
});

describe("no crashes!", () => {
  it("renders main load without crashing", async () => {
    const { getByText, findAllByText } = render(<App />);
    await findAllByText("Georgia Votes", undefined, { timeout: 5000 });
    await getByText("Georgia Votes");
  });
  it("renders scatter plot without crashing", async () => {
    const { getByText, findAllByText, findByTestId } = render(<App />);
    await findAllByText("Georgia Votes", undefined, { timeout: 5000 });
    const button = getByText("Scatter Plot");
    fireEvent.click(button);
    await findByTestId("scatterPlot", undefined, { timeout: 5000 });
  });
  it("renders table without crashing", async ({ expect }) => {
    const { baseElement, getByText, findAllByText, findByTestId } = render(<App />);
    await findAllByText("Georgia Votes", undefined, { timeout: 7500 });
    fireEvent.click(getByText("Table"));
    await findByTestId("electionResultTable", undefined, { timeout: 7500 });
    await findAllByText("FULTON", undefined, { timeout: 7500 });
    expect(baseElement).toMatchSnapshot();
  });
});
