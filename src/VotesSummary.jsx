import React from "react";
import { Descriptions, Button, Table } from "antd";
import { ZoomInOutlined, ZoomOutOutlined, CloseOutlined } from "@ant-design/icons";
import VotesByDateChart from "./VotesByDateChart";

const { Column } = Table;

const numberFormat = new Intl.NumberFormat("en-us", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
const numberFormatRatio = new Intl.NumberFormat("en-us", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const numberFormatPercent = new Intl.NumberFormat("en-us", {
  style: "percent",
  minimumIntegerDigits: 2,
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
// const numberFormatInteger = new Intl.NumberFormat('en-us', options1);

export default function VoteSummary({
  geoJSONVote,
  activeSelection,
  updateCountySelected,
  updateActiveSelection,
  isCountyLevel,
  updateIsCountyLevel,
  updateUserHasSetLevel,
  electionResultCurrentElection,
  electionResultCurrentRace,
  electionResultBaseElection,
  electionResultBaseRace,
  absenteeElectionBaseID,
  absenteeElectionCurrentID,
  showVoteMode,
  showDemographics,
  showAbsentee,
}) {
  if (!geoJSONVote || !geoJSONVote.properties) return <span>Loading...</span>;
  const resultSummary = geoJSONVote.properties;
  const absenteeElectionBaseLabel = absenteeElectionBaseID;
  const absenteeElectionCurrentLabel = absenteeElectionCurrentID;
  return (
    <div>
      <h1>
        {resultSummary.CTYNAME ? resultSummary.CTYNAME : "The State of Georgia"} {resultSummary["PRECINCT_N"] || ""}{" "}
        {activeSelection && (activeSelection?.properties?.id === geoJSONVote.properties.id || activeSelection === geoJSONVote.properties.id) && (
          <span style={{ float: "right" }}>
            <Button
              shape="circle"
              icon={<CloseOutlined />}
              onClick={() => {
                updateCountySelected(null);
                updateActiveSelection(null);
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
                  if (resultSummary.CTYNAME) updateCountySelected(resultSummary.CTYNAME);
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
                updateCountySelected(null);
              }}
            >
              County Level
            </Button>
          )}
        </React.Fragment>
      )}

      <Descriptions
        title={`${electionResultCurrentElection?.label} - ${electionResultCurrentRace?.name}`}
        column={1}
        bordered
        size="small"
        style={{ width: "100%" }}
        contentStyle={{ textAlign: "right", width: "40%" }}
      >
        <Descriptions.Item label={`${electionResultCurrentRace?.republican} (R)`}>
          {numberFormat.format(resultSummary?.electionResultsCurrent?.republican)} (
          {numberFormatPercent.format(resultSummary?.electionResultsCurrent?.perRepublican)})
        </Descriptions.Item>
        <Descriptions.Item label={`${electionResultCurrentRace?.democratic} (D)`}>
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
            <Column
              title={`${electionResultCurrentRace?.republican} (R)`}
              dataIndex="republican"
              key="republican"
              render={(value) => numberFormat.format(value)}
            />
            <Column
              title={`${electionResultCurrentRace?.democratic} (D)`}
              dataIndex="democratic"
              key="democratic"
              render={(value) => numberFormat.format(value)}
            />
          </Table>
        </React.Fragment>
      )}
      {resultSummary.electionResultsComparison && (
        <React.Fragment>
          <br />
          <Descriptions
            title={`${electionResultBaseElection.label} - ${electionResultBaseRace.name}`}
            column={1}
            bordered
            size="small"
            style={{ width: "100%" }}
            contentStyle={{ textAlign: "right", width: "40%" }}
          >
            <Descriptions.Item label={`${electionResultBaseRace?.republican} (R)`}>
              {numberFormat.format(resultSummary?.electionResultsBase?.republican)} (
              {numberFormatPercent.format(resultSummary?.electionResultsBase?.perRepublican)})
            </Descriptions.Item>
            <Descriptions.Item label={`${electionResultBaseRace?.democratic} (D)`}>
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
            <Column
              title={`${electionResultBaseRace?.republican} (R)`}
              dataIndex="republican"
              key="republican"
              render={(value) => numberFormat.format(value)}
            />
            <Column
              title={`${electionResultBaseRace?.democratic} (D)`}
              dataIndex="democratic"
              key="democratic"
              render={(value) => numberFormat.format(value)}
            />
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
      {showAbsentee && (
        <Descriptions title="Absentee Ballots" column={1} bordered size="small" style={{ width: "100%" }} contentStyle={{ textAlign: "right", width: "40%" }}>
          <Descriptions.Item label={`Accepted  ${absenteeElectionCurrentLabel}`}>{numberFormat.format(resultSummary?.absenteeCurrent?.totalAbsenteeVotes)}</Descriptions.Item>
          <Descriptions.Item label={`Accepted at Same Date in ${absenteeElectionBaseLabel}`}>
            {numberFormat.format(resultSummary?.absenteeBase?.absenteeVotesAsOfCurrentDate)}
          </Descriptions.Item>
          <Descriptions.Item label="vs. Same Day">
            {numberFormatRatio.format(resultSummary?.absenteeBallotComparison?.turnoutAbsenteeBallotsSameDay)}
          </Descriptions.Item>
        </Descriptions>
      )}
      <br />
      {showAbsentee && (
        <React.Fragment>
          <br />
          <b>Votes by Day</b>
          <VotesByDateChart resultSummary={resultSummary} absenteeElectionCurrentLabel={absenteeElectionCurrentLabel} absenteeElectionBaseLabel={absenteeElectionBaseLabel} />
        </React.Fragment>
      )}
      <div style={{ width: "100%", textAlign: "right" }}>
        <small>
          {/* <i>Last Updated:</i> {process.env.REACT_APP_UPDATE_DATE} */}
        </small>
      </div>
    </div>
  );
}

const RDIndicator = (value) => {
  return value > 0 ? <span style={{ color: "rgb(102, 134, 181)" }}>D+</span> : <span style={{ color: "#d09897" }}>R+</span>;
};
