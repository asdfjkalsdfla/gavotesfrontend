import React from "react";
import { ConfigProvider } from "antd";
import { describe, it } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import App from "./App.jsx";

describe.concurrent("no crashes!", () => {
  it("renders main load without crashing", async () => {
    const { getByText, findAllByText } = render(<App />);
    await findAllByText("Georgia Votes Visual", undefined, { timeout: 5000 });
    await getByText("Georgia Votes Visual");
  });
  it("renders scatter plot without crashing", async () => {
    const { getByText, findAllByText, findByTestId } = render(<App />);
    await findAllByText("Georgia Votes Visual", undefined, { timeout: 5000 });
    const button = getByText("Scatter Plot");
    fireEvent.click(button);
    await findByTestId("scatterPlot", undefined, { timeout: 5000 });
  });
  it("renders table without crashing", async ({ expect }) => {
    const { baseElement, getByText, findAllByText, findByTestId } = render(
      <ConfigProvider theme={{ hashed: false }}>
        <App />
      </ConfigProvider>
    );
    await findAllByText("Georgia Votes Visual", undefined, { timeout: 5000 });
    fireEvent.click(getByText("Table"));
    await findByTestId("electionResultTable", undefined, { timeout: 5000 });
    expect(baseElement).toMatchSnapshot();
  });
});
