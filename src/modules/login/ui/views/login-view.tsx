/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { z } from "zod";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { login } from "@/app/adapters/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/authContext";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const formSchema = z.object({
  email: z
    .string()
    .email({ message: "Please enter a valid email address" })
    .max(100),
  password: z.string().min(2, { message: "Password can't be empty" }).max(50),
});

export const LoginView = () => {
  const { setUser } = useAuth();

  const { mutate: loginMutate } = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setUser(data); //Save user data to the authContext
      toast.success("Log in completado.");
      window.location.href = "/dashboard/client";
    },
    onError: (err: any) => {
      const backendMessage = "CHIMPANCÉ, usuario o contraseña incorrectos";
      const fallbackMessage = err?.message || "Error desconocido.";
      toast.error(backendMessage || fallbackMessage);
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    loginMutate(values);
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  return (
    <div className="min-h-screen flex items-start justify-center bg-muted py-16 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            Sign in to your account
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your credentials to access the dashboard.
          </p>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 rounded-xl border bg-background p-8 shadow-sm"
          >
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

            <Button type="submit" className="w-full">
              Sign In
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};
