import { useMemo } from "react";
import { scaleLinear, scaleOrdinal } from "d3-scale";
import { defineChart, lineY } from "@tanstack/charts";
import { colorLegend } from "@tanstack/charts/legend";
import { tooltip } from "@tanstack/charts/tooltip";
import { Chart } from "@tanstack/react-charts";

export default function VotesByDateChart({ resultSummary, absenteeElectionCurrentLabel, absenteeElectionBaseLabel }) {
  const currentSeriesLabel = `${absenteeElectionCurrentLabel} Votes`;
  const baseSeriesLabel = `${absenteeElectionBaseLabel} Votes`;

  const rows = useMemo(() => {
    // Filter out bad data points from SOS data
    const chartPoints = resultSummary.absenteeBase?.votesByDay
      ? resultSummary.absenteeBase.votesByDay.filter((date) => date.DaysFromElection <= 0 && date.DaysFromElection >= -30)
      : [];

    const currentPoints = resultSummary.absenteeCurrent?.votesByDay
      ? resultSummary.absenteeCurrent.votesByDay.filter((date) => date.DaysFromElection <= 0 && date.DaysFromElection >= -30)
      : [];

    // Match up the dates
    const currentElectionMap = new Map();
    currentPoints.forEach((point) => currentElectionMap.set(point.DaysFromElection, point.votesOnDate));

    // Determine latest reported day in the current election so we don't plot false 0s into the future
    const latestCurrentDay =
      currentPoints.length > 0 ? currentPoints[currentPoints.length - 1].DaysFromElection : undefined;

    // long-format rows so both series share one lineY mark
    return chartPoints.flatMap((point) => {
      const entries = [{ DaysFromElection: point.DaysFromElection, series: baseSeriesLabel, votes: point.votesOnDate }];

      if (latestCurrentDay !== undefined && point.DaysFromElection <= latestCurrentDay && currentElectionMap.has(point.DaysFromElection)) {
        entries.unshift({
          DaysFromElection: point.DaysFromElection,
          series: currentSeriesLabel,
          votes: currentElectionMap.get(point.DaysFromElection) || 0,
        });
      }

      return entries;
    });
  }, [resultSummary, currentSeriesLabel, baseSeriesLabel]);

  const definition = useMemo(
    () =>
      defineChart({
        marks: [
          lineY(rows, {
            x: "DaysFromElection",
            y: "votes",
            z: "series",
            color: "series",
          }),
        ],
        scales: {
          x: { scale: scaleLinear, grid: true },
          y: { scale: scaleLinear, nice: true, grid: true },
        },
        color: {
          scale: scaleOrdinal().domain([currentSeriesLabel, baseSeriesLabel]).range(["#8884d8", "#82ca9d"]),
          legend: colorLegend({}),
        },
        focus: "group-x",
        tooltip,
      }),
    [rows, currentSeriesLabel, baseSeriesLabel],
  );

  return <Chart definition={definition} height={200} ariaLabel="Votes by day" />;
}
