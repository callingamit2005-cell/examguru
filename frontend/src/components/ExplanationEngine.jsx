import React, { useState, useEffect, useRef, useCallback } from "react";
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const STYLES = `
@keyframes stepIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
@keyframes drawLine { from{stroke-dashoffset:600} to{stroke-dashoffset:0} }
@keyframes popIn { 0%{opacity:0;transform:scale(0.7)} 70%{transform:scale(1.05)} 100%{opacity:1;transform:scale(1)} }
@keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
.step-in { animation: stepIn 0.4s ease forwards; }
.pop-in  { animation: popIn 0.5s cubic-bezier(.34,1.56,.64,1) forwards; }
.dl { stroke-dasharray:600; animation: drawLine 1.5s ease forwards; }
.fade-up { animation: fadeUp 0.3s ease forwards; }
`;

// ─── AI-POWERED DYNAMIC DIAGRAM GENERATOR ─────────────────────────────────────
// Calls backend to generate SVG diagram based on any concept
async function generateDiagram(concept, subject, apiBase) {
  try {
    const res = await fetch(`${apiBase}/chat/diagram`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ concept, subject, question: concept })
    });
    const data = await res.json();
    return data.svg || null;
  } catch {
    return null;
  }
}

// ─── STATIC FALLBACK DIAGRAMS for common concepts ─────────────────────────────
const SVGWrap = ({ children, h = 200 }) => (
  <svg viewBox={`0 0 340 ${h}`} width="100%" style={{ maxWidth: 340, display: "block", margin: "0 auto" }}>
    <defs>
      {["#f59e0b","#10b981","#ef4444","#3b82f6","#a78bfa","#60a5fa","#f97316","#94a3b8","#fbbf24","#34d399"].map((c,i) => (
        <marker key={i} id={`a${i}`} markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L7,3 z" fill={c}/>
        </marker>
      ))}
    </defs>
    <rect width="340" height={h} rx="12" fill="#0f172a"/>
    {children}
  </svg>
);

const T = ({ x, y, text, color = "#94a3b8", size = 10, bold, anchor = "middle" }) => (
  <text x={x} y={y} textAnchor={anchor} fill={color} fontSize={size} fontWeight={bold ? "800" : "400"}>{text}</text>
);

const Arr = ({ x1, y1, x2, y2, color = "#f59e0b", ci = 0 }) => (
  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="2"
    markerEnd={`url(#a${ci})`} className="dl" />
);

