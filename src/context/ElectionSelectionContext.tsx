import { createContext, useContext, useMemo, useState } from "react";
import { useLocation } from "@tanstack/react-router";

interface ElectionSelection {
  absenteeElectionBaseID: string;
  updateAbsenteeElectionBaseID: React.Dispatch<React.SetStateAction<string>>;
  absenteeElectionCurrentID: string;
  updateAbsenteeElectionCurrentID: React.Dispatch<React.SetStateAction<string>>;
  resultsElectionRaceCurrentID: string;
  updateResultsElectionRaceCurrentID: React.Dispatch<React.SetStateAction<string>>;
  resultsElectionRacePerviousID: string;
  updateResultsElectionRacePerviousID: React.Dispatch<React.SetStateAction<string>>;
}

export const ElectionSelectionContext = createContext<ElectionSelection | undefined>(undefined);

interface IProps {
  children: React.ReactNode;
}

export function ElectionSelectionContextProvider({ children }: IProps) {
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const search = Object.fromEntries(urlParams.entries());

  // ************************************************
  // Pull the initial values from the URL params
  // ************************************************
  // races
  const resultsElectionRaceCurrentIDParam: string | undefined = search?.resultsElectionRaceCurrentID;
  const resultsElectionRaceCurrentIDInitial: string = resultsElectionRaceCurrentIDParam || "2024_general||President";
  const resultsElectionRacePerviousIDParam: string | undefined = search?.resultsElectionRacePerviousID;
  const resultsElectionRacePerviousIDInitial: string = resultsElectionRacePerviousIDParam || "2020_general||President of the United States";

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

export function useElectionSelection(): ElectionSelection {
  const context = useContext(ElectionSelectionContext);
  if (!context) {
    throw new Error('useElectionSelection must be used within an ElectionSelectionContextProvider');
  }
  return context;
}
