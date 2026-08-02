import React, { useState, useMemo, useRef, useCallback, useEffect, useLayoutEffect, useTransition } from "react";
import { scaleLinear, scaleSqrt } from "d3-scale";
import { defineChart, dot, lineY } from "@tanstack/charts";
import { findNearestPoint } from "@tanstack/charts/scene";
import { tooltip } from "@tanstack/charts/tooltip";
import { Chart } from "@tanstack/react-charts";
import { SimpleLinearRegression } from "ml-regression-simple-linear";
import { useElectionData } from "../../context/ElectionDataProvider.tsx";
import { useScatterPreference } from "./PreferenceContext.tsx";
import { quantile } from "../..//Utils.jsx";
import { DATA_PROPERTY_ACCESSORS, AXIS_LABELS } from "./dataTransformers.ts";
import "./VotesScatter.css";

const MIN_ZOOM = 5; // adjust based on your data
const DEFAULT_DOMAIN_X = null; // null means "infer domain from data"
const DEFAULT_DOMAIN_Y = [0, 150];
const HOVER_HIT_DISTANCE = 12; // scene pixels considered "on a dot"
const MIN_DRAG_PX = 5; // minimum on-screen drag before a zoom box is shown

const FALLBACK_CHART_HEIGHT = 480;

const tickFormatter = (value) => `${value.toFixed(2)}%`;

