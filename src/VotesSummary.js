import React, { useState } from "react";
import { Descriptions, Button, Table } from 'antd';
import { DownSquareOutlined, ZoomInOutlined, ZoomOutOutlined, CloseOutlined } from '@ant-design/icons';
import VotesByDateChart from "./VotesByDateChart"

const { Column } = Table;

const numberFormat = new Intl.NumberFormat("en-us");
const numberFormatRatio = new Intl.NumberFormat("en-us", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
});
const numberFormatPercent = new Intl.NumberFormat("en-us", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
});
// const numberFormatInteger = new Intl.NumberFormat('en-us', options1);

export default function VoteSummary({ geoJSONVote, activeSelection, updateCountySelected, updateActiveSelection, isCountyLevel, updateIsCountyLevel, updateUserHasSetLevel, show2016Data }) {
    const [showVoteMode, updateShowVoteMode] = useState(false);
    const [showAbsentee, updateShowAbsentee] = useState(false);
    
    if (!geoJSONVote || !geoJSONVote.properties) return <span>Loading...</span>
    const resultSummary = geoJSONVote.properties;
    

    return (<div>
        <h1>{resultSummary.CTYNAME ? resultSummary.CTYNAME : "The State of Georgia"} {resultSummary.PRECINCT_N ||
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
                    if (resultSummary.CTYNAME) updateCountySelected(null);
                }}>County Level</Button>}</React.Fragment>}
        <br />
        <br />
        {showAbsentee && (<Descriptions title="Absentee Ballots" column={1} bordered size="small" style={{ width: "100%" }}>
            <Descriptions.Item label="Accepted 2020">{numberFormat.format(resultSummary["2020TotalVoters"])}</Descriptions.Item>
            <Descriptions.Item label="Accepted at Same Date in 2018">{numberFormat.format(resultSummary["2018TotalVoters"])}</Descriptions.Item>
            <Descriptions.Item label="vs. Same Day">{numberFormatRatio.format(resultSummary["turnoutAbsSameDayVs2018"])}</Descriptions.Item>
            <Descriptions.Item label="2018 Total Vote">{numberFormat.format(resultSummary["totalVotes2018"])}</Descriptions.Item>
            <Descriptions.Item label="% of 2018 Vote Total">{numberFormatPercent.format(resultSummary["turnoutVs2018"])}</Descriptions.Item>
            {show2016Data && (<React.Fragment>
                <Descriptions.Item label="2016 Total Vote">{numberFormat.format(resultSummary["totalVotes2016"])}</Descriptions.Item>
                <Descriptions.Item label="% of 2016 Vote Total">{numberFormatPercent.format(resultSummary["turnoutVs2016"])}</Descriptions.Item>
                <Descriptions.Item label="2018 Vote Total % Change from 2016">{numberFormatPercent.format(resultSummary["turnout2018Vs2016"] - 1)}</Descriptions.Item></React.Fragment>)}
        </Descriptions>)}
        <Descriptions title="2020 Presidential Results (2 party)" column={1} bordered size="small" style={{ width: "100%" }}>
            <Descriptions.Item label="Trump">{numberFormat.format(resultSummary["2020republican"])} ({numberFormatPercent.format(resultSummary["perRepublican2020"])})</Descriptions.Item>
            <Descriptions.Item label="Biden">{numberFormat.format(resultSummary["2020democratic"])} ({numberFormatPercent.format(1 - resultSummary["perRepublican2020"])})</Descriptions.Item>
            <Descriptions.Item label="% of 2018 Vote Total">{numberFormatPercent.format(resultSummary["turnoutVs2018"])}</Descriptions.Item>
            <Descriptions.Item label="% Shift to D from 2016">{numberFormatPercent.format(resultSummary["shift2020To2016"])}</Descriptions.Item>
            <Descriptions.Item label="% Shift to D from 2018">{numberFormatPercent.format(resultSummary["shift2020To2018"])}</Descriptions.Item>
        </Descriptions>
        {showVoteMode && (<React.Fragment><br /><br /><b>Result by Vote Method</b><br /><Table dataSource={resultSummary["2020resultsByMode"]} pagination={false}>
            <Column title="Method" dataIndex="mode" key="mode" />
            <Column title="Trump" dataIndex="2020republican" key="republican" render={value => (numberFormat.format(value))} />
            <Column title="Biden" dataIndex="2020democratic" key="democratic" render={value => (numberFormat.format(value))} />
        </Table></React.Fragment>)}
        <br />
        <Descriptions title="2018 Governor Results (2 party)" column={1} bordered size="small" style={{ width: "100%" }}>
            <Descriptions.Item label="Kemp">{numberFormat.format(resultSummary["2018republican"])} ({numberFormatPercent.format(resultSummary["perRepublican2018"])})</Descriptions.Item>
            <Descriptions.Item label="Abrams">{numberFormat.format(resultSummary["2018democratic"])} ({numberFormatPercent.format(1 - resultSummary["perRepublican2018"])})</Descriptions.Item>
            <Descriptions.Item label="% Shift to D from 2016">{numberFormatPercent.format(resultSummary["shift2018To2016"])}</Descriptions.Item>
        </Descriptions>
        {/* {showVoteMode && (<Table dataSource={resultSummary["2018resultsByMode"]} pagination={false}>
            <Column title="Method" dataIndex="mode" key="mode" />
            <Column title="Kemp" dataIndex="2018republican" key="republican" render={value => (numberFormat.format(value))} />
            <Column title="Abrams" dataIndex="2018democratic" key="democratic" render={value => (numberFormat.format(value))} />
        </Table>)} */}
        <br />
        {show2016Data && (<React.Fragment>
            <Descriptions title="2016 Presidential Results (2 party)" column={1} bordered size="small" style={{ width: "100%" }}>
                <Descriptions.Item label="Trump">{numberFormat.format(resultSummary["2016republican"])} ({numberFormatPercent.format(resultSummary["perRepublican2016"])})</Descriptions.Item>
                <Descriptions.Item label="Clinton">{numberFormat.format(resultSummary["2016democratic"])} ({numberFormatPercent.format(1 - resultSummary["perRepublican2016"])})</Descriptions.Item>
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