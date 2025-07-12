"use client";

import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/app/adapters/api";
import { logout as logoutApi } from "@/app/adapters/api";
import { createContext, useContext, useState, useEffect } from "react";

type User = {
  id: number;
  name: string;
  lastName: string;
  email: string;
  role: string;
};

type AuthContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  isLoading: true,
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Optional: Load session on app start
  useEffect(() => {
    const fetchUser = async () => {
      console.log("Fetching current user..."); // 🪵
      try {
        const res = await getCurrentUser();
        console.log("User fetched:", res); // 🪵
        setUser(res.user || null);
      } catch (err) {
        console.error("getCurrentUser failed:", err); // 🪵
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const logout = async () => {
    try {
      await logoutApi(); // ⬅️ calls the backend to clear the cookie
      setUser(null); // ⬅️ update frontend state
      router.push("/login"); // 👈 Redirects on client side
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
