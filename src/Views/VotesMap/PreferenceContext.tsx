import React, { createContext, useContext, useMemo, useState } from "react";

const url = new URL(window.location.href);
const params = new URLSearchParams(url.search);

// elevation approach
const elevationApproachParam = params.get("elevationApproach");
const elevationApproachInitial = elevationApproachParam || "none";

// color approach
const colorApproachParam = params.get("colorApproach");
const colorApproachInitial = colorApproachParam || "electionResultPerRepublicanPer";

interface IMapPreferenceContext {
  elevationApproach: string;
  updateElevationApproach: React.Dispatch<React.SetStateAction<string>>;
  colorApproach: string;
  updateColorApproach: React.Dispatch<React.SetStateAction<string>>;
}

export const MapPreferenceContext = createContext<IMapPreferenceContext | null>(null);

interface IProps {
  children: React.ReactNode;
}

export function MapsPreferenceContextProvider({ children }: IProps): React.ReactNode {
  const [elevationApproach, updateElevationApproach] = useState(elevationApproachInitial);
  const [colorApproach, updateColorApproach] = useState(colorApproachInitial);

  const contextValue = useMemo(() => {
    const value: IMapPreferenceContext = {
      elevationApproach,
      updateElevationApproach,
      colorApproach,
      updateColorApproach,
    };
    return value;
  }, [elevationApproach, colorApproach]);

  return <MapPreferenceContext.Provider value={contextValue}>{children}</MapPreferenceContext.Provider>;
}

export function useMapPreference(): IMapPreferenceContext | null {
  return useContext(MapPreferenceContext);
}
