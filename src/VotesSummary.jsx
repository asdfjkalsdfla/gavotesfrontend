import React, { useMemo } from "react";
import { Descriptions, Button, Table } from "antd";
import { ZoomInOutlined, ZoomOutOutlined, CloseOutlined } from "@ant-design/icons";
import { useElectionData } from "./ElectionDataProvider";
import VotesByDateChart from "./VotesByDateChart";
import { numberFormat, numberFormatPercent, numberFormatRatio, RDIndicator } from "./Utils";
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
    const source = activeHover ? activeHover : activeSelection; // use the hover value o/w use the selection 
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
    <div>
      <h1>
        {resultSummary.CTYNAME ? resultSummary.CTYNAME : "The State of Georgia"} {resultSummary["PRECINCT_N"] || ""}{" "}
        {activeSelection && activeSelection === resultSummary.id && (
          <span style={{ float: "right" }}>
            <Button
              shape="circle"
              icon={<CloseOutlined />}
              onClick={() => {
                updateCountyFilter(resultSummary.PRECINCT_N && countyFilter ? resultSummary.CTYNAME : null);
                updateActiveSelection(resultSummary.PRECINCT_N && countyFilter ? resultSummary.CTYNAME : null);
              }}
            />
          </span>
        )}
      </h1>
      {!resultSummary.PRECINCT_N && (
        <React.Fragment>
          {isCountyLevel ? (
            <div>
              <Button
                type="primary"
                icon={<ZoomInOutlined />}
                size="small"
                onClick={() => {
                  updateIsCountyLevel(false);
                  updateUserHasSetLevel(true);
                  if (resultSummary.CTYNAME) updateCountyFilter(resultSummary.CTYNAME);
                }}
              >
                Precinct Level
              </Button>
            </div>
          ) : (
            <Button
              icon={<ZoomOutOutlined />}
              size="small"
              onClick={() => {
                updateIsCountyLevel(true);
                updateUserHasSetLevel(true);
                updateCountyFilter(null);
              }}
            >
              County Level
            </Button>
          )}
        </React.Fragment>
      )}

      {showAbsentee && (
        <Descriptions title="Absentee Ballots" column={1} bordered size="small" style={{ width: "100%" }} contentStyle={{ textAlign: "right", width: "40%" }}>
          <Descriptions.Item label={`Accepted  ${absenteeElectionCurrentLabel}`}>
            {numberFormat.format(resultSummary?.absenteeCurrent?.totalAbsenteeVotes)}
          </Descriptions.Item>
          <Descriptions.Item label={`Accepted at Same Date in ${absenteeElectionBaseLabel}`}>
            {numberFormat.format(resultSummary?.absenteeBase?.absenteeVotesAsOfCurrentDate)}
          </Descriptions.Item>
          <Descriptions.Item label="vs. Same Day">
            {numberFormatRatio.format(resultSummary?.absenteeBallotComparison?.turnoutAbsenteeBallotsSameDay)}
          </Descriptions.Item>
          <Descriptions.Item label={`Total Accepted in ${absenteeElectionBaseLabel}`}>
            {numberFormat.format(resultSummary?.absenteeBase?.totalAbsenteeVotes)}
          </Descriptions.Item>
          <Descriptions.Item label={`% of Total`}>{numberFormatRatio.format(resultSummary?.absenteeBallotComparison?.turnoutAbsenteeBallots)}</Descriptions.Item>
        </Descriptions>
      )}
      <Descriptions
        title={`${currentElectionRace.election?.label} - ${currentElectionRace?.name}`}
        column={1}
        bordered
        size="small"
        style={{ width: "100%" }}
        contentStyle={{ textAlign: "right", width: "40%" }}
      >
        <Descriptions.Item label={`${currentElectionRace?.republican} (R)`}>
          {numberFormat.format(resultSummary?.electionResultsCurrent?.republican)} (
          {numberFormatPercent.format(resultSummary?.electionResultsCurrent?.perRepublican)})
        </Descriptions.Item>
        <Descriptions.Item label={`${currentElectionRace?.democratic} (D)`}>
          {numberFormat.format(resultSummary?.electionResultsCurrent?.democratic)} (
          {numberFormatPercent.format(resultSummary?.electionResultsCurrent?.perDemocratic)})
        </Descriptions.Item>
        <Descriptions.Item label="Vote Margin">
          {RDIndicator(resultSummary?.electionResultsCurrent?.marginDemocratic)}{" "}
          {numberFormat.format(Math.abs(resultSummary?.electionResultsCurrent?.marginRepublican))} (
          {numberFormatPercent.format(Math.abs(resultSummary?.electionResultsCurrent?.marginPerRepublican))})
        </Descriptions.Item>
        {resultSummary.electionResultsComparison && (
          <>
            <Descriptions.Item label="Shift in R/D %">
              {RDIndicator(resultSummary.electionResultsComparison.perShiftDemocratic)}{" "}
              {numberFormatPercent.format(Math.abs(resultSummary.electionResultsComparison?.perShiftDemocratic))}
            </Descriptions.Item>
            <Descriptions.Item label="% of Previous Turnout">
              {numberFormatPercent.format(resultSummary.electionResultsComparison?.totalVotesPercent)}
            </Descriptions.Item>
            {/* <Descriptions.Item label="R/D % of Previous Turnout">{numberFormatPercent.format(resultSummary.electionResultsComparison?.totalVotesRDPercent)}</Descriptions.Item>
                <Descriptions.Item label="D % of Previous Turnout">{numberFormatPercent.format(resultSummary.electionResultsComparison?.totalVotesDemocraticPercent)}</Descriptions.Item>
                <Descriptions.Item label="R % of Previous Turnout">{numberFormatPercent.format(resultSummary.electionResultsComparison?.totalVotesRepublicanPercent)}</Descriptions.Item> */}
            <Descriptions.Item label="Shift in Vote Margin">
              {RDIndicator(resultSummary.electionResultsComparison.voteShiftDemocratic)}{" "}
              {numberFormat.format(Math.abs(resultSummary.electionResultsComparison.voteShiftDemocratic))}
            </Descriptions.Item>
            <Descriptions.Item label="Normalized Shift in Vote Margin">
              {RDIndicator(resultSummary.electionResultsComparison.voteShiftDemocraticNormalized)}{" "}
              {numberFormat.format(Math.abs(resultSummary.electionResultsComparison.voteShiftDemocraticNormalized))}
            </Descriptions.Item>
          </>
        )}
      </Descriptions>
      {showVoteMode && (
        <React.Fragment>
          <br />
          <br />
          <b>Result by Vote Method</b>
          <br />
          <Table dataSource={resultSummary?.electionResultsCurrent?.resultsByMode} pagination={false}>
            <Column title="Method" dataIndex="mode" key="mode" />
            <Column title={`${currentElectionRace?.republican} (R)`} dataIndex="republican" key="republican" render={(value) => numberFormat.format(value)} />
            <Column title={`${currentElectionRace?.democratic} (D)`} dataIndex="democratic" key="democratic" render={(value) => numberFormat.format(value)} />
          </Table>
        </React.Fragment>
      )}
      {resultSummary.electionResultsComparison && (
        <React.Fragment>
          <br />
          <Descriptions
            title={`${previousElectionRace.election.label} - ${previousElectionRace.name}`}
            column={1}
            bordered
            size="small"
            style={{ width: "100%" }}
            contentStyle={{ textAlign: "right", width: "40%" }}
          >
            <Descriptions.Item label={`${previousElectionRace?.republican} (R)`}>
              {numberFormat.format(resultSummary?.electionResultsBase?.republican)} (
              {numberFormatPercent.format(resultSummary?.electionResultsBase?.perRepublican)})
            </Descriptions.Item>
            <Descriptions.Item label={`${previousElectionRace?.democratic} (D)`}>
              {numberFormat.format(resultSummary?.electionResultsBase?.democratic)} (
              {numberFormatPercent.format(resultSummary?.electionResultsBase?.perDemocratic)})
            </Descriptions.Item>
            <Descriptions.Item label="Vote Margin">
              {RDIndicator(resultSummary?.electionResultsCurrent?.marginDemocratic)}{" "}
              {numberFormat.format(Math.abs(resultSummary?.electionResultsBase?.marginRepublican))} (
              {numberFormatPercent.format(Math.abs(resultSummary?.electionResultsBase?.marginPerRepublican))})
            </Descriptions.Item>
          </Descriptions>
          <br />
        </React.Fragment>
      )}
      {resultSummary.electionResultsComparison && showVoteMode && (
        <React.Fragment>
          <br />
          <br />
          <b>Result by Vote Method</b>
          <br />
          <Table dataSource={resultSummary?.electionResultsBase?.resultsByMode} pagination={false}>
            <Column title="Method" dataIndex="mode" key="mode" />
            <Column title={`${previousElectionRace?.republican} (R)`} dataIndex="republican" key="republican" render={(value) => numberFormat.format(value)} />
            <Column title={`${previousElectionRace?.democratic} (D)`} dataIndex="democratic" key="democratic" render={(value) => numberFormat.format(value)} />
          </Table>
        </React.Fragment>
      )}
      {showDemographics && resultSummary?.demographics?.whitePer > 0 && (
        <Descriptions
          title="Demographics of 2020 Registered Voters "
          column={1}
          bordered
          size="small"
          style={{ width: "100%" }}
          contentStyle={{ textAlign: "right", width: "40%" }}
        >
          <Descriptions.Item label="White (not hispanic)">{numberFormatPercent.format(resultSummary.demographics.whitePer)}</Descriptions.Item>
          <Descriptions.Item label="Black">{numberFormatPercent.format(resultSummary.demographics.blackPer)}</Descriptions.Item>
          <Descriptions.Item label="Asian">{numberFormatPercent.format(resultSummary.demographics.asianPer)}</Descriptions.Item>
          <Descriptions.Item label="Hispanic">{numberFormatPercent.format(resultSummary.demographics.hispanicPer)}</Descriptions.Item>
          <Descriptions.Item label="Unknown">
            {numberFormatPercent.format(resultSummary.demographics.unknownPer + resultSummary.demographics.otherPer)}
          </Descriptions.Item>
        </Descriptions>
      )}

      <br />
      {showAbsentee && (
        <React.Fragment>
          <br />
          <b>Votes by Day</b>
          <VotesByDateChart
            resultSummary={resultSummary}
            absenteeElectionCurrentLabel={absenteeElectionCurrentLabel}
            absenteeElectionBaseLabel={absenteeElectionBaseLabel}
          />
        </React.Fragment>
      )}
      <div style={{ width: "100%", textAlign: "right" }}>
        <small>{/* <i>Last Updated:</i> {process.env.REACT_APP_UPDATE_DATE} */}</small>
      </div>
    </div>
  );
}
