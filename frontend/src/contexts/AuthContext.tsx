import { createContext, useContext, useEffect, useState } from "react";
import { auth as authApi } from "@/services/api";
import type { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, check if a valid session cookie exists by calling /users/me.
  // Resolve after 8s regardless so a sleeping Fly machine doesn't blank the page.
  useEffect(() => {
    const timeout = setTimeout(() => setIsLoading(false), 8_000);
    authApi
      .me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => {
        clearTimeout(timeout);
        setIsLoading(false);
      });
  }, []);

  const login = async (email: string, password: string) => {
    await authApi.login(email, password);
    // Cookie is now set by the backend — fetch the user profile
    const me = await authApi.me();
    setUser(me);
  };

  const logout = async () => {
    await authApi.logout();   // tells backend to clear the cookie
    setUser(null);
  };

  const register = async (email: string, password: string) => {
    await authApi.register(email, password);
    await login(email, password);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
