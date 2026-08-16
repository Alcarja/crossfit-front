"use client";

import { z } from "zod";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/authContext";
import { Input } from "@/components/ui/input";
import { register } from "@/app/adapters/api";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name can't be empty" }).max(50),
  lastName: z.string().min(2, { message: "Last name can't be empty" }).max(50),
  email: z
    .string()
    .email({ message: "Please enter a valid email address" })
    .max(100),
  password: z.string().min(2, { message: "Password can't be empty" }).max(50),
  role: z.enum(["coach", "client"]),
});

export const RegisterView = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoading } = useAuth();

  // The endpoint lets an admin pick the role, a coach only create clients.
  const isAdmin = user?.role === "admin";

  // React Query: Mutation to create a user
  const {
    mutate: createUserMutate, //Random name we assign to the mutation and then use in the handle submit. It is connected to my nutationFn below
  } = useMutation({
    mutationFn: register, //This createUser is my function from the api
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(`New ${variables.role} has been created.`);
      router.push("/dashboard/settings");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create user: ${error.message}`);
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createUserMutate({
      name: values.name,
      lastName: values.lastName,
      email: values.email,
      password: values.password,
      role: isAdmin ? values.role : "client",
    });
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      lastName: "",
      email: "",
      password: "",
      role: "coach",
    },
  });

  const roleToCreate = isAdmin ? form.watch("role") : "client";

  return (
    <div className="w-full min-h-screen flex items-start justify-center bg-muted px-4 py-16">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            Create an Account
          </h1>
          <p className="text-sm text-muted-foreground">
            Fill in the details to register a new {roleToCreate}.
          </p>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 rounded-xl border bg-background p-8 shadow-sm"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
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
                    <Input placeholder="johndoe@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isAdmin && (
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="coach">Coach</SelectItem>
                        <SelectItem value="client">Client</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              Create Account
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};
