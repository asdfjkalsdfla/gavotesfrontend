/* eslint-disable no-use-before-define */
/* eslint-disable no-unsafe-optional-chaining */
import React, { useState, useMemo, useRef, useEffect } from "react";
import * as Plot from "@observablehq/plot";
import { useElectionData } from "./ElectionDataProvider.jsx";
import { quantile } from "./Utils.jsx";
import "./VotesScatter.css";

const MIN_ZOOM = 5; // adjust based on your data
const DEFAULT_DOMAIN_X = [0, 100];
const DEFAULT_DOMAIN_Y = [0, 150];
const DEFAULT_ZOOM = { x1: null, x2: null };

export default function VotesScatterPlot({ scatterXAxis, scatterYAxis, isCountyLevel, updateActiveHover, updateActiveSelection }) {
  const ref = useRef();
  const { locationResults } = useElectionData();
  // x axis domain
  const [domainX, updateDomainX] = useState(DEFAULT_DOMAIN_X);
  const [domainY, updateDomainY] = useState(DEFAULT_DOMAIN_Y);

  const data = useMemo(() => {
    // console.log("in update data function");
    const pointsOnChart = [];
    let maxX = -500;
    let minX = 500;

    let xProp;
    switch (scatterXAxis) {
      case "perRBase":
        xProp = (dataPoint) => dataPoint.electionResultsBase?.perRepublican;
        break;
      case "perShiftRepublican":
        xProp = (dataPoint) => dataPoint.electionResultsComparison?.perShiftRepublican;
        break;
      case "perShiftRepublicanEarly":
        xProp = (dataPoint) => dataPoint.electionResultsComparison?.perShiftRepublicanEarly;
        break;
      case "totalVotesRepublicanPercent":
        xProp = (dataPoint) => dataPoint.electionResultsComparison?.totalVotesRepublicanPercent;
        break;
      case "whitePer":
        xProp = (dataPoint) => dataPoint?.demographics?.whitePer;
        break;
      case "blackPer":
        xProp = (dataPoint) => dataPoint?.demographics?.blackPer;
        break;
      case "hispanicPer":
        xProp = (dataPoint) => dataPoint?.demographics?.hispanicPer;
        break;
      default:
        xProp = (dataPoint) => dataPoint.electionResultsCurrent?.perRepublican;
    }

    let yProp;
    switch (scatterYAxis) {
      case "perRBase":
        yProp = (dataPoint) => dataPoint.electionResultsBase?.perRepublican;
        break;
      case "turnoutAbsSameDay":
        // yProp = (dataPoint) => dataPoint?.absenteeBallotComparison?.turnoutAbsenteeBallotsSameDay * 100 -  dataPoint.electionResultsComparison?.perShiftRepublican * 100 * 0.85;
        yProp = (dataPoint) => dataPoint?.absenteeBallotComparison?.turnoutAbsenteeBallotsSameDay;
        break;
      case "turnoutAbsenteeBallots":
        yProp = (dataPoint) => dataPoint?.absenteeBallotComparison?.turnoutAbsenteeBallots;
        break;
      case "perShiftRepublican":
        yProp = (dataPoint) => dataPoint.electionResultsComparison?.perShiftRepublican;
        break;
      case "totalVotesRepublicanPercent":
        yProp = (dataPoint) => dataPoint.electionResultsComparison?.totalVotesRepublicanPercent;
        break;
      case "totalVotesDemocraticPercent":
        yProp = (dataPoint) => dataPoint.electionResultsComparison?.totalVotesDemocraticPercent;
        break;
      case "totalVotesPercent":
        yProp = (dataPoint) => dataPoint.electionResultsComparison?.totalVotesRDPercent;
        break;
      default:
        yProp = (dataPoint) => dataPoint?.electionResultsCurrent?.perRepublican;
    }

    locationResults.forEach((point, key) => {
      const x = xProp(point);
      const y = yProp(point);
      const z = Math.sqrt(point?.electionResultsCurrent?.totalVotes);
      const id = key;
      if (x && y) {
        maxX = maxX < x ? x : maxX;
        minX = minX > x ? x : minX;
        pointsOnChart.push({ id, x, y, z });
      }
    });

    const [xMin, xMax] = quantile(
      pointsOnChart.map((point) => point.x),
      isCountyLevel ? [0, 1] : [0.01, 0.99]
    );
    updateDomainX([xMin * 100, xMax * 100]);

    const [yMin, yMax] = quantile(
      pointsOnChart.map((point) => point.y),
      isCountyLevel ? [0, 1] : [0.01, 0.99]
    );
    updateDomainY([yMin * 100, yMax * 100]);
    // updateDomainY([20, 100]);
    return { pointsOnChart };
  }, [locationResults, isCountyLevel, scatterXAxis, scatterYAxis]);

  const hoverScatterDot = useMemo(
    () =>
      ({ id }) => {
        updateActiveHover(id);
      },
    [updateActiveHover]
  );

  const hoverScatterDotOut = useMemo(
    () =>
      ({ id }) => {
        updateActiveHover(null);
      },
    [updateActiveHover]
  );

  const clickScatterDot = useMemo(
    () =>
      ({ id }) => {
        updateActiveSelection(id);
      },
    [updateActiveSelection]
  );

  useEffect(() => {
    const plot = Plot.plot({
      width: 1300,
      height: 800,
      grid: true,
      x: {
        label: "% 2020",
        percent: true,
        domain: domainX,
      },
      y: {
        label: "% 2022",
        percent: true,
        domain: domainY,
      },
      marks: [
        Plot.linearRegressionY(data.pointsOnChart, { x: "x", y: "y", stroke: "blue" }),
        Plot.dot(data.pointsOnChart, {
          x: "x",
          y: "y",
          r: "z",
          tip: true,
          stroke: "black",
          strokeOpacity: 0.4,
          fill: "black",
          fillOpacity: 0.2,
        }),
        Plot.crosshair(data.pointsOnChart, { x: "x", y: "y" }),
      ],
    });
    ref.current.append(plot);
    return () => plot.remove();
  }, [data, domainX, domainY]);

  return (
    <div style={{ width: "100%", height: "100%" }} data-testid="scatterPlot">
      <div ref={ref} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
