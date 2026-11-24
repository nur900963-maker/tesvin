import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useGetMe, getGetMeQueryKey, setAuthTokenGetter, User } from "@workspace/api-client-react";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ──────────────────────────────────────────────────────────────────────────────
// FIX: Set auth token getter di module level (SEBELUM komponen manapun render)
// Ini penting karena React Query v5 bisa trigger fetch SEBELUM useEffect jalan.
// Tanpa ini, request pertama dikirim tanpa Authorization header → 401 → logout!
// ──────────────────────────────────────────────────────────────────────────────
setAuthTokenGetter(() => {
  try { return localStorage.getItem("auth_token"); } catch { return null; }
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => {
    try { return localStorage.getItem("auth_token"); } catch { return null; }
  });

  // Refresh getter setiap login/logout supaya selalu up-to-date
  useEffect(() => {
    setAuthTokenGetter(() => {
      try { return localStorage.getItem("auth_token"); } catch { return null; }
    });
  }, [token]);

  const { data: user, isLoading: isUserLoading, isError } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
      queryKey: getGetMeQueryKey(),
    }
  });

  useEffect(() => {
    if (isError) {
      // Token tidak valid atau expired
      logout();
    }
  }, [isError]);

  const login = (newToken: string) => {
    try { localStorage.setItem("auth_token", newToken); } catch {}
    setTokenState(newToken);
    // Update getter langsung saat login
    setAuthTokenGetter(() => {
      try { return localStorage.getItem("auth_token"); } catch { return null; }
    });
  };

  const logout = () => {
    try { localStorage.removeItem("auth_token"); } catch {}
    setTokenState(null);
    setAuthTokenGetter(() => null);
  };

  // isLoading = true saat sedang fetch user dengan token yang ada
  const isLoading = !!token && (isUserLoading || (!user && !isError));

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
