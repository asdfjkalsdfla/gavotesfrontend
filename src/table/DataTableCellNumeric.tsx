import { cn } from "@/lib/utils";

export function DataTableCellNumeric({ children, className }) {
  return <div className={cn("w-[80px] text-right", className)}>{children}</div>;
}
