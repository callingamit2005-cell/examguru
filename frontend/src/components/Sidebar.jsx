/**
 * Sidebar.jsx
 * 
 * Navigation sidebar with premium-aware display:
 * - Free users: "👑 Go Premium" CTA at top
 * - Premium users: Crown badge + days remaining
 * - Trial users: Countdown + upgrade prompt
 */

import React from "react";
import { useUser } from "../hooks/useUser";
import { useAppData } from "../hooks/useAppData";
import { usePremium } from "../hooks/usePremium";

// Student nav items
const STUDENT_NAV = [
  { id:"dashboard",    icon:"📊", label:"Dashboard" },
  { id:"chat",         icon:"🤖", label:"AI Tutor" },
  { id:"test",         icon:"📝", label:"Mock Test" },
  { id:"ncert",        icon:"📖", label:"NCERT Practice" },
  { id:"history",      icon:"📚", label:"History" },
  { id:"weak",         icon:"🎯", label:"Weak Topics" },
  { id:"heatmap",      icon:"🔥", label:"Weakness Map" },
  { id:"prediction",   icon:"🔭", label:"Exam Prediction" },
  { id:"simulation",   icon:"⏱️", label:"Exam Simulation" },
  { id:"revision",     icon:"⚡", label:"Quick Revision" },
  { id:"countdown",    icon:"⏳", label:"Exam Countdown" },
  { id:"streak",       icon:"🔥", label:"Daily Streak" },
  { id:"leaderboard",  icon:"🏆", label:"Leaderboard" },
  { id:"predictor",    icon:"🔮", label:"Score Predictor" },
  { id:"challenge",    icon:"⚔️", label:"Peer Challenge" },
  { id:"doubts",       icon:"💬", label:"Doubt Community" },
  { id:"group",        icon:"👥", label:"Group Study",        premium:true },
  { id:"progress",     icon:"📊", label:"AI Progress Report", premium:true },
  { id:"gamification", icon:"🎮", label:"My Progress" },
  { id:"planner",      icon:"🗓️", label:"Study Planner" },
  { id:"report",       icon:"📋", label:"Report Card" },
  { id:"parent",       icon:"👨‍👩‍👧", label:"Parent View" },
];

// Admin-only nav items (hidden from students)
const ADMIN_NAV = [
  { id:"admin",        icon:"⚙️", label:"Admin Panel",    color:"#f87171" },
  { id:"content",      icon:"📤", label:"Content Upload", color:"#10b981" },
];

