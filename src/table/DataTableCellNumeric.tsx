import { cn } from "@/lib/utils";

export function DataTableCellNumeric<TData, TValue>({ children, className }: Any) {
  return <div className={cn("w-[80px] text-right", className)}>{children}</div>;
}
