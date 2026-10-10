import React from "react";

export const numberFormat = new Intl.NumberFormat("en-us", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export const numberFormatRatio = new Intl.NumberFormat("en-us", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const numberFormatPercent = new Intl.NumberFormat("en-us", {
  style: "percent",
  minimumIntegerDigits: 1,
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export const RDIndicator = (value) => (value > 0 ? <span style={{ color: "rgb(102, 134, 181)" }}> D + </span> : <span style={{ color: "#d09897" }}>R+</span>);

export const sortNumeric = (a, b) => {
  if (!a || typeof a === "undefined") return 1;
  if (!b || typeof b === "undefined") return -1;
  return (a || 0) - (b || 0);
};

export const quantile = (arr, q) => {
  const sorted = arr.filter((a) => typeof a === "number" && Number.isFinite(a)).sort((a, b) => a - b);
  const quants = Array.isArray(q) ? q : [q];
  const positions = quants.map((quant) => {
    const pos = (sorted.length - 1) * quant;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (sorted[base + 1] !== undefined) {
      return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    }
    return sorted[base];
  });
  return positions;
};

export const normalizeZeroOne = (value, min, max) => {
  if (!value && value !== 0) return undefined;
  return Math.max(0, Math.min(1, (value - min) / (max - min) || 0));
};

export const normalizeZeroCenterToZeroOne = (value, min, max, scale = 1.0) => {
  const absMax = Math.max(Math.abs(min), Math.abs(max));
  return Math.max(0, Math.min(1, (value / absMax) * 0.5 + 0.5)) * scale;
};

export const formatLastUpdated = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
    timeZone: "America/New_York",
  }).format(d);
};

export const getMostRecentDate = (d1, d2) => {
  if (!d1 && !d2) return undefined;
  if (!d1) return d2;
  if (!d2) return d1;
  const t1 = new Date(d1).getTime();
  const t2 = new Date(d2).getTime();
  if (isNaN(t1) && isNaN(t2)) return d1;
  if (isNaN(t1)) return d2;
  if (isNaN(t2)) return d1;
  return t1 >= t2 ? d1 : d2;
};

