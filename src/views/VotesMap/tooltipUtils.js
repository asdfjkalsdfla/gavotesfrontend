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
  const titleHtml = name ? `<div style="font-weight: bold; margin-bottom: 2px;">${name}</div>` : "";

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

  const colorHtml = hasColorData ? `<div>Color: ${formatColorValue(colorVal)}</div>` : "";
  const elevationHtml = hasElevationData ? `<div>Height: ${formatElevationValue(elevationVal)}</div>` : "";

  return {
    html: `${titleHtml}${colorHtml}${elevationHtml}`,
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
