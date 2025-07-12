/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/authContext";

export const AuthGuard = ({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole?: "admin" | "coach" | "manager";
}) => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
      } else if (requiredRole && user.role !== requiredRole) {
        router.push("/unauthorized");
      }
    }
  }, [user, isLoading, requiredRole]);

  if (isLoading || (!user && !isLoading)) {
    return null; // Optional: return a spinner here
  }

  return <>{children}</>;
};