// ─── CONCEPT → DIAGRAM MATCHER (keyword based, works for ANY topic) ────────────
function getStaticDiagram(concept, subject) {
  const c = (concept || "").toLowerCase();
  const s = (subject || "").toLowerCase();

  // Physics
  if (/\bpythag/.test(c)) return <SVGWrap>
    <T x={170} y={18} text="Pythagoras: a² + b² = c²" color="#3b82f6" size={12} bold/>
    <polygon points="40,170 290,170 290,50" fill="rgba(59,130,246,0.12)" stroke="#3b82f6" strokeWidth="2" className="dl"/>
    <rect x="272" y="152" width="18" height="18" fill="none" stroke="#f59e0b" strokeWidth="1.5"/>
    <T x={165} y={188} text="a (base)" color="#10b981" size={12} bold/>
    <T x={308} y={115} text="b" color="#ef4444" size={12} bold/>
    <T x={148} y={100} text="c (hypotenuse)" color="#a78bfa" size={11} bold/>
    <rect x="25" y="22" width="190" height="22" rx="6" fill="rgba(99,102,241,0.15)" stroke="rgba(99,102,241,0.4)" strokeWidth="1"/>
    <T x={120} y={37} text="a² + b² = c²" color="#a78bfa" size={13} bold/>
    <T x={55} y={165} text="θ" color="#fbbf24" size={14}/>
  </SVGWrap>;

  if (/\bnewton\b|f\s*=\s*ma|force.*mass|second law/.test(c)) return <SVGWrap>
    <T x={170} y={18} text="Newton's 2nd Law: F = m × a" color="#f59e0b" size={11} bold/>
    <line x1="20" y1="165" x2="320" y2="165" stroke="#475569" strokeWidth="2"/>
    <circle cx="90" cy="130" r="25" fill="rgba(59,130,246,0.25)" stroke="#3b82f6" strokeWidth="2" className="pop-in"/>
    <T x={90} y={134} text="m = 5kg" color="white" size={9} bold/>
    <Arr x1={118} y1={130} x2={215} y2={130} color="#f59e0b" ci={0}/>
    <T x={168} y={122} text="F = 10N →" color="#f59e0b" size={11} bold/>
    <circle cx="255" cy="130" r="25" fill="rgba(59,130,246,0.1)" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4"/>
    <T x={255} y={134} text="Moving!" color="#64748b" size={9}/>
    <Arr x1={90} y1={158} x2={90} y2={183} color="#ef4444" ci={2}/>
    <T x={108} y={180} text="mg↓" color="#ef4444" size={9}/>
    <rect x="200" y="22" width="125" height="22" rx="6" fill="rgba(245,158,11,0.12)" stroke="rgba(245,158,11,0.3)" strokeWidth="1"/>
    <T x={262} y={37} text="a = F÷m = 2 m/s²" color="#f59e0b" size={9} bold/>
  </SVGWrap>;

  if (/\bohm\b|v\s*=\s*ir|\bcircuit\b|\bresistance\b/.test(c)) return <SVGWrap>
    <T x={170} y={18} text="Ohm's Law: V = I × R" color="#f59e0b" size={12} bold/>
    <rect x="50" y="42" width="60" height="32" rx="6" fill="rgba(245,158,11,0.15)" stroke="#f59e0b" strokeWidth="1.5"/>
    <T x={80} y={58} text="⚡ 12V" color="#f59e0b" size={10} bold/>
    <rect x="220" y="42" width="70" height="32" rx="6" fill="rgba(239,68,68,0.15)" stroke="#ef4444" strokeWidth="1.5"/>
    <T x={255} y={58} text="R = 4Ω" color="#ef4444" size={10} bold/>
    <line x1="110" y1="58" x2="220" y2="58" stroke="#10b981" strokeWidth="2.5" className="dl"/>
    <line x1="50" y1="58" x2="25" y2="58" stroke="#10b981" strokeWidth="2.5"/>
    <line x1="25" y1="58" x2="25" y2="140" stroke="#10b981" strokeWidth="2.5"/>
    <line x1="25" y1="140" x2="315" y2="140" stroke="#10b981" strokeWidth="2.5"/>
    <line x1="315" y1="140" x2="315" y2="58" stroke="#10b981" strokeWidth="2.5"/>
    <line x1="290" y1="58" x2="315" y2="58" stroke="#10b981" strokeWidth="2.5"/>
    <T x={168} y={51} text="I = 3A →" color="#10b981" size={11} bold/>
    <rect x="60" y="98" width="100" height="36" rx="8" fill="rgba(99,102,241,0.1)" stroke="rgba(99,102,241,0.3)" strokeWidth="1"/>
    <T x={110} y={113} text="V = I × R" color="#a78bfa" size={11} bold/>
    <T x={110} y={126} text="12 = 3 × 4 ✓" color="#fbbf24" size={9}/>
  </SVGWrap>;

  if (/\bphotosyn/.test(c)) return <SVGWrap>
    <T x={170} y={14} text="Photosynthesis" color="#10b981" size={12} bold/>
    <circle cx="55" cy="48" r="26" fill="rgba(251,191,36,0.2)" stroke="#fbbf24" strokeWidth="2"/>
    <text x="55" y="43" textAnchor="middle" fill="#fbbf24" fontSize="18">☀️</text>
    <T x={55} y={62} text="Light" color="#fbbf24" size={8} bold/>
    <ellipse cx="175" cy="108" rx="52" ry="36" fill="rgba(16,185,129,0.2)" stroke="#10b981" strokeWidth="2"/>
    <line x1="175" y1="72" x2="175" y2="144" stroke="#065f46" strokeWidth="1.5"/>
    <T x={175} y={112} text="LEAF 🍃" color="white" size={10} bold/>
    <Arr x1={83} y1={116} x2={121} y2={111} color="#94a3b8" ci={7}/>
    <T x={58} y={111} text="CO₂" color="#94a3b8" size={10} bold/>
    <Arr x1={175} y1={180} x2={175} y2={146} color="#60a5fa" ci={5}/>
    <T x={192} y={186} text="H₂O" color="#60a5fa" size={10} bold/>
    <Arr x1={230} y1={98} x2={274} y2={78} color="#34d399" ci={9}/>
    <T x={290} y={76} text="O₂" color="#34d399" size={10} bold/>
    <Arr x1={230} y1={118} x2={274} y2={130} color="#fbbf24" ci={8}/>
    <T x={295} y={130} text="Glucose" color="#fbbf24" size={9} bold/>
    <T x={170} y={195} text="6CO₂ + 6H₂O + Light → C₆H₁₂O₆ + 6O₂" color="#475569" size={8}/>
  </SVGWrap>;

  if (/\bdna\b|double helix|base pair/.test(c)) return <SVGWrap>
    <T x={170} y={16} text="DNA Double Helix" color="#a78bfa" size={12} bold/>
    {[0,1,2,3,4,5,6,7].map(i => {
      const y = 32 + i * 20, o = Math.sin(i * 0.9) * 35;
      const pairs = [["A","T"],["T","A"],["G","C"],["C","G"],["A","T"],["G","C"],["T","A"],["C","G"]];
      const [l, r] = pairs[i];
      const lc = l==="A"?"#3b82f6":l==="T"?"#ef4444":l==="G"?"#10b981":"#f59e0b";
      const rc = r==="A"?"#3b82f6":r==="T"?"#ef4444":r==="G"?"#10b981":"#f59e0b";
      return <g key={i}>
        <circle cx={130+o} cy={y} r={10} fill={`${lc}70`} stroke={lc} strokeWidth="1.5"/>
        <T x={130+o} y={y+4} text={l} color="white" size={8} bold/>
        <circle cx={210-o} cy={y} r={10} fill={`${rc}70`} stroke={rc} strokeWidth="1.5"/>
        <T x={210-o} y={y+4} text={r} color="white" size={8} bold/>
        <line x1={140+o} y1={y} x2={200-o} y2={y} stroke="#334155" strokeWidth="2" strokeDasharray="3"/>
      </g>;
    })}
    <T x={170} y={196} text="A-T (2 bonds)   G-C (3 bonds)" color="#64748b" size={8}/>
  </SVGWrap>;

  if (/\bcell\b|\borganelle\b|\bmitochondr/.test(c)) return <SVGWrap>
    <T x={170} y={16} text="Animal Cell — Organelles" color="#10b981" size={12} bold/>
    <ellipse cx="170" cy="108" rx="135" ry="75" fill="rgba(16,185,129,0.04)" stroke="#10b981" strokeWidth="2" strokeDasharray="6"/>
    <ellipse cx="170" cy="108" rx="118" ry="63" fill="rgba(59,130,246,0.05)" stroke="#3b82f6" strokeWidth="1.5"/>
    <ellipse cx="155" cy="100" rx="33" ry="26" fill="rgba(139,92,246,0.2)" stroke="#8b5cf6" strokeWidth="2"/>
    <T x={155} y={98} text="Nucleus" color="#a78bfa" size={9} bold/>
    <circle cx="155" cy="108" r="7" fill="rgba(139,92,246,0.4)" stroke="#7c3aed" strokeWidth="1"/>
    <T x={155} y={112} text="DNA" color="white" size={7}/>
    <ellipse cx="238" cy="83" rx="20" ry="11" fill="rgba(249,115,22,0.2)" stroke="#f97316" strokeWidth="1.5"/>
    <T x={238} y={87} text="Mito." color="#fb923c" size={8}/>
    <ellipse cx="90" cy="123" rx="18" ry="10" fill="rgba(249,115,22,0.2)" stroke="#f97316" strokeWidth="1.5"/>
    <T x={90} y={127} text="Mito." color="#fb923c" size={8}/>
    <circle cx="232" cy="128" r="13" fill="rgba(16,185,129,0.15)" stroke="#34d399" strokeWidth="1"/>
    <T x={232} y={132} text="Vacuole" color="#34d399" size={8}/>
    <T x={170} y={185} text="Wall → Membrane → Cytoplasm → Nucleus" color="#475569" size={8}/>
  </SVGWrap>;

  if (/\btrig\b|trigonometry|\bsin\b|\bcos\b|\btan\b|soh.cah|sohcahtoa/.test(c)) return <SVGWrap>
    <T x={170} y={16} text="Trigonometry — SOH CAH TOA" color="#a78bfa" size={11} bold/>
    <polygon points="50,170 280,170 280,50" fill="rgba(99,102,241,0.1)" stroke="#6366f1" strokeWidth="2"/>
    <rect x="262" y="152" width="18" height="18" fill="none" stroke="#f59e0b" strokeWidth="1.5"/>
    <path d="M78,170 A28,28 0 0,0 52,145" fill="none" stroke="#10b981" strokeWidth="2"/>
    <T x={82} y={160} text="θ" color="#10b981" size={14} bold/>
    <T x={165} y={188} text="Adjacent (Base)" color="#fbbf24" size={11} bold/>
    <T x={298} y={115} text="Opposite" color="#ef4444" size={10} bold/>
    <T x={148} y={92} text="Hypotenuse" color="#a78bfa" size={11} bold/>
    <rect x="10" y="22" width="220" height="34" rx="8" fill="rgba(99,102,241,0.15)" stroke="rgba(99,102,241,0.4)" strokeWidth="1"/>
    <T x={120} y={36} text="Sin=O/H   Cos=A/H   Tan=O/A" color="#c4b5fd" size={9} bold/>
    <T x={120} y={49} text="SOH - CAH - TOA (memory trick)" color="#818cf8" size={9} bold/>
  </SVGWrap>;

  if (/\bheart\b|\bcardiac\b|blood.*pump|\batri\b|\bventricle\b/.test(c)) return <SVGWrap>
    <T x={170} y={16} text="Human Heart — 4 Chambers" color="#ef4444" size={12} bold/>
    <path d="M170,172 C100,132 50,102 50,67 C50,42 70,27 95,27 C120,27 145,44 170,67 C195,44 220,27 245,27 C270,27 290,42 290,67 C290,102 240,132 170,172 Z" fill="rgba(239,68,68,0.12)" stroke="#ef4444" strokeWidth="2"/>
    <rect x="97" y="62" width="63" height="65" rx="8" fill="rgba(96,165,250,0.18)" stroke="#60a5fa" strokeWidth="1.5"/>
    <rect x="177" y="62" width="63" height="65" rx="8" fill="rgba(239,68,68,0.18)" stroke="#ef4444" strokeWidth="1.5"/>
    <T x={128} y={83} text="Right Atrium" color="#60a5fa" size={8} bold/>
    <T x={208} y={83} text="Left Atrium" color="#ef4444" size={8} bold/>
    <T x={128} y={118} text="R.Ventricle" color="#93c5fd" size={8}/>
    <T x={208} y={118} text="L.Ventricle" color="#fca5a5" size={8}/>
    <T x={170} y={195} text="🔵 Deoxygenated→Lungs  🔴 Oxygenated→Body" color="#94a3b8" size={8}/>
  </SVGWrap>;

  if (/\bmitosis\b|cell.*divis/.test(c)) return <SVGWrap>
    <T x={170} y={16} text="Mitosis — PMAT" color="#10b981" size={12} bold/>
    {[{x:42,l:"Prophase",c:"#3b82f6",i:"◉◉"},{x:120,l:"Metaphase",c:"#f59e0b",i:"━━"},{x:198,l:"Anaphase",c:"#ef4444",i:"↑↑"},{x:276,l:"Telophase",c:"#10b981",i:"⊕⊕"}].map((p,i) => (
      <g key={i}>
        <circle cx={p.x} cy={105} r={30} fill={`${p.c}12`} stroke={p.c} strokeWidth="1.5"/>
        <T x={p.x} y={110} text={p.i} color={p.c} size={13}/>
        <T x={p.x} y={150} text={p.l} color={p.c} size={9} bold/>
        {i<3 && <Arr x1={p.x+30} y1={105} x2={p.x+49} y2={105} color="#475569" ci={7}/>}
      </g>
    ))}
    <T x={170} y={188} text="1 cell → 2 identical daughter cells" color="#64748b" size={9}/>
  </SVGWrap>;

  if (/water.*cycle|\bevapor|\bcondensation\b|\bprecipitation\b/.test(c)) return <SVGWrap>
    <T x={170} y={14} text="Water Cycle" color="#60a5fa" size={12} bold/>
    <rect x="0" y="0" width="340" height="130" rx="12" fill="rgba(30,58,138,0.15)"/>
    <circle cx="55" cy="38" r="24" fill="rgba(251,191,36,0.2)" stroke="#fbbf24" strokeWidth="2"/>
    <text x="55" y="43" textAnchor="middle" fill="#fbbf24" fontSize="18">☀️</text>
    <ellipse cx="175" cy="45" rx="52" ry="22" fill="rgba(148,163,184,0.3)" stroke="#94a3b8" strokeWidth="1.5"/>
    <ellipse cx="148" cy="50" rx="33" ry="18" fill="rgba(148,163,184,0.3)"/>
    <ellipse cx="200" cy="50" rx="33" ry="18" fill="rgba(148,163,184,0.3)"/>
    <T x={175} y={50} text="☁️ Cloud" color="white" size={10} bold/>
    {[155,170,185].map((x,i) => <line key={i} x1={x} y1={70} x2={x-3} y2={90} stroke="#60a5fa" strokeWidth="1.5" className="dl"/>)}
    <ellipse cx="60" cy="162" rx="44" ry="13" fill="rgba(59,130,246,0.25)" stroke="#3b82f6" strokeWidth="1.5"/>
    <T x={60} y={166} text="Ocean/River" color="#93c5fd" size={9} bold/>
    {[40,55,70].map((x,i) => <line key={i} x1={x} y1={148} x2={x+8} y2={100} stroke="#f97316" strokeWidth="1.5" strokeDasharray="3" className="dl"/>)}
    <T x={28} y={125} text="Evap↑" color="#f97316" size={9} bold/>
    <T x={160} y={110} text="Rain↓" color="#60a5fa" size={9} bold/>
    <T x={242} y={145} text="Collection" color="#10b981" size={9} bold/>
  </SVGWrap>;

  if (/\bacid\b|\bbase\b|\bph scale\b|\bph\s*=\b|\bneutral\b/.test(c)) return <SVGWrap>
    <T x={170} y={16} text="pH Scale — Acids, Bases & Neutral" color="#10b981" size={11} bold/>
    {Array.from({length:14}, (_,i) => {
      const hue = i < 7 ? (i * 15) : (200 + (13-i)*12);
      return <g key={i}>
        <rect x={12+i*23} y={35} width={21} height={80} rx="3" fill={`hsl(${hue},65%,40%)`} opacity="0.85"/>
        <T x={22+i*23} y={80} text={String(i+1)} color="white" size={10} bold/>
      </g>;
    })}
    <T x={42} y={128} text="← ACID" color="#ef4444" size={10} bold/>
    <T x={170} y={128} text="NEUTRAL" color="#10b981" size={10} bold/>
    <T x={298} y={128} text="BASE →" color="#3b82f6" size={10} bold/>
    <T x={60} y={150} text="HCl, Vinegar, Lemon" color="#f87171" size={8}/>
    <T x={170} y={150} text="Pure Water (pH=7)" color="#34d399" size={8}/>
    <T x={280} y={150} text="NaOH, Soap" color="#60a5fa" size={8}/>
    <T x={170} y={170} text="Litmus: Red in acid → Blue in base" color="#94a3b8" size={9}/>
    <T x={170} y={185} text="Neutralisation: Acid + Base → Salt + Water" color="#64748b" size={8}/>
  </SVGWrap>;

  if (/\bconstitution\b|fundamental right|\barticle \d+\b|\bparliament\b/.test(c)) return <SVGWrap h={210}>
    <T x={170} y={16} text="Indian Constitution — Key Pillars" color="#f59e0b" size={11} bold/>
    {[
      {y:30,c:"#ef4444",i:"⚖️",l:"Fundamental Rights",d:"Articles 12-35 | Life, Equality, Freedom, Education"},
      {y:66,c:"#3b82f6",i:"📋",l:"DPSP (Art 36-51)",d:"Welfare state goals — not justiciable"},
      {y:102,c:"#10b981",i:"🏛️",l:"Parliament Structure",d:"Lok Sabha + Rajya Sabha + President"},
      {y:138,c:"#a78bfa",i:"⚡",l:"Federal + Unitary",d:"Strong Centre + States have own powers"},
      {y:172,c:"#f97316",i:"🗳️",l:"Universal Franchise",d:"Every citizen 18+ has right to vote"},
    ].map((item,i) => (
      <g key={i}>
        <rect x={12} y={item.y} width={316} height={30} rx="8" fill={`${item.c}10`} stroke={`${item.c}35`} strokeWidth="1"/>
        <text x={28} y={item.y+13} fill={item.c} fontSize={12}>{item.i}</text>
        <T x={160} y={item.y+13} text={item.l} color={item.c} size={10} bold anchor="middle"/>
        <T x={170} y={item.y+25} text={item.d} color="#64748b" size={7.5}/>
      </g>
    ))}
  </SVGWrap>;

  if (/\bdemocracy\b|\blegislature\b|\bexecutive\b|\bjudiciary\b/.test(c)) return <SVGWrap h={210}>
    <T x={170} y={16} text="3 Pillars of Democracy" color="#3b82f6" size={12} bold/>
    <rect x="115" y="26" width="110" height="32" rx="8" fill="rgba(59,130,246,0.18)" stroke="#3b82f6" strokeWidth="2"/>
    <T x={170} y={46} text="THE PEOPLE 🗳️" color="#60a5fa" size={10} bold/>
    <Arr x1={170} y1={58} x2={170} y2={78} color="#3b82f6" ci={3}/>
    <rect x="110" y="80" width="120" height="28" rx="8" fill="rgba(245,158,11,0.15)" stroke="#f59e0b" strokeWidth="1.5"/>
    <T x={170} y={98} text="PARLIAMENT 🏛️" color="#fbbf24" size={10} bold/>
    <Arr x1={145} y1={108} x2={88} y2={130} color="#10b981" ci={1}/>
    <Arr x1={195} y1={108} x2={252} y2={130} color="#ef4444" ci={2}/>
    <Arr x1={170} y1={108} x2={170} y2={130} color="#a78bfa" ci={4}/>
    {[{x:42,c:"#10b981",l:"Legislature",s:"Makes Laws"},{x:130,c:"#a78bfa",l:"Executive",s:"Implements"},{x:218,c:"#ef4444",l:"Judiciary",s:"Interprets"}].map((p,i) => (
      <g key={i}>
        <rect x={p.x} y={132} width={80} height={48} rx="8" fill={`${p.c}12`} stroke={p.c} strokeWidth="1.5"/>
        <T x={p.x+40} y={152} text={p.l} color={p.c} size={9} bold/>
        <T x={p.x+40} y={168} text={p.s} color="#64748b" size={8}/>
      </g>
    ))}
    <T x={170} y={198} text="Separation of Powers — Checks & Balances" color="#475569" size={8} bold/>
  </SVGWrap>;

  if (/\bmughal\b|\bakbar\b|\bbabur\b|\baurangzeb\b|shah jahan/.test(c)) return <SVGWrap h={215}>
    <T x={170} y={16} text="Mughal Empire — Key Rulers" color="#f59e0b" size={12} bold/>
    {[
      {y:28,n:"Babur (1526–30)",e:"Founded empire | Battle of Panipat | Used gunpowder",c:"#3b82f6"},
      {y:57,n:"Humayun (1530–56)",e:"Lost to Sher Shah Suri | Regained with Persian help",c:"#10b981"},
      {y:86,n:"Akbar (1556–1605)",e:"Din-i-Ilahi | Navratnas | Religious tolerance | 9 jewels",c:"#f59e0b"},
      {y:115,n:"Jahangir (1605–27)",e:"Art & painting | Nur Jahan influence | Tuzuk-i-Jahangiri",c:"#f97316"},
      {y:144,n:"Shah Jahan (1628–58)",e:"Taj Mahal | Red Fort | Peacock Throne | Golden age",c:"#a78bfa"},
      {y:173,n:"Aurangzeb (1658–1707)",e:"Jizya reimposed | Largest empire | Deccan wars → decline",c:"#ef4444"},
    ].map((r,i) => (
      <g key={i}>
        <rect x={10} y={r.y} width={320} height={26} rx="6" fill={`${r.c}10`} stroke={`${r.c}30`} strokeWidth="1"/>
        <T x={16} y={r.y+12} text={r.n} color={r.c} size={9} bold anchor="start"/>
        <T x={16} y={r.y+23} text={r.e} color="#64748b" size={7.5} anchor="start"/>
      </g>
    ))}
  </SVGWrap>;

  if (/\bindependence\b|freedom.*movement|\bgandhi\b|quit india|\bdandi\b|\bsatyagrah/.test(c)) return <SVGWrap h={215}>
    <T x={170} y={16} text="Indian Independence Movement" color="#f97316" size={11} bold/>
    {[
      {y:28,yr:"1857",e:"Sepoy Mutiny — First War of Independence",c:"#ef4444"},
      {y:55,yr:"1885",e:"INC founded — Dadabhai Naoroji, moderate phase",c:"#3b82f6"},
      {y:82,yr:"1905",e:"Partition of Bengal → Swadeshi Movement",c:"#f59e0b"},
      {y:109,yr:"1919",e:"Jallianwala Bagh — mass anger across India",c:"#ef4444"},
      {y:136,yr:"1930",e:"Dandi March — Salt Satyagraha — Civil Disobedience",c:"#10b981"},
      {y:163,yr:"1942",e:"Quit India Movement — 'Do or Die' — Gandhi",c:"#f97316"},
      {y:190,yr:"1947",e:"Independence — 15 August 🇮🇳 Nehru: Tryst with Destiny",c:"#10b981"},
    ].map((e,i) => (
      <g key={i}>
        <rect x={10} y={e.y} width={46} height={20} rx="4" fill={`${e.c}20`} stroke={e.c} strokeWidth="1"/>
        <T x={33} y={e.y+14} text={e.yr} color={e.c} size={9} bold/>
        <T x={62} y={e.y+14} text={e.e} color="#94a3b8" size={8} anchor="start"/>
      </g>
    ))}
  </SVGWrap>;

  if (/\bgdp\b|\beconomy\b|\binflation\b|\bfiscal\b|\bmonetary\b|\bbudget\b/.test(c)) return <SVGWrap h={210}>
    <T x={170} y={16} text="Economics — Key Concepts" color="#10b981" size={12} bold/>
    {[
      {y:28,c:"#3b82f6",t:"GDP",d:"Gross Domestic Product = C + I + G + (X-M)"},
      {y:65,c:"#ef4444",t:"Inflation",d:"CPI rises → purchasing power falls → RBI raises rates"},
      {y:102,c:"#f59e0b",t:"Fiscal Policy",d:"Govt spending & tax — budget deficit/surplus"},
      {y:139,c:"#10b981",t:"Monetary Policy",d:"RBI controls repo rate, money supply, CRR, SLR"},
      {y:170,c:"#a78bfa",t:"Balance of Payments",d:"Current + Capital account — forex reserve"},
    ].map((item,i) => (
      <g key={i}>
        <rect x={12} y={item.y} width={316} height={32} rx="8" fill={`${item.c}10`} stroke={`${item.c}35`} strokeWidth="1"/>
        <T x={22} y={item.y+14} text={item.t} color={item.c} size={11} bold anchor="start"/>
        <T x={22} y={item.y+26} text={item.d} color="#64748b" size={8} anchor="start"/>
      </g>
    ))}
  </SVGWrap>;

  if (/\batom\b|\belectron\b|\bproton\b|\bneutron\b|\bnucleus\b/.test(c)) return <SVGWrap>
    <T x={170} y={16} text="Atom — Nucleus + Electrons" color="#a78bfa" size={12} bold/>
    <circle cx="170" cy="105" r="20" fill="rgba(239,68,68,0.25)" stroke="#ef4444" strokeWidth="2"/>
    <T x={170} y={101} text="p⁺p⁺" color="white" size={9} bold/>
    <T x={170} y={113} text="n  n" color="#94a3b8" size={9}/>
    {[42,65,90].map((r,i) => (
      <ellipse key={i} cx="170" cy="105" rx={r} ry={r*0.44}
        fill="none" stroke={["#3b82f6","#10b981","#f59e0b"][i]}
        strokeWidth="1" strokeDasharray="4" opacity="0.6"
        transform={`rotate(${i*60} 170 105)`}/>
    ))}
    {[{cx:212,cy:85,c:"#3b82f6"},{cx:128,cy:125,c:"#3b82f6"},{cx:235,cy:105,c:"#10b981"},{cx:105,cy:105,c:"#10b981"},{cx:218,cy:130,c:"#f59e0b"},{cx:122,cy:80,c:"#f59e0b"}].map((e,i) => (
      <circle key={i} cx={e.cx} cy={e.cy} r={6} fill={`${e.c}40`} stroke={e.c} strokeWidth="1.5" className="pop-in"/>
    ))}
    <T x={270} y={155} text="e⁻ Electron" color="#3b82f6" size={9}/>
    <T x={270} y={168} text="p⁺ Proton" color="#ef4444" size={9}/>
    <T x={270} y={181} text="n  Neutron" color="#94a3b8" size={9}/>
    <T x={170} y={195} text="Atomic no. = Protons | Mass no. = P + N" color="#475569" size={8}/>
  </SVGWrap>;

  if (/\bquadratic\b|\bparabola\b/.test(c)) return <SVGWrap h={210}>
    <T x={170} y={16} text="Quadratic Equation: ax²+bx+c=0" color="#3b82f6" size={11} bold/>
    {Array.from({length:58},(_,i) => {
      const x1=20+i*5.2, y1=120-((x1-170)/14)**2*0.8;
      const x2=25.2+i*5.2, y2=120-((x2-170)/14)**2*0.8;
      return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#3b82f6" strokeWidth="2"/>;
    })}
    <line x1="20" y1="120" x2="320" y2="120" stroke="#475569" strokeWidth="1.5"/>
    <line x1="170" y1="25" x2="170" y2="195" stroke="#475569" strokeWidth="1.5"/>
    <circle cx="100" cy="120" r="5" fill="#ef4444"/>
    <T x={100} y={138} text="x₁" color="#ef4444" size={9}/>
    <circle cx="240" cy="120" r="5" fill="#ef4444"/>
    <T x={240} y={138} text="x₂" color="#ef4444" size={9}/>
    <circle cx="170" cy="68" r="5" fill="#10b981"/>
    <T x={190} y={66} text="Vertex" color="#10b981" size={9}/>
    <rect x={10} y={148} width={320} height={40} rx="8" fill="rgba(59,130,246,0.08)" stroke="rgba(59,130,246,0.2)" strokeWidth="1"/>
    <T x={170} y={164} text="x = (−b ± √(b²−4ac)) / 2a" color="#60a5fa" size={11} bold/>
    <T x={170} y={182} text="b²−4ac > 0 → 2 real roots | =0 → 1 root | <0 → no real root" color="#64748b" size={8}/>
  </SVGWrap>;

  if (/current affairs|scheme|government.*scheme|yojna/.test(c)) return <SVGWrap h={210}>
    <T x={170} y={16} text="Government Schemes — Quick Reference" color="#f59e0b" size={11} bold/>
    {[
      {y:28,c:"#3b82f6",n:"PM-KISAN",d:"₹6000/year to small farmers directly"},
      {y:58,c:"#10b981",n:"Ayushman Bharat",d:"₹5 lakh health insurance to poor families"},
      {y:88,c:"#f59e0b",n:"PM Awas Yojana",d:"Housing for all — urban & rural"},
      {y:118,c:"#ef4444",n:"Swachh Bharat",d:"Toilet construction + cleanliness mission"},
      {y:148,c:"#a78bfa",n:"Digital India",d:"Internet + digital literacy + e-governance"},
      {y:178,c:"#f97316",n:"Make in India",d:"Manufacturing hub — FDI boost"},
    ].map((s,i) => (
      <g key={i}>
        <rect x={10} y={s.y} width={320} height={26} rx="6" fill={`${s.c}10`} stroke={`${s.c}30`} strokeWidth="1"/>
        <T x={16} y={s.y+12} text={s.n} color={s.c} size={10} bold anchor="start"/>
        <T x={16} y={s.y+23} text={s.d} color="#64748b" size={8} anchor="start"/>
      </g>
    ))}
  </SVGWrap>;

  // ── UNIVERSAL FALLBACK — Concept Map for ANY topic ──────────────────────────
  return <SVGWrap>
    <T x={170} y={16} text={`Concept Map — ${(concept||"").slice(0,25)}`} color="#a78bfa" size={11} bold/>
    <ellipse cx="170" cy="95" rx="55" ry="32" fill="rgba(59,130,246,0.18)" stroke="#3b82f6" strokeWidth="2"/>
    <T x={170} y={91} text={(concept||"Topic").split(" ").slice(0,3).join(" ")} color="#60a5fa" size={11} bold/>
    <T x={170} y={105} text="Core Concept" color="#94a3b8" size={8}/>
    {[
      {x:55,y:40,l:"What?",c:"#10b981",angle:225},
      {x:285,y:40,l:"Why?",c:"#f59e0b",angle:315},
      {x:55,y:150,l:"How?",c:"#ef4444",angle:135},
      {x:285,y:150,l:"Apply",c:"#8b5cf6",angle:45},
    ].map((b,i) => {
      const dx = b.x < 170 ? 28 : -28, dy = b.y < 95 ? 14 : -14;
      return <g key={i}>
        <line x1={170+(b.x<170?-55:55)} y1={95+(b.y<95?-32:32)}
          x2={b.x+dx} y2={b.y+dy}
          stroke={b.c} strokeWidth="1.5" strokeDasharray="4" className="dl"/>
        <rect x={b.x-(b.x<170?48:0)} y={b.y-14} width={50} height={28} rx="8"
          fill={`${b.c}12`} stroke={b.c} strokeWidth="1"/>
        <T x={b.x+(b.x<170?-23:25)} y={b.y+5} text={b.l} color={b.c} size={10} bold/>
      </g>;
    })}
    <T x={170} y={178} text={`Subject: ${subject || "General"}`} color="#475569" size={9}/>
    <T x={170} y={192} text="Ask AI for more details → Step by step explanation" color="#334155" size={8}/>
  </SVGWrap>;
}

