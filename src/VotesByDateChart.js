import React from "react";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';


export default function VotesByDateChart({ resultSummary }) {
    const electionDate = new Date('1/5/2021');
    const todayDate = new Date();
    const diffTime = todayDate - electionDate;
    const diffDays = Math.min(-1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) - 1);
    // Filter out bad data points from SOS data
    let chartPoints = resultSummary["votes2021"] ? resultSummary["votes2021"].filter(date => date.DaysFromElection <= diffDays && date.DaysFromElection > -42) : [];

    // match up the 2018 data
    const lastElectionResults = new Map();
    if (resultSummary["votes2020"])
        resultSummary["votes2020"].map(point => lastElectionResults.set(point.DaysFromElection, point.votesOnDate))
    chartPoints.forEach((point) => {
        if (lastElectionResults.has(point.DaysFromElection)) {
            point.lastElectionVotesOnDate = lastElectionResults.get(point.DaysFromElection)
        }
    })
    const width = Math.max(window.innerWidth * 0.25, 300) - 25;
    return <LineChart
        width={width}
        height={200}
        data={chartPoints}
        margin={{
            top: 5, right: 30, left: 20, bottom: 5,
        }}
    >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="DaysFromElection" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line name="2020 Votes" type="linear" dataKey="lastElectionVotesOnDate" stroke="#8884d8" activeDot={{ r: 8 }} />
        <Line name="2021 Votes" type="linear" dataKey="votesOnDate" stroke="#82ca9d" activeDot={{ r: 8 }} />
    </LineChart>
}
