import React, { createContext, useContext, useState } from "react";

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("examguru_user");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("examguru_user", JSON.stringify(userData));
  };

  // Refresh user role from backend — with debounce to prevent spam
  const refreshUser = async (userId) => {
    const lastRefresh = parseInt(localStorage.getItem("eg_last_refresh") || "0");
    const now = Date.now();
    // Only refresh if last refresh was > 2 minutes ago
    if (now - lastRefresh < 120000) return;
    localStorage.setItem("eg_last_refresh", String(now));
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/user/profile/${userId}`);
      const data = await res.json();
      if (data?.user) {
        const saved = JSON.parse(localStorage.getItem("examguru_user") || "{}");
        // Only update if role actually changed
        if (saved.role !== data.user.role) {
          const updated = { ...saved, role: data.user.role };
          setUser(updated);
          localStorage.setItem("examguru_user", JSON.stringify(updated));
        }
      }
    } catch (e) {}
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("examguru_user");
  };

  const updateCourse = (courseCode, subjects) => {
    const updated = { ...user, examTarget: courseCode, subjects };
    setUser(updated);
    localStorage.setItem("examguru_user", JSON.stringify(updated));
  };

  return (
    <UserContext.Provider value={{ user, login, logout, updateCourse, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
