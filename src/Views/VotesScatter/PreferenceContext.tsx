import React, { createContext, useContext, useMemo, useState } from "react";

interface IScatterPlotPreferenceContext {
    scatterXAxis: string;
    updateScatterXAxis: React.Dispatch<React.SetStateAction<string>>;
    scatterYAxis: string;
    updateScatterYAxis: React.Dispatch<React.SetStateAction<string>>;
}

export const ScatterContext = createContext<IScatterPlotPreferenceContext | null>(null);

interface IProps {
  children: React.ReactNode;
}

export function ScatterPlotPreferenceContextProvider({ children }: IProps): React.ReactNode {
    const [scatterXAxis, updateScatterXAxis] = useState("electionResultPerRepublicanPer");
    const [scatterYAxis, updateScatterYAxis] = useState("turnoutAbsSameDay");

  const contextValue = useMemo(() => {
    const value: IScatterPlotPreferenceContext = {
        scatterXAxis,
        updateScatterXAxis,
        scatterYAxis,
        updateScatterYAxis
    };
    return value;
  }, [scatterXAxis, scatterYAxis]);

  return <ScatterContext.Provider value={contextValue}>{children}</ScatterContext.Provider>;
}

export function useScatterPreference(): IScatterPlotPreferenceContext | null {
  return useContext(ScatterContext);
}
