"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api, getToken, setToken, clearToken } from "@/lib/api";

type Admin = { id: string; name: string; email: string };

type AuthContextValue = {
  admin: Admin | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Reads auth state from localStorage on mount — an external system, not React state.
    const stored = window.localStorage.getItem("metrobus_admin_profile");
    const token = getToken();
    if (token && stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAdmin(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const data = await api.post<{ token: string; admin: Admin }>(
      "/api/login",
      { email, password },
      { auth: false }
    );
    setToken(data.token);
    window.localStorage.setItem("metrobus_admin_profile", JSON.stringify(data.admin));
    setAdmin(data.admin);
    router.push("/dashboard");
  }

  function logout() {
    api.post("/api/auth/logout", {}).catch(() => {});
    clearToken();
    window.localStorage.removeItem("metrobus_admin_profile");
    setAdmin(null);
    router.push("/login");
  }

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
