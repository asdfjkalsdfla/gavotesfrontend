import React from "react";
import {
    Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ZAxis, Line, ComposedChart, ResponsiveContainer
} from 'recharts';
import "./VotesScatter.css";
import SimpleLinearRegression from 'ml-regression-simple-linear';


export default function VotesScatterPlot({ allElectionData }) {
    const dataForChart = [];
    let regressionLineData = [];
    let regIntercept = 0;
    let regSlope = 0;

    // const intercept = 8.5;
    // const unitLineData = Array.from(Array(200).keys()).map(i => ({ x: i, y: i + intercept }));
    // const constantValueForLine = 78.0; 
    // const constantValuesLineData = Array.from(Array(200).keys()).map(i => ({ x: i, y: constantValueForLine }));

    if (allElectionData) {
        allElectionData.forEach((point, key) => {
            // const x = point?.electionResultsComparison?.perShiftDemocratic * 100;
            // const x = point?.electionResultsCurrent?.perDemocratic * 100;
            const x = point?.electionResultsCurrent?.perRepublican * 100;
            const y = point?.electionResultsBase?.perRepublican * 100;
            const z = point?.electionResultsCurrent?.totalVotes;
            const id = key;
            if (x && y)
                dataForChart.push({ id, x, y, z })
        })

        const regression = new SimpleLinearRegression(dataForChart.map(point => point.x), dataForChart.map(point => point.y));
        regressionLineData = Array.from(Array(200).keys()).map(i => ({ x: i, y: regression.predict(i) }));
        regIntercept = regression.intercept;
        regSlope = regression.slope;

    }
    console.log(dataForChart);
    console.log(`${regSlope} * x + ${regIntercept}`);
    
    return <ResponsiveContainer width="100%" height="100%">
        <ComposedChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="x" type="number" domain={[0, 100]} allowDataOverflow={true} name="shift" unit="%" />
            <YAxis dataKey="y" type="number" domain={[0, 100]} allowDataOverflow={true} name="2022 turnout" unit="%" />
            <Line name="unitLine" type="linear" dataKey="y" stroke="#8884d8" dot={false} data={regressionLineData}  strokeWidth={2} />
            <ZAxis dataKey="z" type="number" range={[0, 250]} name="votes" />
            <Tooltip content={<CustomTooltip />} dataKey="id" cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name="2022 Absentee" fill="#000000" data={dataForChart} label={false} />
        </ComposedChart>
    </ResponsiveContainer>
}

const CustomTooltip = ({ active, payload, label }) => {
    if (active) {
        return (
            <div className="custom-tooltip">
                <p className="intro">{payload[0].payload.id}</p>
                <p className="desc">D %: {payload[0].payload.x}</p>
                <p className="desc">Turnout Change: {payload[0].payload.y}</p>
                <p className="desc">Votes 2022: {payload[0].payload.z}</p>
            </div>
        );
    }

    return null;
};