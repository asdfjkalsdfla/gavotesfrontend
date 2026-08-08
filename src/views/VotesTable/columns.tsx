import type { ColumnDef } from "@tanstack/react-table";
import type { useNavigate } from "@tanstack/react-router";
import { DataTableColumnHeader } from "./DataTableColumnHeader.tsx";
import { DataTableCellNumeric } from "./DataTableCellNumeric.tsx";
import { numberFormat, numberFormatPercent, numberFormatRatio, RDIndicator } from "../../Utils.jsx";
import type CombinedElectionRow from "../../lib/electionResults/CombinedElectionRow.ts";
import type { Election, ElectionRace } from "../../lib/electionResults/types.ts";
import type { DataTableFeatures } from "./data-table-features.ts";

type NavigateFn = ReturnType<typeof useNavigate>;

export function dataColumnBuilder(
  currentAbsenteeElection: Election | undefined,
  baseAbsenteeElection: Election | undefined,
  currentElectionRace: ElectionRace | undefined,
  previousElectionRace: ElectionRace | undefined,
): ColumnDef<DataTableFeatures, CombinedElectionRow>[] {
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

export function idColumnBuilder(
  isCountyLevel: boolean,
  updateIsCountyLevel: (value: boolean) => void,
  navigate: NavigateFn,
  updateActiveSelection: (value: string | null) => void,
): ColumnDef<DataTableFeatures, CombinedElectionRow>[] {
  const idColumnsParent: ColumnDef<DataTableFeatures, CombinedElectionRow>[] = [
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
              const countyName = getValue<string>();
              navigate({ to: `/counties/${encodeURIComponent(countyName)}/table` });
              updateIsCountyLevel(false);
              updateActiveSelection(countyName);
            }}
          >
            {getValue<string>()}
          </button>
        ) : (
          <span>{getValue<string>()}</span>
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

const absenteeComparisonColumnsBuilder = (): ColumnDef<DataTableFeatures, CombinedElectionRow> => {
  const children: ColumnDef<DataTableFeatures, CombinedElectionRow>[] = [
    {
      id: "turnoutAbsenteeBallotsSameDay",
      meta: { title: "Ratio on Same Day" },
      header: ({ column }) => <DataTableColumnHeader column={column} title={column.columnDef.meta?.title ?? ""} />,
      accessorFn: (originalRow) => originalRow?.absenteeBallotComparison?.turnoutAbsenteeBallotsSameDay,
      cell: ({ getValue }) => <DataTableCellNumeric>{numberFormatRatio.format(getValue<number | undefined>() ?? 0)}</DataTableCellNumeric>,
    },
    {
      id: "turnoutAbsenteeBallots",
      meta: { title: "Ratio on All" },
      header: ({ column }) => <DataTableColumnHeader column={column} title={column.columnDef.meta?.title ?? ""} />,
      accessorFn: (originalRow) => originalRow?.absenteeBallotComparison?.turnoutAbsenteeBallots,
      cell: ({ getValue }) => <DataTableCellNumeric>{numberFormatRatio.format(getValue<number | undefined>() ?? 0)}</DataTableCellNumeric>,
    },
  ];
  return {
    header: "Comparison of Absentee Ballots",
    meta: { title: "Comparison of Absentee Ballots" },
    id: "absCompare",
    columns: children,
  };
};

const absenteeColumnsBuilder = (electionInfo: Election | undefined, absenteeElectionColumn: "absenteeCurrent" | "absenteeBase"): ColumnDef<DataTableFeatures, CombinedElectionRow> => {
  const children: ColumnDef<DataTableFeatures, CombinedElectionRow>[] = [
    {
      id: `${absenteeElectionColumn}##absenteeVotesAsOfCurrentDate`,
      meta: { title: "At Same Days to Election" },
      header: ({ column }) => <DataTableColumnHeader column={column} title={column.columnDef.meta?.title ?? ""} />,
      accessorFn: (originalRow) => originalRow[absenteeElectionColumn]?.absenteeVotesAsOfCurrentDate,
      cell: ({ getValue }) => <DataTableCellNumeric>{numberFormat.format(getValue<number | undefined>() ?? 0)}</DataTableCellNumeric>,
    },
    {
      id: `${absenteeElectionColumn}##totalAbsenteeVotes`,
      meta: { title: "Totals" },
      header: ({ column }) => <DataTableColumnHeader column={column} title={column.columnDef.meta?.title ?? ""} />,
      accessorFn: (originalRow) => originalRow[absenteeElectionColumn]?.totalAbsenteeVotes,
      cell: ({ getValue }) => <DataTableCellNumeric>{numberFormat.format(getValue<number | undefined>() ?? 0)}</DataTableCellNumeric>,
    },
  ];
  return {
    id: `absBallots##${electionInfo?.name}`,
    meta: { title: `Absentee Ballots - ${electionInfo?.label}` },
    header: `Absentee Ballots - ${electionInfo?.label}`,
    columns: children,
  };
};

const electionResultColumnsBuilder = (raceInfo: ElectionRace | undefined, raceColumn: "electionResultsCurrent" | "electionResultsBase"): ColumnDef<DataTableFeatures, CombinedElectionRow> => {
  const children: ColumnDef<DataTableFeatures, CombinedElectionRow>[] = [
    {
      id: `${raceColumn}##republican`,
      meta: { title: `${raceInfo?.republican} (R)` },
      header: ({ column }) => <DataTableColumnHeader column={column} title={column.columnDef.meta?.title ?? ""} />,
      accessorFn: (originalRow) => originalRow[raceColumn]?.republican,
      cell: ({ getValue }) => <DataTableCellNumeric>{numberFormat.format(getValue<number | undefined>() ?? 0)}</DataTableCellNumeric>,
    },
    {
      id: `${raceColumn}##perRepublican`,
      meta: { title: `${raceInfo?.republican} (R) %` },
      header: ({ column }) => <DataTableColumnHeader column={column} title={column.columnDef.meta?.title ?? ""} />,
      accessorFn: (originalRow) => originalRow[raceColumn]?.perRepublican,
      cell: ({ getValue }) => <DataTableCellNumeric>{numberFormatPercent.format(getValue<number | undefined>() ?? 0)}</DataTableCellNumeric>,
    },
    {
      id: `${raceColumn}##democratic`,
      meta: { title: `${raceInfo?.democratic} (D)` },
      header: ({ column }) => <DataTableColumnHeader column={column} title={column.columnDef.meta?.title ?? ""} />,
      accessorFn: (originalRow) => {
        return originalRow[raceColumn]?.democratic;
      },
      cell: ({ getValue }) => <DataTableCellNumeric>{numberFormat.format(getValue<number | undefined>() ?? 0)}</DataTableCellNumeric>,
    },
    {
      id: `${raceColumn}##perDemocratic`,
      meta: { title: `${raceInfo?.democratic} (D) %` },
      header: ({ column }) => <DataTableColumnHeader column={column} title={column.columnDef.meta?.title ?? ""} />,
      accessorFn: (originalRow) => originalRow[raceColumn]?.perDemocratic,
      cell: ({ getValue }) => <DataTableCellNumeric>{numberFormatPercent.format(getValue<number | undefined>() ?? 0)}</DataTableCellNumeric>,
    },
    {
      id: `${raceColumn}##other`,
      meta: { title: "Other Candidates" },
      header: ({ column }) => <DataTableColumnHeader column={column} title={column.columnDef.meta?.title ?? ""} />,
      accessorFn: (originalRow) => originalRow[raceColumn]?.other,
      cell: ({ getValue }) => <DataTableCellNumeric>{numberFormat.format(getValue<number | undefined>() ?? 0)}</DataTableCellNumeric>,
    },
    {
      id: `${raceColumn}##perOther`,
      meta: { title: "Other %" },
      header: ({ column }) => <DataTableColumnHeader column={column} title={column.columnDef.meta?.title ?? ""} />,
      accessorFn: (originalRow) => originalRow[raceColumn]?.perOther,
      cell: ({ getValue }) => <DataTableCellNumeric>{numberFormatPercent.format(getValue<number | undefined>() ?? 0)}</DataTableCellNumeric>,
    },
    {
      id: `${raceColumn}##totalVotes`,
      meta: { title: "Total" },
      header: ({ column }) => <DataTableColumnHeader column={column} title={column.columnDef.meta?.title ?? ""} />,
      accessorFn: (originalRow) => originalRow[raceColumn]?.totalVotes,
      cell: ({ getValue }) => <DataTableCellNumeric>{numberFormat.format(getValue<number | undefined>() ?? 0)}</DataTableCellNumeric>,
    },
    {
      id: `${raceColumn}##marginDemocratic`,
      meta: { title: "Margin" },
      header: ({ column }) => <DataTableColumnHeader column={column} title={column.columnDef.meta?.title ?? ""} />,
      accessorFn: (originalRow) => originalRow[raceColumn]?.marginDemocratic,
      cell: ({ getValue }) => {
        const value = getValue<number | undefined>() ?? 0;
        return (
          <DataTableCellNumeric>
            {RDIndicator(value)} {numberFormat.format(Math.abs(value))}
          </DataTableCellNumeric>
        );
      },
    },
    {
      id: `${raceColumn}##marginPerPerDemocratic`,
      meta: { title: "Margin %" },
      header: ({ column }) => <DataTableColumnHeader column={column} title={column.columnDef.meta?.title ?? ""} />,
      accessorFn: (originalRow) => originalRow[raceColumn]?.marginPerPerDemocratic,
      cell: ({ getValue }) => {
        const value = getValue<number | undefined>() ?? 0;
        return (
          <DataTableCellNumeric>
            {RDIndicator(value)} {numberFormatPercent.format(Math.abs(value))}
          </DataTableCellNumeric>
        );
      },
    },
    {
      id: `${raceColumn}##marginEarlyPerRepublican`,
      meta: { title: "Early Vote Margin %" },
      header: ({ column }) => <DataTableColumnHeader column={column} title={column.columnDef.meta?.title ?? ""} />,
      accessorFn: (originalRow) => originalRow[raceColumn]?.marginEarlyPerRepublican,
      cell: ({ getValue }) => {
        const value = getValue<number | undefined>() ?? 0;
        return (
          <DataTableCellNumeric>
            {RDIndicator(-1 * value)} {numberFormatPercent.format(Math.abs(value))}
          </DataTableCellNumeric>
        );
      },
    },
  ];
  return {
    id: `electionResult##${raceInfo?.election?.label}##${raceInfo?.name}`,
    meta: { title: `${raceInfo?.election?.label} - ${raceInfo?.name}` },
    header: ({ column }) => <DataTableColumnHeader column={column} title={column.columnDef.meta?.title ?? ""} />,
    columns: children,
  };
};

const electionResultComparisonColumnsBuilder = (): ColumnDef<DataTableFeatures, CombinedElectionRow> => {
  const children: ColumnDef<DataTableFeatures, CombinedElectionRow>[] = [
    {
      id: "perShiftDemocratic",
      meta: { title: "Swing (Shift in R/D %)" },
      header: ({ column }) => <DataTableColumnHeader column={column} title={column.columnDef.meta?.title ?? ""} />,
      accessorFn: (originalRow) => originalRow?.electionResultsComparison?.perShiftDemocratic,
      cell: ({ getValue }) => {
        const value = getValue<number | undefined>() ?? 0;
        return (
          <DataTableCellNumeric>
            {RDIndicator(value)} {numberFormatPercent.format(Math.abs(value))}
          </DataTableCellNumeric>
        );
      },
    },
    {
      id: "totalVotesPercent",
      meta: { title: "% of Previous Turnout" },
      header: ({ column }) => <DataTableColumnHeader column={column} title={column.columnDef.meta?.title ?? ""} />,
      accessorFn: (originalRow) => originalRow?.electionResultsComparison?.totalVotesPercent,
      cell: ({ getValue }) => <DataTableCellNumeric>{numberFormatPercent.format(getValue<number | undefined>() ?? 0)}</DataTableCellNumeric>,
    },
    {
      id: "voteShiftDemocraticNormalized",
      meta: { title: "Shift in Vote Margin (Normalized)" },
      header: ({ column }) => <DataTableColumnHeader column={column} title={column.columnDef.meta?.title ?? ""} />,
      accessorFn: (originalRow) => originalRow?.electionResultsComparison?.voteShiftDemocraticNormalized,
      cell: ({ getValue }) => {
        const value = getValue<number | undefined>() ?? 0;
        return (
          <DataTableCellNumeric>
            {RDIndicator(value)} {numberFormat.format(Math.abs(value))}
          </DataTableCellNumeric>
        );
      },
    },
    {
      id: "perShiftRepublicanEarly",
      meta: { title: "EV Shift in R/D %" },
      header: ({ column }) => <DataTableColumnHeader column={column} title={column.columnDef.meta?.title ?? ""} />,
      accessorFn: (originalRow) => originalRow?.electionResultsComparison?.perShiftRepublicanEarly,
      cell: ({ getValue }) => {
        const value = getValue<number | undefined>() ?? 0;
        return (
          <DataTableCellNumeric>
            {RDIndicator(-1 * value)} {numberFormatPercent.format(Math.abs(value))}
          </DataTableCellNumeric>
        );
      },
    },
  ];
  return {
    id: "electionResultCompare",
    meta: { title: "Comparison of Election Results" },
    header: ({ column }) => <DataTableColumnHeader column={column} title={column.columnDef.meta?.title ?? ""} />,
    columns: children,
  };
};

const demographicColumnBuilder = (): ColumnDef<DataTableFeatures, CombinedElectionRow> => {
  const children: ColumnDef<DataTableFeatures, CombinedElectionRow>[] = [
    {
      id: "demographics##whitePer",
      meta: { title: "White %" },
      header: ({ column }) => <DataTableColumnHeader column={column} title={column.columnDef.meta?.title ?? ""} />,
      accessorFn: (originalRow) => originalRow?.demographics?.whitePer,
      cell: ({ getValue }) => <DataTableCellNumeric>{numberFormatPercent.format(getValue<number | undefined>() ?? 0)}</DataTableCellNumeric>,
    },
    {
      id: "demographics##blackPer",
      meta: { title: "Black %" },
      header: ({ column }) => <DataTableColumnHeader column={column} title={column.columnDef.meta?.title ?? ""} />,
      accessorFn: (originalRow) => originalRow?.demographics?.blackPer,
      cell: ({ getValue }) => <DataTableCellNumeric>{numberFormatPercent.format(getValue<number | undefined>() ?? 0)}</DataTableCellNumeric>,
    },
    {
      id: "demographics##hispanicPer",
      meta: { title: "Hispanic %" },
      header: ({ column }) => <DataTableColumnHeader column={column} title={column.columnDef.meta?.title ?? ""} />,
      accessorFn: (originalRow) => originalRow?.demographics?.hispanicPer,
      cell: ({ getValue }) => <DataTableCellNumeric>{numberFormatPercent.format(getValue<number | undefined>() ?? 0)}</DataTableCellNumeric>,
    },
    {
      id: "demographics##asianPer",
      meta: { title: "Asian %" },
      header: ({ column }) => <DataTableColumnHeader column={column} title={column.columnDef.meta?.title ?? ""} />,
      accessorFn: (originalRow) => {
        return originalRow?.demographics?.asianPer;
      },
      cell: ({ getValue }) => <DataTableCellNumeric>{numberFormatPercent.format(getValue<number | undefined>() ?? 0)}</DataTableCellNumeric>,
    },
    {
      id: "demographics##unknownPer",
      meta: { title: "Unknown %" },
      header: ({ column }) => <DataTableColumnHeader column={column} title={column.columnDef.meta?.title ?? ""} />,
      accessorFn: (originalRow) => originalRow?.demographics?.unknownPer,
      cell: ({ getValue }) => <DataTableCellNumeric>{numberFormatPercent.format(getValue<number | undefined>() ?? 0)}</DataTableCellNumeric>,
    },
  ];
  return {
    id: "demographics",
    meta: { title: "Demographics" },
    header: ({ column }) => <DataTableColumnHeader column={column} title={column.columnDef.meta?.title ?? ""} />,
    columns: children,
  };
};
