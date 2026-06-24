"use client";

import { useCallback, useEffect, useState } from "react";

export function useAuth(onAnalyticsRefresh) {
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [authError, setAuthError] = useState("");

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      setUser(data.user);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const trackEvent = async (eventType, eventValue) => {
    try {
      await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType, eventValue }),
      });
    } catch {
      // non-blocking
    }
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setAuthError("");

    try {
      const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload =
        authMode === "login"
          ? { email: authForm.email, password: authForm.password }
          : {
              name: authForm.name,
              email: authForm.email,
              password: authForm.password,
            };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      setUser(data.user);
      await trackEvent("signup", authMode === "register" ? "registered" : "logged_in");
      await onAnalyticsRefresh?.();
      setAuthForm({ name: "", email: "", password: "" });
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Authentication failed.");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    await onAnalyticsRefresh?.();
  };

  return {
    user,
    authMode,
    authForm,
    authError,
    setAuthMode,
    setAuthForm,
    handleAuthSubmit,
    handleLogout,
  };
}
