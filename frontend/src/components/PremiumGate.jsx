/**
 * PremiumGate.jsx
 * 
 * Show this when a free user tries to access premium feature.
 * 
 * Usage:
 *   const { canAccess } = usePremium();
 *   if (!canAccess("group_study")) return <PremiumGate feature="Group Study" />;
 */

import React from "react";

const FEATURE_PERKS = {
  group_study:        { icon:"👥", desc:"Real-time group study rooms with AI" },
  progress_report:    { icon:"📊", desc:"AI-powered weekly progress analysis" },
  unlimited_tests:    { icon:"📝", desc:"Unlimited mock tests anytime" },
  unlimited_ai:       { icon:"🤖", desc:"Unlimited AI tutor conversations" },
  unlimited_scan:     { icon:"📸", desc:"Unlimited photo scanner" },
  exam_simulation_full:{ icon:"⏱️",desc:"Full exam simulation with analysis" },
};

export default function PremiumGate({ feature, onUpgrade, featureKey }) {
  const perk = FEATURE_PERKS[featureKey] || { icon:"👑", desc:"Premium feature" };

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", minHeight:"60vh", padding:"32px", textAlign:"center" }}>

      <div style={{ fontSize:"60px", marginBottom:"16px" }}>🔒</div>

      <h2 style={{ fontSize:"22px", fontWeight:900, marginBottom:"8px" }}>
        {perk.icon} {feature || "Premium Feature"}
      </h2>

      <p style={{ fontSize:"14px", color:"var(--text-secondary)", maxWidth:"340px",
        marginBottom:"24px", lineHeight:"1.7" }}>
        {perk.desc} — yeh feature sirf <strong>Premium members</strong> ke liye available hai.
      </p>

      {/* Plans mini */}
      <div style={{ display:"flex", gap:"12px", marginBottom:"24px", flexWrap:"wrap", justifyContent:"center" }}>
        {[
          { plan:"Monthly", price:"₹99/month", color:"#3b82f6" },
          { plan:"Yearly",  price:"₹899/year",  color:"#10b981", badge:"Best Value" },
        ].map(p => (
          <div key={p.plan} style={{ padding:"14px 20px", borderRadius:"12px",
            border:`1px solid ${p.color}40`, background:`${p.color}0a`,
            textAlign:"center", minWidth:"120px" }}>
            {p.badge && <div style={{ fontSize:"10px", fontWeight:800, color:p.color, marginBottom:"4px" }}>{p.badge}</div>}
            <div style={{ fontWeight:800, marginBottom:"2px" }}>{p.plan}</div>
            <div style={{ fontSize:"16px", fontWeight:900, color:p.color }}>{p.price}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", gap:"10px", flexWrap:"wrap", justifyContent:"center" }}>
        <button onClick={() => onUpgrade?.()}
          style={{ padding:"14px 28px", borderRadius:"12px", border:"none",
            background:"linear-gradient(135deg,#3b82f6,#6366f1)",
            color:"white", fontWeight:900, fontSize:"15px", cursor:"pointer",
            fontFamily:"var(--font-main)",
            boxShadow:"0 8px 20px rgba(59,130,246,0.3)" }}>
          👑 Premium Lo — ₹99/month
        </button>
        <button onClick={() => onUpgrade?.("trial")}
          style={{ padding:"14px 28px", borderRadius:"12px",
            border:"1px solid rgba(245,158,11,0.4)",
            background:"rgba(245,158,11,0.08)",
            color:"#f59e0b", fontWeight:800, fontSize:"14px", cursor:"pointer",
            fontFamily:"var(--font-main)" }}>
          🎁 7-day Free Trial
        </button>
      </div>

      <p style={{ fontSize:"11px", color:"var(--text-muted)", marginTop:"16px" }}>
        🔒 Secure payment via Razorpay • Cancel anytime
      </p>
    </div>
  );
}
