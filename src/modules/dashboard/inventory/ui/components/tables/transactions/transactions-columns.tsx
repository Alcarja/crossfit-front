import { ColumnDef } from "@tanstack/react-table";

type InventoryTransaction = {
  id: number;
  inventoryId: number;
  unitsInStock: number;
  operation: string;
  currentStock: number;
  note: string;
  coachId: number | null;
  createdAt: string;
};

export const transactionColumns: ColumnDef<InventoryTransaction>[] = [
  {
    accessorKey: "createdAt",
    header: () => <div className="w-[80px] pl-4">Date</div>,
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt);
      const formatted = date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      return (
        <div className="truncate w-[150px] pl-4" title={formatted}>
          {formatted}
        </div>
      );
    },
  },
  {
    accessorKey: "inventoryIdName",
    header: () => <div className="w-[150px pl-4">Product</div>,
    cell: (info) => (
      <div className="truncate w-[150px pl-4" title={info.getValue() as string}>
        {info.getValue() as string}
      </div>
    ),
  },
  {
    accessorKey: "note",
    header: () => <div className="w-[100px pl-4">Note</div>,
    cell: (info) => (
      <div className="truncate w-[100px pl-4" title={info.getValue() as string}>
        {info.getValue() as string}
      </div>
    ),
  },
  {
    accessorKey: "operation",
    header: () => <div className="w-[150px pl-4">Operation</div>,
    cell: (info) => (
      <div
        className="truncate w-[150px pl-10"
        title={info.getValue() as string}
      >
        {info.getValue() as string}
      </div>
    ),
  },
  {
    accessorKey: "currentStock",
    header: () => <div className="w-[150px pl-4">Current Stock</div>,
    cell: (info) => (
      <div
        className="truncate w-[150px pl-14"
        title={info.getValue() as string}
      >
        {info.getValue() as string}
      </div>
    ),
  },
  {
    accessorKey: "coachName",
    header: "User",
  },
];
