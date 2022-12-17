import React from "react";
import ReactDOM from "react-dom/client";
import { it, describe, beforeEach, afterEach } from "vitest";
import { act, Simulate } from "react-dom/test-utils";
import { fireEvent, screen, waitFor } from "@testing-library/react";
// import "@testing-library/jest-dom";
import VotesTable from "./VotesTable.jsx";
import { ElectionDataProvider } from "./ElectionDataProvider.jsx";

let container;

describe.concurrent("Votes Table", () => {
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null;
  });

  it("renders without crashing", () => {
    act(() => {
      ReactDOM.createRoot(container).render(
        <ElectionDataProvider
          isCountyLevel={true}
          countyFilter={null}
          absenteeElectionBaseID="election1"
          absenteeElectionCurrentID="election2"
          resultsElectionRaceCurrentID="election3"
          resultsElectionRacePerviousID="election4"
        >
          <VotesTable />
        </ElectionDataProvider>
      );
    });
  });

  it("Show columns displayed", async () => {
    act(() => {
      ReactDOM.createRoot(container).render(
        <ElectionDataProvider
          isCountyLevel={true}
          countyFilter={null}
          absenteeElectionBaseID="election1"
          absenteeElectionCurrentID="election2"
          resultsElectionRaceCurrentID="election3"
          resultsElectionRacePerviousID="election4"
        >
          <VotesTable />
        </ElectionDataProvider>
      );
    });
    act(() => {
      Simulate.click(screen.getByText("Select Data to Display"));
    });
    await waitFor(() => screen.getByText("Asian %"));
  });
});
