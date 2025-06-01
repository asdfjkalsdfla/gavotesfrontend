import React, { useMemo, lazy, Suspense } from "react";
// import { Table } from "antd";
import { ZoomOut, ZoomIn, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "../VotesTable/DataTable.tsx";
import { DataTableColumnHeader } from "../VotesTable/DataTableColumnHeader.tsx";
import { DataTableCellNumeric } from "../VotesTable/DataTableCellNumeric.tsx";
import { useElectionData } from "../../context/ElectionDataProvider.jsx";
import { useSummaryPreferences } from "./PreferenceContext.tsx";
import { numberFormat, numberFormatPercent, numberFormatRatio, RDIndicator } from "../../Utils.jsx";

// import VotesByDateChart from "./VotesByDateChart.jsx";
const VotesByDateChart = lazy(() => import("./VotesByDateChart.jsx"));

// const { Column } = Table;

// const numberFormatInteger = new Intl.NumberFormat('en-us', options1);

export default function VoteSummary({
  activeSelection,
  activeHover,
  countyFilter,
  updateCountyFilter,
  updateActiveSelection,
  isCountyLevel,
  updateIsCountyLevel,
  updateUserHasSetLevel,
}) {
  const { locationResults, countyResults, statewideResults, currentElectionRace, previousElectionRace, currentAbsenteeElection, baseAbsenteeElection } =
    useElectionData();
  const { showVoteMode, showAbsentee, showDemographics } = useSummaryPreferences();
  const resultSummary = useMemo(() => {
    const source = activeHover || activeSelection; // use the hover value o/w use the selection
    if (source && source.properties) return source.properties; // if we have the actual object use it
    if (source && locationResults.has(source)) return locationResults.get(source); // pull the data from the current level displayed
    if (source && countyResults.has(source)) return countyResults.get(source);
    if (countyFilter && countyResults.has(countyFilter)) return countyResults.get(countyFilter); // if filtered to a county use that total
    return statewideResults; // if no selection and no filter, use the statewide total
  }, [activeHover, activeSelection, countyFilter, locationResults, countyResults, statewideResults]);

  if (!resultSummary) return <span>Loading...</span>;

  const absenteeElectionBaseLabel = baseAbsenteeElection.label;
  const absenteeElectionCurrentLabel = currentAbsenteeElection.label;
  return (
    <Card id="regionSummaryName">
      <CardHeader className="pb-3">
        <CardTitle className="text-2xl">
          {resultSummary.CTYNAME ? resultSummary.CTYNAME : "The State of Georgia"} {resultSummary.PRECINCT_N || ""}{" "}
          {activeSelection && activeSelection === resultSummary.id && (
            <span style={{ float: "right" }}>
              <Button
                className="h-6 w-6"
                variant="none"
                size="icon"
                onClick={() => {
                  updateCountyFilter(resultSummary.PRECINCT_N && countyFilter ? resultSummary.CTYNAME : null);
                  updateActiveSelection(resultSummary.PRECINCT_N && countyFilter ? resultSummary.CTYNAME : null);
                }}
              >
                <X />
              </Button>
            </span>
          )}
        </CardTitle>
        <CardDescription>Election results</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-1">
        {!resultSummary.PRECINCT_N && (
          <div className="pt-3  ">
            {isCountyLevel ? (
              <div>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => {
                    updateIsCountyLevel(false);
                    updateUserHasSetLevel(true);
                    if (resultSummary.CTYNAME) updateCountyFilter(resultSummary.CTYNAME);
                  }}
                  className="p-0.3"
                >
                  <ZoomIn className="ml-2 mr-2 h-3 w-3" />
                  <span className="mr-3">Precinct Level</span>
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="xs"
                onClick={() => {
                  updateIsCountyLevel(true);
                  updateUserHasSetLevel(true);
                  updateCountyFilter(null);
                }}
                className="p-0.3"
              >
                <ZoomOut className="ml-2 mr-2 h-3 w-3" />
                <span className="mr-3">County Level</span>
              </Button>
            )}
          </div>
        )}
        {showAbsentee && (
          <div>
            <div className="text-lg font-bold pt-6">Absentee Ballots</div>
            <div className="grid grid-cols-[6fr_4fr] w-full items-center gap-1.5 p-2">
              <div>Accepted {absenteeElectionCurrentLabel}</div>
              <div className="text-right">{numberFormat.format(resultSummary?.absenteeCurrent?.totalAbsenteeVotes)}</div>
              <div>Accepted at Same Date in {absenteeElectionBaseLabel}</div>
              <div className="text-right">{numberFormat.format(resultSummary?.absenteeBase?.absenteeVotesAsOfCurrentDate)}</div>
              <div>vs. Same Day</div>
              <div className="text-right">{numberFormatRatio.format(resultSummary?.absenteeBallotComparison?.turnoutAbsenteeBallotsSameDay)}</div>
              <div>Total Accepted in {absenteeElectionBaseLabel}</div>
              <div className="text-right">{numberFormat.format(resultSummary?.absenteeBase?.totalAbsenteeVotes)}</div>
              <div>% of Total</div>
              <div className="text-right">{numberFormatRatio.format(resultSummary?.absenteeBallotComparison?.turnoutAbsenteeBallots)}</div>
            </div>
          </div>
        )}
        <ElectionResultSummary
          race={currentElectionRace}
          raceResult={resultSummary?.electionResultsCurrent}
          raceComparison={resultSummary.electionResultsComparison}
          showVoteMode={showVoteMode}
        />
        {resultSummary.electionResultsComparison && (
          <ElectionResultSummary race={previousElectionRace} raceResult={resultSummary?.electionResultsBase} showVoteMode={showVoteMode} />
        )}
        {showDemographics && resultSummary?.demographics?.whitePer > 0 && (
          <>
            <div className="text-lg font-bold pt-6">Demographics of 2020 Registered Voters</div>
            <div className="grid grid-cols-[6fr_4fr] w-full items-center gap-1.5 p-2">
              <div>White (not hispanic)</div>
              <div className="text-right">{numberFormatPercent.format(resultSummary.demographics.whitePer)}</div>
              <div>Black</div>
              <div className="text-right">{numberFormatPercent.format(resultSummary.demographics.blackPer)}</div>
              <div>Asian</div>
              <div className="text-right">{numberFormatPercent.format(resultSummary.demographics.asianPer)}</div>
              <div>Hispanic</div>
              <div className="text-right">{numberFormatPercent.format(resultSummary.demographics.hispanicPer)}</div>
              <div>Unknown</div>
              <div className="text-right">{numberFormatPercent.format(resultSummary.demographics.otherPer)}</div>
            </div>
          </>
        )}
        {showAbsentee && (
          <Suspense fallback={<div>Loading...</div>}>
            <div className="text-lg font-bold pt-6">Votes by Day</div>
            <VotesByDateChart
              resultSummary={resultSummary}
              absenteeElectionCurrentLabel={absenteeElectionCurrentLabel}
              absenteeElectionBaseLabel={absenteeElectionBaseLabel}
            />
          </Suspense>
        )}
        <div className="text-right">
          <small>
            <i>Last Updated:</i> {import.meta?.env?.VITE_REACT_APP_UPDATE_DATE}
          </small>
        </div>
      </CardContent>
    </Card>
  );
}

