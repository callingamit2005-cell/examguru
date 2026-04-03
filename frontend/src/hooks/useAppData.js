import React, { createContext, useContext, useState, useEffect } from "react";
import { userAPI, analyticsAPI } from "../utils/api";

const AppDataContext = createContext({ profile: null, analytics: null, loading: true, refresh: () => {} });

// Module-level cache — survives component re-renders/remounts
let _cachedUserId = null;
let _cachedProfile = null;
let _cachedAnalytics = null;
let _fetchPromise = null;

export function AppDataProvider({ userId, children }) {
  const [profile, setProfile]     = useState(_cachedProfile);
  const [analytics, setAnalytics] = useState(_cachedAnalytics);
  const [loading, setLoading]     = useState(!_cachedProfile);

  useEffect(() => {
    if (!userId) return;

    // Already have fresh data for this user — skip fetch
    if (_cachedUserId === userId && _cachedProfile) {
      setProfile(_cachedProfile);
      setAnalytics(_cachedAnalytics);
      setLoading(false);
      return;
    }

    // Deduplicate concurrent fetches
    if (_fetchPromise && _cachedUserId === userId) {
      _fetchPromise.then(() => {
        setProfile(_cachedProfile);
        setAnalytics(_cachedAnalytics);
        setLoading(false);
      });
      return;
    }

    _cachedUserId = userId;
    _fetchPromise = Promise.all([
      userAPI.getProfile(userId),
      analyticsAPI.getDashboard(userId),
    ]).then(([pRes, aRes]) => {
      _cachedProfile  = pRes.data;
      _cachedAnalytics = aRes.data;
      setProfile(_cachedProfile);
      setAnalytics(_cachedAnalytics);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    }).finally(() => {
      _fetchPromise = null;
    });
  }, [userId]);

  // Manual refresh (e.g. after test submission)
  const refresh = () => {
    if (!userId) return;
    _cachedProfile  = null;
    _cachedAnalytics = null;
    _cachedUserId   = null;
    setLoading(true);
    Promise.all([
      userAPI.getProfile(userId),
      analyticsAPI.getDashboard(userId),
    ]).then(([pRes, aRes]) => {
      _cachedProfile  = pRes.data;
      _cachedAnalytics = aRes.data;
      _cachedUserId   = userId;
      setProfile(_cachedProfile);
      setAnalytics(_cachedAnalytics);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  return (
    <AppDataContext.Provider value={{ profile, analytics, loading, refresh }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  return useContext(AppDataContext);
}
