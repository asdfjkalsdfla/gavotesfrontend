// @vitest-environment jsdom

import React from "react";
import { it, describe } from "vitest";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
// import "@testing-library/jest-dom";
import VotesTable from "./VotesTable.jsx";
import { ElectionDataProvider } from "../ElectionDataProvider.jsx";

describe("Votes Table", () => {
  it("renders without crashing", async () => {
    render(
      <ElectionDataProvider
        isCountyLevel={true}
        countyFilter={null}
        absenteeElectionBaseID="2022_general"
        absenteeElectionCurrentID="2022_general"
        resultsElectionRaceCurrentID="2022_general||US Senate"
        resultsElectionRacePerviousID="2020_general||President of the United States"
      >
        <VotesTable />
      </ElectionDataProvider>,
    );
    await waitFor(() => screen.getByText("State of Georgia"));
  });

  it("Show columns displayed", async () => {
    render(
      <ElectionDataProvider
        isCountyLevel={true}
        countyFilter={null}
        absenteeElectionBaseID="2022_general"
        absenteeElectionCurrentID="2022_general"
        resultsElectionRaceCurrentID="2022_general||US Senate"
        resultsElectionRacePerviousID="2020_general||President of the United States"
      >
        <VotesTable />
      </ElectionDataProvider>,
    );
    await waitFor(() => screen.getByText("State of Georgia"));
    fireEvent.click(screen.getByTestId("dataElementSettings"));
    await waitFor(() => screen.getByText("Asian %"));
  });
});
