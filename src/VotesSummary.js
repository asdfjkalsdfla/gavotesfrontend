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

export default function VoteSummary({ geoJSONVote, activeSelection, updateCountySelected, updateActiveSelection, isCountyLevel, updateIsCountyLevel, updateUserHasSetLevel, show2016Data, show2018Data }) {
    const [showVoteMode, updateShowVoteMode] = useState(false);
    const [showAbsentee, updateShowAbsentee] = useState(true);
    
    if (!geoJSONVote || !geoJSONVote.properties) return <span>Loading...</span>
    const resultSummary = geoJSONVote.properties;
    

    return (<div>
        <h1>{resultSummary.County ? resultSummary.County : "The State of Georgia"} {resultSummary["County Precinct"] ||
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
                if (resultSummary.County) updateCountySelected(resultSummary.County);
            }}>Precinct Level</Button>
            </div>
                :
                <Button icon={<ZoomOutOutlined />} size="small" onClick={() => {
                    updateIsCountyLevel(true);
                    updateUserHasSetLevel(true);
                    if (resultSummary.County) updateCountySelected(null);
                }}>County Level</Button>}</React.Fragment>}
        <br />
        <br />
        {showAbsentee && (<Descriptions title="Absentee Ballots" column={1} bordered size="small" style={{ width: "100%" }}>
            <Descriptions.Item label="Accepted 2021">{numberFormat.format(resultSummary["TotalVoters2021"])}</Descriptions.Item>
            <Descriptions.Item label="Accepted at Same Date in 2020">{numberFormat.format(resultSummary["TotalVoters2020"])}</Descriptions.Item>
            <Descriptions.Item label="vs. Same Day">{numberFormatRatio.format(resultSummary["turnoutAbsSameDayVs2020"])}</Descriptions.Item>
            <Descriptions.Item label="2020 Total Vote">{numberFormat.format(resultSummary["totalVotes2020"])}</Descriptions.Item>
            <Descriptions.Item label="% of 2020 Vote Total">{numberFormatPercent.format(resultSummary["turnoutVs2020"])}</Descriptions.Item>
            {show2018Data && (<React.Fragment>
                <Descriptions.Item label="2018 Total Vote">{numberFormat.format(resultSummary["totalVotes2018"])}</Descriptions.Item>
                <Descriptions.Item label="% of 2018 Vote Total">{numberFormatPercent.format(resultSummary["turnoutVs2018"])}</Descriptions.Item>
                </React.Fragment>)}
            {show2016Data && (<React.Fragment>
                <Descriptions.Item label="2016 Total Vote">{numberFormat.format(resultSummary["totalVotes2016"])}</Descriptions.Item>
                <Descriptions.Item label="% of 2016 Vote Total">{numberFormatPercent.format(resultSummary["turnoutVs2016"])}</Descriptions.Item>
                <Descriptions.Item label="2018 Vote Total % Change from 2016">{numberFormatPercent.format(resultSummary["turnout2018Vs2016"] - 1)}</Descriptions.Item></React.Fragment>)}
        </Descriptions>)}
        <Descriptions title="2020 Presidential Results (2 party)" column={1} bordered size="small" style={{ width: "100%" }}>
            <Descriptions.Item label="Trump">{numberFormat.format(resultSummary["republican2020"])} ({numberFormatPercent.format(resultSummary["perRepublican2020"])})</Descriptions.Item>
            <Descriptions.Item label="Biden">{numberFormat.format(resultSummary["democratic2020"])} ({numberFormatPercent.format(1 - resultSummary["perRepublican2020"])})</Descriptions.Item>
            <Descriptions.Item label="% Shift to D from 2016">{numberFormatPercent.format(resultSummary["shift2020To2016"])}</Descriptions.Item>
            <Descriptions.Item label="% Shift to D from 2018">{numberFormatPercent.format(resultSummary["shift2020To2018"])}</Descriptions.Item>
        </Descriptions>
        {showVoteMode && (<React.Fragment><br /><br /><b>Result by Vote Method</b><br /><Table dataSource={resultSummary["2020resultsByMode"]} pagination={false}>
            <Column title="Method" dataIndex="mode" key="mode" />
            <Column title="Trump" dataIndex="republican2020" key="republican" render={value => (numberFormat.format(value))} />
            <Column title="Biden" dataIndex="democratic2020" key="democratic" render={value => (numberFormat.format(value))} />
        </Table></React.Fragment>)}
        <br />
        {show2018Data && (<React.Fragment><Descriptions title="2018 Governor Results (2 party)" column={1} bordered size="small" style={{ width: "100%" }}>
            <Descriptions.Item label="Kemp">{numberFormat.format(resultSummary["republican2018"])} ({numberFormatPercent.format(resultSummary["perRepublican2018"])})</Descriptions.Item>
            <Descriptions.Item label="Abrams">{numberFormat.format(resultSummary["democratic2018"])} ({numberFormatPercent.format(1 - resultSummary["perRepublican2018"])})</Descriptions.Item>
            <Descriptions.Item label="% Shift to D from 2016">{numberFormatPercent.format(resultSummary["shift2018To2016"])}</Descriptions.Item>
        </Descriptions><br /></React.Fragment>)}
        {/* {showVoteMode && (<Table dataSource={resultSummary["2018resultsByMode"]} pagination={false}>
            <Column title="Method" dataIndex="mode" key="mode" />
            <Column title="Kemp" dataIndex="2018republican" key="republican" render={value => (numberFormat.format(value))} />
            <Column title="Abrams" dataIndex="2018democratic" key="democratic" render={value => (numberFormat.format(value))} />
        </Table>)} */}
        
        {show2016Data && (<React.Fragment>
            <Descriptions title="2016 Presidential Results (2 party)" column={1} bordered size="small" style={{ width: "100%" }}>
                <Descriptions.Item label="Trump">{numberFormat.format(resultSummary["republican2016"])} ({numberFormatPercent.format(resultSummary["perRepublican2016"])})</Descriptions.Item>
                <Descriptions.Item label="Clinton">{numberFormat.format(resultSummary["democratic2016"])} ({numberFormatPercent.format(1 - resultSummary["perRepublican2016"])})</Descriptions.Item>
            </Descriptions>
            {/* {showVoteMode && (<Table dataSource={resultSummary["2016resultsByMode"]} pagination={false}>
                <Column title="Method" dataIndex="mode" key="mode" />
                <Column title="Trump" dataIndex="2016republican" key="republican" render={value => (numberFormat.format(value))} />
                <Column title="Clinton" dataIndex="2016democratic" key="democratic" render={value => (numberFormat.format(value))} />
            </Table>)} */}
        </React.Fragment>)}
        <br />
        {showAbsentee && (<React.Fragment><b>Votes by Day</b>
            <VotesByDateChart resultSummary={resultSummary} />
        </React.Fragment>)}

        <div style={{ width: "100%", textAlign: "right" }}><small><i>Last Updated:</i> {process.env.REACT_APP_UPDATE_DATE}</small></div>
    </div>);
}