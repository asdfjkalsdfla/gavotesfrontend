export interface VotesRootSearchParams {
  CTYNAME?: string;
  level?: string;
  hideWelcome?: string;
  hideOptions?: string;
  scatter?: string;
  displayMode?: string;
}

export type DisplayType = "map" | "scatter" | "table";
