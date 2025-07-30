"use client";

import { useQuery } from "@tanstack/react-query";

import { getUsersColumns } from "../components/tables/columns";

import { useAuth } from "@/context/authContext";
import { userByIdQueryOptions, usersQueryOptions } from "@/app/queries/users";
import { DataTable } from "../components/tables/data-table";
import { useEffect } from "react";

export interface Category {
  id: number;
  name: string;
}

export interface InventoryItem {
  id: number;
  name: string;
  categoryId: number;
  categoryName: string;
  priceRegular: number;
  priceCoach: number;
}

export const SettingsView = () => {
  const { user } = useAuth();

  const isAdmin = user?.role === "admin";
  const userId = user?.id;

  const queryOptions = isAdmin
    ? usersQueryOptions() //If it's admin calls getAllUsers()
    : userId !== undefined //If userId is not undefined calls getUserById, if it's undefined it returns null
    ? userByIdQueryOptions(userId)
    : null;

  const { data: userData, isLoading: userDataLoading } = useQuery(
    queryOptions
      ? {
          queryKey: queryOptions.queryKey,
          queryFn: queryOptions.queryFn,
          enabled: true,
        }
      : {
          queryKey: ["user", "undefined"],
          queryFn: async () => [],
          enabled: false, // don't run
        }
  );

  const handleUpdateUser = () => {};

  const handleDeleteUser = () => {};

  const columns = getUsersColumns(handleUpdateUser, handleDeleteUser);

  useEffect(() => {
    console.log("user", userData);
  }, [userData]);

  if (userDataLoading) return <div>Loading...</div>;

  return (
    <div className="w-full p-6 space-y-10">
      <h2 className="text-2xl font-bold">User Settings</h2>

      {user?.role === "admin" && (
        <div className="w-full space-y-4 shadow-md bg-gray-50 p-5 rounded-lg">
          <div>Filters</div>
          {userData && <DataTable columns={columns} data={userData} />}{" "}
        </div>
      )}

      {user?.role !== "admin" && (
        <>
          <p>Formulario</p>
          <div>
            <p>{userData?.user?.[0].name}</p>
          </div>
        </>
      )}
    </div>
  );
};
