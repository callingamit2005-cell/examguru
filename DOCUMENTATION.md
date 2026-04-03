# ExamGuru AI — Developer Documentation
**Last Updated:** April 2026  
**Stack:** React 18 + Node.js/Express + Supabase + Groq AI + Gemini AI

---

## 🏗️ Architecture Overview

```
ai-exam-tutor/
├── frontend/          React SPA (localhost:3000)
└── backend/           Express API (localhost:5000)
```

### Frontend Structure
```
src/
├── App.jsx                    ← Main router (switch-case, 22 pages)
├── index.js                   ← Entry point (NO StrictMode — prevents double effects)
├── styles/global.css          ← CSS variables, dark theme
├── hooks/
│   ├── useUser.js             ← Auth state (localStorage)
│   └── useAppData.js          ← Global data singleton (module-level cache)
├── utils/api.js               ← Axios + 60s client cache
├── components/
│   ├── Sidebar.jsx            ← Navigation (22 items)
│   ├── VoiceTutor.jsx         ← Live voice class (Web Speech API)
│   ├── ExplanationEngine.jsx  ← 4 modes + real Wikipedia images
│   ├── DrawCanvas.jsx         ← HTML5 canvas drawing
│   └── PWAInstall.jsx         ← PWA install prompt
└── pages/ (22 pages)
```

### Backend Structure
```
backend/
├── server.js                  ← Express app, routes, cache middleware
├── .env                       ← API keys (never commit!)
├── controllers/
│   └── aiController.js        ← All AI functions (Groq + Gemini)
├── db/
│   ├── database.js            ← Supabase client
│   └── schema.sql             ← DB schema
└── routes/
    ├── chat.js      ← /message /history /sessions /examiner /whystudy /teacherstyle /diagram
    ├── test.js      ← /generate /submit /history
    ├── user.js      ← /register /profile /subjects
    ├── analytics.js ← /dashboard
    ├── scan.js      ← Gemini vision (primary) + Groq (fallback)
    ├── diagram.js   ← Wikipedia/Wikimedia real image search
    └── admin.js     ← /make-admin /enroll /stats
```

---

## 🗄️ Database (Supabase)

### Tables
| Table | Purpose |
|-------|---------|
| users | User profiles, role, examTarget |
| sessions | Chat sessions |
| messages | Chat history |
| mock_tests | Test results |
| weak_topics | Wrong answer tracking |
| courses | Available courses (20+) |
| enrollments | User-course enrollment |

---

## 🤖 AI Configuration

### Models Used
| Purpose | Model | Tokens |
|---------|-------|--------|
| Chat/Tutor | llama-3.3-70b-versatile | 1500 |
| Mock Tests | llama-3.1-8b-instant | 4000 |
| SVG Diagrams | llama-3.3-70b-versatile | 4000 |
| Diagram concept extraction | llama-3.1-8b-instant | 20 |
| Photo Scan | gemini-1.5-flash (primary) | - |
| Diagram images | Wikimedia Commons API | - |

### Exam Configs (67 exams supported)
- School: FOUNDATION, CLASS_9 to CLASS_12 (Sci/Com/Arts)
- Engineering: JEE, BITSAT, MHT-CET, KCET, WBJEE
- Medical: NEET, NEET_PG, AIIMS
- UPSC: UPSC, UPSC_PRE, UPSC_MAINS, UPSC_CSAT
- State PCS: UP_PCS, MP_PCS, RAS, BPSC, MPSC + 12 more states
- SSC/Railway: SSC_CGL, SSC_CHSL, SSC_GD, RRB_NTPC, NDA, CDS...
- Banking: IBPS_PO, SBI_PO, RBI_GRADE_B...
- Others: CLAT, CAT, GATE, UGC_NET

---

## ⚡ Performance Architecture

### Critical: No Infinite Loops
- `StrictMode` REMOVED from index.js (double-invokes effects)
- `"proxy"` REMOVED from frontend/package.json (caused HMR loop)
- `useAppData` uses module-level singleton (fetch once, share everywhere)
- All pages use `useAppData()` — NO direct API calls on mount

### Caching
- **Frontend**: 60s TTL cache in `api.js` (cachedGet)
- **Backend**: 45s server cache for /api/analytics + /api/user
- **Diagrams**: 60min cache in diagram.js

---

## 📱 Pages Index (22 pages)

| Route | Page | Description |
|-------|------|-------------|
| dashboard | DashboardPage | Stats, quick actions |
| chat | ChatPage | AI Tutor (main feature) |
| test | TestPage | Mock test generator |
| history | HistoryPage | Chat history |
| weak | WeakTopicsPage | Wrong answer analysis |
| heatmap | WeaknessHeatmap | Color-coded weakness map |
| prediction | ExamPrediction | AI exam prediction |
| simulation | ExamSimulation | Real exam UI + timer |
| revision | QuickRevision | Flashcards + key points |
| countdown | ExamCountdown | Live exam countdown timer |
| streak | StudyStreak | Daily tasks + streak |
| leaderboard | Leaderboard | XP rankings |
| predictor | ScorePredictor | AI score prediction |
| challenge | PeerChallenge | Friend challenge system |
| doubts | DoubtShare | Community doubt board |
| group | GroupStudy | Group study rooms |
| progress | ProgressReport | AI weekly report + print |
| gamification | GamificationPage | XP, badges, achievements |
| planner | StudyPlannerPage | Study schedule |
| report | ReportPage | Report card PDF |
| parent | ParentDashboard | Parent monitoring |
| admin | AdminPanel | Admin controls |
| ncert | NCERTPractice | Chapter-wise NCERT practice |

---

## 🔑 Environment Variables (.env)

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
GROQ_API_KEY=xxx          # llama models
GEMINI_API_KEY=xxx        # vision + diagrams
ADMIN_SECRET=examguru2026
PORT=5000
```

---

## 🚀 How to Run

```bash
# Backend
cd backend && npm install && npm start

# Frontend
cd frontend && npm install && npm start
# Note: No "proxy" in package.json!
```

---

## 🐛 Known Issues / Fixes Applied

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| 429 Too Many Requests | StrictMode double effects | Removed StrictMode |
| Page auto-refresh loop | `"proxy"` in package.json | Removed proxy |
| API infinite loop | Pages calling APIs on every render | useAppData singleton |
| Wrong diagram shown | `/ph/` matching "physiology" | Word boundary regex `\bph\b` |
| JSON parse error in tests | AI returns malformed JSON | Error recovery + repair |

---

## 📦 Adding New Features Checklist

1. Create `frontend/src/pages/NewPage.jsx`
2. Add import in `App.jsx`
3. Add `case 'newpage': return <NewPage />;` in switch
4. Add `{ id:"newpage", icon:"🆕", label:"New Feature" }` in Sidebar.jsx
5. Update this documentation
