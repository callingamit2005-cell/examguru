/**
 * MobileNav.jsx — Bottom Navigation Bar
 * 
 * Shows on mobile (≤768px), hidden on desktop.
 * 5 key tabs: Dashboard, AI Tutor, Test, Premium, More
 * "More" opens a slide-up drawer with all other pages.
 * 
 * Capacitor-ready: safe area insets handled via CSS.
 */

import React, { useState } from "react";
import { usePremium } from "../hooks/usePremium";

const MAIN_TABS = [
  { id:"dashboard", icon:"📊", label:"Home"     },
  { id:"chat",      icon:"🤖", label:"AI Tutor" },
  { id:"test",      icon:"📝", label:"Test"     },
  { id:"ncert",     icon:"📖", label:"NCERT"    },
  { id:"more",      icon:"☰",  label:"More"     },
];

const MORE_PAGES = [
  { id:"history",     icon:"📚", label:"History"       },
  { id:"weak",        icon:"🎯", label:"Weak Topics"   },
  { id:"heatmap",     icon:"🔥", label:"Weakness Map"  },
  { id:"prediction",  icon:"🔭", label:"Exam Predict"  },
  { id:"simulation",  icon:"⏱️", label:"Exam Sim"     },
  { id:"revision",    icon:"⚡", label:"Quick Revision"},
  { id:"countdown",   icon:"⏳", label:"Countdown"     },
  { id:"streak",      icon:"🔥", label:"Streak"        },
  { id:"leaderboard", icon:"🏆", label:"Leaderboard"   },
  { id:"challenge",   icon:"⚔️", label:"Challenge"    },
  { id:"doubts",      icon:"💬", label:"Doubts"        },
  { id:"group",       icon:"👥", label:"Group Study",  premium:true },
  { id:"progress",    icon:"📊", label:"AI Report",    premium:true },
  { id:"gamification",icon:"🎮", label:"My Progress"  },
  { id:"predictor",   icon:"🔮", label:"Score Pred"   },
  { id:"planner",     icon:"🗓️", label:"Planner"      },
  { id:"parent",      icon:"👨‍👩‍👧", label:"Parent View" },
  { id:"pricing",     icon:"👑", label:"Premium"       },
];

export default function MobileNav({ activePage, onPageChange }) {
  const [showMore, setShowMore] = useState(false);
  const { isPremium } = usePremium();

  const handleNav = (id) => {
    if (id === "more") { setShowMore(true); return; }
    onPageChange(id);
    setShowMore(false);
  };

  return (
    <>
      {/* Bottom Tab Bar */}
      <nav className="mobile-nav">
        {MAIN_TABS.map(tab => (
          <button key={tab.id}
            onClick={() => handleNav(tab.id)}
            className={`mobile-nav-btn ${(activePage === tab.id || (tab.id === "more" && showMore)) ? "active" : ""}`}>
            <span className="nav-icon">{tab.icon}</span>
            <span className="nav-label">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* More drawer — slide up */}
      {showMore && (
        <>
          {/* Backdrop */}
          <div onClick={() => setShowMore(false)}
            style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:300 }}/>

          {/* Drawer */}
          <div style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:301,
            background:"var(--bg-secondary)", borderRadius:"20px 20px 0 0",
            border:"1px solid var(--border)", borderBottom:"none",
            padding:"16px 16px 32px", maxHeight:"75vh", overflowY:"auto",
            animation:"bottomSlide 0.25s ease" }}>

            {/* Handle */}
            <div style={{ width:"40px", height:"4px", borderRadius:"2px",
              background:"var(--border-light)", margin:"0 auto 16px" }}/>

            <div style={{ fontSize:"12px", fontWeight:800, color:"var(--text-muted)",
              marginBottom:"12px", paddingLeft:"4px" }}>ALL FEATURES</div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"8px" }}>
              {MORE_PAGES.map(page => {
                const isLocked = page.premium && !isPremium;
                return (
                  <button key={page.id}
                    onClick={() => handleNav(page.id)}
                    style={{ display:"flex", flexDirection:"column", alignItems:"center",
                      gap:"6px", padding:"12px 8px", borderRadius:"12px", border:"none",
                      background: activePage===page.id?"var(--accent-glow)":"var(--bg-card)",
                      outline: activePage===page.id?"1px solid var(--accent)":"1px solid var(--border)",
                      cursor:"pointer", fontFamily:"var(--font-main)",
                      WebkitTapHighlightColor:"transparent", position:"relative" }}>
                    {isLocked && (
                      <span style={{ position:"absolute", top:"4px", right:"4px",
                        fontSize:"9px", opacity:0.6 }}>🔒</span>
                    )}
                    <span style={{ fontSize:"22px" }}>{page.icon}</span>
                    <span style={{ fontSize:"10px", fontWeight:600,
                      color: activePage===page.id?"var(--accent)":"var(--text-muted)",
                      textAlign:"center", lineHeight:"1.2" }}>{page.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}
