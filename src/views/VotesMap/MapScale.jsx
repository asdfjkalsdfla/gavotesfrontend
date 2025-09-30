import React, { useMemo } from "react";
import { numberFormatPercent } from "../../Utils";

export default function MapScale({ scaleToColorFunction, scaleMin, scaleMax }) {
  const colorSteps = useMemo(() => {
    const steps = [...Array(40).keys()].map((point) => {
      const color = scaleToColorFunction((point * 2.5) / 100);
      return (
        <span key={point} style={{ backgroundColor: color, width: "1px" }}>
          &nbsp;
        </span>
      );
    });
    return steps;
  }, [scaleToColorFunction]);

  return (
    <div
      style={{
        position: "absolute",
        top: "88%",
        right: 0,
        width: 200,
        boxShadow: "rgba(0, 0, 0, 0.16) 0px 1px 4px",
        margin: 24,
        padding: "5px 24px",
        backgroundColor: "white",
        zIndex: 999,
      }}
    >
      {colorSteps}
      <br />
      <span>{numberFormatPercent.format(scaleMin)}</span>
      <span style={{ float: "right" }}>{numberFormatPercent.format(scaleMax)}</span>
    </div>
  );
}
