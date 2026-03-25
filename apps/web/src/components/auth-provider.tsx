"use client";

import { createContext, useContext, useMemo } from "react";

interface AuthContextValue {
  token: string | null;
}

const AuthContext = createContext<AuthContextValue>({ token: null });

export function AuthProvider({
  token,
  children,
}: {
  token: string | null;
  children: React.ReactNode;
}) {
  const value = useMemo(() => ({ token }), [token]);
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthToken() {
  return useContext(AuthContext).token;
}
