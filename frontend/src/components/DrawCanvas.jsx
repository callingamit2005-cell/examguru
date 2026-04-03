import React, { useRef, useState, useEffect, useCallback } from "react";

// ─── Styles ───────────────────────────────────────────────────────────────────
const STYLES = `
@keyframes toolPop { 0%{transform:scale(0.8);opacity:0} 100%{transform:scale(1);opacity:1} }
@keyframes feedbackSlide { 0%{transform:translateY(-20px);opacity:0} 100%{transform:translateY(0);opacity:1} }
@keyframes checkmark { 0%{stroke-dashoffset:100} 100%{stroke-dashoffset:0} }
.draw-tool { animation: toolPop 0.2s ease forwards; }
.draw-feedback { animation: feedbackSlide 0.3s ease forwards; }
`;

const COLORS = ["#3b82f6","#ef4444","#10b981","#f59e0b","#8b5cf6","#ec4899","#000000","#ffffff"];

const GUIDED_STEPS = {
  default: [
    "📦 Ek bada box/rectangle banao — yeh main concept hai",
    "➡️ Arrows banao — flow dikhao",
    "🏷️ Labels likho — har part ka naam",
    "🔗 Connect karo related parts ko",
    "⭐ Important points highlight karo"
  ],
  newton: [
    "🔵 Ek ball banao center mein",
    "➡️ Ek arrow right side mein banao — Force (F)",
    "⬆️ Ek arrow upar banao — Normal Force (N)",
    "⬇️ Ek arrow neeche banao — Gravity (g)",
    "🏷️ Sabko label karo: F, N, mg"
  ],
  photosynthesis: [
    "☀️ Upar sun banao",
    "🌿 Beech mein leaf banao (oval shape)",
    "⬇️ CO₂ ka arrow leaf mein jaata dikhao",
    "⬆️ O₂ ka arrow leaf se bahar jaata dikhao",
    "🏷️ Label karo: Sun, Leaf, CO₂, O₂, Glucose"
  ],
  cell: [
    "⭕ Bada circle banao — Cell Wall",
    "⭕ Chhota circle andar — Cell Membrane",
    "🔵 Center mein oval — Nucleus",
    "Dots scatter karo — Mitochondria",
    "🏷️ Label karo: Wall, Membrane, Nucleus, Cytoplasm"
  ],
  heart: [
    "❤️ Heart shape banao",
    "➡️ Right side mein: Right Atrium + Right Ventricle",
    "⬅️ Left side mein: Left Atrium + Left Ventricle",
    "🔴 Red arrows — Oxygenated blood",
    "🔵 Blue arrows — Deoxygenated blood"
  ]
};

