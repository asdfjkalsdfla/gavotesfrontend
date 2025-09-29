import React, { useMemo, useState, useTransition, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { idColumnBuilder, dataColumnBuilder } from "./columns.jsx";
import { DataTable } from "./DataTable.tsx";
// import { Download } from "lucide-react";
// import { CSVLink } from "react-csv";
import { useElectionData } from "../../context/ElectionDataProvider.jsx";

export default function VotesTable({ isCountyLevel, countyFilter, updateIsCountyLevel, updateActiveSelection }) {
  const navigate = useNavigate();
  const { locationResults, currentElectionRace, previousElectionRace, currentAbsenteeElection, baseAbsenteeElection, isLoading, isError, error } =
    useElectionData();
  const [rows, updateRows] = useState([]);

  const idColumns = useMemo(
    () => idColumnBuilder(isCountyLevel, updateIsCountyLevel, navigate, updateActiveSelection),
    [isCountyLevel, updateIsCountyLevel, navigate, updateActiveSelection],
  );

  const dataColumns = useMemo(
    () => dataColumnBuilder(currentAbsenteeElection, baseAbsenteeElection, currentElectionRace, previousElectionRace),
    [currentAbsenteeElection, baseAbsenteeElection, currentElectionRace, previousElectionRace],
  );

  const columns = useMemo(() => {
    return [...idColumns, ...dataColumns];
  }, [idColumns, dataColumns]);

  const csvFileHeaders = [];
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  columns.length &&
    columns.forEach((column) => {
      if (column.columns) {
        column.columns.forEach((childColumn) => {
          csvFileHeaders.push({
            label: childColumn.meta.title,
            //  key: childColumn?.dataIndex.join(".")
            // TODO - figure out way to not use the accessor function
          });
        });
      }
    });

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(() => {
      const newRows = [...locationResults.values()].filter((row) => row.CTYNAME).map((row) => ({ key: row.id, ...row }));
      // // Force calculation of new values
      // newRows.forEach((row) => {
      //   columns.forEach((parentColumn) => {
      //     if (!parentColumn.children) return;
      //     parentColumn?.children.forEach((column) => {
      //       const dataIndexes = Array.isArray(column.dataIndex) ? column.dataIndex : [column.dataIndex];
      //       let prevValue = row;
      //       if (!prevValue) return;
      //       dataIndexes.forEach((index) => {
      //         prevValue = prevValue?.[index];
      //         console.log(prevValue);
      //       });
      //     });
      //   });
      // });
      updateRows(newRows);
    });
  }, [locationResults]);

  if (isLoading) return <div className="p-4">Loading...</div>;
  if (isError) return <div className="p-4">Error loading data: {error?.message}</div>;

  return (
    <div className="p-4" style={{ width: "10fr", height: "1fr" }} data-testid="electionResultTableWrapper">
      <div className="mx-auto flex items-center justify-between">
        <div className="flex lg:flex-1">
          <div className="text-2xl font-bold">
            <button
              type="button"
              className="text-left underline hover:no-underline"
              onClick={() => {
                navigate({ to: "/table" });
                updateActiveSelection(null);
                updateIsCountyLevel(true);
              }}
            >
              State of Georgia
            </button>
            {countyFilter && <> - {countyFilter} </>}
          </div>
        </div>
        <div className="flex flex-1 justify-end">
          {/* <CSVLink data={rows} headers={csvFileHeaders} filename="voting-data.csv">
            <Download className="mr-2 h-5 w-5" />
          </CSVLink> */}
        </div>
      </div>
      <div className="pt-6">{!isPending && <DataTable columns={columns} data={rows} initialSortColumn="county" />}</div>
    </div>
  );
}
