import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

export default function VotesByDateChart({ resultSummary, absenteeElectionCurrentLabel, absenteeElectionBaseLabel }) {
  // console.log(resultSummary);
  // Filter out bad data points from SOS data
  const chartPoints = resultSummary.absenteeBase?.votesByDay
    ? resultSummary.absenteeBase.votesByDay.filter((date) => date.DaysFromElection <= 0 && date.DaysFromElection > -42)
    : [];

  // match up the dates
  const currentElectionMap = new Map();
  if (resultSummary.absenteeCurrent?.votesByDay)
    resultSummary.absenteeCurrent.votesByDay.map((point) => currentElectionMap.set(point.DaysFromElection, point.votesOnDate));

  // Create new objects with the additional property instead of mutating existing ones
  const chartData = chartPoints.map((point) => ({
    ...point,
    currentElectionVotesOnDate: currentElectionMap.get(point.DaysFromElection) || 0,
  }));

  const width = Math.max(window.innerWidth * 0.25, 300) - 25;
  return (
    <LineChart
      width={width}
      height={200}
      data={chartData}
      margin={{
        top: 5,
        right: 30,
        left: 20,
        bottom: 5,
      }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="DaysFromElection" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line name={`${absenteeElectionCurrentLabel} Votes`} type="linear" dataKey="currentElectionVotesOnDate" stroke="#8884d8" activeDot={{ r: 8 }} />
      <Line name={`${absenteeElectionBaseLabel} Votes`} type="linear" dataKey="votesOnDate" stroke="#82ca9d" activeDot={{ r: 8 }} />
    </LineChart>
  );
}
