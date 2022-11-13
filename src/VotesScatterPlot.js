import React, { useMemo } from "react";
import {
    Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ZAxis, Line, ComposedChart, ResponsiveContainer
} from 'recharts';
import "./VotesScatter.css";
import SimpleLinearRegression from 'ml-regression-simple-linear';


export default function VotesScatterPlot({ allElectionData, isCountyLevel, updateActiveHover, updateActiveSelection }) {
    const hoverScatterDot = useMemo(() => {
        return ({ id }) => {
            updateActiveHover(id);
        }
    }, [updateActiveHover]);

    const hoverScatterDotOut = useMemo(() => {
        console.log(`in update hover function`);
        return ({ id }) => {
            updateActiveHover(null);
        }
    }, [updateActiveHover]);

    const clickScatterDot = useMemo(() => {
        return ({ id }) => {
            updateActiveSelection(id);
        }
    }, [updateActiveSelection]);

    const data = useMemo(() => {
        console.log(`in update data function`);
        const pointsOnChart = [];

        allElectionData.forEach((point, key) => {
            // const x = point?.electionResultsComparison?.perShiftDemocratic * 100;
            // const x = point?.electionResultsCurrent?.perDemocratic * 100;
            const x = point?.electionResultsCurrent?.perRepublican * 100;
            const y = point?.electionResultsBase?.perRepublican * 100;
            const z = point?.electionResultsCurrent?.totalVotes;
            const id = key;
            if (x && y)
                pointsOnChart.push({ id, x, y, z })
        })

        const regression = new SimpleLinearRegression(pointsOnChart.map(point => point.x), pointsOnChart.map(point => point.y));
        const regressionLineData = Array.from(Array(200).keys()).map(i => ({ x: i, y: regression.predict(i) }));
        const regIntercept = regression.intercept;
        const regSlope = regression.slope;
        return { pointsOnChart, regressionLineData, regIntercept, regSlope}
    }, [allElectionData]);
 
    const range= useMemo(() => {
        return [0, isCountyLevel ? 500 : 150]
    },[isCountyLevel]);

    const domain= useMemo(() => {
        return [0, 100]
    },[]);

    return <ResponsiveContainer width="100%" height="100%">
        <ComposedChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="x" type="number" domain={domain} allowDataOverflow={true} name="shift" unit="%" />
            <YAxis dataKey="y" type="number" domain={domain} allowDataOverflow={true} name="2022 turnout" unit="%" />
            <Line name="unitLine" type="linear" dataKey="y" stroke="#8884d8" dot={false} data={data?.regressionLineData} strokeWidth={2} />
            <ZAxis dataKey="z" type="number" range={range} name="votes" />
            {/* <Tooltip content={<CustomTooltip />} dataKey="id" cursor={{ strokeDasharray: '3 3' }} /> */}
            <Scatter name="2022 Absentee" fill="#000000" fillOpacity={0.5} data={data?.pointsOnChart} onMouseEnter={hoverScatterDot} onMouseLeave={hoverScatterDotOut} onClick={clickScatterDot} />
        </ComposedChart>
    </ResponsiveContainer>
}

const CustomTooltip = ({ active, payload }) => {
    if (!payload || payload.size === 0)
        return (<></>);
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
