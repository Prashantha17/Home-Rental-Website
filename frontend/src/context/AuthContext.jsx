// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("access_token") || null);
  const [username, setUsername] = useState(() => localStorage.getItem("username") || null);
  const [role, setRole] = useState(() => localStorage.getItem("role") || null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Sync state to localStorage
  const login = useCallback((accessToken, userIdentifier, userRole) => {
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("username", userIdentifier);
    localStorage.setItem("role", userRole);

    setToken(accessToken);
    setUsername(userIdentifier);
    setRole(userRole);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");

    setToken(null);
    setUsername(null);
    setRole(null);
  }, []);

  // Listen for unauthorized 401 events from the API client
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    setIsInitialized(true);

    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, [logout]);

  const value = {
    token,
    username,
    role,
    isAuthenticated: Boolean(token),
    isAdmin: role === "admin",
    isOwner: role === "owner" || role === "admin",
    isInitialized,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
