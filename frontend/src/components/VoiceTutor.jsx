import React, { useState, useRef, useEffect, useCallback } from "react";
import { chatAPI } from "../utils/api";
import API from "../utils/api";

// ─── Styles ───────────────────────────────────────────────────────────────────
const injectStyles = () => {
  if (document.getElementById("vt-styles")) return;
  const s = document.createElement("style");
  s.id = "vt-styles";
  s.textContent = `
    @keyframes breathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
    @keyframes talking { 0%,100%{transform:scaleY(1)} 30%{transform:scaleY(1.1)} 60%{transform:scaleY(0.95)} }
    @keyframes listening { 0%,100%{transform:rotate(0)} 50%{transform:rotate(5deg)} }
    @keyframes ripple { 0%{transform:scale(1);opacity:0.5} 100%{transform:scale(2.2);opacity:0} }
    @keyframes wordIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
    @keyframes barAnim { 0%,100%{height:4px} 50%{height:20px} }
    @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
    .word-in { animation: wordIn 0.15s ease forwards; }
    .slide-up { animation: slideUp 0.3s ease forwards; }
  `;
  document.head.appendChild(s);
};

// ─── Avatar Component ─────────────────────────────────────────────────────────
function TeacherAvatar({ state, color = "#3b82f6" }) {
  // state: idle | talking | listening | thinking
  const anim = state === "talking" ? "talking 0.4s ease infinite"
    : state === "listening" ? "listening 1s ease infinite"
    : state === "thinking" ? "breathe 1.5s ease infinite"
    : "breathe 3s ease infinite";

  const eyeAnim = state === "thinking" ? "pulse 1s ease infinite" : "none";

  return (
    <div style={{ position:"relative", width:"110px", height:"110px" }}>
      {/* Ripple rings when talking */}
      {state === "talking" && [1,2].map(i => (
        <div key={i} style={{ position:"absolute", inset:`-${i*18}px`, borderRadius:"50%",
          border:`2px solid ${color}40`,
          animation:`ripple ${0.8+i*0.4}s ease-out infinite`,
          animationDelay:`${i*0.3}s` }}/>
      ))}
      {/* Ripple rings when listening */}
      {state === "listening" && [1,2].map(i => (
        <div key={i} style={{ position:"absolute", inset:`-${i*14}px`, borderRadius:"50%",
          border:`2px solid #10b98140`,
          animation:`ripple ${1+i*0.5}s ease-out infinite`,
          animationDelay:`${i*0.4}s` }}/>
      ))}

      {/* Main face */}
      <div style={{
        width:"110px", height:"110px", borderRadius:"50%",
        background:`radial-gradient(circle at 35% 35%, ${color}ee, ${color}88)`,
        boxShadow:`0 0 30px ${color}50, inset 0 2px 8px rgba(255,255,255,0.2)`,
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
        animation: anim, position:"relative", overflow:"hidden"
      }}>
        {/* Shine */}
        <div style={{ position:"absolute", top:"12px", left:"20px", width:"22px", height:"10px", borderRadius:"50%", background:"rgba(255,255,255,0.25)", transform:"rotate(-20deg)" }}/>

        {/* Eyes */}
        <div style={{ display:"flex", gap:"16px", marginBottom:"8px" }}>
          {[0,1].map(i => (
            <div key={i} style={{ width:"14px", height:"14px", borderRadius:"50%", background:"white",
              display:"flex", alignItems:"center", justifyContent:"center",
              animation: eyeAnim }}>
              <div style={{ width:"7px", height:"7px", borderRadius:"50%", background:"#1e293b",
                transform: state==="listening"?"translate(1px,-1px)":"none", transition:"transform 0.3s" }}/>
            </div>
          ))}
        </div>

        {/* Mouth */}
        <div style={{
          width: state==="talking"?"22px":"18px",
          height: state==="talking"?"10px": state==="listening"?"4px":"6px",
          borderRadius: state==="talking"?"0 0 12px 12px":"30px",
          background:"white",
          transition:"all 0.15s ease",
          animation: state==="talking"?"talking 0.3s ease infinite":"none"
        }}/>

        {/* Thinking dots */}
        {state === "thinking" && (
          <div style={{ position:"absolute", bottom:"8px", display:"flex", gap:"4px" }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ width:"5px", height:"5px", borderRadius:"50%", background:"white",
                animation:`pulse 0.8s ease infinite`, animationDelay:`${i*0.2}s` }}/>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Audio Visualizer ─────────────────────────────────────────────────────────
function AudioBars({ active, color = "#3b82f6" }) {
  return (
    <div style={{ display:"flex", gap:"3px", alignItems:"center", height:"28px" }}>
      {Array.from({length:8},(_,i) => (
        <div key={i} style={{
          width:"4px", borderRadius:"4px", background: active ? color : "#334155",
          height: active ? "4px" : "4px",
          animation: active ? `barAnim ${0.4+i*0.08}s ease infinite` : "none",
          animationDelay: `${i*0.06}s`,
          transition:"background 0.3s"
        }}/>
      ))}
    </div>
  );
}

// ─── Script Line (typewriter effect) ─────────────────────────────────────────
function ScriptLine({ text, isNew }) {
  const [displayed, setDisplayed] = useState(isNew ? "" : text);
  const [idx, setIdx] = useState(isNew ? 0 : text.length);

  useEffect(() => {
    if (!isNew) { setDisplayed(text); return; }
    if (idx >= text.length) return;
    const t = setTimeout(() => {
      setDisplayed(text.slice(0, idx + 1));
      setIdx(i => i + 1);
    }, 18);
    return () => clearTimeout(t);
  }, [idx, text, isNew]);

  return (
    <p style={{ margin:0, fontSize:"14px", lineHeight:"1.75", color:"#e2e8f0" }}>
      {displayed}
      {isNew && idx < text.length && (
        <span style={{ display:"inline-block", width:"2px", height:"14px", background:"#60a5fa",
          marginLeft:"2px", animation:"pulse 0.6s ease infinite", verticalAlign:"middle" }}/>
      )}
    </p>
  );
}

// ─── VOICE TUTOR FULL SCREEN ───────────────────────────────────────────────────
function VoiceTutorModal({ user, subject, examType, sessionId, setSessionId, onClose }) {
  const [avatarState, setAvatarState] = useState("idle"); // idle|talking|listening|thinking
  const [script, setScript] = useState([]); // [{text, speaker, isNew}]
  const [status, setStatus] = useState("Shuru ho raha hai...");
  const [canInterrupt, setCanInterrupt] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [studentInput, setStudentInput] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [currentTopic, setCurrentTopic] = useState(subject);
  const [sessionActive, setSessionActive] = useState(true);
  const [interruptHint, setInterruptHint] = useState(false);

  const synthRef = useRef(null);
  const recognitionRef = useRef(null);
  const scriptEndRef = useRef(null);
  const utteranceRef = useRef(null);
  const isActiveRef = useRef(true);

  useEffect(() => {
    injectStyles();
    startClass();
    return () => {
      isActiveRef.current = false;
      stopSpeaking();
      stopListening();
    };
  }, []);

  useEffect(() => {
    scriptEndRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [script]);

  const stopSpeaking = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  };

  const stopListening = () => {
    try { recognitionRef.current?.stop(); } catch {}
    setIsRecording(false);
  };

  const addToScript = (text, speaker = "teacher", isNew = true) => {
    setScript(prev => [...prev, { text, speaker, isNew, id: Date.now() + Math.random() }]);
  };

  // ── Natural TTS with pauses ──────────────────────────────────────────────
  const speakNatural = useCallback((text, onDone) => {
    if (!window.speechSynthesis || !isActiveRef.current) { onDone?.(); return; }
    stopSpeaking();

    // Split into natural chunks at punctuation
    const chunks = text
      .replace(/\n+/g, " ")
      .replace(/\*\*/g, "")
      .replace(/#{1,6}\s/g, "")
      .split(/(?<=[।.!?])\s+/)
      .filter(c => c.trim().length > 0);

    let idx = 0;
    const speakNext = () => {
      if (!isActiveRef.current || idx >= chunks.length) { onDone?.(); return; }
      const chunk = chunks[idx++];
      const utt = new SpeechSynthesisUtterance(chunk);

      // Natural voice settings
      utt.lang = "hi-IN";
      utt.rate = 0.88;   // slightly slower = clearer
      utt.pitch = 1.05;  // slight pitch = natural
      utt.volume = 1;

      // Pick best available voice
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v =>
        v.lang.includes("hi") || v.name.includes("Hindi") || v.name.includes("Google हिन्दी")
      ) || voices.find(v => v.lang.includes("en-IN")) || voices[0];
      if (preferred) utt.voice = preferred;

      utt.onstart = () => setAvatarState("talking");
      utt.onpause = () => setAvatarState("idle");
      utt.onresume = () => setAvatarState("talking");
      utt.onend = () => {
        // Small pause between sentences (natural rhythm)
        setTimeout(speakNext, 280);
      };
      utt.onerror = () => speakNext();

      utteranceRef.current = utt;
      window.speechSynthesis.speak(utt);
    };

    speakNext();
  }, []);

  // ── Interrupt: student can speak anytime ──────────────────────────────────
  const handleInterrupt = () => {
    stopSpeaking();
    setAvatarState("listening");
    setStatus("Suno raha hoon... bolo!");
    setCanInterrupt(false);
    setShowInput(true);
    setInterruptHint(false);
  };

  // ── Get AI response ───────────────────────────────────────────────────────
  const getAIResponse = useCallback(async (message, isFirstMessage = false) => {
    if (!isActiveRef.current) return;
    setAvatarState("thinking");
    setStatus("Soch raha hoon...");
    setCanInterrupt(false);

    try {
      const systemContext = isFirstMessage
        ? `Yeh ek live voice class hai. Tum ek warm, encouraging Indian teacher ho. 
           Student ka naam ${user?.name} hai, ${examType} ki taiyari kar raha/rahi hai.
           Subject: ${subject}.
           IMPORTANT: 
           - Bolne wali bhasha use karo (written nahi)
           - Short sentences (max 20 words each)
           - Beech mein pause karo (... use karo)
           - Natural Hinglish mein bolo
           - Pehle welcome karo, phir topic introduce karo
           - End mein ek question poochho`
        : `Live class chal rahi hai. Teacher ho. Student ne kaha: "${message}"
           RULES:
           - Direct answer do
           - Short sentences
           - Natural bolne wali bhasha
           - Hinglish
           - End mein ek follow-up question poochho`;

      const res = await API.post("/chat/message", {
        userId: user?.id,
        message: isFirstMessage ? `${subject} ka concept explain karo — voice class mein` : message,
        examType,
        subject,
        sessionId,
        systemOverride: systemContext
      });

      if (!isActiveRef.current) return;

      const response = res.data.response;
      setSessionId?.(res.data.sessionId);

      // Add to script with typewriter
      addToScript(response, "teacher", true);
      setAvatarState("talking");
      setStatus("Padha raha hoon...");

      // Show interrupt hint after 3 seconds
      setTimeout(() => {
        if (isActiveRef.current) setInterruptHint(true);
        setCanInterrupt(true);
      }, 3000);

      // Speak it
      speakNatural(response, () => {
        if (!isActiveRef.current) return;
        setAvatarState("listening");
        setStatus("Tumhari bari — kuch poochho ya bolo!");
        setShowInput(true);
        setCanInterrupt(false);
        setInterruptHint(false);
        autoListen();
      });

    } catch {
      addToScript("Sorry, kuch technical issue hua. Dubara try karo!", "teacher", true);
      setAvatarState("idle");
      setStatus("Error — retry karo");
    }
  }, [user, subject, examType, sessionId, speakNatural]);

  // ── Auto voice recognition ────────────────────────────────────────────────
  const autoListen = useCallback(() => {
    if (!isActiveRef.current) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      const rec = new SpeechRecognition();
      rec.lang = "hi-IN";
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.continuous = false;

      setIsRecording(true);
      setAvatarState("listening");
      setStatus("🎤 Bol sakte ho...");

      rec.onresult = (e) => {
        const said = e.results[0][0].transcript;
        if (said.trim()) {
          addToScript(said, "student", false);
          setStudentInput("");
          setShowInput(false);
          setIsRecording(false);
          getAIResponse(said);
        }
      };

      rec.onerror = () => {
        setIsRecording(false);
        setAvatarState("idle");
        setStatus("Voice nahi suna. Type karo ya mic try karo.");
      };

      rec.onend = () => setIsRecording(false);

      recognitionRef.current = rec;
      rec.start();
    } catch {}
  }, [getAIResponse]);

  const startClass = useCallback(async () => {
    setStatus("Class shuru ho rahi hai...");
    await new Promise(r => setTimeout(r, 800));
    if (!isActiveRef.current) return;
    await getAIResponse("", true);
  }, [getAIResponse]);

  const handleStudentSubmit = (text) => {
    const msg = text || studentInput;
    if (!msg.trim()) return;
    stopListening();
    addToScript(msg, "student", false);
    setStudentInput("");
    setShowInput(false);
    getAIResponse(msg);
  };

  const endClass = () => {
    isActiveRef.current = false;
    stopSpeaking();
    stopListening();
    onClose();
  };

  const subjectColor = {
    Physics:"#3b82f6", Chemistry:"#10b981", Biology:"#22c55e",
    Mathematics:"#f59e0b", History:"#f97316", Polity:"#a78bfa",
    Economy:"#06b6d4", Geography:"#84cc16", default:"#3b82f6"
  }[subject] || "#3b82f6";

  return (
    <div style={{ position:"fixed", inset:0, zIndex:5000,
      background:"linear-gradient(135deg, #050d1a 0%, #0a1628 50%, #0d1f35 100%)",
      display:"flex", flexDirection:"column", overflow:"hidden" }}>

      {/* Header */}
      <div style={{ padding:"14px 20px", borderBottom:"1px solid rgba(255,255,255,0.06)",
        display:"flex", alignItems:"center", gap:"14px", flexShrink:0,
        background:"rgba(255,255,255,0.02)" }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:"16px", fontWeight:900, color:"white" }}>🎓 ExamGuru Live Class</div>
          <div style={{ fontSize:"12px", color:"#64748b" }}>{examType} • {subject} • AI Teacher</div>
        </div>
        <div style={{ padding:"6px 14px", borderRadius:"20px",
          background:`${subjectColor}20`, border:`1px solid ${subjectColor}40`,
          fontSize:"12px", fontWeight:700, color:subjectColor,
          display:"flex", alignItems:"center", gap:"6px" }}>
          <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:subjectColor,
            animation: avatarState==="talking"?"pulse 0.5s ease infinite":"none" }}/>
          {avatarState === "talking" ? "Padha Raha Hoon" : avatarState === "listening" ? "Sun Raha Hoon" : avatarState === "thinking" ? "Soch Raha Hoon" : "Live"}
        </div>
        <button onClick={endClass}
          style={{ padding:"7px 16px", borderRadius:"8px", border:"1px solid rgba(239,68,68,0.4)",
            background:"rgba(239,68,68,0.1)", color:"#f87171", cursor:"pointer",
            fontSize:"12px", fontWeight:800, fontFamily:"var(--font-main)" }}>
          ✕ Class Khatam
        </button>
      </div>

      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
        {/* Left — Avatar + Controls */}
        <div style={{ width:"220px", flexShrink:0, display:"flex", flexDirection:"column",
          alignItems:"center", padding:"28px 16px", gap:"20px",
          borderRight:"1px solid rgba(255,255,255,0.05)" }}>

          <TeacherAvatar state={avatarState} color={subjectColor}/>

          {/* Subject badge */}
          <div style={{ padding:"6px 16px", borderRadius:"20px",
            background:`${subjectColor}20`, border:`1px solid ${subjectColor}40`,
            fontSize:"13px", fontWeight:800, color:subjectColor }}>
            📚 {subject}
          </div>

          {/* Status */}
          <div style={{ fontSize:"12px", fontWeight:700, color:
            avatarState==="talking"?subjectColor:
            avatarState==="listening"?"#10b981":
            avatarState==="thinking"?"#f59e0b":"#64748b",
            textAlign:"center", animation: avatarState!=="idle"?"pulse 1s ease infinite":"none" }}>
            • {avatarState === "talking" ? "PADHA RAHA HOON" :
               avatarState === "listening" ? "SUN RAHA HOON" :
               avatarState === "thinking" ? "SOCH RAHA HOON" : "IDLE"}
          </div>

          {/* Audio bars */}
          <AudioBars active={avatarState === "talking" || isRecording} color={subjectColor}/>

          {/* INTERRUPT BUTTON — always visible when talking */}
          {canInterrupt && (
            <button onClick={handleInterrupt}
              className="slide-up"
              style={{ width:"100%", padding:"10px", borderRadius:"10px",
                border:`2px solid #ef4444`, background:"rgba(239,68,68,0.15)",
                color:"#f87171", cursor:"pointer", fontSize:"12px", fontWeight:800,
                fontFamily:"var(--font-main)", animation:"pulse 1.5s ease infinite",
                display:"flex", alignItems:"center", justifyContent:"center", gap:"6px" }}>
              ✋ Roko — Poochna Hai!
            </button>
          )}

          {/* Listening indicator */}
          {isRecording && (
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:"24px", marginBottom:"4px", animation:"pulse 0.8s ease infinite" }}>🎤</div>
              <div style={{ fontSize:"11px", color:"#10b981", fontWeight:700 }}>Bolo!</div>
              <div style={{ fontSize:"10px", color:"#475569", marginTop:"2px" }}>Hindi ya English dono chalega</div>
            </div>
          )}

          {/* Hint */}
          {interruptHint && !canInterrupt && (
            <div style={{ fontSize:"10px", color:"#475569", textAlign:"center", padding:"6px",
              background:"rgba(255,255,255,0.03)", borderRadius:"8px" }}>
              💡 Beech mein rokna ho to<br/>"✋ Roko" button press karo
            </div>
          )}
        </div>

        {/* Right — Script / Notes */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          {/* Script area */}
          <div style={{ flex:1, overflowY:"auto", padding:"20px 24px",
            display:"flex", flexDirection:"column", gap:"16px" }}>

            {script.length === 0 && (
              <div style={{ textAlign:"center", marginTop:"60px", opacity:0.4 }}>
                <div style={{ fontSize:"32px", marginBottom:"12px" }}>🎓</div>
                <div style={{ fontSize:"14px", color:"#64748b" }}>Class shuru ho rahi hai...</div>
              </div>
            )}

            {script.map((line, i) => (
              <div key={line.id} className={line.isNew?"slide-up":""} style={{ display:"flex", gap:"12px",
                justifyContent: line.speaker==="student"?"flex-end":"flex-start" }}>
                {line.speaker === "teacher" && (
                  <div style={{ width:"34px", height:"34px", borderRadius:"50%", flexShrink:0,
                    background:`radial-gradient(circle, ${subjectColor}cc, ${subjectColor}66)`,
                    display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px", marginTop:"2px" }}>
                    🎓
                  </div>
                )}
                <div style={{ maxWidth:"75%", padding:"12px 16px", borderRadius:
                    line.speaker==="teacher"?"4px 16px 16px 16px":"16px 4px 16px 16px",
                  background: line.speaker==="teacher"
                    ?"rgba(255,255,255,0.05)":"rgba(59,130,246,0.15)",
                  border: line.speaker==="teacher"
                    ?"1px solid rgba(255,255,255,0.08)":`1px solid ${subjectColor}40` }}>
                  <ScriptLine text={line.text} isNew={line.isNew && i===script.length-1}/>
                  {line.speaker === "teacher" && (
                    <div style={{ fontSize:"9px", color:"#475569", marginTop:"6px", fontWeight:700 }}>EXAMGURU AI</div>
                  )}
                  {line.speaker === "student" && (
                    <div style={{ fontSize:"9px", color:`${subjectColor}99`, marginTop:"6px", fontWeight:700, textAlign:"right" }}>TUM</div>
                  )}
                </div>
                {line.speaker === "student" && (
                  <div style={{ width:"34px", height:"34px", borderRadius:"50%", flexShrink:0,
                    background:"rgba(59,130,246,0.2)", border:`1px solid ${subjectColor}40`,
                    display:"flex", alignItems:"center", justifyContent:"center", fontSize:"14px", marginTop:"2px" }}>
                    👤
                  </div>
                )}
              </div>
            ))}
            <div ref={scriptEndRef}/>
          </div>

          {/* Bottom input area */}
          <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", padding:"14px 20px",
            background:"rgba(255,255,255,0.02)", flexShrink:0 }}>

            {showInput ? (
              <div className="slide-up" style={{ display:"flex", gap:"10px", alignItems:"center" }}>
                <div style={{ flex:1, position:"relative" }}>
                  <input
                    value={studentInput}
                    onChange={e => setStudentInput(e.target.value)}
                    onKeyDown={e => e.key==="Enter" && handleStudentSubmit()}
                    placeholder="Apna sawaal type karo ya mic use karo..."
                    autoFocus
                    style={{ width:"100%", padding:"12px 16px", borderRadius:"12px",
                      border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.06)",
                      color:"white", fontSize:"14px", fontFamily:"var(--font-main)",
                      outline:"none", boxSizing:"border-box" }}
                  />
                </div>
                <button onClick={() => handleStudentSubmit()}
                  disabled={!studentInput.trim()}
                  style={{ padding:"12px 20px", borderRadius:"12px", border:"none",
                    background:studentInput.trim()?subjectColor:"#334155",
                    color:"white", cursor:studentInput.trim()?"pointer":"default",
                    fontSize:"13px", fontWeight:800, fontFamily:"var(--font-main)", flexShrink:0 }}>
                  Bhejo →
                </button>
                <button onClick={autoListen}
                  style={{ padding:"12px", borderRadius:"12px", border:`1px solid ${subjectColor}40`,
                    background:`${subjectColor}20`, color:subjectColor,
                    cursor:"pointer", fontSize:"18px", flexShrink:0 }}>
                  🎤
                </button>
              </div>
            ) : (
              <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                <div style={{ flex:1, fontSize:"12px", color:"#475569" }}>
                  {status}
                </div>
                {!canInterrupt && avatarState === "talking" && (
                  <button onClick={handleInterrupt}
                    style={{ padding:"8px 16px", borderRadius:"8px",
                      border:"1px solid rgba(239,68,68,0.35)", background:"rgba(239,68,68,0.08)",
                      color:"#f87171", cursor:"pointer", fontSize:"12px",
                      fontWeight:800, fontFamily:"var(--font-main)" }}>
                    ✋ Interrupt
                  </button>
                )}
                {avatarState === "listening" && (
                  <button onClick={() => setShowInput(true)}
                    style={{ padding:"8px 16px", borderRadius:"8px",
                      border:`1px solid ${subjectColor}40`, background:`${subjectColor}15`,
                      color:subjectColor, cursor:"pointer", fontSize:"12px",
                      fontWeight:800, fontFamily:"var(--font-main)" }}>
                    ⌨️ Type Karo
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Public Button Component ───────────────────────────────────────────────────
export function VoiceInputButton({ onResult }) {
  const [recording, setRecording] = useState(false);
  const recRef = useRef(null);

  const toggle = () => {
    if (recording) {
      recRef.current?.stop();
      setRecording(false);
    } else {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) return;
      const r = new SR();
      r.lang = "hi-IN"; r.continuous = false;
      r.onresult = e => { onResult?.(e.results[0][0].transcript); setRecording(false); };
      r.onerror = () => setRecording(false);
      r.onend = () => setRecording(false);
      recRef.current = r;
      r.start();
      setRecording(true);
    }
  };

  return (
    <button onClick={toggle}
      style={{ width:"40px", height:"40px", borderRadius:"50%", border:"none",
        background: recording ? "rgba(239,68,68,0.2)" : "var(--bg-secondary)",
        color: recording ? "#f87171" : "var(--text-muted)",
        cursor:"pointer", fontSize:"18px", display:"flex",
        alignItems:"center", justifyContent:"center", flexShrink:0,
        animation: recording ? "pulse 0.8s ease infinite" : "none" }}>
      {recording ? "🔴" : "🎤"}
    </button>
  );
}

export function SpeakButton({ text }) {
  const [speaking, setSpeaking] = useState(false);
  const speak = () => {
    if (speaking) { window.speechSynthesis?.cancel(); setSpeaking(false); return; }
    if (!text || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(text.slice(0, 500));
    u.lang = "hi-IN"; u.rate = 0.9; u.pitch = 1;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };
  return (
    <button onClick={speak}
      style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)",
        fontSize:"14px", padding:"4px 8px", borderRadius:"6px", fontFamily:"var(--font-main)" }}>
      {speaking ? "⏹️" : "🔊"}
    </button>
  );
}

// ─── Main VoiceTutor Export ────────────────────────────────────────────────────
export function VoiceTutor({ user, subject, examType, sessionId, setSessionId }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}
        style={{ padding:"8px 14px", borderRadius:"8px",
          border:"1px solid rgba(99,102,241,0.4)", background:"rgba(99,102,241,0.1)",
          color:"#a78bfa", cursor:"pointer", fontSize:"12px", fontWeight:800,
          fontFamily:"var(--font-main)", display:"flex", alignItems:"center", gap:"6px" }}>
        🎙️ Live Class Shuru Karo
      </button>
      {open && (
        <VoiceTutorModal
          user={user} subject={subject} examType={examType}
          sessionId={sessionId} setSessionId={setSessionId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
