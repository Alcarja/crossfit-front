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
import { Card } from "@/components/ui/card";
import { Loader } from "lucide-react";

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
        <section className="space-y-8 px-4 md:px-8">
          <header className="space-y-1 pl-3">
            <h2 className="text-3xl font-bold tracking-tight">User Settings</h2>
            <p className="text-muted-foreground text-sm">
              Manage coaches, staff, and all registered users.
            </p>
          </header>

          <div className="rounded-xl border shadow-md bg-card p-6 space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="space-y-1">
                <h3 className="text-lg font-medium">Filters</h3>
                <p className="text-sm text-muted-foreground">
                  Search or filter users by role, name, or date.
                </p>
              </div>
            </div>

            <div className="rounded-md border bg-background p-4 shadow-sm">
              {userData && userData.length > 0 ? (
                <DataTable columns={columns} data={userData} />
              ) : (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  No user data available.
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {user?.role !== "admin" && (
        <section className="px-4 md:px-0 py-8">
          <div className="relative w-full max-w-xl mx-auto rounded-xl border bg-background shadow-sm p-8 space-y-6">
            {/* Loading Overlay */}
            {mutation.isPending && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-xl">
                <Card className="w-auto px-8 py-6 flex items-center gap-3">
                  <Loader className="h-5 w-5 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Updating user...
                  </span>
                </Card>
              </div>
            )}

            {/* Header */}
            <div className="text-center space-y-1">
              <h2 className="text-3xl font-bold tracking-tight">
                User Settings
              </h2>
              <p className="text-sm text-muted-foreground">
                Update your account details and change your password.
              </p>
            </div>

            {/* Form */}
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Jane" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} />
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
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="jane.doe@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="oldPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
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
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
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

                <Button type="submit" className="w-full">
                  Save Changes
                </Button>
              </form>
            </Form>
          </div>
        </section>
      )}
    </div>
  );
};
