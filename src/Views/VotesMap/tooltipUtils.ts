import { numberFormat, numberFormatPercent } from "../../Utils";

/**
 * Creates a tooltip for map features based on color and elevation data
 * @param {Object} params - Tooltip parameters
 * @param {Object} params.object - The map object/feature
 * @param {string} params.colorApproach - Current color visualization approach
 * @param {string} params.elevationApproach - Current elevation visualization approach
 * @param {Function} params.updateActiveHover - Function to update hover state
 * @returns {Object|null} Tooltip HTML object or null
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
  const hasColorData = lookup[colorApproach];
  const hasElevationData = elevationApproach !== "none" && lookup[elevationApproach];

  if (!hasColorData && !hasElevationData) {
    return null;
  }

  const formatColorValue = (value) => {
    return colorApproach === "electionResultVoteShift" ? numberFormat.format(value) : numberFormatPercent.format(value);
  };

  const colorHtml = hasColorData ? `<div>Color: ${formatColorValue(lookup[colorApproach])}</div>` : "";
  const elevationHtml = hasElevationData ? `<div>Height: ${numberFormat.format(lookup[elevationApproach])}</div>` : "";

  return {
    html: `${colorHtml}${elevationHtml}`,
  };
};

/**
 * Determines if a feature should show a tooltip based on available data
 * @param {Object} object - The map object/feature
 * @param {string} colorApproach - Current color visualization approach
 * @param {string} elevationApproach - Current elevation visualization approach
 * @returns {boolean} Whether tooltip should be shown
 */
export const shouldShowTooltip = (object, colorApproach, elevationApproach) => {
  if (!object) return false;

  const lookup = object.properties ? object.properties : object;
  const hasColorData = lookup[colorApproach];
  const hasElevationData = elevationApproach !== "none" && lookup[elevationApproach];

  return hasColorData || hasElevationData;
};

/**
 * Formats a value based on the color approach type
 * @param {number} value - The value to format
 * @param {string} colorApproach - Current color visualization approach
 * @returns {string} Formatted value string
 */
export const formatTooltipValue = (value, colorApproach) => {
  return colorApproach === "electionResultVoteShift" ? numberFormat.format(value) : numberFormatPercent.format(value);
};
