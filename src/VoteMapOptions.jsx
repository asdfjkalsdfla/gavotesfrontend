import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useElectionData } from "./ElectionDataProvider.jsx";

export default function VoteMapSelectItems({
  updateElevationApproach,
  updateShowOptions,
  elevationApproach,
  updateColorApproach,
  colorApproach,
  absenteeBase,
  updateAbsenteeBase,
  electionResultBase,
  updateElectionResultBase,
  electionResultCurrent,
  updateElectionResultCurrent,
  showVoteMode,
  updateShowVoteMode,
  showDemographics,
  updateShowDemographics,
  showAbsentee,
  updateShowAbsentee,
  displayType,
  scatterXAxis,
  updateScatterXAxis,
  scatterYAxis,
  updateScatterYAxis,
}) {
  const { elections } = useElectionData();

  return (
    <React.Fragment>
      <div className="grid w-full items-center gap-2">
        <div className="text-2xl font-bold">
          Options
          <span style={{ float: "right" }}>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                updateShowOptions(false);
              }}
            >
              <X />
            </Button>
          </span>
        </div>
        {(displayType === "scatter" || displayType === "map") && (
          <>
            <div className="flex font-bold">Main Display</div>
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
                    <SelectTrigger id="xaxis">
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
                    style={{ width: 300 }}
                    value={scatterYAxis}
                    virtual={false}
                  >
                    <SelectTrigger id="yaxis">
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
                  <label htmlFor="elevationApproach">Color Approach</label>
                  <Select
                    onValueChange={(value) => {
                      updateColorApproach(value);
                    }}
                    value={colorApproach}
                  >
                    <SelectTrigger id="colorApproach">
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
                  <label htmlFor="elevationApproach">Elevation Approach</label>
                  <Select
                    onValueChange={(value) => {
                      updateElevationApproach(value);
                    }}
                    value={elevationApproach}
                  >
                    <SelectTrigger id="elevationApproach">
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
          </>
        )}
        <div className="flex font-bold">Election Results</div>
        <div className="flex flex-col space-y-1.5">
          <label htmlFor="baseElection">Base</label>
          <Select
            value={electionResultCurrent}
            onValueChange={(value) => {
              updateElectionResultCurrent(value);
            }}
          >
            <SelectTrigger id="baseElection">
              <SelectValue placeholder="Base Race" />
            </SelectTrigger>
            <SelectContent position="popper">
              {elections
                .filter((election) => !election.isCurrentElection)
                .map((election) =>
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
            value={electionResultBase}
            onValueChange={(value) => {
              updateElectionResultBase(value);
            }}
          >
            <SelectTrigger id="prevElection">
              <SelectValue placeholder="Previous Race" />
            </SelectTrigger>
            <SelectContent position="popper">
              {elections
                .filter((election) => !election.isCurrentElection)
                .map((election) =>
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
        {(elevationApproach !== "none" || displayType === "table") && (
          <>
            <br />
            <br />
            <div>
              <b>Absentee Ballots:</b>
            </div>
            {/* Current Election<br /><Select
            style={{ width: 300 }}
            placeholder="Base Election"
            virtual={true}
            value={absenteeCurrent}
            onChange={(value) => { updateAbsenteeCurrent(value) }}
        >
            {elections.map(election => <SelectItem key={election.name} value={election.name}>{election.label}</SelectItem>)}
        </Select>
        <br /> */}
            <div className="flex flex-col space-y-1.5">
              <label htmlFor="baseElection">Compared to </label>
              <Select
                placeholder="Base Election"
                value={absenteeBase}
                onValueChange={(value) => {
                  updateAbsenteeBase(value);
                }}
              >
                <SelectTrigger id="comparedTo">
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
          </>
        )}

        <div className="flex font-bold">Geography Data</div>
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
      </div>
    </React.Fragment>
  );
}
