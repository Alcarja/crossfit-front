"use client";

import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { PencilIcon, Trash2Icon } from "lucide-react";

export type InventoryItem = {
  id: number;
  name: string;
  categoryId: number;
  categoryName: string;
  priceRegular: number;
  priceCoach: number;
};

export const getInventoryColumns = (
  handleUpdate: (item: InventoryItem) => void,
  handleDelete: (id: number) => void
): ColumnDef<InventoryItem>[] => [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "categoryName",
    header: "Category",
  },
  {
    accessorKey: "priceRegular",
    header: "Price (Regular)",
    cell: ({ row }) => {
      const price = row.getValue("priceRegular") as number;
      return <span className="ml-1">{price} €</span>;
    },
  },
  {
    accessorKey: "priceCoach",
    header: "Price (Coach)",
    cell: ({ row }) => {
      const price = row.getValue("priceCoach") as number;
      return <span className="ml-1">{price} €</span>;
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const item = row.original;

      return (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleUpdate(item)}
          >
            <PencilIcon />
          </Button>
          <Button
            size="sm"
            variant="delete"
            className="w-auto"
            onClick={() => handleDelete(item.id)}
          >
            <Trash2Icon />
          </Button>
        </div>
      );
    },
  },
];
