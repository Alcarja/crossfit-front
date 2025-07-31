"use client";

import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { PencilIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";

export type User = {
  id: number;
  name: string;
  lastName: string;
  role: string;
  createdAt: string;
};

export const getUsersColumns = (
  handleUpdateUser: (user: User) => void,
  handleDeleteUser: (id: number) => void
): ColumnDef<User>[] => [
  {
    accessorKey: "id",
    header: "Id",
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "lastName",
    header: "Last Name",
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.getValue("role") as string | undefined;

      if (!role) return <span className="text-muted-foreground">—</span>;

      return role.charAt(0).toUpperCase() + role.slice(1);
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => {
      const raw = row.getValue("createdAt") as string;
      const date = new Date(raw);
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const item = row.original;

      return (
        <div className="flex gap-2">
          <Link href={`/dashboard/settings/${item.id}`}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleUpdateUser(item)}
            >
              <PencilIcon />
            </Button>
          </Link>
          <Button
            size="sm"
            variant="delete"
            className="w-auto"
            onClick={() => handleDeleteUser(item.id)}
          >
            <Trash2Icon />
          </Button>
        </div>
      );
    },
  },
];
