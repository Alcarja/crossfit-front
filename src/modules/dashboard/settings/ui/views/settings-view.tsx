"use client";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/authContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { DataTable } from "../components/tables/data-table";
import { getUsersColumns } from "../components/tables/columns";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  updateUserByIdMutationOptions,
  userByIdQueryOptions,
  usersQueryOptions,
} from "@/app/queries/users";
import { toast } from "sonner";

export interface Category {
  id: number;
  name: string;
}

const passwordRegex =
  /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=<>?{}[\]~]).{6,50}$/;

const formSchema = z.object({
  name: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().min(2).max(50),
  oldPassword: z.string().optional(),
  newPassword: z
    .string()
    .optional()
    .refine(
      (val) => !val || passwordRegex.test(val),
      "New password must include an uppercase letter, a number, and a special character."
    ),
});

export const SettingsView = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      lastName: "",
      email: "",
    },
  });

  useEffect(() => {
    const currentUser = userData?.user?.[0];
    if (currentUser) {
      form.reset({
        name: currentUser.name || "",
        lastName: currentUser.lastName || "",
        email: currentUser.email || "",
      });
    }
  }, [userData, form]);

  const mutation = useMutation(
    userId !== undefined
      ? updateUserByIdMutationOptions(userId)
      : {
          mutationKey: ["updateUser", "undefined"],
          mutationFn: async () => {
            throw new Error("userId is undefined");
          },
        }
  );

  function onSubmit(values: z.infer<typeof formSchema>) {
    mutation.mutate(values, {
      onSuccess: () => {
        toast.success("User updated correctly!");
        queryClient.invalidateQueries({ queryKey: ["user", userId] });
        form.setValue("oldPassword", "");
        form.setValue("newPassword", "");
      },
      onError: (error: Error) => {
        console.error("Failed to update user:", error);
        toast.error("Error updating user");
      },
    });
  }

  if (userDataLoading) return <div>Loading...</div>;

  return (
    <div className="w-full p-6 space-y-10">
      {user?.role === "admin" && (
        <>
          <h2 className="text-2xl font-bold">User Settings</h2>

          <div className="w-full space-y-4 shadow-md bg-gray-50 p-5 rounded-lg">
            <div>Filters</div>
            {userData && <DataTable columns={columns} data={userData} />}{" "}
          </div>
        </>
      )}

      {user?.role !== "admin" && (
        <>
          <div className="w-[98%] max-w-[800px] mx-auto border shadow-sm rounded-md h-auto px-8 py-8 mt-8">
            <div>
              <h2 className="text-2xl font-bold text-center pb-8">
                User Settings
              </h2>
            </div>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8"
              >
                <div className="w-full flex flex-wrap items-center gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="w-full sm:flex-1">
                        <FormLabel className="mb-0 ml-1">Name</FormLabel>
                        <FormControl>
                          <Input placeholder="shadcn" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem className="w-full sm:flex-1">
                        <FormLabel className="mb-0 ml-1">Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="shadcn" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel className="mb-0 ml-1">Email</FormLabel>
                      <FormControl>
                        <Input placeholder="shadcn" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="oldPassword"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel className="mb-0 ml-1">
                        Current Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showOldPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowOldPassword((prev) => !prev)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
                          >
                            {showOldPassword ? "Hide" : "Show"}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel className="mb-0 ml-1">New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showNewPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword((prev) => !prev)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
                          >
                            {showNewPassword ? "Hide" : "Show"}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit">Submit</Button>
              </form>
            </Form>
          </div>
        </>
      )}
    </div>
  );
};
