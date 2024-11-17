import React, { createContext, useContext, useMemo, useState } from "react";

interface ElectionSelection {
  absenteeElectionBaseID: string;
  updateAbsenteeElectionBaseID: Function;
  absenteeElectionCurrentID: string;
  updateAbsenteeElectionCurrentID: Function;
  resultsElectionRaceCurrentID: string;
  updateResultsElectionRaceCurrentID: Function;
  resultsElectionRacePerviousID: string;
  updateResultsElectionRacePerviousID: Function;
}

// ************************************************
// Pull the initial values from the URL params
// ************************************************
const url = new URL(window.location.href);
const params = new URLSearchParams(url.search);
// races
const resultsElectionRaceCurrentIDParam: string | null = params.get("resultsElectionRaceCurrentID");
const resultsElectionRaceCurrentIDInitial: string = resultsElectionRaceCurrentIDParam || "2024_general||President";
const resultsElectionRacePerviousIDParam: string | null = params.get("resultsElectionRacePerviousID");
const resultsElectionRacePerviousIDInitial: string = resultsElectionRacePerviousIDParam || "2020_general||President of the United States";

export const ElectionSelectionContext = createContext<ElectionSelection | null>(null);

interface IProps {
  children: React.ReactNode;
}

export function ElectionSelectionContextProvider({ children }: IProps): React.ReactNode {
  const [absenteeElectionCurrentID, updateAbsenteeElectionCurrentID] = useState<string>("2024_general");
  const [absenteeElectionBaseID, updateAbsenteeElectionBaseID] = useState<string>("2022_general");
  const [resultsElectionRaceCurrentID, updateResultsElectionRaceCurrentID] = useState<string>(resultsElectionRaceCurrentIDInitial);
  const [resultsElectionRacePerviousID, updateResultsElectionRacePerviousID] = useState<string>(resultsElectionRacePerviousIDInitial);

  const contextValue = useMemo(() => {
    const value: ElectionSelection = {
      absenteeElectionCurrentID,
      updateAbsenteeElectionCurrentID,
      absenteeElectionBaseID,
      updateAbsenteeElectionBaseID,
      resultsElectionRaceCurrentID,
      updateResultsElectionRaceCurrentID,
      resultsElectionRacePerviousID,
      updateResultsElectionRacePerviousID,
    };
    return value;
  }, [absenteeElectionCurrentID, absenteeElectionBaseID, resultsElectionRaceCurrentID, resultsElectionRacePerviousID]);

  return <ElectionSelectionContext.Provider value={contextValue}>{children}</ElectionSelectionContext.Provider>;
}

export function useElectionSelection(): ElectionSelection | null {
  return useContext(ElectionSelectionContext);
}
