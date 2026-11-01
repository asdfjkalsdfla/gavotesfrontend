import { numberFormat, numberFormatPercent, numberFormatRatio } from "../../Utils";

const getColorValue = (lookup, colorApproach) => {
  if (lookup[colorApproach] !== undefined) return lookup[colorApproach];
  switch (colorApproach) {
    case "electionResultVoteMargin":
      return lookup.electionResultsCurrent?.marginDemocratic;
    case "electionResultVoteShift":
      return lookup.electionResultsComparison?.voteShiftDemocratic;
    case "electionResultVoteShiftNormalized":
      return lookup.electionResultsComparison?.voteShiftDemocraticNormalized;
    case "electionResultPerRepublicanPerShift":
      return lookup.electionResultsComparison?.perShiftDemocratic;
    case "turnoutAbsSameDay":
      return lookup.absenteeBallotComparison?.turnoutAbsenteeBallotsSameDay;
    case "turnoutAbs":
      return lookup.absenteeBallotComparison?.turnoutAbsenteeBallots;
    case "totalVotesPercent":
      return lookup.electionResultsComparison?.totalVotesPercent;
    case "hispanicPer":
      return lookup.demographics?.hispanicPer;
    case "blackPer":
      return lookup.demographics?.blackPer;
    default:
      return lookup.electionResultsCurrent?.perDemocratic;
  }
};

const getElevationValue = (lookup, elevationApproach) => {
  if (lookup[elevationApproach] !== undefined) return lookup[elevationApproach];
  switch (elevationApproach) {
    case "turnoutAbsSameDay":
      return lookup.absenteeBallotComparison?.turnoutAbsenteeBallotsSameDay;
    case "turnoutAbs":
      return lookup.absenteeBallotComparison?.turnoutAbsenteeBallots;
    case "votes":
      return lookup.absenteeCurrent?.totalAbsenteeVotes;
    default:
      return undefined;
  }
};

/**
 * Creates a tooltip for map features based on color and elevation data
 */
export const createMapTooltip = ({ object, colorApproach, elevationApproach, updateActiveHover }) => {
  if (!object) {
    updateActiveHover(object);
    return null;
  }

  if (object.properties) {
    updateActiveHover(object.properties.id);
  }

  const lookup = object.properties ? object.properties : object;
  const colorVal = getColorValue(lookup, colorApproach);
  const elevationVal = elevationApproach !== "none" ? getElevationValue(lookup, elevationApproach) : undefined;

  const hasColorData = colorVal !== undefined && colorVal !== null;
  const hasElevationData = elevationVal !== undefined && elevationVal !== null;

  if (!hasColorData && !hasElevationData) {
    return null;
  }

  const name = lookup.CTYNAME || lookup.county || lookup.NAME || lookup.id;
  const titleHtml = name
    ? `<div style="font-weight: 700; font-size: 13px; color: #f8fafc; margin-bottom: 4px; padding-bottom: 3px; border-bottom: 1px solid rgba(148, 163, 184, 0.25);">${name}</div>`
    : "";

  const formatColorValue = (value) => {
    if (colorApproach === "electionResultVoteMargin" || colorApproach === "electionResultVoteShift" || colorApproach === "electionResultVoteShiftNormalized") {
      const party = value > 0 ? "D+" : value < 0 ? "R+" : "";
      return `${party}${numberFormat.format(Math.abs(value))}`;
    }
    if (colorApproach === "turnoutAbsSameDay" || colorApproach === "turnoutAbs") {
      return `${numberFormatRatio.format(value)}×`;
    }
    if (colorApproach === "votes") {
      return numberFormat.format(value);
    }
    if (colorApproach === "electionResultPerRepublicanPer") {
      if (value > 0.5) {
        return `D ${numberFormatPercent.format(value)}`;
      }
      if (value < 0.5) {
        return `R ${numberFormatPercent.format(1 - value)}`;
      }
      return `Tie (${numberFormatPercent.format(value)})`;
    }
    return numberFormatPercent.format(value);
  };

  const formatElevationValue = (value) => {
    if (elevationApproach === "turnoutAbsSameDay" || elevationApproach === "turnoutAbs") {
      return `${numberFormatRatio.format(value)}×`;
    }
    return numberFormat.format(value);
  };

  const colorHtml = hasColorData
    ? `<div style="font-size: 12px; color: #f8fafc; font-weight: 500; line-height: 1.45;">Color: ${formatColorValue(colorVal)}</div>`
    : "";
  const elevationHtml = hasElevationData
    ? `<div style="font-size: 12px; color: #cbd5e1; font-weight: 500; line-height: 1.45;">Height: ${formatElevationValue(elevationVal)}</div>`
    : "";

  return {
    html: `${titleHtml}${colorHtml}${elevationHtml}`,
    style: {
      backgroundColor: "rgba(15, 23, 42, 0.92)",
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
      color: "#f8fafc",
      borderRadius: "8px",
      padding: "8px 12px",
      boxShadow: "0 8px 20px rgba(15, 23, 42, 0.32)",
      border: "1px solid rgba(255, 255, 255, 0.14)",
      fontSize: "12px",
      pointerEvents: "none",
    },
  };
};

/**
 * Determines if a feature should show a tooltip based on available data
 */
export const shouldShowTooltip = (object, colorApproach, elevationApproach) => {
  if (!object) return false;

  const lookup = object.properties ? object.properties : object;
  const colorVal = getColorValue(lookup, colorApproach);
  const elevationVal = elevationApproach !== "none" ? getElevationValue(lookup, elevationApproach) : undefined;

  return (colorVal !== undefined && colorVal !== null) || (elevationVal !== undefined && elevationVal !== null);
};

/**
 * Formats a value based on the color approach type
 */
export const formatTooltipValue = (value, colorApproach) => {
  return colorApproach === "electionResultVoteShift" ? numberFormat.format(value) : numberFormatPercent.format(value);
};
