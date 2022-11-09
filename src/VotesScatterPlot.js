import React from "react";
import {
    ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ZAxis
} from 'recharts';
import "./VotesScatter.css";


export default function VotesScatterPlot({ allElectionData }) {
    const dataForChart = [];
    if (allElectionData) {
        allElectionData.forEach((point, key) => {
            // const x = point?.electionResultsComparison?.perShiftDemocratic * 100;
            const x = point?.electionResultsCurrent?.perDemocratic * 100;
            const y = point?.absenteeBallotComparison?.turnoutAbsenteeBallotsSameDay * 100;
            const z = point?.electionResultsCurrent?.totalVotes;
            const id = key;
            if (x && y)
                dataForChart.push({ id, x, y, z })
        })
    }
    console.log(dataForChart);
    const width = window.innerWidth * 0.7;
    return <div style={{ position: "absolute" }}><ScatterChart width={width} height={900}
        margin={{ top: 100, right: 20, bottom: 10, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="x" type="number" domain={[0,100]} allowDataOverflow={true} name="shift" unit="%" />
        <YAxis dataKey="y" type="number" domain={[0, 200]} allowDataOverflow={true} name="2022 turnout" />
        <ZAxis dataKey="z" type="number" range={[0, 100]} name="votes" scale="sqrt" />
        <Tooltip content={<CustomTooltip />} dataKey="id" cursor={{ strokeDasharray: '3 3' }} />
        <Scatter name="2022 Absentee" data={dataForChart} fill="#8884d8" />
    </ScatterChart>
    </div>
}

const CustomTooltip = ({ active, payload, label }) => {
    if (active) {
        return (
            <div className="custom-tooltip">
                <p className="intro">{payload[0].payload.id}</p>
                <p className="desc">Shift R to D: {payload[0].payload.x}</p>
                <p className="desc">2022 Abs Turnout: {payload[0].payload.y}</p>
                <p className="desc">Votes 2020: {payload[0].payload.z}</p>
            </div>
        );
    }

    return null;
};