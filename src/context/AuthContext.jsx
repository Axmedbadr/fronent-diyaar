import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { clearAccessToken, setAccessToken } from "../api/client";
import {
  loginRequest,
  logoutRequest,
  meRequest,
  refreshRequest,
  registerRequest
} from "../api/auth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const applyAuthPayload = useCallback((payload) => {
    if (payload?.accessToken) {
      setAccessToken(payload.accessToken);
    }
    if (payload?.user) {
      setUser(payload.user);
      setIsAuthenticated(true);
    }
  }, []);

  const login = useCallback(
    async ({ email, password }) => {
      const data = await loginRequest(email, password);
      applyAuthPayload(data);
      return data;
    },
    [applyAuthPayload]
  );

  const register = useCallback(
    async ({ name, email, password }) => {
      const data = await registerRequest(name, email, password);
      applyAuthPayload(data);
      return data;
    },
    [applyAuthPayload]
  );

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      clearAccessToken();
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  const restoreSession = useCallback(async () => {
    try {
      const refreshed = await refreshRequest();
      applyAuthPayload(refreshed);

      const me = await meRequest();
      if (me?.user) {
        setUser(me.user);
        setIsAuthenticated(true);
      }
    } catch {
      clearAccessToken();
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, [applyAuthPayload]);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      login,
      register,
      logout
    }),
    [user, isAuthenticated, isLoading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};