// ─── REAL WORLD EXAMPLES ──────────────────────────────────────────────────────
const EXAMPLES = {
  physics:["🏏 Cricket ball swing","🚗 Car braking","💡 Bulb glow","📱 Phone charging"],
  chemistry:["🍳 Khana pakana","🔋 Battery","🫁 Saans lena","🧴 Soap bubbles"],
  mathematics:["📐 Ghar banana","💰 Bank interest","🗺️ GPS","🎮 Game score"],
  biology:["❤️ Heartbeat","🧠 Memory","🌱 Plant growth","🍎 Digestion"],
  history:["🏛️ Aaj ka India","⚔️ Freedom fighters","📜 Constitution","🗳️ Elections"],
  polity:["⚖️ Court cases","🏛️ Parliament session","🗳️ Elections","📋 RTI use"],
  economy:["💹 Stock market","🏦 Bank loan","📈 Inflation effect","🛍️ GST"],
  geography:["🌧️ Mumbai rains","🏔️ Himalaya","🌊 Tsunami","🌪️ Cyclone"],
  default:["🌍 Real life","📱 Technology","🏠 Ghar mein","💡 Everyday use"]
};

// ─── REAL IMAGE DIAGRAM BLOCK ────────────────────────────────────────────────
function DiagramBlock({ concept, subject, staticFallback }) {
  const [imgUrl, setImgUrl]     = useState(null);
  const [imgMeta, setImgMeta]   = useState(null);
  const [loading, setLoading]   = useState(true);  // start as loading
  const [imgError, setImgError] = useState(false);
  const fetchedRef              = useRef(false);

  useEffect(() => {
    if (!concept || fetchedRef.current) return;
    fetchedRef.current = true;

    fetch(`${API_BASE}/diagram`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ concept, subject, question: concept })
    })
    .then(r => r.json())
    .then(data => {
      if (data.type === "image" && data.url) {
        setImgUrl(data.url);
        setImgMeta({ title: data.title, source: data.source, link: data.link });
      }
    })
    .catch(() => {})
    .finally(() => setLoading(false));
  }, [concept, subject]);

  // Loading state
  if (loading) return (
    <div style={{ background:"var(--bg-secondary)", borderRadius:"14px", padding:"28px 16px", border:"1px solid var(--border)", textAlign:"center" }}>
      <div className="loader" style={{ width:"22px", height:"22px", margin:"0 auto 8px" }}/>
      <div style={{ fontSize:"11px", color:"var(--text-muted)" }}>📚 Diagram dhundh raha hoon...</div>
    </div>
  );

  // Real image found — show it
  if (imgUrl && !imgError) return (
    <div className="step-in" style={{ background:"var(--bg-secondary)", borderRadius:"14px", padding:"14px", border:"1px solid var(--border)" }}>
      <div style={{ fontSize:"10px", fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase", marginBottom:"10px" }}>
        📚 Educational Diagram — {imgMeta?.source}
      </div>
      <img
        src={imgUrl}
        alt={imgMeta?.title || concept}
        style={{ maxWidth:"100%", maxHeight:"400px", borderRadius:"10px", objectFit:"contain", display:"block", margin:"0 auto" }}
        onError={() => setImgError(true)}
      />
      <div style={{ marginTop:"8px", display:"flex", justifyContent:"center", gap:"12px" }}>
        <a href={imgMeta?.link} target="_blank" rel="noopener noreferrer"
          style={{ fontSize:"10px", color:"#60a5fa", textDecoration:"none", fontWeight:700 }}>
          📖 Source: {imgMeta?.source} →
        </a>
      </div>
    </div>
  );

  // Fallback — static SVG
  return (
    <div className="step-in" style={{ background:"var(--bg-secondary)", borderRadius:"14px", padding:"14px", border:"1px solid var(--border)", textAlign:"center" }}>
      <div style={{ fontSize:"10px", fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase", marginBottom:"10px" }}>
        📊 Visual Diagram
      </div>
      {staticFallback}
    </div>
  );
}


// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function ExplanationEngine({ message, response, subject, examType, onRetry }) {
  const [mode, setMode] = useState("structured");
  const [revealed, setRevealed] = useState(0);
  const [parsed, setParsed] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!document.getElementById("exp-styles")) {
      const s = document.createElement("style");
      s.id = "exp-styles"; s.textContent = STYLES;
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
    if (!response) return;
    setRevealed(0);
    parseResponse(response);
  }, [response, mode]);

  useEffect(() => {
    if (!parsed) return;
    const total = (parsed.steps?.length || 0) + 5;
    if (revealed >= total) return;
    timerRef.current = setTimeout(() => setRevealed(r => r + 1), 200);
    return () => clearTimeout(timerRef.current);
  }, [revealed, parsed]);

  const parseResponse = useCallback((text) => {
    const clean = text.replace(/\*\*/g, "").replace(/#{1,6}\s/g, "").trim();
    const lines = clean.split("\n").filter(l => l.trim());
    const steps = [];
    let mainExplanation = "", examTip = "";

    lines.forEach(line => {
      const l = line.trim();
      if (l.match(/^[→•\-\*]|^\d+\.|^✅|^Step\s*\d/i) && l.length > 10)
        steps.push(l.replace(/^[→•\-\*✅]\s*/, "").replace(/^\d+\.\s*/, "").replace(/^Step\s*\d+:?\s*/i,"").trim());
      else if (l.match(/exam|tip|yaad|trick|JEE|NEET|UPSC|PCS|SSC/i) && l.length > 10)
        examTip = l;
      else if (l.length > 20 && !mainExplanation)
        mainExplanation = l;
    });

    if (steps.length === 0)
      clean.split(/\n\n+/).filter(p => p.trim().length > 15).slice(0, 4)
        .forEach(p => steps.push(p.trim().slice(0, 280)));

    const subLower = (subject || "").toLowerCase();
    const examples = EXAMPLES[subLower] || EXAMPLES.default;

    setParsed({
      mainExplanation: mainExplanation || steps[0] || clean.slice(0, 200),
      steps: steps.slice(0, 5), examTip, examples, rawText: clean
    });
  }, [subject]);

  if (!parsed) return null;

  const show = (i) => i < revealed;

  const diagram = getStaticDiagram(message, subject);

  const modeLabels = {
    structured: "📚 Step-by-Step",
    simple: "😊 Super Simple",
    exam: "🎯 Exam View",
    story: "📖 Story"
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"10px", fontFamily:"var(--font-main)" }}>

      {/* Mode Tabs */}
      {show(0) && (
        <div className="step-in" style={{ display:"flex", gap:"5px", flexWrap:"wrap" }}>
          {Object.entries(modeLabels).map(([m, l]) => (
            <button key={m} onClick={() => { setMode(m); setRevealed(0); }}
              style={{ padding:"5px 12px", borderRadius:"20px", border:"none", cursor:"pointer",
                background: mode===m ? "var(--accent)" : "var(--bg-secondary)",
                color: mode===m ? "white" : "var(--text-muted)",
                fontSize:"11px", fontWeight:800, fontFamily:"var(--font-main)", transition:"all 0.15s" }}>
              {l}
            </button>
          ))}
          <button onClick={() => onRetry?.("hinglish")}
            style={{ padding:"5px 12px", borderRadius:"20px", border:"1px solid var(--border)", background:"transparent", color:"var(--text-muted)", fontSize:"11px", fontWeight:800, fontFamily:"var(--font-main)", cursor:"pointer", marginLeft:"auto" }}>
            HI/EN 🔄
          </button>
        </div>
      )}

      {/* STRUCTURED */}
      {mode === "structured" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>

          {show(1) && (
            <DiagramBlock
            concept={message}
            subject={subject}
            staticFallback={diagram}
          />
          )}

          {show(2) && (
            <div className="step-in" style={{ background:"linear-gradient(135deg,rgba(59,130,246,0.08),rgba(99,102,241,0.04))", border:"1px solid rgba(59,130,246,0.2)", borderRadius:"12px", padding:"14px 16px" }}>
              <div style={{ fontSize:"10px", fontWeight:800, color:"var(--accent)", marginBottom:"6px" }}>💡 SIMPLE MEIN</div>
              <p style={{ fontSize:"14px", lineHeight:"1.75", color:"var(--text-primary)", margin:0 }}>{parsed.mainExplanation}</p>
            </div>
          )}

          {parsed.steps.map((step, i) => show(i + 3) && (
            <div key={i} className="step-in" style={{ display:"flex", gap:"12px", alignItems:"flex-start" }}>
              <div style={{ minWidth:"28px", height:"28px", borderRadius:"50%",
                background:`linear-gradient(135deg, hsl(${200+i*30},80%,55%), hsl(${220+i*30},80%,45%))`,
                display:"flex", alignItems:"center", justifyContent:"center",
                color:"white", fontSize:"12px", fontWeight:900, flexShrink:0, boxShadow:"0 2px 8px rgba(0,0,0,0.3)" }}>{i+1}</div>
              <div style={{ background:"var(--bg-card)", borderRadius:"10px", padding:"12px 14px", border:"1px solid var(--border)", flex:1 }}>
                <p style={{ margin:0, fontSize:"13px", lineHeight:"1.7", color:"var(--text-primary)" }}>{step}</p>
              </div>
            </div>
          ))}

          {show(parsed.steps.length + 3) && parsed.examTip && (
            <div className="step-in" style={{ background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.25)", borderRadius:"10px", padding:"12px 14px" }}>
              <div style={{ fontSize:"10px", fontWeight:800, color:"#fbbf24", marginBottom:"4px" }}>🎯 EXAM TIP — {examType}</div>
              <p style={{ margin:0, fontSize:"13px", color:"var(--text-secondary)", lineHeight:"1.6" }}>{parsed.examTip}</p>
            </div>
          )}
        </div>
      )}

      {/* SIMPLE */}
      {mode === "simple" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
          {show(1) && <DiagramBlock
            concept={message}
            subject={subject}
            staticFallback={diagram}
          />}
          {show(2) && (
            <div className="step-in" style={{ background:"linear-gradient(135deg,#1e3a5f,#1e2d5f)", borderRadius:"14px", padding:"18px", border:"1px solid #2d4a8a" }}>
              <div style={{ fontSize:"11px", fontWeight:800, color:"#60a5fa", marginBottom:"8px" }}>🧒 BILKUL SIMPLE — 5th Class Style!</div>
              <p style={{ fontSize:"15px", lineHeight:"1.85", color:"#e2e8f0", margin:0 }}>{parsed.rawText.slice(0,350)}</p>
            </div>
          )}
          {show(3) && (
            <div>
              <div style={{ fontSize:"10px", fontWeight:800, color:"var(--text-muted)", marginBottom:"8px" }}>🌍 REAL LIFE MEIN</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
                {parsed.examples.slice(0,4).map((ex,i) => (
                  <div key={i} className="step-in" style={{ background:"var(--bg-card)", borderRadius:"10px", padding:"12px", border:"1px solid var(--border)", textAlign:"center" }}>
                    <div style={{ fontSize:"22px", marginBottom:"4px" }}>{ex.split(" ")[0]}</div>
                    <div style={{ fontSize:"11px", color:"var(--text-secondary)", fontWeight:600 }}>{ex.replace(/^\S+\s/,"")}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* EXAM */}
      {mode === "exam" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
          {show(1) && (
            <div className="step-in" style={{ background:"linear-gradient(135deg,rgba(239,68,68,0.08),rgba(239,68,68,0.03))", border:"2px solid rgba(239,68,68,0.2)", borderRadius:"12px", padding:"14px 16px" }}>
              <div style={{ fontSize:"10px", fontWeight:800, color:"#f87171", marginBottom:"8px" }}>🎯 {examType} EXAM POINT OF VIEW</div>
              <p style={{ fontSize:"14px", lineHeight:"1.7", color:"var(--text-primary)", margin:0 }}>{parsed.examTip || parsed.mainExplanation}</p>
            </div>
          )}
          {show(2) && <DiagramBlock
            concept={message}
            subject={subject}
            staticFallback={diagram}
          />}
          {parsed.steps.map((s,i) => show(i+3) && (
            <div key={i} className="step-in" style={{ display:"flex", gap:"10px", alignItems:"flex-start" }}>
              <span style={{ color:"#f87171", fontWeight:900, fontSize:"14px", flexShrink:0, marginTop:"2px" }}>★</span>
              <span style={{ fontSize:"13px", color:"var(--text-secondary)", lineHeight:"1.6" }}>{s}</span>
            </div>
          ))}
        </div>
      )}

      {/* STORY */}
      {mode === "story" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
          {show(1) && (
            <div className="step-in" style={{ background:"linear-gradient(160deg,#1a0a2e,#0d1b3e)", border:"1px solid #3d2a6e", borderRadius:"16px", padding:"20px" }}>
              <div style={{ fontSize:"11px", fontWeight:800, color:"#a78bfa", marginBottom:"10px" }}>📖 EK KAHANI SE SAMJHO</div>
              <p style={{ fontSize:"14px", lineHeight:"1.9", color:"#e2e8f0", margin:0, fontStyle:"italic" }}>"{parsed.rawText.slice(0,420)}..."</p>
              <div style={{ marginTop:"12px", fontSize:"12px", color:"#7c3aed", fontWeight:700 }}>— Yahi concept {subject} mein kaam aata hai! 🌟</div>
            </div>
          )}
          {show(2) && <DiagramBlock
            concept={message}
            subject={subject}
            staticFallback={diagram}
          />}
        </div>
      )}

      {/* Nahi samjha + retry buttons */}
      {show(parsed.steps.length + 2) && (
        <div className="step-in" style={{ display:"flex", gap:"7px", flexWrap:"wrap", marginTop:"4px" }}>
          <button onClick={() => onRetry?.("simpler")} style={{ padding:"7px 14px", borderRadius:"8px", border:"1px solid rgba(239,68,68,0.3)", background:"rgba(239,68,68,0.08)", color:"#f87171", cursor:"pointer", fontSize:"12px", fontWeight:800, fontFamily:"var(--font-main)" }}>
            😕 Nahi Samjha
          </button>
          <button onClick={() => onRetry?.("example")} style={{ padding:"7px 14px", borderRadius:"8px", border:"1px solid rgba(16,185,129,0.3)", background:"rgba(16,185,129,0.08)", color:"#10b981", cursor:"pointer", fontSize:"12px", fontWeight:800, fontFamily:"var(--font-main)" }}>
            🌍 Example Do
          </button>
          <button onClick={() => onRetry?.("exam")} style={{ padding:"7px 14px", borderRadius:"8px", border:"1px solid rgba(245,158,11,0.3)", background:"rgba(245,158,11,0.08)", color:"#fbbf24", cursor:"pointer", fontSize:"12px", fontWeight:800, fontFamily:"var(--font-main)" }}>
            🎯 Exam Tip
          </button>
        </div>
      )}
    </div>
  );
}