export default function VotesScatterPlot({ isCountyLevel, updateActiveHover, updateActiveSelection }) {
  const { locationResults } = useElectionData();
  const { scatterXAxis, scatterYAxis } = useScatterPreference();
  const [, startTransition] = useTransition();
  // x/y axis domains; null x domain means "let the chart infer it from the data"
  const [domainX, updateDomainX] = useState(DEFAULT_DOMAIN_X);
  const [domainY, updateDomainY] = useState(DEFAULT_DOMAIN_Y);

  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const svgRef = useRef(null);

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
        pointsOnChart.push({ id, x, y, z, county: point?.CTYNAME, precinct: point?.PRECINCT_N });
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

    const [yMin, yMax] = quantile(
      pointsOnChart.map((point) => point.y),
      isCountyLevel ? [0, 1] : [0.01, 0.99],
    );
    const defaultDomainY = [yMin - 1, yMax + 1];
    return { pointsOnChart, regressionLineData, regIntercept, regSlope, defaultDomainY };
  }, [locationResults, isCountyLevel, scatterXAxis, scatterYAxis]);

  // reset the zoom whenever the underlying data or selected axes change
  useEffect(() => {
    updateDomainX(DEFAULT_DOMAIN_X);
    updateDomainY(data.defaultDomainY);
  }, [data]);

  const isZoomed = domainX !== null;
  const resetZoom = useCallback(() => {
    updateDomainX(DEFAULT_DOMAIN_X);
    updateDomainY(data.defaultDomainY);
  }, [data]);

  // measure the container so the chart can fill all available vertical space
  const [chartHeight, setChartHeight] = useState(FALLBACK_CHART_HEIGHT);
  useLayoutEffect(() => {
    const node = containerRef.current;
    if (!node) return undefined;
    const observer = new ResizeObserver((entries) => {
      const height = entries[0]?.contentRect.height;
      if (height) setChartHeight(height);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // active drag-to-zoom box, in CSS pixels relative to the container
  const [dragBox, setDragBox] = useState(null);

  const handleFocusChange = useCallback(
    (point) => {
      updateActiveHover(point?.datum?.id ?? null);
    },
    [updateActiveHover],
  );

  const handleSelect = useCallback(
    (point) => {
      if (point?.datum?.id !== undefined) {
        updateActiveSelection(point.datum.id);
      }
    },
    [updateActiveSelection],
  );

  const handleRender = useCallback(({ scene, svg }) => {
    sceneRef.current = scene;
    svgRef.current = svg;
  }, []);

  // Converts a client (viewport) coordinate into scene-pixel coordinates
  const toSceneCoords = useCallback((clientX, clientY) => {
    const svg = svgRef.current;
    const scene = sceneRef.current;
    if (!svg || !scene) return null;
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    return {
      x: ((clientX - rect.left) / rect.width) * scene.width,
      y: ((clientY - rect.top) / rect.height) * scene.height,
    };
  }, []);

  /**
   * Two possible events:
   * 1. Pressing down on a dot(data point) to select it (native click/select handles this)
   * 2. Pressing down on the plot background to start a zoom-box drag
   */
  const handlePointerDown = useCallback(
    (e) => {
      if (e.button !== 0) return;
      const scene = sceneRef.current;
      const sceneCoords = toSceneCoords(e.clientX, e.clientY);
      if (scene && sceneCoords) {
        const hit = findNearestPoint(scene, sceneCoords.x, sceneCoords.y, HOVER_HIT_DISTANCE);
        if (hit?.datum?.id !== undefined) {
          // Let the native click/select behavior handle a dot click
          return;
        }
      }
      const containerRect = containerRef.current.getBoundingClientRect();
      const localX = e.clientX - containerRect.left;
      const localY = e.clientY - containerRect.top;
      setDragBox({ x1: localX, y1: localY, x2: localX, y2: localY });
    },
    [toSceneCoords],
  );

  const handlePointerMove = useCallback((e) => {
    setDragBox((prev) => {
      if (!prev) return prev;
      const containerRect = containerRef.current.getBoundingClientRect();
      const localX = e.clientX - containerRect.left;
      const localY = e.clientY - containerRect.top;
      return { ...prev, x2: localX, y2: localY };
    });
  }, []);

  // When dragging stops, invert the pixel box into domain values and zoom
  // Ignore if not enough of a drag
  const handlePointerUp = useCallback(() => {
    setDragBox((box) => {
      if (!box) return null;
      const scene = sceneRef.current;
      const svg = svgRef.current;
      if (scene && svg && (Math.abs(box.x2 - box.x1) >= MIN_DRAG_PX || Math.abs(box.y2 - box.y1) >= MIN_DRAG_PX)) {
        const rect = svg.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        const toScene = (localX, localY) => ({
          x: ((localX + containerRect.left - rect.left) / rect.width) * scene.width,
          y: ((localY + containerRect.top - rect.top) / rect.height) * scene.height,
        });
        const c1 = toScene(box.x1, box.y1);
        const c2 = toScene(box.x2, box.y2);

        // ResolvedScale only exposes a forward `map`; rebuild an invertible
        // d3 scale from the resolved domain and the current plot bounds.
        const interactiveX = scaleLinear()
          .domain(scene.scales.x.domain)
          .range([scene.chart.x, scene.chart.x + scene.chart.width]);
        const interactiveY = scaleLinear()
          .domain(scene.scales.y.domain)
          .range([scene.chart.y + scene.chart.height, scene.chart.y]);

        let x1 = interactiveX.invert(c1.x);
        let x2 = interactiveX.invert(c2.x);
        let y1 = interactiveY.invert(c1.y);
        let y2 = interactiveY.invert(c2.y);

        // ensure x1 <= x2 and y1 <= y2
        if (x1 > x2) [x1, x2] = [x2, x1];
        if (y1 > y2) [y1, y2] = [y2, y1];

        if (x2 - x1 < MIN_ZOOM) {
          console.log("zoom cancel");
        } else {
          startTransition(() => {
            updateDomainX([x1 - 2.5, x2 + 2.5]);
            updateDomainY([y1 - 2.5, y2 + 2.5]);
          });
        }
      }
      return null;
    });
  }, [startTransition]);

  const rMax = isCountyLevel ? 18 : 10;
  const xAxisLabel = AXIS_LABELS[scatterXAxis] ?? AXIS_LABELS.perRepublican;
  const yAxisLabel = AXIS_LABELS[scatterYAxis] ?? AXIS_LABELS.perRepublican;

  const definition = useMemo(() => {
    return defineChart({
      marks: [
        dot(data.pointsOnChart, {
          key: "id",
          x: "x",
          y: "y",
          r: "z",
          rScale: { scale: () => scaleSqrt().range([1, rMax]) },
          fill: "#000000",
          fillOpacity: isCountyLevel ? 0.6 : 0.15,
        }),
        lineY(data.regressionLineData, {
          id: "fit",
          x: "x",
          y: "y",
          stroke: "#8884d8",
          strokeWidth: 2,
        }),
      ],
      x: {
        scale: domainX ? scaleLinear().domain(domainX) : scaleLinear,
        grid: true,
        axis: { label: xAxisLabel, ticks: { format: tickFormatter } },
      },
      y: {
        scale: scaleLinear().domain(domainY),
        grid: true,
        axis: { label: yAxisLabel, ticks: { format: tickFormatter } },
      },
      maxFocusDistance: HOVER_HIT_DISTANCE,
      animate: false,
      tooltip: {
        use: tooltip,
        items: [{ field: "county", label: "County" }, { field: "precinct", label: "Precinct" }, "x", "y"],
      },
    });
  }, [data, domainX, domainY, isCountyLevel, rMax, xAxisLabel, yAxisLabel]);

  const dragBoxStyle = useMemo(() => {
    if (!dragBox) return null;
    if (Math.abs(dragBox.x2 - dragBox.x1) < MIN_DRAG_PX && Math.abs(dragBox.y2 - dragBox.y1) < MIN_DRAG_PX) return null;
    const left = Math.min(dragBox.x1, dragBox.x2);
    const top = Math.min(dragBox.y1, dragBox.y2);
    return {
      position: "absolute",
      left,
      top,
      width: Math.abs(dragBox.x2 - dragBox.x1),
      height: Math.abs(dragBox.y2 - dragBox.y1),
      border: "1px solid red",
      backgroundColor: "rgba(255, 0, 0, 0.1)",
      pointerEvents: "none",
    };
  }, [dragBox]);

  return (
    <div style={{ width: "100%", height: "100%" }} data-testid="scatterPlot">
      <div
        ref={containerRef}
        style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onDoubleClick={resetZoom}
      >
        <Chart
          definition={definition}
          height={chartHeight}
          ariaLabel="2022 election results scatter plot"
          onRender={handleRender}
          onFocusChange={handleFocusChange}
          onSelect={handleSelect}
        />
        {dragBoxStyle && <div style={dragBoxStyle} />}
        {isZoomed && (
          <button type="button" className="scatterResetZoomButton" onClick={resetZoom}>
            Reset zoom
          </button>
        )}
      </div>
    </div>
  );
}