// ─── Main Draw Canvas ─────────────────────────────────────────────────────────
export default function DrawCanvas({ concept, subject, onClose }) {
  const canvasRef = useRef(null);
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#3b82f6");
  const [size, setSize] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showGuide, setShowGuide] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [checking, setChecking] = useState(false);
  const [history, setHistory] = useState([]);
  const lastPos = useRef(null);

  const conceptKey = Object.keys(GUIDED_STEPS).find(k =>
    concept?.toLowerCase().includes(k)
  ) || "default";
  const steps = GUIDED_STEPS[conceptKey];

  useEffect(() => {
    if (!document.getElementById("draw-styles")) {
      const s = document.createElement("style");
      s.id = "draw-styles"; s.textContent = STYLES;
      document.head.appendChild(s);
    }
    initCanvas();
  }, []);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveHistory();
  };

  const saveHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setHistory(prev => [...prev.slice(-20), canvas.toDataURL()]);
  }, []);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDraw = useCallback((e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const pos = getPos(e, canvas);
    setIsDrawing(true);
    lastPos.current = pos;

    if (tool === "pen" || tool === "eraser") {
      const ctx = canvas.getContext("2d");
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
  }, [tool]);

  const draw = useCallback((e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);

    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = size * 5;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
    }

    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
  }, [isDrawing, tool, color, size]);

  const endDraw = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) ctx.globalCompositeOperation = "source-over";
    saveHistory();
  }, [isDrawing, saveHistory]);

  const undo = () => {
    if (history.length < 2) return;
    const prev = history[history.length - 2];
    setHistory(h => h.slice(0, -1));
    const img = new Image();
    img.onload = () => {
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) ctx.drawImage(img, 0, 0);
    };
    img.src = prev;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveHistory();
    setFeedback(null);
  };

  const checkDrawing = async () => {
    setChecking(true);
    setFeedback(null);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Check if canvas has content (not just background)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let nonBgPixels = 0;

    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i], g = pixels[i+1], b = pixels[i+2];
      // Count non-dark pixels (not background)
      if (r > 30 || g > 30 || b > 30) nonBgPixels++;
    }

    const coverage = nonBgPixels / (canvas.width * canvas.height);

    await new Promise(r => setTimeout(r, 1500)); // simulate checking

    if (coverage < 0.005) {
      setFeedback({ type: "error", msg: "Canvas khali hai! Pehle kuch draw karo 🎨" });
    } else if (coverage < 0.02) {
      setFeedback({ type: "warning", msg: "⚠️ Thoda aur details add karo — arrows, labels, connections banao!" });
    } else if (coverage < 0.05) {
      setFeedback({ type: "ok", msg: "👍 Achha hai! Labels aur arrows aur add karo toh perfect ho jayega!" });
    } else {
      setFeedback({ type: "success", msg: "✅ Wah! Bahut achha diagram banaya! Concept clearly show ho raha hai!" });
    }
    setChecking(false);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) setCurrentStep(s => s + 1);
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(s => s - 1);
  };

  const feedbackColors = {
    success: { bg:"rgba(16,185,129,0.15)", border:"rgba(16,185,129,0.4)", color:"#10b981" },
    ok:      { bg:"rgba(59,130,246,0.15)", border:"rgba(59,130,246,0.4)", color:"#60a5fa" },
    warning: { bg:"rgba(245,158,11,0.15)", border:"rgba(245,158,11,0.4)", color:"#fbbf24" },
    error:   { bg:"rgba(239,68,68,0.15)", border:"rgba(239,68,68,0.4)", color:"#f87171" },
  };

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:3000, background:"rgba(0,0,0,0.9)",
      display:"flex", flexDirection:"column", backdropFilter:"blur(4px)"
    }}>
      {/* Header */}
      <div style={{ padding:"12px 16px", background:"var(--bg-secondary)", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:"12px" }}>
        <div style={{ flex:1 }}>
          <h2 style={{ fontSize:"16px", fontWeight:900, margin:0 }}>✏️ Draw It Yourself</h2>
          <p style={{ fontSize:"11px", color:"var(--text-muted)", margin:0 }}>{concept} — {subject}</p>
        </div>
        <button onClick={onClose} style={{ background:"none", border:"1px solid var(--border)", color:"var(--text-muted)", cursor:"pointer", borderRadius:"8px", padding:"6px 12px", fontSize:"12px", fontWeight:700, fontFamily:"var(--font-main)" }}>
          ✕ Close
        </button>
      </div>

      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
        {/* LEFT — Guide */}
        {showGuide && (
          <div style={{ width:"220px", background:"var(--bg-secondary)", borderRight:"1px solid var(--border)", padding:"14px", display:"flex", flexDirection:"column", gap:"12px", overflowY:"auto", flexShrink:0 }}>
            <div style={{ fontSize:"12px", fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase" }}>📋 Guide</div>

            {steps.map((step, i) => (
              <div key={i} style={{
                padding:"10px 12px", borderRadius:"10px",
                background: i === currentStep ? "var(--accent-glow)" : i < currentStep ? "rgba(16,185,129,0.08)" : "var(--bg-card)",
                border: `1px solid ${i === currentStep ? "var(--accent)" : i < currentStep ? "rgba(16,185,129,0.3)" : "var(--border)"}`,
                cursor:"pointer", transition:"all 0.2s"
              }} onClick={() => setCurrentStep(i)}>
                <div style={{ display:"flex", gap:"8px", alignItems:"flex-start" }}>
                  <div style={{
                    width:"20px", height:"20px", borderRadius:"50%", flexShrink:0,
                    background: i < currentStep ? "#10b981" : i === currentStep ? "var(--accent)" : "var(--bg-secondary)",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:"10px", fontWeight:900, color:"white"
                  }}>
                    {i < currentStep ? "✓" : i+1}
                  </div>
                  <p style={{ fontSize:"12px", color: i === currentStep ? "var(--accent)" : "var(--text-secondary)", margin:0, lineHeight:"1.5" }}>
                    {step}
                  </p>
                </div>
              </div>
            ))}

            <div style={{ display:"flex", gap:"6px" }}>
              <button onClick={prevStep} disabled={currentStep===0} className="btn btn-secondary" style={{ flex:1, justifyContent:"center", fontSize:"12px", padding:"6px" }}>← Prev</button>
              <button onClick={nextStep} disabled={currentStep===steps.length-1} className="btn btn-primary" style={{ flex:1, justifyContent:"center", fontSize:"12px", padding:"6px" }}>Next →</button>
            </div>

            <div style={{ fontSize:"11px", color:"var(--text-muted)", textAlign:"center", marginTop:"4px" }}>
              Step {currentStep+1} of {steps.length}
            </div>
          </div>
        )}

        {/* CENTER — Canvas */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"12px", gap:"10px", overflow:"hidden" }}>
          {/* Feedback */}
          {feedback && (
            <div className="draw-feedback" style={{
              padding:"10px 16px", borderRadius:"10px", fontSize:"13px", fontWeight:700,
              background: feedbackColors[feedback.type].bg,
              border: `1px solid ${feedbackColors[feedback.type].border}`,
              color: feedbackColors[feedback.type].color,
              maxWidth:"600px", width:"100%", textAlign:"center"
            }}>
              {feedback.msg}
            </div>
          )}

          {/* Canvas */}
          <canvas
            ref={canvasRef}
            width={800}
            height={500}
            style={{
              borderRadius:"12px",
              border:"1px solid var(--border)",
              cursor: tool === "eraser" ? "cell" : "crosshair",
              touchAction:"none",
              maxWidth:"100%",
              maxHeight:"calc(100vh - 280px)",
              boxShadow:"0 8px 32px rgba(0,0,0,0.5)"
            }}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />

          {/* Bottom actions */}
          <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", justifyContent:"center" }}>
            <button onClick={checkDrawing} disabled={checking} className="btn btn-primary" style={{ fontSize:"13px" }}>
              {checking ? <><div className="loader" style={{width:"14px",height:"14px"}}/> Checking...</> : "🤖 AI Check Karo"}
            </button>
            <button onClick={undo} className="btn btn-secondary" style={{ fontSize:"13px" }}>↩️ Undo</button>
            <button onClick={clearCanvas} className="btn btn-secondary" style={{ fontSize:"13px" }}>🗑️ Clear</button>
            <button onClick={() => setShowGuide(g => !g)} className="btn btn-secondary" style={{ fontSize:"13px" }}>
              {showGuide ? "📋 Hide Guide" : "📋 Show Guide"}
            </button>
          </div>
        </div>

        {/* RIGHT — Tools */}
        <div style={{ width:"64px", background:"var(--bg-secondary)", borderLeft:"1px solid var(--border)", padding:"12px 8px", display:"flex", flexDirection:"column", gap:"8px", alignItems:"center" }}>
          {/* Tools */}
          {[
            { id:"pen", icon:"✏️", label:"Pen" },
            { id:"eraser", icon:"🧹", label:"Erase" },
          ].map(t => (
            <button key={t.id} onClick={() => setTool(t.id)} title={t.label}
              className="draw-tool"
              style={{
                width:"44px", height:"44px", borderRadius:"10px", border:"none", cursor:"pointer",
                background: tool===t.id ? "var(--accent)" : "var(--bg-card)",
                fontSize:"20px", display:"flex", alignItems:"center", justifyContent:"center",
                transition:"all 0.15s", boxShadow: tool===t.id ? "0 0 12px rgba(59,130,246,0.4)" : "none"
              }}>
              {t.icon}
            </button>
          ))}

          <div style={{ width:"40px", height:"1px", background:"var(--border)", margin:"4px 0" }}/>

          {/* Size */}
          {[2,4,8].map(s => (
            <button key={s} onClick={() => setSize(s)}
              style={{
                width:"44px", height:"44px", borderRadius:"10px", border:"none", cursor:"pointer",
                background: size===s ? "var(--accent-glow)" : "var(--bg-card)",
                display:"flex", alignItems:"center", justifyContent:"center",
                transition:"all 0.15s",
                borderWidth: size===s ? "1px" : "0px",
                borderStyle: "solid",
                borderColor: size===s ? "var(--accent)" : "transparent"
              }}>
              <div style={{ width:`${s*2}px`, height:`${s*2}px`, borderRadius:"50%", background:"var(--text-primary)" }}/>
            </button>
          ))}

          <div style={{ width:"40px", height:"1px", background:"var(--border)", margin:"4px 0" }}/>

          {/* Colors */}
          {COLORS.map(c => (
            <button key={c} onClick={() => { setColor(c); setTool("pen"); }}
              style={{
                width:"28px", height:"28px", borderRadius:"50%", border:`2px solid ${color===c ? "white" : "transparent"}`,
                background:c, cursor:"pointer", transition:"all 0.15s",
                boxShadow: color===c ? "0 0 8px rgba(255,255,255,0.4)" : "none"
              }}/>
          ))}
        </div>
      </div>
    </div>
  );
}
