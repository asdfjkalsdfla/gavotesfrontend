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
  turnoutFilter,
  onTurnoutFilterChange,
  turnoutStats,
  isCountyLevel = true,
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

  const isTurnoutElevation =
    elevationApproach === "turnoutAbsSameDay" || elevationApproach === "turnoutAbs";

  const showTurnoutFilter = Boolean(
    turnoutFilter &&
      onTurnoutFilterChange &&
      ((showElevationScale && isTurnoutElevation) ||
        colorApproach === "turnoutAbsSameDay" ||
        turnoutFilter.enabled),
  );

  // Compute slider bounds aligned with Height: Turnout Ratio min/max
  const rawMin =
    isTurnoutElevation && elevationMin !== undefined
      ? elevationMin
      : turnoutStats?.min !== undefined && turnoutStats?.totalCount > 0
        ? turnoutStats.min
        : 0.5;
  const rawMax =
    isTurnoutElevation && elevationMax !== undefined
      ? elevationMax
      : turnoutStats?.max !== undefined && turnoutStats?.totalCount > 0
        ? turnoutStats.max
        : 1.5;

  const sliderMin = Math.max(0, Math.floor(rawMin * 100) / 100);
  const sliderMax = Math.max(sliderMin + 0.05, Math.ceil(rawMax * 100) / 100);
  const hasParityInRange = sliderMin <= 1.0 && sliderMax >= 1.0;
  const midThreshold = Number(((sliderMin + sliderMax) / 2).toFixed(2));

  const getInitialThreshold = () => {
    const current = Number(turnoutFilter?.threshold);
    if (Number.isFinite(current) && current >= sliderMin && current <= sliderMax) {
      return current;
    }
    return hasParityInRange ? 1.0 : midThreshold;
  };

  const clampedThreshold =
    turnoutFilter?.threshold !== undefined
      ? Math.min(sliderMax, Math.max(sliderMin, Number(turnoutFilter.threshold)))
      : getInitialThreshold();

  const renderFilterToggleButtons = () => (
    <div
      role="group"
      aria-label="Same-Day Turnout Filter Mode"
      style={{
        display: "inline-flex",
        backgroundColor: "#f1f5f9",
        borderRadius: "6px",
        padding: "2px",
        gap: "2px",
      }}
    >
      {[
        { key: "off", label: "Off", title: "Show all locations" },
        { key: "gte", label: "≥ Above", title: "Find locations at or above turnout threshold" },
        { key: "lte", label: "≤ Below", title: "Find locations at or below turnout threshold" },
      ].map((btn) => {
        const isActive =
          btn.key === "off"
            ? !turnoutFilter?.enabled
            : Boolean(turnoutFilter?.enabled && turnoutFilter?.operator === btn.key);
        return (
          <button
            key={btn.key}
            type="button"
            title={btn.title}
            onClick={() => {
              if (btn.key === "off" || isActive) {
                onTurnoutFilterChange({ ...turnoutFilter, enabled: false });
              } else {
                onTurnoutFilterChange({
                  enabled: true,
                  operator: btn.key,
                  threshold: turnoutFilter?.enabled ? turnoutFilter?.threshold : getInitialThreshold(),
                });
              }
            }}
            style={{
              padding: "2px 6px",
              fontSize: "10px",
              fontWeight: isActive ? 600 : 500,
              borderRadius: "4px",
              border: "none",
              cursor: "pointer",
              backgroundColor: isActive ? "#1e293b" : "transparent",
              color: isActive ? "#ffffff" : "#475569",
              transition: "background-color 0.15s ease, color 0.15s ease",
            }}
          >
            {btn.label}
          </button>
        );
      })}
    </div>
  );

  const renderActiveSliderControls = () => (
    <div style={{ marginTop: 6 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 3,
          fontSize: "11px",
        }}
      >
        <span style={{ fontWeight: 600, color: "#0f172a" }}>
          {turnoutFilter?.operator === "lte" ? "≤" : "≥"} {numberFormatRatio.format(clampedThreshold)}×{" "}
          <span style={{ color: "#64748b", fontWeight: 500 }}>
            ({numberFormatPercent.format(clampedThreshold)})
          </span>
        </span>
        {turnoutStats?.totalCount > 0 && (
          <span
            data-testid="turnout-filter-match-count"
            style={{
              fontSize: "10px",
              fontWeight: 600,
              padding: "1px 6px",
              borderRadius: "999px",
              backgroundColor: turnoutStats.matchCount > 0 ? "#eff6ff" : "#fef2f2",
              color: turnoutStats.matchCount > 0 ? "#1d4ed8" : "#b91c1c",
            }}
          >
            {turnoutStats.matchCount} / {turnoutStats.totalCount}{" "}
            {isCountyLevel ? "counties" : "precincts"}
          </span>
        )}
      </div>

      <input
        type="range"
        aria-label="Same-Day Turnout Threshold"
        min={sliderMin}
        max={sliderMax}
        step={0.01}
        value={clampedThreshold}
        onChange={(e) => {
          onTurnoutFilterChange({
            ...turnoutFilter,
            enabled: true,
            threshold: parseFloat(e.target.value),
          });
        }}
        style={{
          width: "100%",
          cursor: "pointer",
          accentColor: "#1e293b",
          margin: "2px 0",
        }}
      />
    </div>
  );

  // Don't render an empty box if nothing applies
  if (!gradientStyle && !isScatterPlot && !showElevationScale && !showTurnoutFilter) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        bottom: 24,
        right: 24,
        minWidth: 236,
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

      {/* 3D Elevation Height Scale (with integrated Turnout Ratio Filter) */}
      {showElevationScale && (
        <div
          style={{
            marginTop: gradientStyle || isScatterPlot ? 10 : 0,
            paddingTop: gradientStyle || isScatterPlot ? 8 : 0,
            borderTop: gradientStyle || isScatterPlot ? "1px solid #e2e8f0" : "none",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 8,
              fontSize: "11px",
              fontWeight: 600,
              color: "#334155",
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span>Height: {elevationApproach === "votes" ? "Absentee Votes" : "Turnout Ratio"}</span>
              <span
                aria-hidden="true"
                style={{ display: "inline-flex", alignItems: "flex-end", gap: 2, height: 12 }}
              >
                {[4, 7, 10, 12].map((h) => (
                  <span
                    key={h}
                    style={{
                      width: 3,
                      height: h,
                      borderRadius: 1,
                      backgroundColor: "#64748b",
                      opacity: 0.35 + (h / 12) * 0.55,
                    }}
                  />
                ))}
              </span>
            </span>
            {showTurnoutFilter && isTurnoutElevation && renderFilterToggleButtons()}
          </div>

          {showTurnoutFilter && isTurnoutElevation && turnoutFilter?.enabled && renderActiveSliderControls()}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "11px",
              color: "#64748b",
              marginTop: 4,
            }}
          >
            {showTurnoutFilter && isTurnoutElevation && turnoutFilter?.enabled ? (
              <>
                <button
                  type="button"
                  title="Set threshold to minimum"
                  onClick={() =>
                    onTurnoutFilterChange({
                      ...turnoutFilter,
                      enabled: true,
                      threshold: sliderMin,
                    })
                  }
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    color: "#64748b",
                    cursor: "pointer",
                    fontSize: "11px",
                  }}
                >
                  {formatElevation(elevationMin)} (Min)
                </button>
                <button
                  type="button"
                  title={hasParityInRange ? "Snap to 1.00× (100% parity)" : "Snap to midpoint"}
                  onClick={() =>
                    onTurnoutFilterChange({
                      ...turnoutFilter,
                      enabled: true,
                      threshold: hasParityInRange ? 1.0 : midThreshold,
                    })
                  }
                  style={{
                    background:
                      Math.abs(clampedThreshold - (hasParityInRange ? 1.0 : midThreshold)) < 0.005
                        ? "#e2e8f0"
                        : "#f8fafc",
                    border: "1px solid #cbd5e1",
                    borderRadius: "4px",
                    padding: "1px 6px",
                    color: "#334155",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: "10px",
                  }}
                >
                  {hasParityInRange ? "1.00× Parity" : `${numberFormatRatio.format(midThreshold)}× Mid`}
                </button>
                <button
                  type="button"
                  title="Set threshold to maximum"
                  onClick={() =>
                    onTurnoutFilterChange({
                      ...turnoutFilter,
                      enabled: true,
                      threshold: sliderMax,
                    })
                  }
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    color: "#64748b",
                    cursor: "pointer",
                    fontSize: "11px",
                  }}
                >
                  {formatElevation(elevationMax)} (Max)
                </button>
              </>
            ) : (
              <>
                <span>{formatElevation(elevationMin)} (Min)</span>
                <span>{formatElevation(elevationMax)} (Max)</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Fallback Turnout Filter when in 2D Flat mode (no 3D Elevation Scale visible) */}
      {!showElevationScale && showTurnoutFilter && (
        <div
          style={{
            marginTop: gradientStyle || isScatterPlot ? 10 : 0,
            paddingTop: gradientStyle || isScatterPlot ? 8 : 0,
            borderTop: gradientStyle || isScatterPlot ? "1px solid #e2e8f0" : "none",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: "11px", fontWeight: 600, color: "#334155" }}>
              Turnout Ratio
            </span>
            {renderFilterToggleButtons()}
          </div>
          {turnoutFilter?.enabled && renderActiveSliderControls()}
        </div>
      )}
    </div>
  );
}
