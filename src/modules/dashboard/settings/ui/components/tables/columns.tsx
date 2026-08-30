"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type UserRole } from "@/app/adapters/api";
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

const assignableRoles = ["admin", "coach", "client"] as const;

const formatRole = (role: string) =>
  role.charAt(0).toUpperCase() + role.slice(1);

export const getUsersColumns = ({
  handleUpdateUser,
  handleDeleteUser,
  handleRoleChange,
  currentUserId,
  pendingUserId,
}: {
  handleUpdateUser: (user: User) => void;
  handleDeleteUser: (id: number) => void;
  handleRoleChange: (user: User, role: UserRole) => void;
  currentUserId?: number;
  pendingUserId?: number;
}): ColumnDef<User>[] => [
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
      const item = row.original;

      if (!item.role) return <span className="text-muted-foreground">—</span>;

      const isSelf = item.id === currentUserId;
      const options = assignableRoles.some((role) => role === item.role)
        ? [...assignableRoles]
        : [item.role, ...assignableRoles];

      return (
        <div
          className="flex items-center gap-2"
          title={isSelf ? "You cannot change your own role" : undefined}
        >
          <Select
            value={item.role}
            onValueChange={(value) => handleRoleChange(item, value as UserRole)}
            disabled={isSelf || pendingUserId === item.id}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((role) => (
                <SelectItem key={role} value={role}>
                  {formatRole(role)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isSelf && (
            <span className="text-xs text-muted-foreground">(you)</span>
          )}
        </div>
      );
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
