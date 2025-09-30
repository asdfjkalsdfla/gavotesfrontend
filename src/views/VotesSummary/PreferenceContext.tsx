import React, { createContext, useContext, useMemo, useState } from "react";

interface ISummaryPreferenceContext {
  showVoteMode: boolean;
  updateShowVoteMode: React.Dispatch<React.SetStateAction<boolean>>;
  showAbsentee: boolean;
  updateShowAbsentee: React.Dispatch<React.SetStateAction<boolean>>;
  showDemographics: boolean;
  updateShowDemographics: React.Dispatch<React.SetStateAction<boolean>>;
}

export const SummaryPreferenceContext = createContext<ISummaryPreferenceContext | null>(null);

interface IProps {
  children: React.ReactNode;
}

export function SummaryPreferenceContextProvider({ children }: IProps): React.ReactNode {
  const [showVoteMode, updateShowVoteMode] = useState(false);
  const [showAbsentee, updateShowAbsentee] = useState(false);
  const [showDemographics, updateShowDemographics] = useState(false);

  const contextValue = useMemo(() => {
    const value: ISummaryPreferenceContext = {
      showVoteMode,
      updateShowVoteMode,
      showAbsentee,
      updateShowAbsentee,
      showDemographics,
      updateShowDemographics
    };
    return value;
  }, [showVoteMode, showAbsentee,showDemographics]);

  return <SummaryPreferenceContext.Provider value={contextValue}>{children}</SummaryPreferenceContext.Provider>;
}

export function useSummaryPreferences (): ISummaryPreferenceContext | null {
  return useContext(SummaryPreferenceContext);
}
