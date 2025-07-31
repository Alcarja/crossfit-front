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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Loader, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  updateUserByIdAdminMutationOptions,
  userByIdQueryOptions,
} from "@/app/queries/users";
import { Card } from "@/components/ui/card";

const passwordRegex =
  /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=<>?{}[\]~]).{6,50}$/;

const formSchema = z
  .object({
    name: z.string().min(2).max(50),
    lastName: z.string().min(2).max(50),
    email: z.string().min(2).max(50),
    newPassword: z.string().optional(),
    repeatNewPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.newPassword || data.repeatNewPassword) {
        return data.newPassword === data.repeatNewPassword;
      }
      return true;
    },
    {
      message: "Passwords do not match",
      path: ["repeatNewPassword"],
    }
  )
  .refine(
    (data) => {
      if (!data.newPassword) return true;
      return passwordRegex.test(data.newPassword);
    },
    {
      message:
        "New password must include an uppercase letter, a number, and a special character.",
      path: ["newPassword"],
    }
  );

interface UserSettingsFormProps {
  coachId: string;
}

const UserSettingsFormAdmin = ({ coachId }: UserSettingsFormProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showRepeatNewPassword, setShowRepeatNewPassword] = useState(false);

  const { data: userData } = useQuery(userByIdQueryOptions(Number(coachId)));

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
    updateUserByIdAdminMutationOptions(Number(coachId))
  );

  function onSubmit(values: z.infer<typeof formSchema>) {
    mutation.mutate(values, {
      onSuccess: () => {
        toast.success("User updated successfully!");
        queryClient.invalidateQueries({ queryKey: ["user", Number(coachId)] });
        form.setValue("newPassword", "");
        form.setValue("repeatNewPassword", "");
      },
      onError: (error: Error) => {
        console.error("Failed to update user:", error);
        toast.error("Error updating user");
      },
    });
  }

  return (
    <section className="min-h-screen w-full flex items-start justify-center bg-muted px-4 py-16">
      <div className="relative w-full max-w-xl rounded-xl border bg-background shadow-sm px-12 space-y-6 pb-12">
        {/* Loader Overlay */}
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

        {/* Close button */}
        <div className="flex justify-end pt-8">
          <Button
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-destructive h-8 w-8"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Header */}
        <div className="text-center space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">User Settings</h2>
          <p className="text-sm text-muted-foreground">
            Update your personal info and password.
          </p>
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

            <FormField
              control={form.control}
              name="repeatNewPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Repeat New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showRepeatNewPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowRepeatNewPassword((prev) => !prev)
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
                      >
                        {showRepeatNewPassword ? "Hide" : "Show"}
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
  );
};

export default UserSettingsFormAdmin;
