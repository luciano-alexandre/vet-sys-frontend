import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../api/endpoints";
import { clearToken, getToken, setToken } from "../api/client";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refreshMe() {
    try {
      if (!getToken()) {
        setUser(null);
        return;
      }
      const me = await authApi.me();
      setUser(me);
    } catch {
      clearToken();
      setUser(null);
    }
  }

  useEffect(() => {
    refreshMe().finally(() => setLoading(false));
  }, []);

  async function login(email, senha) {
    const data = await authApi.login({ email, senha });
    console.log(data.token);
    setToken(data.token);
    setUser(data.usuario);
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  const value = useMemo(() => ({ user, loading, login, logout, refreshMe }), [user, loading]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return useContext(AuthCtx);
}