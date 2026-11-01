import React, { createContext, useContext, useMemo, useState } from "react";
import { useSearch } from "@tanstack/react-router";

export interface ITurnoutFilter {
  enabled: boolean;
  operator: "gte" | "lte";
  threshold: number;
}

interface IMapPreferenceContext {
  elevationApproach: string;
  updateElevationApproach: React.Dispatch<React.SetStateAction<string>>;
  colorApproach: string;
  updateColorApproach: React.Dispatch<React.SetStateAction<string>>;
  turnoutFilter: ITurnoutFilter;
  updateTurnoutFilter: React.Dispatch<React.SetStateAction<ITurnoutFilter>>;
}

export const MapPreferenceContext = createContext<IMapPreferenceContext | null>(null);

interface IProps {
  children: React.ReactNode;
}

export function MapsPreferenceContextProvider({ children }: IProps): React.ReactNode {
  const search = useSearch({ strict: false });

  // elevation approach
  const elevationApproachParam = search?.elevationApproach;
  const elevationApproachInitial = elevationApproachParam || "turnoutAbsSameDay";

  // color approach
  const colorApproachParam = search?.colorApproach;
  const colorApproachInitial = colorApproachParam || "electionResultPerRepublicanPer";

  const [elevationApproach, updateElevationApproach] = useState(elevationApproachInitial);
  const [colorApproach, updateColorApproach] = useState(colorApproachInitial);
  const [turnoutFilter, updateTurnoutFilter] = useState<ITurnoutFilter>({
    enabled: false,
    operator: "gte",
    threshold: 1.0,
  });

  const contextValue = useMemo(() => {
    const value: IMapPreferenceContext = {
      elevationApproach,
      updateElevationApproach,
      colorApproach,
      updateColorApproach,
      turnoutFilter,
      updateTurnoutFilter,
    };
    return value;
  }, [elevationApproach, colorApproach, turnoutFilter]);

  return <MapPreferenceContext.Provider value={contextValue}>{children}</MapPreferenceContext.Provider>;
}

export function useMapPreference(): IMapPreferenceContext | null {
  return useContext(MapPreferenceContext);
}
