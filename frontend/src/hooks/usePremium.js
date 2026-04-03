/**
 * usePremium.js
 * 
 * Central hook for premium status management.
 * - Checks backend for real premium status
 * - Caches for 5 minutes to avoid repeated API calls
 * - Provides isPremium, plan, daysLeft, canAccess()
 * 
 * Usage:
 *   const { isPremium, plan, canAccess } = usePremium();
 *   if (!canAccess("mock_test")) return <PremiumGate />;
 */

import { useState, useEffect, useCallback } from "react";
import { useUser } from "./useUser";
import API from "../utils/api";

// Features available to free users (with limits)
const FREE_LIMITS = {
  ai_questions:  5,    // per day
  mock_tests:    2,    // per month
  photo_scan:    3,    // per day
  ncert:         true, // basic access
  leaderboard:   true,
  peer_challenge:true,
  streak:        true,
};

// Features only for premium
const PREMIUM_ONLY = [
  "group_study",
  "progress_report",
  "exam_simulation_full",
  "unlimited_tests",
  "unlimited_ai",
  "unlimited_scan",
];

const CACHE_KEY     = "eg_premium_cache";
const CACHE_EXPIRY  = 5 * 60 * 1000; // 5 minutes

export function usePremium() {
  const { user } = useUser();
  const [status, setStatus] = useState(() => {
    // Load from cache first
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
      if (cached.ts && Date.now() - cached.ts < CACHE_EXPIRY) {
        return cached.data;
      }
    } catch {}
    return { isPremium: false, plan: "free", daysLeft: 0, trialUsed: false };
  });
  const [loading, setLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const FREE_DEFAULT = { isPremium: false, plan: "free", daysLeft: 0, trialUsed: false };
    try {
      const res = await API.get(`/payment/status/${user.id}`);
      const data = res.data;
      setStatus(data);
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
    } catch (err) {
      // 404 = route not set up yet → silently default to free
      // Don't spam console with errors
      setStatus(FREE_DEFAULT);
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: FREE_DEFAULT }));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Check if user can access a feature
  const canAccess = useCallback((feature) => {
    if (status.isPremium) return true;
    if (PREMIUM_ONLY.includes(feature)) return false;
    return true; // free features allowed
  }, [status.isPremium]);

  const refreshPremium = () => {
    localStorage.removeItem(CACHE_KEY);
    fetchStatus();
  };

  return {
    isPremium:    status.isPremium || false,
    plan:         status.plan || "free",
    daysLeft:     status.daysLeft || 0,
    trialUsed:    status.trialUsed || false,
    isTrialing:   status.plan === "trial",
    canAccess,
    refreshPremium,
    loading,
  };
}
