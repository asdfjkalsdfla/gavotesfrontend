import React, { useMemo } from "react";
import { numberFormatPercent, numberFormatRatio, numberFormat } from "../../Utils";

const COLOR_NAMES = {
  electionResultPerRepublicanPer: "Vote Share (Rep / Dem)",
  electionResultVoteMargin: "Vote Margin",
  electionResultPerRepublicanPerShift: "Vote Swing (Shift in R/D %)",
  totalVotesPercent: "% of Previous Turnout",
  electionResultVoteShiftNormalized: "Shift in Vote Margin (normalized)",
  blackPer: "Black Population %",
  hispanicPer: "Hispanic Population %",
  turnoutAbsSameDay: "Absentee Votes @ Same Day",
  turnoutAbs: "% of Total Votes",
  votes: "Total Absentee Votes",
};

export const toCssColor = (color) => {
  if (!color) return "transparent";
  if (Array.isArray(color)) {
    const [r, g, b, a] = color;
    if (a !== undefined) {
      const alpha = a > 1 ? a / 255 : a;
      return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${alpha})`;
    }
    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
  }
  return String(color);
};

export default function MapScale({
  scaleToColorFunction,
  scaleMin,
  scaleMax,
  colorApproach,
  elevationMin,
  elevationMax,
  elevationApproach,
}) {
  const isScatterPlot =
    colorApproach === "electionResultVoteMargin" ||
    colorApproach === "electionResultVoteShiftNormalized" ||
    colorApproach === "electionResultVoteShift";

  const gradientStyle = useMemo(() => {
    if (!scaleToColorFunction || isScatterPlot) return null;
    const samples = 25;
    const stops = Array.from({ length: samples }, (_, i) => {
      const t = i / (samples - 1);
      const color = scaleToColorFunction(t);
      return `${toCssColor(color)} ${(t * 100).toFixed(1)}%`;
    });
    return `linear-gradient(to right, ${stops.join(", ")})`;
  }, [scaleToColorFunction, isScatterPlot]);

  const formatColorValue = (val) => {
    if (val === undefined || val === null) return "";
    if (colorApproach === "turnoutAbsSameDay" || colorApproach === "turnoutAbs") {
      return `${numberFormatRatio.format(val)}×`;
    }
    if (colorApproach === "votes") {
      return numberFormat.format(val);
    }
    return numberFormatPercent.format(val);
  };

  const formatElevation = (val) => {
    if (val === undefined || val === null) return "";
    if (elevationApproach === "turnoutAbsSameDay" || elevationApproach === "turnoutAbs") {
      return `${numberFormatRatio.format(val)}×`;
    }
    return numberFormat.format(val);
  };

  const showElevationScale =
    !isScatterPlot &&
    elevationApproach &&
    elevationApproach !== "none" &&
    elevationMin !== undefined &&
    elevationMax !== undefined;

  // Don't render an empty box if nothing applies
  if (!gradientStyle && !isScatterPlot && !showElevationScale) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        bottom: 24,
        right: 24,
        minWidth: 220,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12)",
        padding: "10px 16px",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(6px)",
        borderRadius: "8px",
        border: "1px solid #e2e8f0",
        zIndex: 20,
        fontSize: "12px",
        pointerEvents: "auto",
      }}
    >
      {/* Bubble Legend for Scatter Plot Approaches */}
      {isScatterPlot && (
        <div>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "#334155", marginBottom: 6 }}>
            {COLOR_NAMES[colorApproach] || "Vote Margin"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: "rgba(170, 57, 57, 0.65)",
                  border: "1.5px solid rgb(170, 57, 57)",
                  display: "inline-block",
                }}
              />
              <span style={{ fontSize: "11px", color: "#334155", fontWeight: 500 }}>Republican</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: "rgba(17, 62, 103, 0.65)",
                  border: "1.5px solid rgb(17, 62, 103)",
                  display: "inline-block",
                }}
              />
              <span style={{ fontSize: "11px", color: "#334155", fontWeight: 500 }}>Democratic</span>
            </div>
          </div>
          <div style={{ fontSize: "10px", color: "#64748b", fontStyle: "italic" }}>
            Circle size indicates margin volume
          </div>
        </div>
      )}

      {/* Continuous Gradient Color Scale */}
      {gradientStyle && (
        <div>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "#334155", marginBottom: 5 }}>
            {COLOR_NAMES[colorApproach] || "Color Scale"}
          </div>
          <div
            style={{
              width: "100%",
              height: "12px",
              borderRadius: "4px",
              background: gradientStyle,
              boxShadow: "inset 0 0 0 1px rgba(0, 0, 0, 0.1)",
            }}
          />
          {colorApproach === "electionResultPerRepublicanPer" ? (
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: "11px" }}>
              <span style={{ color: "#b91c1c", fontWeight: 600 }}>R 100%</span>
              <span style={{ color: "#64748b" }}>Tie</span>
              <span style={{ color: "#1d4ed8", fontWeight: 600 }}>D 100%</span>
            </div>
          ) : colorApproach === "electionResultPerRepublicanPerShift" ? (
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: "11px" }}>
              <span style={{ color: "#b91c1c", fontWeight: 600 }}>
                R +{numberFormatPercent.format(Math.abs(scaleMin))}
              </span>
              <span style={{ color: "#64748b" }}>0%</span>
              <span style={{ color: "#1d4ed8", fontWeight: 600 }}>
                D +{numberFormatPercent.format(scaleMax)}
              </span>
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, color: "#64748b", fontSize: "11px" }}>
              <span>{formatColorValue(scaleMin)}</span>
              <span>{formatColorValue(scaleMax)}</span>
            </div>
          )}
        </div>
      )}

      {/* 3D Elevation Height Scale */}
      {showElevationScale && (
        <div
          style={{
            marginTop: gradientStyle || isScatterPlot ? 10 : 0,
            paddingTop: gradientStyle || isScatterPlot ? 8 : 0,
            borderTop: gradientStyle || isScatterPlot ? "1px solid #e2e8f0" : "none",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: 600, color: "#334155" }}>
            <span>Height: {elevationApproach === "votes" ? "Absentee Votes" : "Turnout Ratio"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748b", marginTop: 2 }}>
            <span>{formatElevation(elevationMin)} (Min)</span>
            <span>{formatElevation(elevationMax)} (Max)</span>
          </div>
        </div>
      )}
    </div>
  );
}
