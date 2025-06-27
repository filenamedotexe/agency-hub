import React from "react";
import { cn } from "@/lib/utils";
import { uiDebug } from "@/lib/ui-debug";

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveDataTableProps {
  columns: {
    key: string;
    label: string;
    priority?: "high" | "medium" | "low";
    renderCell?: (value: any, row: any) => React.ReactNode;
  }[];
  data: any[];
  onRowClick?: (row: any) => void;
  className?: string;
}

export function ResponsiveTable({ children, className }: ResponsiveTableProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ResponsiveTableContainer({
  children,
  className,
}: ResponsiveTableProps) {
  return (
    <div className={cn("overflow-hidden", className)}>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export function ResponsiveDataTable({
  columns,
  data,
  onRowClick,
  className,
}: ResponsiveDataTableProps) {
  uiDebug.log("ResponsiveDataTable", "Rendering", {
    columns: columns.length,
    rows: data.length,
  });

  return (
    <>
      {/* Desktop Table */}
      <div className={cn("hidden overflow-x-auto md:block", className)}>
        <table className="w-full">
          <thead>
            <tr className="border-b">
              {columns.map((col) => (
                <th key={col.key} className="p-4 text-left font-medium">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={idx}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  "border-b transition-colors",
                  onRowClick && "cursor-pointer hover:bg-gray-50"
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className="p-4">
                    {col.renderCell
                      ? col.renderCell(row[col.key], row)
                      : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="space-y-4 md:hidden">
        {data.map((row, idx) => (
          <div
            key={idx}
            onClick={() => onRowClick?.(row)}
            className={cn(
              "space-y-3 rounded-lg border bg-white p-4 shadow-sm",
              onRowClick &&
                "cursor-pointer transition-transform active:scale-[0.98]"
            )}
          >
            {columns
              .filter((col) => col.priority !== "low")
              .map((col) => (
                <div
                  key={col.key}
                  className="flex flex-col gap-1 sm:flex-row sm:justify-between"
                >
                  <span className="text-sm font-medium text-gray-600">
                    {col.label}:
                  </span>
                  <div className="text-sm">
                    {col.renderCell
                      ? col.renderCell(row[col.key], row)
                      : row[col.key]}
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>
    </>
  );
}
