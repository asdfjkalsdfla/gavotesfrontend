import React, { useMemo, lazy, Suspense } from "react";
import { Table } from "antd";
import { ZoomOut, ZoomIn, X } from "lucide-react";
import { useElectionData } from "./ElectionDataProvider.jsx";
import { numberFormat, numberFormatPercent, numberFormatRatio, RDIndicator } from "./Utils.jsx";
import { Button } from "@/components/ui/button";

// import VotesByDateChart from "./VotesByDateChart.jsx";
const VotesByDateChart = lazy(() => import("./VotesByDateChart.jsx"));

const { Column } = Table;

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
  showVoteMode,
  showDemographics,
  showAbsentee,
}) {
  const { locationResults, countyResults, statewideResults, currentElectionRace, previousElectionRace, currentAbsenteeElection, baseAbsenteeElection } =
    useElectionData();
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
    <div className="p-4">
      <div id="regionSummaryName" className="text-2xl font-bold">
        {resultSummary.CTYNAME ? resultSummary.CTYNAME : "The State of Georgia"} {resultSummary.PRECINCT_N || ""}{" "}
        {activeSelection && activeSelection === resultSummary.id && (
          <span style={{ float: "right" }}>
            <Button
              variant="outline"
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
      </div>
      {!resultSummary.PRECINCT_N && (
        <React.Fragment>
          {isCountyLevel ? (
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  updateIsCountyLevel(false);
                  updateUserHasSetLevel(true);
                  if (resultSummary.CTYNAME) updateCountyFilter(resultSummary.CTYNAME);
                }}
              >
                <ZoomIn className="mr-2 h-4 w-4" /> Precinct Level
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                updateIsCountyLevel(true);
                updateUserHasSetLevel(true);
                updateCountyFilter(null);
              }}
            >
              <ZoomOut className="mr-2 h-4 w-4" />
              County Level
            </Button>
          )}
        </React.Fragment>
      )}
      {showAbsentee && (
        <>
          <div className="text-lg font-bold py-3">Absentee Ballots</div>
          <div className="grid grid-cols-[60%_40%] w-full items-center gap-4">
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
        </>
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
          <div className="text-lg font-bold py-3">Demographics of 2020 Registered Voters</div>
          <div className="grid grid-cols-[60%_40%] w-full items-center gap-4">
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
      <br />
      {showAbsentee && (
        <Suspense fallback={<div>Loading...</div>}>
          <br />
          <b>Votes by Day</b>
          <VotesByDateChart
            resultSummary={resultSummary}
            absenteeElectionCurrentLabel={absenteeElectionCurrentLabel}
            absenteeElectionBaseLabel={absenteeElectionBaseLabel}
          />
        </Suspense>
      )}
      <div style={{ width: "100%", textAlign: "right" }}>
        <small>
          <i>Last Updated:</i> {import.meta?.env?.VITE_REACT_APP_UPDATE_DATE}
        </small>
      </div>
    </div>
  );
}

function ElectionResultSummary({ race, raceResult, raceComparison, showVoteMode }) {
  return (
    <>
      <div className="text-lg font-bold py-3">
        {race.election?.label} - {race?.name}
      </div>
      <div className="grid grid-cols-[60%_40%] w-full items-center gap-4">
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
          <Table dataSource={raceResult?.resultsByMode} pagination={false} sortDirections="">
            <Column title="Method" dataIndex="mode" key="mode" sorter={(a, b) => (a.mode > b.mode ? 1 : -1)} sortOrder="ascend" />
            <Column
              title={`${race?.republican} (R)`}
              align="right"
              dataIndex="republican"
              key="republican"
              render={(value, row) => (
                <>
                  {numberFormat.format(row?.republican)} ({numberFormatPercent.format(row?.perRepublican)})
                </>
              )}
            />
            <Column
              title={`${race?.democratic} (D)`}
              dataIndex="democratic"
              key="democratic"
              align="right"
              render={(value, row) => (
                <>
                  {numberFormat.format(row?.democratic)} ({numberFormatPercent.format(row?.perDemocratic)})
                </>
              )}
            />
          </Table>
        </React.Fragment>
      )}
    </>
  );
}
