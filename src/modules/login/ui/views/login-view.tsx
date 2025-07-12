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
      toast.success("Logged in correctly.");
      window.location.href = "/";
    },
    onError: (err: any) => {
      console.error("❌ Login failed:", err.message);
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
    <div className="max-w-2xl mx-auto p-6 space-y-10">
      <h1 className="text-5xl font-bold text-center">Login User</h1>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 bg-white shadow-md rounded-lg p-6 border"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4"></div>

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
                  <Input type="password" placeholder="•••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full text-red">
            Submit
          </Button>
        </form>
      </Form>
    </div>
  );
};
