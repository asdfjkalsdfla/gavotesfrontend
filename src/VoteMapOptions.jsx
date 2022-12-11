import React, { startTransition } from "react";
import { Select, Button, Checkbox, Radio } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { useElectionData } from "./ElectionDataProvider";
const { Option } = Select;

export default function VoteMapOptions({
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
  updateDisplayType,
  scatterXAxis,
  updateScatterXAxis,
  scatterYAxis,
  updateScatterYAxis,
}) {
  const { elections } = useElectionData();

  return (
    <React.Fragment>
      <h1>
        Options
        {updateShowOptions && (
          <span style={{ float: "right" }}>
            <Button
              shape="circle"
              icon={<CloseOutlined />}
              onClick={() => {
                updateShowOptions(false);
              }}
            />
          </span>
        )}
      </h1>
      <div>
        <b>Main Display:</b>
      </div>
      <div>
        Type
        <br />
        <Radio.Group
          value={displayType}
          onChange={({ target: { value } }) => {
            startTransition(() => {
              updateDisplayType(value);
            });
          }}
        >
          <Radio.Button value="map">Map</Radio.Button>
          <Radio.Button value="scatter">Scatter Plot</Radio.Button>
          <Radio.Button value="table">Table</Radio.Button>
        </Radio.Group>
      </div>
      {displayType === "scatter" && (
        <>
          <div>X Axis</div>
          <Select
            onChange={(value) => {
              updateScatterXAxis(value);
            }}
            style={{ width: 300 }}
            value={scatterXAxis}
            virtual={false}
          >
            <Option value="electionResultPerRepublicanPer">Current Election Vote Share</Option>
            <Option value="perRBase">Previous Election Vote Share</Option>
            <Option value="perShiftRepublican">Vote Swing (Shift in R/D %)</Option>
            {/* <Option value="perShiftRepublicanEarly">Shift in Early Vote R/D %</Option> */}
            {/* <Option value="totalVotesRepublicanPercent">Change in R Votes</Option> */}
            <Option value="whitePer">White %</Option>
            <Option value="blackPer">Black %</Option>
            <Option value="hispanicPer">Hispanic %</Option>
          </Select>
          <br />
          <div>Y Axis</div>
          <Select
            onChange={(value) => {
              updateScatterYAxis(value);
            }}
            style={{ width: 300 }}
            value={scatterYAxis}
            virtual={false}
          >
            <Option value="electionResultPerRepublicanPer">Current Election Vote Share</Option>
            <Option value="perRBase">Previous Election Vote Share</Option>
            <Option value="perShiftRepublican">Vote Swing (Shift in R/D %)</Option>
            <Option value="totalVotesPercent">% of Previous Turnout</Option>
            <Option value="turnoutAbsSameDay">Absentee Votes @ Same Day</Option>
            <Option value="turnoutAbsenteeBallots">% of Absentee Votes</Option>
          </Select>
          <br />
        </>
      )}
      {displayType === "map" && (
        <>
          <div>Color Approach</div>
          <Select
            onChange={(value) => {
              updateColorApproach(value);
            }}
            style={{ width: 300 }}
            placeholder="Color Based On"
            value={colorApproach}
            virtual={false}
          >
            <Option value="electionResultPerRepublicanPer">Vote Share</Option>
            <Option value="electionResultVoteMargin">Vote Margin</Option>
            <Option value="electionResultPerRepublicanPerShift">Vote Swing (Shift in R/D %)</Option>
            <Option value="totalVotesPercent">% of Previous Turnout</Option>
            {/* <Option value="electionResultVoteShift">Shift in Vote Margin</Option> */}
            <Option value="electionResultVoteShiftNormalized">Shift in Vote Margin (normalized)</Option>
            <Option value="blackPer">Black %</Option>
            <Option value="hispanicPer">Hispanic %</Option>
            <Option value="turnoutAbsSameDay">Absentee Votes @ Same Day</Option>
            {/* <Option value="turnoutAbs">% of Total Votes</Option> */}
          </Select>
          <br />
          <div>Elevation Approach</div>
          <Select
            onChange={(value) => {
              updateElevationApproach(value);
            }}
            style={{ width: 300 }}
            placeholder="Elevation Based On"
            value={elevationApproach}
          >
            <Option value="turnoutAbsSameDay">Absentee Votes @ Same Day</Option>
            <Option value="turnoutAbs">% of Total Votes</Option>
            <Option value="votes">Current Votes</Option>
            <Option value="none">None</Option>
          </Select>
        </>
      )}
      <br />
      <br />
      <div>
        <b>Election Results:</b>
      </div>
      Base <br />
      <Select
        style={{ width: 300 }}
        placeholder="Base Race"
        virtual={true}
        value={electionResultCurrent}
        onChange={(value) => {
          updateElectionResultCurrent(value);
        }}
      >
        {elections
          .filter((election) => !election.isCurrentElection)
          .map((election) =>
            election.races.map((race) => (
              <Option key={`${election.name}||${race.name}`} value={`${election.name}||${race.name}`}>{`${election.label} - ${race.name}`}</Option>
            ))
          )}
      </Select>
      <br />
      Compared to <br />
      <Select
        style={{ width: 300 }}
        placeholder="Compared To"
        virtual={true}
        value={electionResultBase}
        onChange={(value) => {
          updateElectionResultBase(value);
        }}
      >
        {elections
          .filter((election) => !election.isCurrentElection)
          .map((election) =>
            election.races.map((race) => (
              <Option key={`${election.name}||${race.name}`} value={`${election.name}||${race.name}`}>{`${election.label} - ${race.name}`}</Option>
            ))
          )}
      </Select>
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
            {elections.map(election => <Option key={election.name} value={election.name}>{election.label}</Option>)}
        </Select>
        <br /> */}
          Compared to <br />
          <Select
            style={{ width: 300 }}
            placeholder="Base Election"
            virtual={true}
            value={absenteeBase}
            onChange={(value) => {
              updateAbsenteeBase(value);
            }}
          >
            {elections
              .filter((election) => !election.isCurrentElection)
              .map((election) => (
                <Option key={election.name} value={election.name}>
                  {election.label}
                </Option>
              ))}
          </Select>
        </>
      )}
      <br />
      <br />
      <div>
        <b>Geography Data:</b>
      </div>
      <Checkbox
        onChange={(e) => {
          updateShowAbsentee(e.target.checked);
        }}
        checked={showAbsentee}
      >
        Absentee Ballots
      </Checkbox>
      <br />
      <Checkbox
        onChange={(e) => {
          updateShowVoteMode(e.target.checked);
        }}
        checked={showVoteMode}
      >
        Votes by Mode
      </Checkbox>
      <br />
      <Checkbox
        onChange={(e) => {
          updateShowDemographics(e.target.checked);
        }}
        checked={showDemographics}
      >
        Demographics
      </Checkbox>
    </React.Fragment>
  );
}
