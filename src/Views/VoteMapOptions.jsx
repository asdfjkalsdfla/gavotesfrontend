import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useElectionSelection } from "../context/ElectionSelectionContext.tsx";
import { useElectionData } from "../context/ElectionDataProvider.jsx";
import { useMapPreference } from "./VotesMap/PreferenceContext.tsx";
import { useScatterPreference } from "./VotesScatter/PreferenceContext.tsx";
import { useSummaryPreferences } from "./VotesSummary/PreferenceContext.tsx";

export default function VoteMapSelectItems({ updateShowOptions, displayType }) {
  const {
    absenteeElectionBaseID,
    updateAbsenteeElectionBaseID,
    resultsElectionRaceCurrentID,
    updateResultsElectionRaceCurrentID,
    resultsElectionRacePerviousID,
    updateResultsElectionRacePerviousID,
  } = useElectionSelection();
  const { elevationApproach, updateElevationApproach, colorApproach, updateColorApproach } = useMapPreference();
  const { scatterXAxis, updateScatterXAxis, scatterYAxis, updateScatterYAxis } = useScatterPreference();
  const { showVoteMode, updateShowVoteMode, showDemographics, updateShowDemographics, showAbsentee, updateShowAbsentee } = useSummaryPreferences();
  const { elections } = useElectionData();

  return (
    <Card className="mb-5">
      <CardHeader className="pb-3">
        <CardTitle className="text-2xl">
          Options
          <span style={{ float: "right" }}>
            <Button
              className="h-6 w-6"
              variant="none"
              size="icon"
              onClick={() => {
                updateShowOptions(false);
              }}
            >
              <X />
            </Button>
          </span>
        </CardTitle>
        <CardDescription>Set what's displayed</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-1">
        {(displayType === "scatter" || displayType === "map") && (
          <div className="mb-5">
            <div className="flex font-bold">Display Strategy</div>
            {displayType === "scatter" && (
              <>
                <div className="flex flex-col space-y-1.5">
                  <label htmlFor="xaxis">X Axis</label>
                  <Select
                    onValueChange={(value) => {
                      updateScatterXAxis(value);
                    }}
                    value={scatterXAxis}
                  >
                    <SelectTrigger id="xaxis" className="w-full">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem value="electionResultPerRepublicanPer">Current Election Vote Share</SelectItem>
                      <SelectItem value="perRBase">Previous Election Vote Share</SelectItem>
                      <SelectItem value="perShiftRepublican">Vote Swing (Shift in R/D %)</SelectItem>
                      {/* <SelectItem value="perShiftRepublicanEarly">Shift in Early Vote R/D %</SelectItem> */}
                      {/* <SelectItem value="totalVotesRepublicanPercent">Change in R Votes</SelectItem> */}
                      <SelectItem value="whitePer">White %</SelectItem>
                      <SelectItem value="blackPer">Black %</SelectItem>
                      <SelectItem value="hispanicPer">Hispanic %</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col space-y-1.5">
                  <label htmlFor="yaxis">Y Axis</label>
                  <Select
                    onValueChange={(value) => {
                      updateScatterYAxis(value);
                    }}
                    value={scatterYAxis}
                    virtual={false}
                  >
                    <SelectTrigger id="yaxis" className="w-full">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem value="electionResultPerRepublicanPer">Current Election Vote Share</SelectItem>
                      <SelectItem value="perRBase">Previous Election Vote Share</SelectItem>
                      <SelectItem value="perShiftRepublican">Vote Swing (Shift in R/D %)</SelectItem>
                      <SelectItem value="totalVotesPercent">% of Previous Turnout</SelectItem>
                      <SelectItem value="totalVotesRepublicanPercent">Change in R Turnout</SelectItem>
                      <SelectItem value="totalVotesDemocraticPercent">Change in D Turnout</SelectItem>
                      <SelectItem value="turnoutAbsSameDay">Absentee Votes @ Same Day</SelectItem>
                      <SelectItem value="turnoutAbsenteeBallots">% of Absentee Votes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            {displayType === "map" && (
              <>
                <div className="flex flex-col space-y-1.5">
                  <label htmlFor="elevationApproach">Colors Show</label>
                  <Select
                    onValueChange={(value) => {
                      updateColorApproach(value);
                    }}
                    value={colorApproach}
                  >
                    <SelectTrigger id="colorApproach" className="w-full">
                      <SelectValue placeholder="Color Based On" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem value="electionResultPerRepublicanPer">Vote Share</SelectItem>
                      <SelectItem value="electionResultVoteMargin">Vote Margin</SelectItem>
                      <SelectItem value="electionResultPerRepublicanPerShift">Vote Swing (Shift in R/D %)</SelectItem>
                      <SelectItem value="totalVotesPercent">% of Previous Turnout</SelectItem>
                      {/* <SelectItem value="electionResultVoteShift">Shift in Vote Margin</SelectItem> */}
                      <SelectItem value="electionResultVoteShiftNormalized">Shift in Vote Margin (normalized)</SelectItem>
                      <SelectItem value="blackPer">Black %</SelectItem>
                      <SelectItem value="hispanicPer">Hispanic %</SelectItem>
                      <SelectItem value="turnoutAbsSameDay">Absentee Votes @ Same Day</SelectItem>
                      {/* <SelectItem value="turnoutAbs">% of Total Votes</SelectItem> */}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col space-y-1.5">
                  <label htmlFor="elevationApproach">Elevation Shows</label>
                  <Select
                    onValueChange={(value) => {
                      updateElevationApproach(value);
                    }}
                    value={elevationApproach}
                  >
                    <SelectTrigger id="elevationApproach" className="w-full">
                      <SelectValue placeholder="Elevation Based On" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem value="turnoutAbsSameDay">Absentee Votes @ Same Day</SelectItem>
                      <SelectItem value="turnoutAbs">% of Total Votes</SelectItem>
                      <SelectItem value="votes">Current Votes</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
        )}
        <div className="mb-5">
          <div className="flex font-bold">Election Results</div>
          <div className="flex flex-col space-y-1.5">
            <label htmlFor="currentElection">Current</label>
            <Select
              value={resultsElectionRaceCurrentID}
              onValueChange={(value) => {
                updateResultsElectionRaceCurrentID(value);
              }}
            >
              <SelectTrigger id="currentElection" className="w-full">
                <SelectValue placeholder="Current Race" />
              </SelectTrigger>
              <SelectContent position="popper">
                {elections
                  .filter((election) => !election.isCurrentElection)
                  .map(
                    (election) =>
                      election.races &&
                      election.races.map((race) => (
                        <SelectItem
                          key={`${election.name}||${race.name}`}
                          value={`${election.name}||${race.name}`}
                        >{`${election.label} - ${race.name}`}</SelectItem>
                      )),
                  )}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col space-y-1.5">
            <label htmlFor="baseElection">Compared to </label>
            <Select
              value={resultsElectionRacePerviousID}
              onValueChange={(value) => {
                updateResultsElectionRacePerviousID(value);
              }}
            >
              <SelectTrigger id="prevElection" className="w-full">
                <SelectValue placeholder="Previous Race" />
              </SelectTrigger>
              <SelectContent position="popper">
                {elections
                  .filter((election) => !election.isCurrentElection)
                  .map(
                    (election) =>
                      election.races &&
                      election.races.map((race) => (
                        <SelectItem
                          key={`${election.name}||${race.name}`}
                          value={`${election.name}||${race.name}`}
                        >{`${election.label} - ${race.name}`}</SelectItem>
                      )),
                  )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {(elevationApproach !== "none" || displayType === "table") && (
          <div className="mb-5">
            <div className="flex font-bold">Absentee Ballots</div>
            <div className="flex flex-col space-y-1.5">
              <label htmlFor="baseElection">Compared to </label>
              <Select
                placeholder="Base Election"
                value={absenteeElectionBaseID}
                onValueChange={(value) => {
                  updateAbsenteeElectionBaseID(value);
                }}
              >
                <SelectTrigger id="comparedTo" className="w-full">
                  <SelectValue placeholder="Previous Race" />
                </SelectTrigger>
                <SelectContent position="popper">
                  {elections
                    .filter((election) => !election.isCurrentElection)
                    .map((election) => (
                      <SelectItem key={election.name} value={election.name}>
                        {election.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div className="flex font-bold">Selected County/Precinct Data</div>
        <div className="flex flex-col gap-2">
          <div className="items-top flex space-x-2">
            <Checkbox
              id="absBallots"
              onCheckedChange={(checked) => {
                updateShowAbsentee(checked);
              }}
              checked={showAbsentee}
            />
            <div className="grid gap-1.5 leading-none">
              <label htmlFor="absBallots" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Absentee Ballots
              </label>
            </div>
          </div>
          <div className="items-top flex space-x-2">
            <Checkbox
              id="showVoteMode"
              onCheckedChange={(checked) => {
                updateShowVoteMode(checked);
              }}
              checked={showVoteMode}
            />
            <div className="grid gap-1.5 leading-none">
              <label htmlFor="showVoteMode" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Votes by Mode
              </label>
            </div>
          </div>

          <div className="items-top flex space-x-2">
            <Checkbox
              id="showDemographics"
              onCheckedChange={(checked) => {
                updateShowDemographics(checked);
              }}
              checked={showDemographics}
            />
            <div className="grid gap-1.5 leading-none">
              <label htmlFor="showDemographics" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Demographics
              </label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
