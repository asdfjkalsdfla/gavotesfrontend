import { useMemo, useState } from "react";
import { scaleLinear, scaleOrdinal } from "d3-scale";
import { defineChart, lineY } from "@tanstack/charts";
import { colorLegend } from "@tanstack/charts/legend";
import { tooltip } from "@tanstack/charts/tooltip";
import { Chart } from "@tanstack/react-charts";
import { Button } from "@/components/ui/button";
import { useSummaryPreferences } from "./PreferenceContext.tsx";

export default function VotesByDateChart({
  resultSummary,
  absenteeElectionCurrentLabel,
  absenteeElectionBaseLabel,
  isCumulative: propIsCumulative,
  onCumulativeChange,
}) {
  const preferences = useSummaryPreferences();
  const [localIsCumulative, setLocalIsCumulative] = useState(false);

  const isCumulative = propIsCumulative !== undefined ? propIsCumulative : (preferences?.showCumulativeVotes ?? localIsCumulative);

  const setIsCumulative = (val) => {
    if (onCumulativeChange) {
      onCumulativeChange(val);
    }
    if (preferences?.updateShowCumulativeVotes) {
      preferences.updateShowCumulativeVotes(val);
    }
    setLocalIsCumulative(val);
  };

  const currentSeriesLabel = `${absenteeElectionCurrentLabel} Votes`;
  const baseSeriesLabel = `${absenteeElectionBaseLabel} Votes`;

  const rows = useMemo(() => {
    // Filter out bad data points from SOS data
    const chartPoints = resultSummary?.absenteeBase?.votesByDay
      ? resultSummary.absenteeBase.votesByDay.filter((date) => date.DaysFromElection <= 0 && date.DaysFromElection >= -30)
      : [];

    const currentPoints = resultSummary?.absenteeCurrent?.votesByDay
      ? resultSummary.absenteeCurrent.votesByDay.filter((date) => date.DaysFromElection <= 0 && date.DaysFromElection >= -30)
      : [];

    // Match up the dates
    const currentElectionMap = new Map();
    currentPoints.forEach((point) => {
      const votes = isCumulative ? point.votesToDate : point.votesOnDate;
      currentElectionMap.set(point.DaysFromElection, votes);
    });

    // Determine latest reported day in the current election so we don't plot false 0s into the future
    const latestCurrentDay =
      resultSummary?.absenteeBallotComparison?.targetDaysOut ??
      (currentPoints.length > 0 ? currentPoints[currentPoints.length - 1].DaysFromElection : undefined);

    // long-format rows so both series share one lineY mark
    return chartPoints.flatMap((point) => {
      const baseVotes = isCumulative ? point.votesToDate : point.votesOnDate;
      const entries = [{ DaysFromElection: point.DaysFromElection, series: baseSeriesLabel, votes: baseVotes ?? 0 }];

      if (latestCurrentDay !== undefined && point.DaysFromElection <= latestCurrentDay && currentElectionMap.has(point.DaysFromElection)) {
        entries.unshift({
          DaysFromElection: point.DaysFromElection,
          series: currentSeriesLabel,
          votes: currentElectionMap.get(point.DaysFromElection) ?? 0,
        });
      }

      return entries;
    });
  }, [resultSummary, currentSeriesLabel, baseSeriesLabel, isCumulative]);

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

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">{isCumulative ? "Cumulative votes" : "Daily votes"}</span>
        <div className="flex gap-1" role="group" aria-label="Vote count display mode">
          <Button
            type="button"
            variant={!isCumulative ? "default" : "outline"}
            size="sm"
            className="h-7 px-2.5 text-xs"
            onClick={() => setIsCumulative(false)}
            aria-pressed={!isCumulative}
          >
            Exact
          </Button>
          <Button
            type="button"
            variant={isCumulative ? "default" : "outline"}
            size="sm"
            className="h-7 px-2.5 text-xs"
            onClick={() => setIsCumulative(true)}
            aria-pressed={isCumulative}
          >
            Cumulative
          </Button>
        </div>
      </div>
      <Chart definition={definition} height={200} ariaLabel={isCumulative ? "Cumulative votes by day" : "Votes by day"} />
    </div>
  );
}
