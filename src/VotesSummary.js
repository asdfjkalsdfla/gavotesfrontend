import React, { useState } from "react";
import { Descriptions, Button, Table } from 'antd';
import { DownSquareOutlined, ZoomInOutlined, ZoomOutOutlined, CloseOutlined } from '@ant-design/icons';
import VotesByDateChart from "./VotesByDateChart"

const { Column } = Table;

const numberFormat = new Intl.NumberFormat("en-us");
const numberFormatRatio = new Intl.NumberFormat("en-us", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});
const numberFormatPercent = new Intl.NumberFormat("en-us", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
});
// const numberFormatInteger = new Intl.NumberFormat('en-us', options1);

export default function VoteSummary({ geoJSONVote, activeSelection, updateCountySelected, updateActiveSelection, isCountyLevel, updateIsCountyLevel, updateUserHasSetLevel, electionResultCurrentElection, electionResultCurrentRace, electionResultBaseElection, electionResultBaseRace, absenteeElectionBaseID }) {
    const [showVoteMode, updateShowVoteMode] = useState(true);
    const [showAbsentee, updateShowAbsentee] = useState(false);
    const [showDemographics, updateShowDemographics] = useState(true);


    if (!geoJSONVote || !geoJSONVote.properties) return <span>Loading...</span>
    const resultSummary = geoJSONVote.properties;
    const absenteeElectionBaseLabel = absenteeElectionBaseID;
    return (<div>
        <h1>{resultSummary.CTYNAME ? resultSummary.CTYNAME : "The State of Georgia"} {resultSummary["PRECINCT_N"] ||
            ""}{" "}
            {activeSelection && activeSelection === geoJSONVote && <span style={{ float: "right" }}><Button shape="circle" icon={<CloseOutlined />} onClick={() => {
                updateCountySelected(null);
                updateActiveSelection(null);
            }} /></span>}
        </h1>
        {!resultSummary.PRECINCT_N &&
            <React.Fragment>{isCountyLevel ? <div><Button type="primary" icon={<ZoomInOutlined />} size="small" onClick={() => {
                updateIsCountyLevel(false);
                updateUserHasSetLevel(true);
                if (resultSummary.CTYNAME) updateCountySelected(resultSummary.CTYNAME);
            }}>Precinct Level</Button>
            </div>
                :
                <Button icon={<ZoomOutOutlined />} size="small" onClick={() => {
                    updateIsCountyLevel(true);
                    updateUserHasSetLevel(true);
                    updateCountySelected(null);
                }}>County Level</Button>}</React.Fragment>}
        
        <Descriptions title={`${electionResultCurrentElection?.label} - ${electionResultCurrentRace?.name}`} column={1} bordered size="small" style={{ width: "100%" }}>
            <Descriptions.Item label={`${electionResultCurrentRace?.republican} (R)`}>{numberFormat.format(resultSummary?.electionResultsCurrent?.republican)} ({numberFormatPercent.format(resultSummary?.electionResultsCurrent?.perRepublican)})</Descriptions.Item>
            <Descriptions.Item label={`${electionResultCurrentRace?.democratic} (D)`}>{numberFormat.format(resultSummary?.electionResultsCurrent?.democratic)} ({numberFormatPercent.format(resultSummary?.electionResultsCurrent?.perDemocratic)})</Descriptions.Item>
            <Descriptions.Item label={`R Margin`}>{numberFormat.format(resultSummary?.electionResultsCurrent?.marginRepublican)} ({numberFormatPercent.format(resultSummary?.electionResultsCurrent?.marginPerRepublican)})</Descriptions.Item>
            {resultSummary.electionResultsComparison && (<Descriptions.Item label="Shift to D">{numberFormat.format(resultSummary.electionResultsComparison.voteShiftDemocratic)} ({numberFormatPercent.format(resultSummary.electionResultsComparison?.perShiftDemocratic)})</Descriptions.Item>)}
        </Descriptions>
        {showVoteMode && (<React.Fragment><br /><br /><b>Result by Vote Method</b><br /><Table dataSource={resultSummary?.electionResultsCurrent?.resultsByMode} pagination={false}>
            <Column title="Method" dataIndex="mode" key="mode" />
            <Column title={`${electionResultCurrentRace?.republican} (R)`} dataIndex="republican" key="republican" render={value => (numberFormat.format(value))} />
            <Column title={`${electionResultCurrentRace?.democratic} (D)`} dataIndex="democratic" key="democratic" render={value => (numberFormat.format(value))} />
        </Table></React.Fragment>)}
        {resultSummary.electionResultsComparison && (<React.Fragment><br /><Descriptions title={`${electionResultBaseElection.label} - ${electionResultBaseRace.name}`} column={1} bordered size="small" style={{ width: "100%" }}>
            <Descriptions.Item label={`${electionResultBaseRace?.republican} (R)`}>{numberFormat.format(resultSummary?.electionResultsBase?.republican)} ({numberFormatPercent.format(resultSummary?.electionResultsBase?.perRepublican)})</Descriptions.Item>
            <Descriptions.Item label={`${electionResultBaseRace?.democratic} (D)`}>{numberFormat.format(resultSummary?.electionResultsBase?.democratic)} ({numberFormatPercent.format(resultSummary?.electionResultsBase?.perDemocratic)})</Descriptions.Item>
        </Descriptions><br /></React.Fragment>)}
        {resultSummary.electionResultsComparison && showVoteMode && (<React.Fragment><br /><br /><b>Result by Vote Method</b><br /><Table dataSource={resultSummary?.electionResultsBase?.resultsByMode} pagination={false}>
            <Column title="Method" dataIndex="mode" key="mode" />
            <Column title={`${electionResultBaseRace?.republican} (R)`} dataIndex="republican" key="republican" render={value => (numberFormat.format(value))} />
            <Column title={`${electionResultBaseRace?.democratic} (D)`} dataIndex="democratic" key="democratic" render={value => (numberFormat.format(value))} />
        </Table></React.Fragment>)}
        {showDemographics && resultSummary?.WMREG20 && (<Descriptions title="Demographics of 2020 Registered Voters " column={1} bordered size="small" style={{ width: "100%" }}>
            <Descriptions.Item label="White (not hispanic)">{numberFormatPercent.format((resultSummary?.WMREG20+resultSummary?.WFMREG20+resultSummary?.WUKNREG20)/resultSummary?.REG20)}</Descriptions.Item>
            <Descriptions.Item label="Black">{numberFormatPercent.format((resultSummary?.BLMREG20+resultSummary?.BLFREG20+resultSummary?.BLUKNREG20)/resultSummary?.REG20)}</Descriptions.Item>
            <Descriptions.Item label="Asian">{numberFormatPercent.format((resultSummary?.ASIANMREG2+resultSummary?.ASIANFMREG+resultSummary?.ASIANUKNRE)/resultSummary?.REG20)}</Descriptions.Item>
            <Descriptions.Item label="Hispanic">{numberFormatPercent.format((resultSummary?.HISPMREG20+resultSummary?.HISPFMREG2+resultSummary?.HSPUKNREG2)/resultSummary?.REG20)}</Descriptions.Item>
            <Descriptions.Item label="Unknown">{numberFormatPercent.format((resultSummary?.OTHERMREG2+resultSummary?.OTHERFMREG+resultSummary?.OTHERUKNRE+resultSummary?.UKNMALEREG+resultSummary?.UKNFMREG20+resultSummary?.UKNOWNREG2)/resultSummary?.REG20)}</Descriptions.Item>
        </Descriptions>)}
        {showAbsentee && (<Descriptions title="Absentee Ballots" column={1} bordered size="small" style={{ width: "100%" }}>
            <Descriptions.Item label="Accepted 2021">{numberFormat.format(resultSummary?.absenteeCurrent?.totalAbsenteeVotes)}</Descriptions.Item>
            <Descriptions.Item label={`Accepted at Same Date in ${absenteeElectionBaseLabel}`}>{numberFormat.format(resultSummary?.absenteeBase?.absenteeVotesAsOfCurrentDate)}</Descriptions.Item>
            <Descriptions.Item label="vs. Same Day">{numberFormatRatio.format(resultSummary?.absenteeBallotComparison?.turnoutAbsenteeBallotsSameDay)}</Descriptions.Item>
        </Descriptions>)}
        <br />
        {showAbsentee && (<React.Fragment><br /><b>Votes by Day</b>
            <VotesByDateChart resultSummary={resultSummary} absenteeElectionBaseLabel={absenteeElectionBaseLabel} />
        </React.Fragment>)}
        <div style={{ width: "100%", textAlign: "right" }}><small><i>Last Updated:</i> {process.env.REACT_APP_UPDATE_DATE}</small></div>
    </div>);
}