"use client";

import { useAuth } from "@/context/authContext";
import { useEffect } from "react";

export const HomeView = () => {
  const { user } = useAuth();

  useEffect(() => {
    console.log(user);
  }, [user]);

  return <div>home view</div>;
};
