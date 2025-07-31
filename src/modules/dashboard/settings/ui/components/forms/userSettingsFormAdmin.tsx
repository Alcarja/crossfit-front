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
import { X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  updateUserByIdAdminMutationOptions,
  userByIdQueryOptions,
} from "@/app/queries/users";

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
    <div className="w-full h-full mx-auto">
      <div className="w-[98%] max-w-[800px] h-auto mx-auto border shadow-sm rounded-md px-8 py-8 mt-8">
        <div className="w-full h-auto flex items-center justify-end">
          <Button
            onClick={() => router.back()}
            variant="default"
            className="w-9 h-9 text-black hover:text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-400"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        <h2 className="text-2xl font-bold text-center pb-8">User Settings</h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="w-full flex flex-wrap items-center gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="w-full sm:flex-1">
                    <FormLabel>Name</FormLabel>
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
                    <FormLabel>Last Name</FormLabel>
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
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="shadcn" {...field} />
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
                <FormItem className="w-full">
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

            <Button type="submit">Submit</Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default UserSettingsFormAdmin;
