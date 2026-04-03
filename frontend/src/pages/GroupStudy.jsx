import React, { useState, useEffect, useRef } from "react";
import { useUser } from "../hooks/useUser";
import API from "../utils/api";

const ROOMS_KEY = "examguru_rooms";

function getRooms() {
  try { return JSON.parse(localStorage.getItem(ROOMS_KEY) || "[]"); }
  catch { return []; }
}
function saveRooms(r) { localStorage.setItem(ROOMS_KEY, JSON.stringify(r)); }
function genCode() { return Math.random().toString(36).slice(2,7).toUpperCase(); }
function timeAgo(iso) {
  const s = (Date.now() - new Date(iso)) / 1000;
  if (s < 60) return "abhi";
  if (s < 3600) return `${Math.floor(s/60)}m`;
  return `${Math.floor(s/3600)}h`;
}

export default function GroupStudy() {
  const { user } = useUser();
  const [rooms, setRooms]       = useState([]);
  const [activeRoom, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState("");
  const [roomName, setRoomName] = useState("");
  const [subject, setSubject]   = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [sending, setSending]   = useState(false);
  const [tab, setTab]           = useState("rooms"); // rooms|chat
  const bottomRef = useRef(null);

  const examType = user?.examTarget || "JEE";
  const SUBJECTS = { JEE:["Physics","Chemistry","Mathematics"], NEET:["Physics","Chemistry","Biology"], UPSC:["History","Geography","Polity","Economy"], default:["General","Reasoning","Mathematics"] };
  const subjects = SUBJECTS[examType] || SUBJECTS.default;

  useEffect(() => {
    const saved = getRooms();
    if (saved.length === 0) {
      const demo = [
        { id:1, code:genCode(), name:"JEE Physics Doubts", subject:"Physics", examType:"JEE", host:"Rahul", hostId:"demo1", members:[{id:"demo1",name:"Rahul"},{id:"demo2",name:"Priya"}], messages:[
          { id:1, userId:"demo1", userName:"Rahul", text:"Aaj hum Newton's laws cover karenge!", time:new Date(Date.now()-3600000).toISOString(), isAI:false },
          { id:2, userId:"ai", userName:"🤖 ExamGuru AI", text:"Great! Newton's Laws mein 3 laws hain. 1st: Inertia ka law — koi object tab tak move ya stop nahi hota jab tak bahar se force na lage!", time:new Date(Date.now()-3500000).toISOString(), isAI:true },
        ], created:new Date(Date.now()-7200000).toISOString() },
      ];
      saveRooms(demo);
      setRooms(demo);
    } else {
      setRooms(saved);
    }
    if (subjects[0]) setSubject(subjects[0]);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages]);

  const createRoom = () => {
    if (!roomName.trim()) return;
    const room = {
      id: Date.now(), code: genCode(),
      name: roomName, subject, examType,
      host: user.name, hostId: user.id,
      members: [{ id:user.id, name:user.name }],
      messages: [{ id:1, userId:"ai", userName:"🤖 ExamGuru AI", text:`${roomName} mein aapka swagat hai! Main aapka AI study buddy hoon. Koi bhi question poochho, main turant jawab dunga! 🎓`, time:new Date().toISOString(), isAI:true }],
      created: new Date().toISOString()
    };
    const updated = [room, ...getRooms()];
    saveRooms(updated);
    setRooms(updated);
    openRoom(room);
    setRoomName("");
  };

  const joinRoom = () => {
    const code = joinCode.trim().toUpperCase();
    const found = getRooms().find(r => r.code === code);
    if (!found) { alert("Room not found! Code check karo."); return; }
    const alreadyIn = found.members?.find(m => m.id === user.id);
    if (!alreadyIn) {
      found.members = [...(found.members||[]), { id:user.id, name:user.name }];
      const updated = getRooms().map(r => r.code===code ? found : r);
      saveRooms(updated);
      setRooms(updated);
    }
    openRoom(found);
    setJoinCode("");
  };

  const openRoom = (room) => {
    setActive(room);
    setMessages(room.messages || []);
    setTab("chat");
  };

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    const msg = { id:Date.now(), userId:user.id, userName:user.name, text:input.trim(), time:new Date().toISOString(), isAI:false };
    const withUser = [...messages, msg];
    setMessages(withUser);
    const userText = input.trim();
    setInput("");
    setSending(true);

    // AI responds if message has "?" or starts with AI trigger words
    const needsAI = userText.includes("?") || /^(AI|bot|guru|explain|kya|how|why|samjhao)/i.test(userText);
    if (needsAI) {
      try {
        const res = await API.post("/chat/message", {
          userId: user.id, message: userText,
          examType: activeRoom?.examType || examType,
          subject: activeRoom?.subject || subject,
        });
        const aiMsg = { id:Date.now()+1, userId:"ai", userName:"🤖 ExamGuru AI",
          text: res.data.response?.replace(/\*\*/g,"").replace(/#{1,3}\s/g,"").slice(0,600) || "",
          time: new Date().toISOString(), isAI:true };
        const withAI = [...withUser, aiMsg];
        setMessages(withAI);
        updateRoom(withAI);
      } catch {}
    } else {
      updateRoom(withUser);
    }
    setSending(false);
  };

  const updateRoom = (msgs) => {
    const updated = getRooms().map(r => r.id===activeRoom?.id ? {...r, messages:msgs} : r);
    saveRooms(updated);
    setRooms(updated);
  };

  if (tab === "chat" && activeRoom) return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden" }}>
      {/* Header */}
      <div style={{ padding:"12px 16px", background:"var(--bg-secondary)", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:"12px", flexShrink:0 }}>
        <button onClick={() => setTab("rooms")} style={{ background:"none", border:"none", color:"var(--text-muted)", cursor:"pointer", fontSize:"18px", padding:"4px" }}>←</button>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:800, fontSize:"14px" }}>{activeRoom.name}</div>
          <div style={{ fontSize:"11px", color:"var(--text-muted)" }}>
            {activeRoom.subject} • {activeRoom.members?.length || 1} members • Code: <span style={{color:"var(--accent)",fontWeight:700,fontFamily:"monospace"}}>{activeRoom.code}</span>
          </div>
        </div>
        <button onClick={() => {
          const text = `📚 Join my ExamGuru Study Room!\nRoom: ${activeRoom.name}\nSubject: ${activeRoom.subject}\n🔑 Code: ${activeRoom.code}\nexamguru.ai`;
          navigator.clipboard?.writeText(text).then(() => alert("✅ Copied! WhatsApp pe share karo!"));
        }} style={{ padding:"6px 12px", borderRadius:"8px", border:"1px solid var(--border)", background:"transparent", color:"var(--text-muted)", cursor:"pointer", fontSize:"11px", fontWeight:700, fontFamily:"var(--font-main)" }}>
          📤 Invite
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:"auto", padding:"16px", display:"flex", flexDirection:"column", gap:"10px" }}>
        {messages.map(msg => {
          const isMe = msg.userId === user.id;
          return (
            <div key={msg.id} style={{ display:"flex", gap:"8px", justifyContent:isMe?"flex-end":"flex-start" }}>
              {!isMe && (
                <div style={{ width:"32px", height:"32px", borderRadius:"50%", flexShrink:0,
                  background: msg.isAI ? "linear-gradient(135deg,var(--accent),#8b5cf6)" : `hsl(${msg.userName?.charCodeAt(0)*7||200},55%,40%)`,
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:msg.isAI?"16px":"12px", fontWeight:900, color:"white", marginTop:"2px" }}>
                  {msg.isAI ? "🤖" : msg.userName?.charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{ maxWidth:"72%",  }}>
                {!isMe && <div style={{ fontSize:"10px", color:"var(--text-muted)", marginBottom:"3px", fontWeight:700 }}>{msg.userName}</div>}
                <div style={{ padding:"10px 14px", borderRadius: isMe?"16px 4px 16px 16px":"4px 16px 16px 16px",
                  background: isMe ? "var(--accent)" : msg.isAI ? "linear-gradient(135deg,rgba(59,130,246,0.15),rgba(99,102,241,0.08))" : "var(--bg-card)",
                  border: `1px solid ${isMe?"transparent":msg.isAI?"rgba(59,130,246,0.2)":"var(--border)"}`,
                  color: isMe ? "white" : "var(--text-primary)", fontSize:"13px", lineHeight:"1.6" }}>
                  {msg.text}
                </div>
                <div style={{ fontSize:"9px", color:"var(--text-muted)", marginTop:"3px", textAlign:isMe?"right":"left" }}>
                  {timeAgo(msg.time)}
                </div>
              </div>
            </div>
          );
        })}
        {sending && (
          <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
            <div style={{ width:"32px", height:"32px", borderRadius:"50%", background:"linear-gradient(135deg,var(--accent),#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px" }}>🤖</div>
            <div style={{ padding:"10px 14px", borderRadius:"4px 16px 16px 16px", background:"var(--bg-card)", border:"1px solid var(--border)", display:"flex", gap:"4px", alignItems:"center" }}>
              {[0,1,2].map(i => <div key={i} style={{ width:"6px", height:"6px", borderRadius:"50%", background:"var(--text-muted)", animation:"pulse 1s ease infinite", animationDelay:`${i*0.2}s` }}/>)}
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div style={{ padding:"12px 16px", borderTop:"1px solid var(--border)", background:"var(--bg-secondary)", display:"flex", gap:"10px", flexShrink:0 }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key==="Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
          placeholder="Message likho... ? se poochho AI se!"
          style={{ flex:1, padding:"11px 14px", borderRadius:"12px", border:"1px solid var(--border)",
            background:"var(--bg-card)", color:"var(--text-primary)", fontSize:"13px",
            fontFamily:"var(--font-main)", outline:"none" }}/>
        <button onClick={sendMessage} disabled={!input.trim()||sending}
          style={{ padding:"11px 18px", borderRadius:"12px", border:"none",
            background:input.trim()&&!sending?"var(--accent)":"#334155",
            color:"white", cursor:input.trim()&&!sending?"pointer":"default", fontSize:"16px" }}>
          {sending ? <div className="loader" style={{width:"16px",height:"16px"}}/> : "🚀"}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ padding:"24px", overflowY:"auto", maxHeight:"100vh" }}>
      <div style={{ marginBottom:"20px" }}>
        <h1 style={{ fontSize:"22px", fontWeight:900, marginBottom:"4px" }}>👥 Group Study Room</h1>
        <p style={{ color:"var(--text-secondary)", fontSize:"13px" }}>Friends ke saath padho — AI bhi saath mein hai!</p>
      </div>

      {/* Create Room */}
      <div className="card" style={{ marginBottom:"16px" }}>
        <div style={{ fontSize:"14px", fontWeight:800, marginBottom:"12px" }}>➕ New Room Banao</div>
        <input value={roomName} onChange={e => setRoomName(e.target.value)}
          onKeyDown={e => e.key==="Enter" && createRoom()}
          placeholder="Room ka naam (jaise: JEE Physics Doubts)"
          style={{ width:"100%", padding:"10px 14px", borderRadius:"8px", border:"1px solid var(--border)",
            background:"var(--bg-secondary)", color:"var(--text-primary)", fontSize:"13px",
            fontFamily:"var(--font-main)", outline:"none", boxSizing:"border-box", marginBottom:"10px" }}/>
        <div style={{ display:"flex", gap:"8px", marginBottom:"10px", flexWrap:"wrap" }}>
          {subjects.map(s => (
            <button key={s} onClick={() => setSubject(s)}
              style={{ padding:"5px 12px", borderRadius:"20px", border:`1px solid ${subject===s?"var(--accent)":"var(--border)"}`,
                background:subject===s?"var(--accent-glow)":"transparent",
                color:subject===s?"var(--accent)":"var(--text-muted)",
                cursor:"pointer", fontSize:"11px", fontWeight:700, fontFamily:"var(--font-main)" }}>{s}</button>
          ))}
        </div>
        <button className="btn btn-primary" onClick={createRoom} disabled={!roomName.trim()} style={{ justifyContent:"center", width:"100%" }}>
          🚀 Room Create Karo
        </button>
      </div>

      {/* Join Room */}
      <div className="card" style={{ marginBottom:"16px" }}>
        <div style={{ fontSize:"14px", fontWeight:800, marginBottom:"10px" }}>🔑 Room Join Karo</div>
        <div style={{ display:"flex", gap:"10px" }}>
          <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
            placeholder="Room Code (jaise: ABC12)"
            maxLength={5}
            style={{ flex:1, padding:"10px 14px", borderRadius:"8px", border:"1px solid var(--border)",
              background:"var(--bg-secondary)", color:"var(--text-primary)", fontSize:"16px",
              fontFamily:"monospace", fontWeight:700, outline:"none", letterSpacing:"0.2em",
              textAlign:"center" }}/>
          <button className="btn btn-primary" onClick={joinRoom} disabled={joinCode.length!==5}>Join →</button>
        </div>
      </div>

      {/* Rooms list */}
      <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
        <div style={{ fontSize:"13px", fontWeight:800, color:"var(--text-muted)" }}>📋 Active Rooms</div>
        {rooms.map(room => (
          <div key={room.id} className="card fade-in" style={{ cursor:"pointer" }} onClick={() => openRoom(room)}>
            <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
              <div style={{ width:"42px", height:"42px", borderRadius:"10px", flexShrink:0,
                background:"linear-gradient(135deg,var(--accent),#8b5cf6)",
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px" }}>
                📚
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:800, fontSize:"14px", marginBottom:"2px" }}>{room.name}</div>
                <div style={{ fontSize:"11px", color:"var(--text-muted)" }}>
                  {room.subject} • {room.members?.length||1} members • Code: <span style={{color:"var(--accent)",fontWeight:700,fontFamily:"monospace"}}>{room.code}</span>
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:"12px", color:"#10b981", fontWeight:700 }}>
                  {room.messages?.length||0} msgs
                </div>
                <div style={{ fontSize:"10px", color:"var(--text-muted)" }}>
                  {room.messages?.length ? timeAgo(room.messages[room.messages.length-1].time) : "new"}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
