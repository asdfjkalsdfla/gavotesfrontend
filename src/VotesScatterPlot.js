import React, { useState, useMemo } from "react";
import { Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ZAxis, Line, ComposedChart, ScatterChart, ResponsiveContainer, ReferenceArea } from "recharts";
import "./VotesScatter.css";
import SimpleLinearRegression from "ml-regression-simple-linear";

const MIN_ZOOM = 5; // adjust based on your data
const DEFAULT_DOMAIN = ["dataMin", "dataMax"];
const DEFAULT_ZOOM = { x1: null, x2: null };

export default function VotesScatterPlot({ allElectionData, isCountyLevel, updateActiveHover, updateActiveSelection }) {
  // x axis domain
  const [domainX, updateDomainX] = useState(DEFAULT_DOMAIN);
  const [domainY, updateDomainY] = useState(DEFAULT_DOMAIN);

  const data = useMemo(() => {
    console.log(`in update data function`);
    const pointsOnChart = [];
    let maxX = -500;
    let minX = 500;

    allElectionData.forEach((point, key) => {
      const x = point?.electionResultsCurrent?.perRepublican * 100;
      const y = point?.electionResultsBase?.perRepublican * 100;
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
      pointsOnChart.map((point) => point.y)
    );
    const regressionLineData = [
      { x: maxX, y: regression.predict(maxX) },
      { x: minX, y: regression.predict(minX) },
    ];
    // const regressionLineData = Array.from(Array(200).keys()).map(i => ({ x: i, y: regression.predict(i) }));
    const regIntercept = regression.intercept;
    const regSlope = regression.slope;
    // setFilteredData(pointsOnChart);
    updateDomainX(DEFAULT_DOMAIN);
    updateDomainY(DEFAULT_DOMAIN);
    return { pointsOnChart, regressionLineData, regIntercept, regSlope };
  }, [allElectionData]);

  // zoom coordinates
  const [zoomArea, setZoomArea] = useState(DEFAULT_ZOOM);
  // flag if currently zooming (press and drag)
  const [isZooming, setIsZooming] = useState(false);
  // flag if zoomed in
  // const isZoomed = filteredData?.length !== data?.length;

  // flag to show the zooming area (ReferenceArea)
  const showZoomBox = isZooming && !(Math.abs(zoomArea.x1 - zoomArea.x2) < MIN_ZOOM) && !(Math.abs(zoomArea.y1 - zoomArea.y2) < MIN_ZOOM);

  // reset the states on zoom out
  function handleZoomOut() {
    updateDomainX(DEFAULT_DOMAIN);
    setZoomArea(DEFAULT_ZOOM);
  }

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
    } else {
      // console.log("zoom start");
      setZoomArea({ x1: xValue, x2: xValue, y1: yValue, y2: yValue });
    }
  }

  // Update zoom end coordinates
  function handleMouseMove(e, ...all) {
    // console.log(e);
    // console.log(all);
    const xValue = e?.activePayload[0].payload.x;
    const yValue = e?.activePayload[0].payload.y;
    if (isZooming) {
      // console.log("zoom selecting");
      setZoomArea((prev) => ({ ...prev, x2: xValue, y2: yValue }));
    }
  }

  // When zooming stops, update with filtered data points
  // Ignore if not enough zoom
  function handleMouseUp(e) {
    if (isZooming) {
      setIsZooming(false);
      let { x1, x2, y1, y2 } = zoomArea;

      // ensure x1 <= x2 and y1 <= y2
      if (x1 > x2) [x1, x2] = [x2, x1];
      if (y1 > y2) [y1, y2] = [y2, y1];

      // const  pointsOnMap = data.pointsOnChart.filter(point => point.x < x2 && point.x > x1).map(point => point.y);
      // const y1 = Math.min(...pointsOnMap);
      // const y2 = Math.max(...pointsOnMap);

      if (x2 - x1 < MIN_ZOOM) {
        console.log("zoom cancel");
      } else {
        // console.log("zoom stop");
        updateDomainX([x1 - 2.5, x2 + 2.5]);
        updateDomainY([y1 - 2.5, y2 + 2.5]);
        setZoomArea(DEFAULT_ZOOM);
      }
    }
  }

  const hoverScatterDot = useMemo(() => {
    return ({ id }) => {
      updateActiveHover(id);
    };
  }, [updateActiveHover]);

  const hoverScatterDotOut = useMemo(() => {
    return ({ id }) => {
      updateActiveHover(null);
    };
  }, [updateActiveHover]);

  const clickScatterDot = useMemo(() => {
    return ({ id }) => {
      updateActiveSelection(id);
    };
  }, [updateActiveSelection]);

  const range = useMemo(() => {
    return [0, isCountyLevel ? 500 : 250];
  }, [isCountyLevel]);

  // let seg = [data?.regressionLineData[0], data?.regressionLineData[99]];
  // seg = [{ x: 0, y: 0 }, { x: 1000, y: 1000 }];
  // console.log(seg);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <div style={{ width: "100%", height: "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
            <CartesianGrid strokeDasharray="2 2" />
            <XAxis dataKey="x" type="number" domain={domainX} allowDataOverflow={true} name="shift" unit="%" />
            <YAxis dataKey="y" type="number" domain={domainY} allowDataOverflow={true} name="2022 turnout" unit="%" />
            <ZAxis dataKey="z" type="number" range={range} name="votes" />
            {/* <Tooltip content={<CustomTooltip />} dataKey="id" cursor={{ strokeDasharray: '3 3' }} /> */}
            <Scatter
              isAnimationActive={false}
              name="2022 Absentee"
              fill="#000000"
              fillOpacity={0.5}
              data={data.pointsOnChart}
              onMouseEnter={hoverScatterDot}
              onMouseLeave={hoverScatterDotOut}
              onClick={clickScatterDot}
            />

            {showZoomBox && <ReferenceArea x1={zoomArea?.x1} x2={zoomArea?.x2} y1={zoomArea?.y1} y2={zoomArea?.y2} stroke="red" strokeOpacity={0.3} />}
            {/* <Brush dataKey="x" height={30} width={100} x={100} y={100} data={data.pointsOnChart} stroke="#8884d8" /> */}
            <Line name="fit" type="linear" dataKey="y" stroke="#8884d8" dot={false} data={data?.regressionLineData} strokeWidth={2} isAnimationActive={false} />
            {/* <ReferenceLine name="fit"  stroke="#8884d8" segment={data.regressionLineData} strokeWidth={2} /> */}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload }) => {
  if (!payload || payload.size === 0) return <></>;
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

function getClickedPoint(x, y, dataOnPlot) {
  const allPoints = Array.from(document.querySelectorAll(".custom-dot"));

  for (let i = 0; i < allPoints.length; i++) {
    const { chartX, chartY, xValue, yValue, radius } = allPoints[i].dataset;

    // calculate distance between 2 points
    const pointX = Number(chartX);
    const pointY = Number(chartY);
    const deltaX = x - pointX;
    const deltaY = y - pointY;
    const distance = Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));

    // if distance <= radius, then clicked on a dot
    if (distance <= Number(radius)) {
      const dataPoint = dataOnPlot.find((d) => d.x === Number(xValue) && d.y === Number(yValue));
      if (dataPoint) {
        return dataPoint;
      }
    }
  }
}
