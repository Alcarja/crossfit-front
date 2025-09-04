/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/authContext";

type Role = "admin" | "coach" | "manager" | "client";

export const AuthGuard = ({
  children,
  allowedRoles, // e.g. ['admin','coach','manager']
}: {
  children: React.ReactNode;
  allowedRoles?: Role[];
}) => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role as Role)) {
      router.replace("/unauthorized");
    }
  }, [isLoading, user?.role, allowedRoles]);

  // Block render while deciding
  if (
    isLoading ||
    !user ||
    (allowedRoles && !allowedRoles.includes((user as any).role))
  ) {
    return null;
  }

  return <>{children}</>;
};
