import { DataTableColumnHeader } from "./DataTableColumnHeader.tsx";
import { DataTableCellNumeric } from "./DataTableCellNumeric.tsx";
import { numberFormat, numberFormatPercent, numberFormatRatio, RDIndicator } from "../../Utils.jsx";

export function dataColumnBuilder(currentAbsenteeElection, baseAbsenteeElection, currentElectionRace, previousElectionRace) {
  return [
    absenteeComparisonColumnsBuilder(),
    absenteeColumnsBuilder(currentAbsenteeElection, "absenteeCurrent"),
    absenteeColumnsBuilder(baseAbsenteeElection, "absenteeBase"),
    electionResultColumnsBuilder(currentElectionRace, "electionResultsCurrent"),
    electionResultColumnsBuilder(previousElectionRace, "electionResultsBase"),
    electionResultComparisonColumnsBuilder(),
    demographicColumnBuilder(),
  ];
}

export function idColumnBuilder(isCountyLevel, updateIsCountyLevel, updateCountyFilter, updateActiveSelection, navigate, currentDisplayMode) {
  const idColumnsParent = [
    {
      id: "county",
      accessorKey: "CTYNAME",
      meta: { title: "County" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="County" />,
      cell: ({ getValue }) =>
        isCountyLevel ? (
          <button
            type="button"
            className="text-left underline hover:no-underline"
            onClick={() => {
              const countyName = getValue();
              navigate({ to: `/counties/${encodeURIComponent(countyName)}/${currentDisplayMode}` });
              updateIsCountyLevel(false);
              updateCountyFilter(countyName);
              updateActiveSelection(countyName);
            }}
          >
            {getValue()}
          </button>
        ) : (
          <span>{getValue()}</span>
        ),
      enableHiding: false,
    },
  ];
  if (!isCountyLevel) {
    idColumnsParent.push({
      id: "precinct",
      accessorKey: "PRECINCT_N",
      meta: { title: "Precinct" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="Precinct" />,
    });
  }
  return idColumnsParent;
}

const absenteeComparisonColumnsBuilder = () => {
  const children = [
    {
      id: "turnoutAbsenteeBallotsSameDay",
      meta: { title: "Ratio on Same Day" },
      header: ({ column }) => <DataTableColumnHeader column={column} title={column.columnDef.meta.title} />,
      accessorFn: (originalRow) => originalRow?.absenteeBallotComparison?.turnoutAbsenteeBallotsSameDay,
      cell: ({ getValue }) => <DataTableCellNumeric>{numberFormatRatio.format(getValue())}</DataTableCellNumeric>,
    },
    {
      id: "turnoutAbsenteeBallots",
      meta: { title: "Ratio on All" },
      header: ({ column }) => <DataTableColumnHeader column={column} title={column.columnDef.meta.title} />,
      accessorFn: (originalRow) => originalRow?.absenteeBallotComparison?.turnoutAbsenteeBallots,
      cell: ({ getValue }) => <DataTableCellNumeric>{numberFormatRatio.format(getValue())}</DataTableCellNumeric>,
    },
  ];
  return {
    header: "Comparison of Absentee Ballots",
    meta: { title: "Comparison of Absentee Ballots" },
    id: "absCompare",
    columns: children,
  };
};

const absenteeColumnsBuilder = (electionInfo, absenteeElectionColumn) => {
  const children = [
    {
      id: `${absenteeElectionColumn}##absenteeVotesAsOfCurrentDate`,
      meta: { title: "At Same Days to Election" },
      header: ({ column }) => <DataTableColumnHeader column={column} title={column.columnDef.meta.title} />,
      accessorFn: (originalRow) => originalRow[absenteeElectionColumn]?.absenteeVotesAsOfCurrentDate,
      cell: ({ getValue }) => <DataTableCellNumeric>{numberFormat.format(getValue())}</DataTableCellNumeric>,
    },
    {
      id: `${absenteeElectionColumn}##totalAbsenteeVotes`,
      meta: { title: "Totals" },
      header: ({ column }) => <DataTableColumnHeader column={column} title={column.columnDef.meta.title} />,
      accessorFn: (originalRow) => originalRow[absenteeElectionColumn]?.totalAbsenteeVotes,
      cell: ({ getValue }) => <DataTableCellNumeric>{numberFormat.format(getValue())}</DataTableCellNumeric>,
    },
  ];
  return {
    id: `absBallots##${electionInfo?.name}`,
    meta: { title: `Absentee Ballots - ${electionInfo?.label}` },
    header: `Absentee Ballots - ${electionInfo?.label}`,
    columns: children,
  };
};

const electionResultColumnsBuilder = (raceInfo, raceColumn) => {
  const children = [
    {
      id: `${raceColumn}##republican`,
      meta: { title: `${raceInfo?.republican} (R)` },
      header: ({ column }) => <DataTableColumnHeader column={column} title={column.columnDef.meta.title} />,
      accessorFn: (originalRow) => originalRow[raceColumn]?.republican,
      cell: ({ getValue }) => <DataTableCellNumeric>{numberFormat.format(getValue())}</DataTableCellNumeric>,
    },
    {
      id: `${raceColumn}##perRepublican`,
      meta: { title: `${raceInfo?.republican} (R) %` },
      header: ({ column }) => <DataTableColumnHeader column={column} title={column.columnDef.meta.title} />,
      accessorFn: (originalRow) => originalRow[raceColumn]?.perRepublican,
      cell: ({ getValue }) => <DataTableCellNumeric>{numberFormatPercent.format(getValue())}</DataTableCellNumeric>,
    },
    {
      id: `${raceColumn}##democratic`,
      meta: { title: `${raceInfo?.democratic} (D)` },
      header: ({ column }) => <DataTableColumnHeader column={column} title={column.columnDef.meta.title} />,
      accessorFn: (originalRow) => {
        return originalRow[raceColumn]?.democratic;
      },
      cell: ({ getValue }) => <DataTableCellNumeric>{numberFormat.format(getValue())}</DataTableCellNumeric>,
    },
    {
      id: `${raceColumn}##perDemocratic`,
      meta: { title: `${raceInfo?.democratic} (D) %` },
      header: ({ column }) => <DataTableColumnHeader column={column} title={column.columnDef.meta.title} />,
      accessorFn: (originalRow) => originalRow[raceColumn]?.perDemocratic,
      cell: ({ getValue }) => <DataTableCellNumeric>{numberFormatPercent.format(getValue())}</DataTableCellNumeric>,
    },
    {
      id: `${raceColumn}##other`,
      meta: { title: "Other Candidates" },
      header: ({ column }) => <DataTableColumnHeader column={column} title={column.columnDef.meta.title} />,
      accessorFn: (originalRow) => originalRow[raceColumn]?.other,
      cell: ({ getValue }) => <DataTableCellNumeric>{numberFormat.format(getValue())}</DataTableCellNumeric>,
    },
    {
      id: `${raceColumn}##perOther`,
      meta: { title: "Other %" },
      header: ({ column }) => <DataTableColumnHeader column={column} title={column.columnDef.meta.title} />,
      accessorFn: (originalRow) => originalRow[raceColumn]?.perOther,
      cell: ({ getValue }) => <DataTableCellNumeric>{numberFormatPercent.format(getValue())}</DataTableCellNumeric>,
    },
    {
      id: `${raceColumn}##totalVotes`,
      meta: { title: "Total" },
      header: ({ column }) => <DataTableColumnHeader column={column} title={column.columnDef.meta.title} />,
      accessorFn: (originalRow) => originalRow[raceColumn]?.totalVotes,
      cell: ({ getValue }) => <DataTableCellNumeric>{numberFormat.format(getValue())}</DataTableCellNumeric>,
    },
    {
      id: `${raceColumn}##marginDemocratic`,
      meta: { title: "Margin" },
      header: ({ column }) => <DataTableColumnHeader column={column} title={column.columnDef.meta.title} />,
      accessorFn: (originalRow) => originalRow[raceColumn]?.marginDemocratic,
      cell: ({ getValue }) => (
        <DataTableCellNumeric>
          {RDIndicator(getValue())} {numberFormat.format(Math.abs(getValue()))}
        </DataTableCellNumeric>
      ),
    },
    {
      id: `${raceColumn}##marginPerPerDemocratic`,
      meta: { title: "Margin %" },
      header: ({ column }) => <DataTableColumnHeader column={column} title={column.columnDef.meta.title} />,
      accessorFn: (originalRow) => originalRow[raceColumn]?.marginPerPerDemocratic,
      cell: ({ getValue }) => (
        <DataTableCellNumeric>
          {RDIndicator(getValue())} {numberFormatPercent.format(Math.abs(getValue()))}
        </DataTableCellNumeric>
      ),
    },
    {
      id: `${raceColumn}##marginEarlyPerRepublican`,
      meta: { title: "Early Vote Margin %" },
      header: ({ column }) => <DataTableColumnHeader column={column} title={column.columnDef.meta.title} />,
      accessorFn: (originalRow) => originalRow[raceColumn]?.marginEarlyPerRepublican,
      cell: ({ getValue }) => (
        <DataTableCellNumeric>
          {RDIndicator(-1 * getValue())} {numberFormatPercent.format(Math.abs(getValue()))}
        </DataTableCellNumeric>
      ),
    },
  ];
  return {
    id: `electionResult##${raceInfo?.election?.label}##${raceInfo?.name}`,
    meta: { title: `${raceInfo?.election?.label} - ${raceInfo?.name}` },
    header: ({ column }) => <DataTableColumnHeader column={column} title={column.columnDef.meta.title} />,
    columns: children,
  };
};

const electionResultComparisonColumnsBuilder = () => {
  const children = [
    {
      id: "perShiftDemocratic",
      meta: { title: "Swing (Shift in R/D %)" },
      header: ({ column }) => <DataTableColumnHeader column={column} title={column.columnDef.meta.title} />,
      accessorFn: (originalRow) => originalRow?.electionResultsComparison?.perShiftDemocratic,
      cell: ({ getValue }) => (
        <DataTableCellNumeric>
          {RDIndicator(getValue())} {numberFormatPercent.format(Math.abs(getValue()))}
        </DataTableCellNumeric>
      ),
    },
    {
      id: "totalVotesPercent",
      meta: { title: "% of Previous Turnout" },
      header: ({ column }) => <DataTableColumnHeader column={column} title={column.columnDef.meta.title} />,
      accessorFn: (originalRow) => originalRow?.electionResultsComparison?.totalVotesPercent,
      cell: ({ getValue }) => <DataTableCellNumeric>{numberFormatPercent.format(getValue())}</DataTableCellNumeric>,
    },
    {
      id: "voteShiftDemocraticNormalized",
      meta: { title: "Shift in Vote Margin (Normalized)" },
      header: ({ column }) => <DataTableColumnHeader column={column} title={column.columnDef.meta.title} />,
      accessorFn: (originalRow) => originalRow?.electionResultsComparison?.voteShiftDemocraticNormalized,
      cell: ({ getValue }) => (
        <DataTableCellNumeric>
          {RDIndicator(getValue())} {numberFormat.format(Math.abs(getValue()))}
        </DataTableCellNumeric>
      ),
    },
    {
      id: "perShiftRepublicanEarly",
      meta: { title: "EV Shift in R/D %" },
      header: ({ column }) => <DataTableColumnHeader column={column} title={column.columnDef.meta.title} />,
      accessorFn: (originalRow) => originalRow?.electionResultsComparison?.perShiftRepublicanEarly,
      cell: ({ getValue }) => (
        <DataTableCellNumeric>
          {RDIndicator(-1 * getValue())} {numberFormatPercent.format(Math.abs(getValue()))}
        </DataTableCellNumeric>
      ),
    },
  ];
  return {
    id: "electionResultCompare",
    meta: { title: "Comparison of Election Results" },
    header: ({ column }) => <DataTableColumnHeader column={column} title={column.columnDef.meta.title} />,
    columns: children,
  };
};

const demographicColumnBuilder = () => {
  const children = [
    {
      id: "demographics##whitePer",
      meta: { title: "White %" },
      header: ({ column }) => <DataTableColumnHeader column={column} title={column.columnDef.meta.title} />,
      accessorFn: (originalRow) => originalRow?.demographics?.whitePer,
      cell: ({ getValue }) => <DataTableCellNumeric>{numberFormatPercent.format(getValue())}</DataTableCellNumeric>,
    },
    {
      id: "demographics##blackPer",
      meta: { title: "Black %" },
      header: ({ column }) => <DataTableColumnHeader column={column} title={column.columnDef.meta.title} />,
      accessorFn: (originalRow) => originalRow?.demographics?.blackPer,
      cell: ({ getValue }) => <DataTableCellNumeric>{numberFormatPercent.format(getValue())}</DataTableCellNumeric>,
    },
    {
      id: "demographics##hispanicPer",
      meta: { title: "Hispanic %" },
      header: ({ column }) => <DataTableColumnHeader column={column} title={column.columnDef.meta.title} />,
      accessorFn: (originalRow) => originalRow?.demographics?.hispanicPer,
      cell: ({ getValue }) => <DataTableCellNumeric>{numberFormatPercent.format(getValue())}</DataTableCellNumeric>,
    },
    {
      id: "demographics##asianPer",
      meta: { title: "Asian %" },
      header: ({ column }) => <DataTableColumnHeader column={column} title={column.columnDef.meta.title} />,
      accessorFn: (originalRow) => {
        return originalRow?.demographics?.asianPer;
      },
      cell: ({ getValue }) => <DataTableCellNumeric>{numberFormatPercent.format(getValue())}</DataTableCellNumeric>,
    },
    {
      id: "demographics##unknownPer",
      meta: { title: "Unknown %" },
      header: ({ column }) => <DataTableColumnHeader column={column} title={column.columnDef.meta.title} />,
      accessorFn: (originalRow) => originalRow?.demographics?.unknownPer,
      cell: ({ getValue }) => <DataTableCellNumeric>{numberFormatPercent.format(getValue())}</DataTableCellNumeric>,
    },
  ];
  return {
    id: "demographics",
    meta: { title: "Demographics" },
    header: ({ column }) => <DataTableColumnHeader column={column} title={column.columnDef.meta.title} />,
    columns: children,
  };
};
