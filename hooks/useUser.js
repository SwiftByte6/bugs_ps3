"use client";

import { useState, useEffect } from "react";
import { getCurrentUser, signInUser, signUpUser, signOutUser } from "../lib/services/authService";

export default function useUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const current = await getCurrentUser();
        setUser(current);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await signInUser({ email, password });
      setUser(res.user);
      return res;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name, email, password) => {
    setLoading(true);
    try {
      const res = await signUpUser({ name, email, password });
      setUser(res.user);
      return res;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOutUser();
    setUser(null);
  };

  return {
    user,
    loading,
    login,
    signup,
    logout,
    isAuthenticated: Boolean(user),
  };
}