function ElectionResultSummary({ race, raceResult, raceComparison, showVoteMode }) {
  const columnsVoteMode = [
    {
      id: "mode",
      accessorKey: "mode",
      meta: { title: "Vote Mode" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="Vote Mode" />,
      enableHiding: false,
    },
    {
      id: `${race}##perR`,
      accessorKey: "republican",
      meta: { title: `${race?.republican} (R)` },
      header: ({ column }) => <DataTableColumnHeader column={column} title={column.columnDef.meta.title} />,
      cell: ({ row }) => (
        <DataTableCellNumeric>
          {numberFormat.format(row.original?.republican)} ({numberFormatPercent.format(row.original?.perRepublican)})
        </DataTableCellNumeric>
      ),
    },
    {
      id: `${race}##perD`,
      accessorKey: "democratic",
      meta: { title: `${race?.democratic} (D)` },
      header: ({ column }) => <DataTableColumnHeader column={column} title={column.columnDef.meta.title} />,
      cell: ({ row }) => (
        <DataTableCellNumeric>
          {numberFormat.format(row.original?.democratic)} ({numberFormatPercent.format(row.original?.perDemocratic)})
        </DataTableCellNumeric>
      ),
    },
  ];
  return (
    <div>
      <div className="text-lg font-bold pt-6">
        {race?.election?.label} - {race?.name}
      </div>
      <div className="grid grid-cols-[6fr_4fr] items-center gap-1.5 p-2">
        <div>{race?.republican} (R)</div>
        <div className="text-right">
          {numberFormat.format(raceResult?.republican)} ({numberFormatPercent.format(raceResult?.perRepublican)})
        </div>
        <div>{race?.democratic} (D)</div>
        <div className="text-right">
          {numberFormat.format(raceResult?.democratic)} ({numberFormatPercent.format(raceResult?.perDemocratic)})
        </div>
        <div>Vote Margin</div>
        <div className="text-right">
          {RDIndicator(raceResult?.marginDemocratic)} {numberFormat.format(Math.abs(raceResult?.marginRepublican))} (
          {numberFormatPercent.format(Math.abs(raceResult?.marginPerRepublican))})
        </div>
        {raceComparison && (
          <>
            <div>Swing (Shift in R/D %)</div>
            <div className="text-right">
              {RDIndicator(raceComparison.perShiftDemocratic)} {numberFormatPercent.format(Math.abs(raceComparison?.perShiftDemocratic))}
            </div>
            <div>% of Previous Turnout</div>
            <div className="text-right">{numberFormatPercent.format(raceComparison?.totalVotesPercent)}</div>
            {/* <Descriptions.Item label="R/D % of Previous Turnout">{numberFormatPercent.format(resultSummary.electionResultsComparison?.totalVotesRDPercent)}</Descriptions.Item>
                <Descriptions.Item label="D % of Previous Turnout">{numberFormatPercent.format(resultSummary.electionResultsComparison?.totalVotesDemocraticPercent)}</Descriptions.Item>
                <Descriptions.Item label="R % of Previous Turnout">{numberFormatPercent.format(resultSummary.electionResultsComparison?.totalVotesRepublicanPercent)}</Descriptions.Item> */}
            {/* <Descriptions.Item label="Shift in Vote Margin">
              {RDIndicator(resultSummary.electionResultsComparison.voteShiftDemocratic)}{" "}
              {numberFormat.format(Math.abs(resultSummary.electionResultsComparison.voteShiftDemocratic))}
            </Descriptions.Item> */}
            <div>Shift in Vote Margin (normalized)</div>
            <div className="text-right">
              {RDIndicator(raceComparison.voteShiftDemocraticNormalized)} {numberFormat.format(Math.abs(raceComparison.voteShiftDemocraticNormalized))}
            </div>
          </>
        )}
      </div>
      {showVoteMode && (
        <React.Fragment>
          <br />
          <br />
          <b>Result by Vote Method</b>
          <br />
          <DataTable columns={columnsVoteMode} data={raceResult?.resultsByMode} initialSortColumn="mode" />
        </React.Fragment>
      )}
    </div>
  );
}
