import React, { useState, useMemo, useTransition } from "react";
import { Scatter, XAxis, YAxis, CartesianGrid, ZAxis, Line, ComposedChart, ResponsiveContainer, ReferenceArea } from "recharts";
import { SimpleLinearRegression } from "ml-regression-simple-linear";
import { useElectionData } from "../../context/ElectionDataProvider.jsx";
import { useScatterPreference } from "./PreferenceContext.tsx";
import { quantile } from "../..//Utils.jsx";
import { DATA_PROPERTY_ACCESSORS } from "../../utils/dataTransformers.js";
import "./VotesScatter.css";

const MIN_ZOOM = 5; // adjust based on your data
const DEFAULT_DOMAIN_X = ["dataMin", "dataMax"];
const DEFAULT_DOMAIN_Y = [0, 150];
const DEFAULT_ZOOM = { x1: null, x2: null };

const tickFormatter = (value) => value.toFixed(2);

export default function VotesScatterPlot({ isCountyLevel, updateActiveHover, updateActiveSelection }) {
  const { locationResults } = useElectionData();
  const { scatterXAxis, scatterYAxis } = useScatterPreference();
  const [, startTransition] = useTransition();
  // x axis domain
  const [domainX, updateDomainX] = useState(DEFAULT_DOMAIN_X);
  const [domainY, updateDomainY] = useState(DEFAULT_DOMAIN_Y);

  const data = useMemo(() => {
    const pointsOnChart = [];
    let maxX = -500;
    let minX = 500;

    // Use the centralized property accessors
    const xProp = DATA_PROPERTY_ACCESSORS[scatterXAxis] || DATA_PROPERTY_ACCESSORS.perRepublican;
    const yProp = DATA_PROPERTY_ACCESSORS[scatterYAxis] || DATA_PROPERTY_ACCESSORS.perRepublican;

    locationResults.forEach((point, key) => {
      const x = xProp(point);
      const y = yProp(point);
      const z = point?.electionResultsCurrent?.totalVotes;
      const id = key;
      if (x && y) {
        maxX = maxX < x ? x : maxX;
        minX = minX > x ? x : minX;
        pointsOnChart.push({ id, x, y, z });
      }
    });

    const regression = new SimpleLinearRegression(
      pointsOnChart.map((point) => point.x),
      pointsOnChart.map((point) => point.y),
    );
    const regressionLineData = [
      { x: maxX, y: regression.predict(maxX) },
      { x: minX, y: regression.predict(minX) },
    ];
    const regIntercept = regression.intercept;
    const regSlope = regression.slope;
    updateDomainX(DEFAULT_DOMAIN_X);

    const [yMin, yMax] = quantile(
      pointsOnChart.map((point) => point.y),
      isCountyLevel ? [0, 1] : [0.01, 0.99],
    );
    updateDomainY([yMin - 1, yMax + 1]);
    return { pointsOnChart, regressionLineData, regIntercept, regSlope };
  }, [locationResults, isCountyLevel, scatterXAxis, scatterYAxis]);

  // zoom coordinates
  const [zoomArea, setZoomArea] = useState(DEFAULT_ZOOM);
  // flag if currently zooming (press and drag)
  const [isZooming, setIsZooming] = useState(false);

  // flag to show the zooming area (ReferenceArea)
  const showZoomBox = isZooming && !(Math.abs(zoomArea.x1 - zoomArea.x2) < MIN_ZOOM) && !(Math.abs(zoomArea.y1 - zoomArea.y2) < MIN_ZOOM);

  /**
   * Two possible events:
   * 1. Clicking on a dot(data point) to select
   * 2. Clicking on the plot to start zooming
   */
  function handleMouseDown(e) {
    setIsZooming(true);
    const { chartX, chartY } = e || {};
    const xValue = e?.activePayload[0].payload.x;
    const yValue = e?.activePayload[0].payload.y;
    const clickedPoint = getClickedPoint(chartX, chartY, data);

    if (clickedPoint) {
      return;
    }
    startTransition(() => {
      setZoomArea({ x1: xValue, x2: xValue, y1: yValue, y2: yValue });
    });
  }

  // Update zoom end coordinates
  function handleMouseMove(e) {
    const xValue = e?.activePayload[0].payload.x;
    const yValue = e?.activePayload[0].payload.y;
    if (isZooming) {
      startTransition(() => {
        setZoomArea((prev) => ({ ...prev, x2: xValue, y2: yValue }));
      });
    }
  }

  // When zooming stops, update with filtered data points
  // Ignore if not enough zoom
  function handleMouseUp() {
    if (isZooming) {
      setIsZooming(false);
      let { x1, x2, y1, y2 } = zoomArea;

      // ensure x1 <= x2 and y1 <= y2
      if (x1 > x2) [x1, x2] = [x2, x1];
      if (y1 > y2) [y1, y2] = [y2, y1];

      if (x2 - x1 < MIN_ZOOM) {
        console.log("zoom cancel");
      } else {
        updateDomainX([x1 - 2.5, x2 + 2.5]);
        updateDomainY([y1 - 2.5, y2 + 2.5]);
        setZoomArea(DEFAULT_ZOOM);
      }
    }
  }

  const hoverScatterDot = useMemo(
    () =>
      ({ id }) => {
        updateActiveHover(id);
      },
    [updateActiveHover],
  );

  const hoverScatterDotOut = useMemo(
    () =>
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ({ id }) => {
        updateActiveHover(null);
      },
    [updateActiveHover],
  );

  const clickScatterDot = useMemo(
    () =>
      ({ id }) => {
        updateActiveSelection(id);
      },
    [updateActiveSelection],
  );

  const range = useMemo(() => [0, isCountyLevel ? 500 : 200], [isCountyLevel]);

  return (
    <div style={{ width: "100%", height: "100%" }} data-testid="scatterPlot">
      <div style={{ width: "100%", height: "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
            <CartesianGrid strokeDasharray="2 2" />
            <XAxis dataKey="x" type="number" domain={domainX} allowDataOverflow={true} name="shift" unit="%" tickFormatter={tickFormatter} />
            <YAxis dataKey="y" type="number" domain={domainY} allowDataOverflow={true} name="2022 turnout" unit="%" tickFormatter={tickFormatter} />
            <ZAxis dataKey="z" type="number" range={range} name="votes" />
            <Scatter
              isAnimationActive={false}
              name="2022 Absentee"
              fill="#000000"
              fillOpacity={isCountyLevel ? 0.6 : 0.15}
              data={data.pointsOnChart}
              onMouseEnter={hoverScatterDot}
              onMouseLeave={hoverScatterDotOut}
              onClick={clickScatterDot}
            />

            {showZoomBox && <ReferenceArea x1={zoomArea?.x1} x2={zoomArea?.x2} y1={zoomArea?.y1} y2={zoomArea?.y2} stroke="red" strokeOpacity={0.3} />}
            <Line name="fit" type="linear" dataKey="y" stroke="#8884d8" dot={false} data={data?.regressionLineData} strokeWidth={2} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function getClickedPoint(x, y, dataOnPlot) {
  const allPoints = Array.from(document.querySelectorAll(".custom-dot"));

  allPoints.forEach((point) => {
    const { chartX, chartY, xValue, yValue, radius } = point.dataset;

    // calculate distance between 2 points
    const pointX = Number(chartX);
    const pointY = Number(chartY);
    const deltaX = x - pointX;
    const deltaY = y - pointY;
    const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);

    // if distance <= radius, then clicked on a dot
    if (distance <= Number(radius)) {
      const dataPoint = dataOnPlot.find((d) => d.x === Number(xValue) && d.y === Number(yValue));
      if (dataPoint) {
        return dataPoint;
      }
    }
  });
}
