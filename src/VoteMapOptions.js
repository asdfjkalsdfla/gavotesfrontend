import React from "react";
import { Select, Button, Checkbox } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
const { Option } = Select;


export default function VoteMapOptions({ updateElevationApproach, updateShowOptions, elevationApproach, updateColorApproach, colorApproach, elections, absenteeCurrent, updateAbsenteeCurrent, absenteeBase, updateAbsenteeBase, electionResultBase, updateElectionResultBase, electionResultCurrent, updateElectionResultCurrent }) {

    return <React.Fragment><h1>Options
        {updateShowOptions && <span style={{ float: "right" }}><Button shape="circle" icon={<CloseOutlined />} onClick={() => {
            updateShowOptions(false);
        }} /></span>}</h1>
        <div><b>Map Options:</b></div>
        <div>Elevation Approach</div>
        <Select
            onChange={(value) => { updateElevationApproach(value) }}
            style={{ width: 300 }}
            placeholder="Elevation Based On"
            value={elevationApproach}
        >
            <Option value="turnoutAbsSameDay">Absentee Votes @ Same Day</Option>
            <Option value="turnoutAbs">% of Total Votes</Option>
            <Option value="votes">Current Votes</Option>
            <Option value="none">None</Option>
        </Select>
        <br />
        <div>Color Approach</div>
        <Select
            onChange={(value) => { updateColorApproach(value) }}
            style={{ width: 300 }}
            placeholder="Color Based On"
            value={colorApproach}
            virtual={false}
        >
            <Option value="electionResultPerRepublicanPer">Election Results</Option>
            <Option value="electionResultVoteMargin">Election Margin</Option>
            <Option value="electionResultPerRepublicanPerShift">Shift Election Result %</Option>
            <Option value="electionResultVoteShift">Shift Election Result #</Option>
            <Option value="turnoutAbsSameDay">Absentee Votes @ Same Day</Option>
            <Option value="turnoutAbs">% of Total Votes</Option>
        </Select>
        <br /><br />
        <div><b>Absentee Ballots:</b></div>
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
        Compared to<br /><Select
            style={{ width: 300 }}
            placeholder="Base Election"
            virtual={true}
            value={absenteeBase}
            onChange={(value) => { updateAbsenteeBase(value) }}
        >
            {elections.filter(election => !election.isCurrentElection).map(election => <Option key={election.name} value={election.name}>{election.label}</Option>)}
        </Select>
        <br /><br />
        <div><b>Election Results:</b></div>
        Base<br /><Select
            style={{ width: 300 }}
            placeholder="Base Race"
            virtual={true}
            value={electionResultCurrent}
            onChange={(value) => { updateElectionResultCurrent(value) }}
        >
            {elections.filter(election => !election.isCurrentElection).map(election => election.races.map(race => <Option key={`${election.name}##${race.name}`} value={`${election.name}##${race.name}`}>{`${election.label} - ${race.name}`}</Option>))}
        </Select>
        <br />
        Compared to<br /><Select
            style={{ width: 300 }}
            placeholder="Compared To"
            virtual={true}
            value={electionResultBase}
            onChange={(value) => { updateElectionResultBase(value) }}
        >
            {elections.filter(election => !election.isCurrentElection).map(election => election.races.map(race => <Option key={`${election.name}##${race.name}`} value={`${election.name}##${race.name}`}>{`${election.label} - ${race.name}`}</Option>))}
        </Select>
        <br /><br /></React.Fragment>
} 