import { cn } from "@/lib/utils";

export function DataTableCellNumeric<TData, TValue>({ children, className }: Any) {
  return <div className={cn("text-right", className)}>{children}</div>;
}
