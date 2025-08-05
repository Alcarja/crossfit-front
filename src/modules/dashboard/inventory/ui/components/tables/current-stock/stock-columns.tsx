"use client";

import { ColumnDef } from "@tanstack/react-table";
import { InventoryItem } from "../../../views/inventory-view";

export const stockColumns: ColumnDef<InventoryItem>[] = [
  {
    accessorKey: "name",
    header: () => <div className="w-[200px] pl-4">Item</div>,
    cell: (info) => (
      <div
        className="truncate w-[200px] pl-4"
        title={info.getValue() as string}
      >
        {info.getValue() as string}
      </div>
    ),
  },
  {
    accessorKey: "categoryName",
    header: () => <div className="w-[150px pl-4">Category</div>,
    cell: (info) => (
      <div className="truncate w-[150px pl-4" title={info.getValue() as string}>
        {info.getValue() as string}
      </div>
    ),
  },
  {
    accessorKey: "unitsInStock",
    header: () => <div className="w-[100px] text-right pl-18">Stock</div>,
    cell: ({ row }) => (
      <div className="w-[100px] text-right">
        {row.original.unitsInStock ?? 0}
      </div>
    ),
  },
];
