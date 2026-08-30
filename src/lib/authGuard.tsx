/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/authContext";

export const AuthGuard = ({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: readonly string[];
}) => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading]);

  if (isLoading || !user) {
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="w-full flex items-start justify-center px-4 py-16">
        <Card className="w-full max-w-md px-8 py-10 text-center space-y-3">
          <h1 className="text-2xl font-bold tracking-tight">
            This panel is for coaches and admins
          </h1>
          <p className="text-sm text-muted-foreground">
            Your account does not have access to the management panel. Ask an
            admin to change your role, then sign in again.
          </p>
          <Link href="/" className="text-sm underline underline-offset-4">
            Back to home
          </Link>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
