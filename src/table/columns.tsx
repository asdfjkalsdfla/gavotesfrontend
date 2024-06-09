import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "./DataTableColumnHeader.tsx";
import { DataTableCellNumeric } from "./DataTableCellNumeric.tsx";
import { numberFormat, numberFormatPercent, numberFormatRatio, RDIndicator, sortNumeric } from "../Utils.jsx";

export function dataColumnBuilder(currentAbsenteeElection : any, baseAbsenteeElection : any, currentElectionRace: any, previousElectionRace: any): ColumnDef<any>[] {
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

export function idColumnBuilder(isCountyLevel: Boolean, updateIsCountyLevel: Function, updateCountyFilter: Function, updateActiveSelection: Function): ColumnDef<any>[] {
  const idColumnsParent: ColumnDef<any>[] = [
    {
      id: "county",
      accessorKey: "CTYNAME",
      header: ({ column }) => <DataTableColumnHeader column={column} title="County" />,
      cell: ({ getValue, row }) =>
        isCountyLevel ? (
          <a
            onClick={() => {
              updateIsCountyLevel(false);
              updateActiveSelection(null);
              updateCountyFilter(row.CTYNAME);
            }}
          >
            {getValue()}
          </a>
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
      header: ({ column }) => <DataTableColumnHeader column={column} title="Precinct" />,
    });
  }
  return idColumnsParent;
}

const absenteeComparisonColumnsBuilder = (): ColumnDef<any> => {
  const children: ColumnDef<any>[] = [
    {
      id: "turnoutAbsenteeBallotsSameDay",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Ratio on Same Day" />,
      accessorFn: (originalRow) => originalRow?.absenteeBallotComparison?.absenteeVotesAsOfCurrentDate,
      cell: ({ getValue }) => <DataTableCellNumeric>{numberFormatRatio.format(getValue())}</DataTableCellNumeric>,
    },
    {
      id: "turnoutAbsenteeBallots",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Ratio on All" />,
      accessorFn: (originalRow) => originalRow?.absenteeBallotComparison?.turnoutAbsenteeBallots,
      cell: ({ getValue }) => <DataTableCellNumeric>{numberFormatRatio.format(getValue())}</DataTableCellNumeric>,
    },
  ];
  return {
    header: "Comparison of Absentee Ballots",
    id: "absCompare",
    columns: children,
  };
};

const absenteeColumnsBuilder = (electionInfo, absenteeElectionColumn): ColumnDef<any> => {
  const children: ColumnDef<any>[] = [
    {
      id: `${absenteeElectionColumn}##absenteeVotesAsOfCurrentDate`,
      header: ({ column }) => <DataTableColumnHeader column={column} title="At Same Days to Election" />,
      accessorFn: (originalRow) => originalRow[absenteeElectionColumn]?.absenteeVotesAsOfCurrentDate,
      cell: ({ getValue }) => <DataTableCellNumeric>{numberFormat.format(getValue())}</DataTableCellNumeric>,
    },
    {
      id: `${absenteeElectionColumn}##totalAbsenteeVotes`,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Totals" />,
      accessorFn: (originalRow) => originalRow[absenteeElectionColumn]?.totalAbsenteeVotes,
      cell: ({ getValue }) => <DataTableCellNumeric>{numberFormat.format(getValue())}</DataTableCellNumeric>,
    },
  ];
  return {
    header: `Absentee Ballots - ${electionInfo?.label}`,
    id: `absBallots##${electionInfo?.name}`,
    columns: children,
  };
};

const electionResultColumnsBuilder = (raceInfo, raceColumn): ColumnDef<any> => {
  const children: ColumnDef<any>[] = [
    {
      id: `${raceColumn}##republican`,
      header: ({ column }) => <DataTableColumnHeader column={column} title={`${raceInfo?.republican} (R)`} />,
      accessorFn: (originalRow) => originalRow[raceColumn]?.republican,
      cell: ({ getValue }) => <DataTableCellNumeric>{numberFormat.format(getValue())}</DataTableCellNumeric>,
    },
    {
      id: `${raceColumn}##perRepublican`,
      header: ({ column }) => <DataTableColumnHeader column={column} title={`${raceInfo?.republican} (R) %`} />,
      accessorFn: (originalRow) => originalRow[raceColumn]?.perRepublican,
      cell: ({ getValue }) => <DataTableCellNumeric>{numberFormatPercent.format(getValue())}</DataTableCellNumeric>,
    },
    {
      id: `${raceColumn}##democratic`,
      header: ({ column }) => <DataTableColumnHeader column={column} title={`${raceInfo?.democratic} (D)`} />,
      accessorFn: (originalRow) => {
        return originalRow[raceColumn]?.democratic;
      },
      cell: ({ getValue }) => <DataTableCellNumeric>{numberFormat.format(getValue())}</DataTableCellNumeric>,
    },
    {
      id: `${raceColumn}##perDemocratic`,
      header: ({ column }) => <DataTableColumnHeader column={column} title={`${raceInfo?.republican} (D) %`} />,
      accessorFn: (originalRow) => originalRow[raceColumn]?.perDemocratic,
      cell: ({ getValue }) => <DataTableCellNumeric>{numberFormatPercent.format(getValue())}</DataTableCellNumeric>,
    },
    {
      id: `${raceColumn}##other`,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Other Candidates" />,
      accessorFn: (originalRow) => originalRow[raceColumn]?.other,
      cell: ({ getValue }) => <DataTableCellNumeric>{numberFormat.format(getValue())}</DataTableCellNumeric>,
    },
    {
      id: `${raceColumn}##perOther`,
      header: ({ column }) => <DataTableColumnHeader column={column} title={`Other %`} />,
      accessorFn: (originalRow) => originalRow[raceColumn]?.perOther,
      cell: ({ getValue }) => <DataTableCellNumeric>{numberFormatPercent.format(getValue())}</DataTableCellNumeric>,
    },
    {
      id: `${raceColumn}##totalVotes`,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Total" />,
      accessorFn: (originalRow) => originalRow[raceColumn]?.totalVotes,
      cell: ({ getValue }) => <DataTableCellNumeric>{numberFormat.format(getValue())}</DataTableCellNumeric>,
    },
    {
      id: `${raceColumn}##marginDemocratic`,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Margin" />,
      accessorFn: (originalRow) => originalRow[raceColumn]?.marginDemocratic,
      cell: ({ getValue }) => (
        <DataTableCellNumeric>
          {RDIndicator(getValue())} {numberFormat.format(Math.abs(getValue()))}
        </DataTableCellNumeric>
      ),
    },
    {
      id: `${raceColumn}##marginPerPerDemocratic`,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Margin %" />,
      accessorFn: (originalRow) => originalRow[raceColumn]?.marginPerPerDemocratic,
      cell: ({ getValue }) => (
        <DataTableCellNumeric>
          {RDIndicator(getValue())} {numberFormatPercent.format(Math.abs(getValue()))}
        </DataTableCellNumeric>
      ),
    },
    {
      id: `${raceColumn}##marginEarlyPerRepublican`,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Early Vote Margin %" />,
      accessorFn: (originalRow) => originalRow[raceColumn]?.marginEarlyPerRepublican,
      cell: ({ getValue }) => (
        <DataTableCellNumeric>
          {RDIndicator(-1 * getValue())} {numberFormatPercent.format(Math.abs(getValue()))}
        </DataTableCellNumeric>
      ),
    },
  ];
  return {
    header: `${raceInfo?.election?.label} - ${raceInfo?.name}`,
    id: `electionResult##${raceInfo?.election?.label}##${raceInfo?.name}`,
    columns: children,
  };
};

const electionResultComparisonColumnsBuilder = (): ColumnDef<any> => {
  const children: ColumnDef<any>[] = [
    {
      id: "perShiftDemocratic",
      header: "Swing (Shift in R/D %)",
      accessorFn: (originalRow) => originalRow?.electionResultsComparison?.perShiftDemocratic,
      cell: ({ getValue }) => (
        <DataTableCellNumeric>
          {RDIndicator(getValue())} {numberFormatPercent.format(Math.abs(getValue()))}
        </DataTableCellNumeric>
      ),
    },
    {
      id: "totalVotesPercent",
      header: "% of Previous Turnout",
      accessorFn: (originalRow) => originalRow?.electionResultsComparison?.totalVotesPercent,
      cell: ({ getValue }) => <DataTableCellNumeric>{numberFormatPercent.format(getValue())}</DataTableCellNumeric>,
    },
    {
      id: "voteShiftDemocraticNormalized",
      header: "Shift in Vote Margin (Normalized)",
      accessorFn: (originalRow) => originalRow?.electionResultsComparison?.voteShiftDemocraticNormalized,
      cell: ({ getValue }) => (
        <DataTableCellNumeric>
          {RDIndicator(getValue())} {numberFormat.format(Math.abs(getValue()))}
        </DataTableCellNumeric>
      ),
    },
    {
      id: "perShiftRepublicanEarly",
      header: "EV Shift in R/D %",
      accessorFn: (originalRow) => originalRow?.electionResultsComparison?.perShiftRepublicanEarly,
      cell: ({ getValue }) => (
        <DataTableCellNumeric>
          {RDIndicator(-1 * getValue())} {numberFormatPercent.format(Math.abs(getValue()))}
        </DataTableCellNumeric>
      ),
    },
  ];
  return {
    header: "Comparison of Election Results",
    id: "electionResultCompare",
    columns: children,
  };
};

const demographicColumnBuilder = (): ColumnDef<any> => {
  const children: ColumnDef<any>[] = [
    {
      id: "demographics##whitePer",
      header: "White %",
      accessorFn: (originalRow) => originalRow?.demographics?.whitePer,
      cell: ({ getValue }) => <DataTableCellNumeric>{numberFormatPercent.format(getValue())}</DataTableCellNumeric>,
    },
    {
      id: "demographics##blackPer",
      header: "Black %",
      accessorFn: (originalRow) => originalRow?.demographics?.blackPer,
      cell: ({ getValue }) => <DataTableCellNumeric>{numberFormatPercent.format(getValue())}</DataTableCellNumeric>,
    },
    {
      id: "demographics##hispanicPer",
      header: "Hispanic %",
      accessorFn: (originalRow) => originalRow?.demographics?.hispanicPer,
      cell: ({ getValue }) => <DataTableCellNumeric>{numberFormatPercent.format(getValue())}</DataTableCellNumeric>,
    },
    {
      id: "demographics##asianPer",
      header: "Asian %",
      accessorFn: (originalRow) => {
        return originalRow?.demographics?.asianPer;
      },
      cell: ({ getValue }) => <DataTableCellNumeric>{numberFormatPercent.format(getValue())}</DataTableCellNumeric>,
    },
    {
      id: "demographics##unknownPer",
      header: "Unknown %",
      accessorFn: (originalRow) => originalRow?.demographics?.unknownPer,
      cell: ({ getValue }) => <DataTableCellNumeric>{numberFormatPercent.format(getValue())}</DataTableCellNumeric>,
    },
  ];
  return {
    header: "Demographics",
    id: "demographics",
    columns: children,
  };
};
