/* eslint-disable @typescript-eslint/no-explicit-any */
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

import { useEffect, useMemo, useState } from "react";
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
import { CalendarIcon, Loader, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  phoneNumber: z.string().min(9),
  birthDay: z.string(),
  city: z.string(),
  country: z.string(),
  address: z.string(),
  postalCode: z.string(),
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

  const [query, setQuery] = useState("");
  const [role, setRole] = useState<string>("all");

  const roles = useMemo(() => {
    // Normalize: extract array of users depending on the shape
    const usersArray = Array.isArray(userData)
      ? userData
      : userData?.user ?? [];

    return Array.from(new Set(usersArray.map((u: any) => u.role))).sort();
  }, [userData]);

  const filteredUsers = useMemo(() => {
    const usersArray = Array.isArray(userData)
      ? userData
      : userData?.user ?? [];

    const q = query.trim().toLowerCase();

    return usersArray.filter((u: any) => {
      const matchesText =
        q === "" ||
        `${u.name} ${u.lastName}`.toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q);

      const matchesRole = role === "all" || u.role === role;

      return matchesText && matchesRole;
    });
  }, [userData, query, role]);

  const handleUpdateUser = () => {};

  const handleDeleteUser = () => {};

  const columns = getUsersColumns(handleUpdateUser, handleDeleteUser);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      city: "",
      country: "",
      address: "",
      postalCode: "",
    },
  });

  useEffect(() => {
    const currentUser = userData?.user?.[0];
    if (currentUser) {
      form.reset({
        name: currentUser.name || "",
        lastName: currentUser.lastName || "",
        email: currentUser.email || "",
        phoneNumber: currentUser.phoneNumber || "",
        city: currentUser.city || "",
        country: currentUser.country || "",
        address: currentUser.address || "",
        postalCode: currentUser.postalCode || "",
        birthDay: currentUser.birthDay,
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
    <div className="w-full space-y-10">
      {user?.role === "admin" && (
        <section className="space-y-8 px-4 py-6 md:px-8">
          <header className="space-y-1 pl-3">
            <h2 className="text-3xl font-bold tracking-tight">User Settings</h2>
            <p className="text-muted-foreground text-sm">
              Manage coaches, staff, and all registered users.
            </p>
          </header>

          <div className="rounded-xl border shadow-md bg-card p-6 space-y-6">
            {/* Filters */}
            <div className="flex items-center justify-between border-b pb-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Search className="h-4 w-4" />
                  <p className="text-sm">
                    Search or filter users by role, name, or date.
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  {/* Name / lastName text filter */}
                  <Input
                    placeholder="Buscar por nombre o apellido…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="sm:w-72"
                  />

                  {/* Role filter */}
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger className="sm:w-44">
                      <SelectValue placeholder="Rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los roles</SelectItem>
                      {roles.map((r: any) => (
                        <SelectItem key={r} value={r}>
                          {r?.charAt(0).toUpperCase() +
                            r?.slice(1).toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="rounded-md border bg-background p-4 shadow-sm">
              {userData && userData.length > 0 ? (
                <DataTable columns={columns} data={filteredUsers} />
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
        <section className="px-4 md:px-0 py-4">
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
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="C/ Falsa 123..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="Madrid" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="Spain" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal Code</FormLabel>
                      <FormControl>
                        <Input placeholder="123456" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="666666666" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="birthDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de nacimiento</FormLabel>
                      <FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="min-w-[200px] justify-start"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              <span>
                                {field.value
                                  ? format(new Date(field.value), "PPP")
                                  : "Selecciona una fecha"}
                              </span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            align="end"
                            className="p-0 pointer-events-auto"
                          >
                            <Calendar
                              mode="single"
                              captionLayout="dropdown" // ⬅️ Enables year/month dropdowns
                              fromYear={1900} // ⬅️ Earliest selectable year
                              toYear={new Date().getFullYear()} // ⬅️ Latest year (this year)
                              selected={
                                field.value ? new Date(field.value) : undefined
                              }
                              onSelect={(date) => {
                                if (date) {
                                  field.onChange(format(date, "yyyy-MM-dd"));
                                }
                              }}
                              className="rounded-md"
                            />
                          </PopoverContent>
                        </Popover>
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