export default function Sidebar({ activePage, onPageChange }) {
  const { user, logout }      = useUser();
  const { profile }           = useAppData() || {};
  const { isPremium, plan, daysLeft, isTrialing } = usePremium();

  const isAdmin = user?.role === "admin" || profile?.user?.role === "admin";

  return (
    <aside className="desktop-sidebar" style={{
      width:"220px", position:"fixed", top:0, left:0, height:"100vh",
      background:"var(--bg-secondary)", borderRight:"1px solid var(--border)",
      display:"flex", flexDirection:"column", zIndex:100, overflowY:"auto"
    }}>
      {/* Logo */}
      <div style={{ padding:"16px", borderBottom:"1px solid var(--border)", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <div style={{ width:"36px", height:"36px", borderRadius:"10px",
            background:"linear-gradient(135deg,var(--accent),#8b5cf6)",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px" }}>
            🎓
          </div>
          <div>
            <div style={{ fontWeight:900, fontSize:"15px" }}>ExamGuru</div>
            <div style={{ fontSize:"10px", color:"var(--accent)", fontWeight:700 }}>AI</div>
          </div>
        </div>
      </div>

      {/* User + Premium status */}
      <div style={{ padding:"12px 14px", borderBottom:"1px solid var(--border)", flexShrink:0 }}>
        <div style={{ fontWeight:800, fontSize:"13px", marginBottom:"6px" }}>{user?.name}</div>
        <div style={{ display:"flex", alignItems:"center", gap:"6px", flexWrap:"wrap" }}>
          <span style={{ padding:"2px 8px", borderRadius:"20px", fontSize:"10px", fontWeight:800,
            background:"var(--accent-glow)", color:"var(--accent)", border:"1px solid var(--accent)" }}>
            {user?.examTarget}
          </span>
          {isPremium && (
            <span style={{ padding:"2px 8px", borderRadius:"20px", fontSize:"10px", fontWeight:800,
              background: isTrialing?"rgba(245,158,11,0.15)":"rgba(16,185,129,0.15)",
              color: isTrialing?"#f59e0b":"#10b981",
              border:`1px solid ${isTrialing?"rgba(245,158,11,0.4)":"rgba(16,185,129,0.4)"}` }}>
              {isTrialing ? `🎁 Trial ${daysLeft}d` : `👑 ${plan === "yearly" ? "Yearly" : "Monthly"}`}
            </span>
          )}
        </div>
      </div>

      {/* Premium CTA — only for free users */}
      {!isPremium && (
        <button onClick={() => onPageChange("pricing")}
          style={{ margin:"10px 10px 4px", padding:"10px 14px", borderRadius:"10px", border:"none",
            background:"linear-gradient(135deg,rgba(59,130,246,0.15),rgba(99,102,241,0.1))",
            borderTop:"1px solid rgba(59,130,246,0.3)",
            cursor:"pointer", textAlign:"left", fontFamily:"var(--font-main)",
            outline:"1px solid rgba(59,130,246,0.25)" }}>
          <div style={{ fontSize:"12px", fontWeight:900, color:"var(--accent)", marginBottom:"2px" }}>
            👑 Go Premium
          </div>
          <div style={{ fontSize:"10px", color:"var(--text-muted)" }}>
            ₹99/mo • 7-day free trial
          </div>
        </button>
      )}

      {/* Trial expiry warning */}
      {isTrialing && daysLeft <= 2 && (
        <button onClick={() => onPageChange("pricing")}
          style={{ margin:"8px 10px 4px", padding:"8px 12px", borderRadius:"8px", border:"none",
            background:"rgba(245,158,11,0.12)", outline:"1px solid rgba(245,158,11,0.4)",
            cursor:"pointer", textAlign:"left", fontFamily:"var(--font-main)" }}>
          <div style={{ fontSize:"11px", fontWeight:800, color:"#f59e0b" }}>
            ⚠️ Trial expires in {daysLeft} day{daysLeft!==1?"s":""}!
          </div>
          <div style={{ fontSize:"10px", color:"var(--text-muted)" }}>Tap to subscribe</div>
        </button>
      )}

      {/* Nav */}
      <nav style={{ flex:1, padding:"6px 8px", overflowY:"auto" }}>
        {/* Student items */}
        {STUDENT_NAV.map(item => {
          const isLocked = item.premium && !isPremium;
          return (
            <button key={item.id}
              onClick={() => onPageChange(isLocked ? "pricing" : item.id)}
              style={{
                width:"100%", padding:"8px 10px", borderRadius:"8px", border:"none",
                background: activePage===item.id ? "var(--accent-glow)" : "transparent",
                color: activePage===item.id ? "var(--accent)" : isLocked ? "#475569" : "var(--text-secondary)",
                cursor:"pointer", display:"flex", alignItems:"center", gap:"8px",
                fontSize:"12px", fontWeight: activePage===item.id ? 700 : 400,
                fontFamily:"var(--font-main)", textAlign:"left", transition:"all 0.15s",
                marginBottom:"1px",
                borderLeft: activePage===item.id ? "3px solid var(--accent)" : "3px solid transparent",
              }}>
              <span style={{ fontSize:"14px", flexShrink:0 }}>{item.icon}</span>
              <span style={{ flex:1 }}>{item.label}</span>
              {isLocked && <span style={{ fontSize:"10px", opacity:0.5 }}>🔒</span>}
            </button>
          );
        })}

        {/* Admin-only section — hidden from students */}
        {isAdmin && (
          <>
            <div style={{ margin:"10px 6px 6px", fontSize:"9px", fontWeight:800,
              color:"var(--text-muted)", letterSpacing:"0.08em", textTransform:"uppercase" }}>
              Admin Panel
            </div>
            {ADMIN_NAV.map(item => (
              <button key={item.id}
                onClick={() => onPageChange(item.id)}
                style={{ width:"100%", padding:"8px 10px", borderRadius:"8px", border:"none",
                  background: activePage===item.id ? `${item.color}18` : "transparent",
                  color: activePage===item.id ? item.color : "var(--text-secondary)",
                  cursor:"pointer", display:"flex", alignItems:"center", gap:"8px",
                  fontSize:"12px", fontWeight: activePage===item.id ? 700 : 400,
                  fontFamily:"var(--font-main)", textAlign:"left", marginBottom:"1px",
                  borderLeft: activePage===item.id ? `3px solid ${item.color}` : "3px solid transparent",
                }}>
                <span style={{ fontSize:"14px" }}>{item.icon}</span>
                <span style={{ flex:1 }}>{item.label}</span>
              </button>
            ))}
          </>
        )}
      </nav>

      {/* Logout */}
      <div style={{ padding:"10px", borderTop:"1px solid var(--border)", flexShrink:0 }}>
        <button onClick={logout}
          style={{ width:"100%", padding:"8px", borderRadius:"8px",
            border:"1px solid rgba(239,68,68,0.3)", background:"rgba(239,68,68,0.05)",
            color:"#f87171", cursor:"pointer", fontSize:"12px", fontWeight:700,
            fontFamily:"var(--font-main)", display:"flex", alignItems:"center",
            justifyContent:"center", gap:"6px" }}>
          🚪 Logout
        </button>
      </div>
    </aside>
  );
}
