import React from "react";
import { it, describe } from "vitest";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
// import "@testing-library/jest-dom";
import VotesTable from "./VotesTable.jsx";
import { ElectionDataProvider } from "./ElectionDataProvider.jsx";

describe.concurrent("Votes Table", () => {
  it.skip("renders without crashing", async () => {
    render(
      <ElectionDataProvider
        isCountyLevel={true}
        countyFilter={null}
        absenteeElectionBaseID="2022_runoff"
        absenteeElectionCurrentID="2022_general"
        resultsElectionRaceCurrentID="2022_runoff||US Senate"
        resultsElectionRacePerviousID="2022_general||US Senate"
      >
        <VotesTable />
      </ElectionDataProvider>
    );
    await waitFor(() => screen.getByText("Select Data to Display"));
  });

  it.skip("Show columns displayed", async () => {
    render(
      <ElectionDataProvider
        isCountyLevel={true}
        countyFilter={null}
        absenteeElectionBaseID="2022_runoff"
        absenteeElectionCurrentID="2022_general"
        resultsElectionRaceCurrentID="2022_runoff||US Senate"
        resultsElectionRacePerviousID="2022_general||US Senate"
      >
        <VotesTable />
      </ElectionDataProvider>
    );
    await waitFor(() => screen.getByText("Select Data to Display"));
    fireEvent.click(screen.getByText("Select Data to Display"));
    await waitFor(() => screen.getByText("Asian %"));
  });
});
