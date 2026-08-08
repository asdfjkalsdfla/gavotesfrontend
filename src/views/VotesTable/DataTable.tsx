import * as React from "react";
import type { ColumnDef, ColumnVisibilityState, RowData, SortingState } from "@tanstack/react-table";
import { useTable } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTableViewOptions } from "./DataTableViewOptions.tsx";
import { DataTablePagination } from "./DataTablePagination.tsx";
import { features, type DataTableFeatures } from "./data-table-features.ts";

interface DataTableProps<TData extends RowData> {
  columns: ColumnDef<DataTableFeatures, TData, unknown>[];
  data: TData[];
  initialSortColumn: string;
}

export function DataTable<TData extends RowData>({ columns, data, initialSortColumn }: DataTableProps<TData>) {
  const [columnVisibility, setColumnVisibility] = React.useState<ColumnVisibilityState>({});
  const [sorting, setSorting] = React.useState<SortingState>([{ id: initialSortColumn, desc: false }]);

  const table = useTable({
    data,
    columns,
    features,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnVisibility,
    },
  });

  return (
    <div className="space-y-4" data-testid="electionResultTable">
      <div className="items-right justify-between px-4 lg:px-6">
        <span data-testid="dataElementSettings">
          <DataTableViewOptions table={table} />
        </span>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-muted sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead colSpan={header.colSpan} key={header.id}>
                      {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
