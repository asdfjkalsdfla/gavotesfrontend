import React, { createContext, useContext, useMemo, useState } from "react";

interface ISummaryPreferenceContext {
  showVoteMode: boolean;
  updateShowVoteMode: React.Dispatch<React.SetStateAction<boolean>>;
  showAbsentee: boolean;
  updateShowAbsentee: React.Dispatch<React.SetStateAction<boolean>>;
  showDemographics: boolean;
  updateShowDemographics: React.Dispatch<React.SetStateAction<boolean>>;
  showCumulativeVotes: boolean;
  updateShowCumulativeVotes: React.Dispatch<React.SetStateAction<boolean>>;
}

export const SummaryPreferenceContext = createContext<ISummaryPreferenceContext | null>(null);

interface IProps {
  children: React.ReactNode;
}

export function SummaryPreferenceContextProvider({ children }: IProps): React.ReactNode {
  const [showVoteMode, updateShowVoteMode] = useState(false);
  const [showAbsentee, updateShowAbsentee] = useState(true);
  const [showDemographics, updateShowDemographics] = useState(false);
  const [showCumulativeVotes, updateShowCumulativeVotes] = useState(false);

  const contextValue = useMemo(() => {
    const value: ISummaryPreferenceContext = {
      showVoteMode,
      updateShowVoteMode,
      showAbsentee,
      updateShowAbsentee,
      showDemographics,
      updateShowDemographics,
      showCumulativeVotes,
      updateShowCumulativeVotes,
    };
    return value;
  }, [showVoteMode, showAbsentee, showDemographics, showCumulativeVotes]);

  return <SummaryPreferenceContext.Provider value={contextValue}>{children}</SummaryPreferenceContext.Provider>;
}

export function useSummaryPreferences(): ISummaryPreferenceContext | null {
  return useContext(SummaryPreferenceContext);
}
