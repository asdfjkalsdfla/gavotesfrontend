import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface DataTableCellNumericProps {
  children: ReactNode;
  className?: string;
}

export function DataTableCellNumeric({ children, className }: DataTableCellNumericProps) {
  return <div className={cn("w-[80px] text-right", className)}>{children}</div>;
}
