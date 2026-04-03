# 🎓 ExamGuru AI — Production Ready

AI-powered exam preparation for **JEE | NEET | UPSC**
Stack: **React + Node.js + Supabase (PostgreSQL) + Groq AI**
Both 100% FREE — scales to millions of users!

---

## ⚡ Setup (10 minutes)

### Step 1: Supabase Setup (FREE Database)

1. Go to [supabase.com](https://supabase.com) → Sign Up (free)
2. Click **"New Project"** → Name it → Create
3. Wait 2 min for project to start
4. Go to **SQL Editor** → **New Query**
5. Open `backend/db/schema.sql` → Copy all → Paste → Click **Run**
6. Go to **Settings → API** → Copy:
   - `Project URL` → this is your `SUPABASE_URL`
   - `anon public` key → this is your `SUPABASE_ANON_KEY`

### Step 2: Groq API Key (FREE AI)

1. Go to [console.groq.com](https://console.groq.com) → Sign Up
2. **API Keys** → **Create API Key** → Copy it

### Step 3: Backend

```cmd
cd backend
copy .env.example .env
notepad .env
```

Fill in your .env:
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
GROQ_API_KEY=gsk_...
```

```cmd
npm install
npm start
```

✅ Should see: `🚀 ExamGuru AI Server running on http://localhost:5000`

### Step 4: Frontend

```cmd
cd frontend
npm install
npm start
```

Open `http://localhost:3000` 🎉

---

## 🏗️ Project Structure

```
ai-exam-tutor/
├── backend/
│   ├── server.js
│   ├── .env.example
│   ├── controllers/aiController.js   # Groq AI (temperature: 0.1)
│   ├── db/
│   │   ├── database.js               # Supabase client
│   │   └── schema.sql                # Run this in Supabase SQL Editor
│   └── routes/
│       ├── chat.js, test.js
│       ├── user.js, analytics.js
└── frontend/
    └── src/ (React app)
```

---

## 🆓 Free Tier Limits

| Service | Free Limit | Paid Upgrade |
|---------|-----------|--------------|
| **Supabase** | 500MB DB, 2GB bandwidth | $25/month |
| **Groq AI** | 1000 req/day (70B) | Pay-per-token |
| **Vercel** (frontend) | Unlimited | Free forever |
| **Render** (backend) | 750 hrs/month | $7/month |

---

## 🚀 Deploy to Production (Free)

### Frontend → Vercel
```bash
cd frontend && npm run build
# Push to GitHub → Connect to vercel.com → Auto deploy!
```

### Backend → Render.com
1. Push to GitHub
2. render.com → New Web Service → Connect repo
3. Add environment variables
4. Deploy!

---

## 🤖 AI Config
- **Provider:** Groq (Free)
- **Chat Model:** llama-3.3-70b-versatile
- **Temperature:** 0.1 (precise answers)
- **Context:** Last 20 messages

## 🛡️ Security
- Helmet.js security headers
- Rate limiting (200 req/15min, 30 AI req/min)
- Supabase Row Level Security (enterprise-grade)
- Input validation on all endpoints
