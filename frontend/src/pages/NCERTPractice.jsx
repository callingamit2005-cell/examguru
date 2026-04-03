/**
 * NCERTPractice.jsx
 * 
 * Feature: NCERT Chapter-wise Practice
 * - Subject → Chapter → Topic drill-down
 * - AI generates chapter-specific MCQs
 * - Progress tracking per chapter
 * - Supports all exam types
 * 
 * @author ExamGuru AI
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "../hooks/useUser";
import { testAPI } from "../utils/api";

// ─── Complete Syllabus Data (NCERT + Competitive Exams) ─────────────────────
const NCERT_DATA = {

  // ── SCHOOL SUBJECTS ─────────────────────────────────────────────────────────
  Physics: {
    "Class 11": ["Physical World & Units","Motion in a Straight Line","Motion in a Plane","Laws of Motion","Work Energy Power","System of Particles & Rotation","Gravitation","Mechanical Properties of Solids","Mechanical Properties of Fluids","Thermal Properties of Matter","Thermodynamics","Kinetic Theory","Oscillations","Waves"],
    "Class 12": ["Electric Charges & Fields","Electrostatic Potential","Current Electricity","Moving Charges & Magnetism","Magnetism & Matter","Electromagnetic Induction","Alternating Current","Electromagnetic Waves","Ray Optics","Wave Optics","Dual Nature of Radiation","Atoms","Nuclei","Semiconductor Electronics"],
    "JEE Special": ["Rotational Mechanics Advanced","Fluid Mechanics JEE","Electrostatics JEE","Optics JEE","Modern Physics JEE","Heat & Thermodynamics JEE","Waves & Sound JEE","Magnetic Effects JEE"],
    "NEET Special": ["Human Physiology Physics","Biomechanics","Medical Instruments","Radiation in Medicine"],
  },
  Chemistry: {
    "Class 11": ["Some Basic Concepts","Structure of Atom","Classification of Elements","Chemical Bonding","States of Matter","Thermodynamics","Equilibrium","Redox Reactions","Hydrogen","s-Block Elements","p-Block Elements (1)","Organic Chemistry Basics","Hydrocarbons","Environmental Chemistry"],
    "Class 12": ["Solid State","Solutions","Electrochemistry","Chemical Kinetics","Surface Chemistry","General Principles (Metallurgy)","p-Block Elements (2)","d & f Block Elements","Coordination Compounds","Haloalkanes & Haloarenes","Alcohols Phenols Ethers","Aldehydes Ketones","Amines","Biomolecules"],
    "JEE Special": ["Organic Reactions Mechanism","Named Reactions","Coordination Chemistry Advanced","Electrochemistry Advanced","Chemical Equilibrium Advanced"],
    "NEET Special": ["Biomolecules & Biochemistry","Chemistry in Daily Life","Polymers & Materials","Environmental Chemistry NEET"],
  },
  Mathematics: {
    "Class 11": ["Sets","Relations & Functions","Trigonometric Functions","Principle of Mathematical Induction","Complex Numbers","Linear Inequalities","Permutations & Combinations","Binomial Theorem","Sequences & Series","Straight Lines","Conic Sections","Introduction to 3D Geometry","Limits & Derivatives","Statistics","Probability"],
    "Class 12": ["Relations & Functions","Inverse Trigonometric Functions","Matrices","Determinants","Continuity & Differentiability","Applications of Derivatives","Integrals","Applications of Integrals","Differential Equations","Vector Algebra","Three Dimensional Geometry","Linear Programming","Probability"],
    "JEE Special": ["Complex Numbers Advanced","Matrices Advanced","Calculus JEE Level","Coordinate Geometry Advanced","Probability Advanced","Vectors & 3D Advanced"],
  },
  Biology: {
    "Class 11": ["Living World","Biological Classification","Plant Kingdom","Animal Kingdom","Morphology of Flowering Plants","Anatomy of Flowering Plants","Structural Organisation in Animals","Cell: The Unit of Life","Biomolecules","Cell Cycle & Division","Transport in Plants","Mineral Nutrition","Photosynthesis","Respiration in Plants","Plant Growth & Development","Digestion & Absorption","Breathing & Gas Exchange","Body Fluids & Circulation","Excretory Products","Locomotion & Movement","Neural Control","Chemical Coordination"],
    "Class 12": ["Reproduction in Organisms","Sexual Reproduction in Flowering Plants","Human Reproduction","Reproductive Health","Heredity & Variation","Molecular Basis of Inheritance","Evolution","Human Health & Disease","Strategies for Enhancement in Food","Microbes in Human Welfare","Biotechnology: Principles","Biotechnology: Applications","Organisms & Populations","Ecosystem","Biodiversity","Environmental Issues"],
    "NEET Special": ["Human Anatomy Detailed","Genetics & Molecular Biology Advanced","Ecology Advanced","Biotechnology NEET","Evolution & Paleontology"],
  },

  // ── UPSC / IAS ──────────────────────────────────────────────────────────────
  "History (UPSC)": {
    "Ancient India": ["Prehistoric India","Indus Valley Civilisation","Vedic Age","Mahajanapadas & Magadha","Maurya Empire","Post-Maurya Period","Gupta Empire","Post-Gupta Period","South Indian Kingdoms","Art & Architecture Ancient"],
    "Medieval India": ["Early Medieval Period","Rajput Kingdoms","Delhi Sultanate","Vijayanagara Empire","Bhakti & Sufi Movement","Mughal Empire","Maratha Empire","Art Culture Medieval","Regional Kingdoms"],
    "Modern India": ["European Advent","British Expansion","Economic Impact of British","Social Religious Reform Movements","Revolt of 1857","Indian National Congress","Gandhian Era","Revolutionary Movements","Constitutional Development","Independence & Partition"],
    "World History": ["French Revolution","Industrial Revolution","World War I","Russian Revolution","Rise of Fascism","World War II","Cold War","Decolonisation","Contemporary World"],
  },
  "Geography (UPSC)": {
    "Physical Geography": ["Universe & Solar System","Earth Structure","Geomorphology (Landforms)","Rocks & Minerals","Earthquakes & Volcanoes","Ocean Floor","Atmosphere","Climatology","Monsoon","Ocean Currents","Tides","Biogeography","Environmental Geography"],
    "Indian Geography": ["India Physical Features","Himalayan System","Northern Plains","Peninsular Plateau","Coastal Plains & Islands","Indian Rivers","Indian Climate","Natural Vegetation","Indian Soils","Natural Disasters India","Population Geography India"],
    "Economic Geography": ["Agriculture Types","Green Revolution","Irrigation Systems","Mining & Minerals","Energy Resources","Industries & Urbanisation","Transport & Communication","Trade & Globalisation"],
    "Human Geography": ["Population Theories","Migration","Human Development","Settlements","Cultural Geography","Political Geography","Geopolitics"],
  },
  "Polity (UPSC)": {
    "Constitution": ["Historical Background","Making of Constitution","Salient Features","Preamble","Union & its Territory","Citizenship","Fundamental Rights","Directive Principles","Fundamental Duties","Amendment Procedure"],
    "Central Government": ["President","Vice President","Prime Minister & Cabinet","Parliament: Lok Sabha","Parliament: Rajya Sabha","Legislative Process","Parliamentary Committees","Supreme Court","High Courts","Subordinate Courts"],
    "State Government": ["Governor","State Legislature","Chief Minister & Council","State Judiciary","Local Self Government Urban","Panchayati Raj"],
    "Constitutional Bodies": ["Election Commission","UPSC & State PSCs","Finance Commission","CAG","Attorney General","NITI Aayog","Planning in India"],
    "Important Acts & Articles": ["Key Constitutional Articles","Emergency Provisions","Inter-State Relations","Official Language","Schedules of Constitution","Important Amendment Acts"],
  },
  "Economy (UPSC)": {
    "Indian Economy Basics": ["Economic Planning History","NITI Aayog & Five Year Plans","National Income Concepts","Economic Survey Analysis","Budget Basics & Components"],
    "Agriculture": ["Green Revolution","Agricultural Reforms","Land Reforms","Irrigation & Water","Agricultural Marketing","Food Security","MSP & Procurement","Agricultural Finance"],
    "Industry & Trade": ["Industrial Policy History","MSME Sector","Public Sector","FDI & FII Policy","Export Import Policy","SEZ & Industrial Corridors","Make in India"],
    "Banking & Finance": ["RBI Functions","Banking Sector Reforms","Monetary Policy","Inflation & Price Indices","Fiscal Policy","Taxation System","GST","Capital Markets"],
    "Poverty & Development": ["Poverty Estimation","Unemployment Types","Human Development Index","Social Sector Schemes","Financial Inclusion","Digital Economy"],
    "International Economy": ["WTO & Trade Agreements","IMF & World Bank","Balance of Payments","Forex Reserves","Globalisation Impact"],
  },
  "Environment (UPSC)": {
    "Ecology Basics": ["Ecosystem Concepts","Food Web & Energy Flow","Biogeochemical Cycles","Biodiversity Types","Hotspots of Biodiversity","Invasive Species","Ecological Services"],
    "Environmental Issues": ["Climate Change & IPCC","Global Warming","Ozone Depletion","Acid Rain","Air Pollution","Water Pollution","Soil Degradation","Desertification"],
    "Conservation": ["Wildlife Protection Act","Forest Conservation Act","Protected Areas","Tiger Reserves","Ramsar Wetlands","Biosphere Reserves","CITES","National Missions"],
    "International Conventions": ["UNFCCC & Paris Agreement","Kyoto Protocol","CBD","Stockholm Convention","Basel Convention","Sustainable Development Goals"],
  },
  "Science & Technology (UPSC)": {
    "Space Technology": ["ISRO Missions","Satellites & Applications","Space Exploration","Mars & Moon Missions","GPS Technology"],
    "Defence Technology": ["Missile Systems India","Nuclear Program","Defence Modernisation","Cyber Security"],
    "Bio & Nano Technology": ["Biotechnology Applications","GM Crops","Stem Cell Research","Nanotechnology Uses","Genomics & Proteomics"],
    "IT & Communications": ["Internet & 5G","Artificial Intelligence","Blockchain","Cybersecurity","Digital India Initiatives"],
    "Health Technology": ["Drug Discovery","Vaccine Technology","Medical Devices","COVID-19 Impact","Health Schemes"],
  },
  "Current Affairs (UPSC)": {
    "National Affairs": ["Government Schemes 2024-25","Constitutional Developments","Judicial Decisions","Economic Policies","Social Issues"],
    "International Affairs": ["India Foreign Policy","India-US Relations","India-China Relations","India-Pakistan","G20 & Global Forums","UN & International Organizations"],
    "Awards & Recognition": ["Bharat Ratna & Padma Awards","Nobel Prize","Sports Awards","Literary Awards"],
    "Reports & Indices": ["Economic Survey","World Development Report","Human Development Report","Global Hunger Index","Ease of Doing Business"],
  },
  "Ethics (UPSC)": {
    "Ethics Foundation": ["Attitude & Aptitude","Emotional Intelligence","Ethics in Public Administration","Corruption & Anti-Corruption","Probity in Governance"],
    "Moral Thinkers": ["Indian Philosophers (Gandhi, Ambedkar)","Western Philosophers","Ethics of Care","Utilitarianism & Deontology"],
    "Case Studies": ["Ethical Dilemmas in Administration","Whistleblowing","Conflict of Interest","Human Rights Issues","Environmental Ethics"],
  },

  // ── STATE PCS ───────────────────────────────────────────────────────────────
  "UP Special": {
    "UP History": ["Ancient UP (Kosala, Kashi)","Medieval UP (Delhi Sultanate in UP)","Mughal Period in UP","1857 in UP","Freedom Movement in UP","Post-Independence UP"],
    "UP Geography": ["UP Physical Features","Ganga-Yamuna Doab","Eastern UP Plains","Bundelkhand Region","UP Climate & Rivers","UP Districts & Divisions"],
    "UP Economy": ["UP Agriculture & Crops","Sugar Industry UP","Handicrafts (Lucknow Chikankari etc)","UP Industrial Development","UP Expressways & Infrastructure","ODOP Scheme UP"],
    "UP Polity & Schemes": ["UP Government Structure","UP Panchayati Raj","UP Police & Administration","CM Yogi Government Schemes","UP Budget & Economy","UP Education Schemes"],
    "UP Culture": ["UP Art & Architecture","Awadhi Culture","Braj Culture","Bundelkhandi Culture","UP Fairs & Festivals","Famous Personalities UP"],
  },

  // ── SSC ─────────────────────────────────────────────────────────────────────
  "General Intelligence": {
    "Verbal Reasoning": ["Analogy","Classification","Series Completion","Coding-Decoding","Blood Relations","Direction Sense","Sitting Arrangement","Syllogism","Statement & Conclusion"],
    "Non-Verbal Reasoning": ["Pattern Completion","Mirror Images","Paper Folding","Figure Matrix","Counting Figures","Embedded Figures","Visual Puzzles"],
    "Logical Reasoning": ["Logical Sequence","Logical Venn Diagrams","Data Sufficiency","Decision Making","Critical Reasoning"],
  },
  "Quantitative Aptitude": {
    "Arithmetic": ["Number System","HCF & LCM","Fractions & Decimals","Square Roots & Cube Roots","Percentage","Profit & Loss","Simple & Compound Interest","Ratio & Proportion","Average","Partnership"],
    "Advanced Maths": ["Time Work & Wages","Time Speed Distance","Pipes & Cisterns","Mixture & Alligation","Mensuration 2D","Mensuration 3D","Trigonometry","Heights & Distances"],
    "Data Interpretation": ["Tables","Bar Graphs","Pie Charts","Line Graphs","Mixed DI","Data Comparison"],
    "Algebra": ["Linear Equations","Quadratic Equations","Polynomials","Indices & Surds","Sequence & Series SSC"],
  },
  "General Awareness": {
    "History GK": ["Ancient India GK","Medieval India GK","Modern India GK","World History GK","Important Dates & Events"],
    "Geography GK": ["India Geography Facts","World Geography Facts","Physical Features","Climate & Weather","Crops & Resources"],
    "Polity GK": ["Constitution Facts","Parliament Facts","Important Articles","Supreme Court","Election Commission GK"],
    "Science GK": ["Physics GK","Chemistry GK","Biology GK","Computer GK","Inventions & Discoveries"],
    "Current Affairs": ["National Current Affairs","International Current Affairs","Sports Current Affairs","Awards & Honours","Economy Current Affairs"],
  },
  "English Language": {
    "Grammar": ["Noun & Pronoun","Verb & Tense","Adjective & Adverb","Prepositions","Conjunctions","Articles","Voice (Active/Passive)","Narration (Direct/Indirect)","Subject-Verb Agreement"],
    "Vocabulary": ["Synonyms","Antonyms","One Word Substitution","Idioms & Phrases","Spelling Correction","Word Usage"],
    "Comprehension": ["Reading Comprehension","Para Jumbles","Sentence Completion","Cloze Test","Error Detection","Sentence Improvement"],
  },

  // ── BANKING ─────────────────────────────────────────────────────────────────
  "Banking Awareness": {
    "Banking Basics": ["History of Banking India","Types of Banks","RBI Functions & Role","Monetary Policy Tools","Banking Regulations","Basel Norms"],
    "Products & Services": ["Types of Deposits","Types of Loans","Credit Cards","Mobile Banking","NEFT RTGS IMPS","Insurance Products"],
    "Financial Inclusion": ["Jan Dhan Yojana","MUDRA Loans","Priority Sector Lending","SHG & Microfinance","PM Suraksha Bima","Atal Pension Yojana"],
    "Current Banking": ["Recent RBI Policies","Banking Mergers","NPA & Bad Loans","Digital Payment Systems","FinTech & Neo Banks","CBDC (Digital Rupee)"],
  },

  // ── SOCIAL SCIENCE (School) ─────────────────────────────────────────────────
  "Social Science": {
    "Class 9 History": ["French Revolution","Russian Revolution","Nazism & Hitler","Forest Society","Pastoralists"],
    "Class 9 Geography": ["India Physical Features","Drainage","Climate","Natural Vegetation","Population"],
    "Class 9 Civics": ["Democracy","Constitutional Design","Electoral Politics","Working of Institutions","Democratic Rights"],
    "Class 9 Economics": ["Village Palampur","People as Resource","Poverty","Food Security"],
    "Class 10 History": ["Nationalism in Europe","Nationalism in India","Globalisation History","Industrialisation","Print Culture"],
    "Class 10 Geography": ["Resources","Forest & Wildlife","Water Resources","Agriculture","Minerals & Energy","Manufacturing","National Economy"],
    "Class 10 Civics": ["Power Sharing","Federalism","Democracy & Diversity","Gender Religion Caste","Popular Struggles","Political Parties","Outcomes of Democracy"],
    "Class 10 Economics": ["Development","Sectors of Economy","Money & Credit","Globalisation","Consumer Rights"],
  },
  "General Knowledge": {
    "India": ["Indian History Ancient","Indian History Medieval","Indian History Modern","Indian Geography","Indian Constitution & Polity","Indian Economy","Science & Technology India","Art & Culture","Sports & Awards India","Current Affairs India"],
    "World": ["World Geography","World History","International Organizations","Countries & Capitals","Environment & Ecology","Science Basics World","Sports World"],
  },
};

// ─── Progress stored locally ──────────────────────────────────────────────────
const getProgress = () => {
  try { return JSON.parse(localStorage.getItem("ncert_progress") || "{}"); }
  catch { return {}; }
};
const saveProgress = (p) => localStorage.setItem("ncert_progress", JSON.stringify(p));

export default function NCERTPractice() {
  const { user } = useUser();
  const [step, setStep]         = useState("subject"); // subject → class → chapter → quiz
  const [selSubject, setSubject]  = useState(null);
  const [selClass, setSelClass]   = useState(null);
  const [selChapter, setChapter]  = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers]     = useState({});
  const [current, setCurrent]     = useState(0);
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);
  const [progress, setProgress]   = useState(getProgress());
  const [qCount, setQCount]       = useState(10);

  const examType  = user?.examTarget || "JEE";

  // Subjects based on exam type
  const EXAM_SUBJECTS = {
    // Engineering
    JEE:          ["Physics","Chemistry","Mathematics"],
    JEE_MAIN:     ["Physics","Chemistry","Mathematics"],
    BITSAT:       ["Physics","Chemistry","Mathematics"],
    MHT_CET:      ["Physics","Chemistry","Mathematics","Biology"],
    KCET:         ["Physics","Chemistry","Mathematics","Biology"],
    WBJEE:        ["Physics","Chemistry","Mathematics"],
    // Medical
    NEET:         ["Physics","Chemistry","Biology"],
    NEET_PG:      ["Biology"],
    // UPSC
    UPSC:         ["History (UPSC)","Geography (UPSC)","Polity (UPSC)","Economy (UPSC)","Environment (UPSC)","Science & Technology (UPSC)","Current Affairs (UPSC)","Ethics (UPSC)"],
    UPSC_PRE:     ["History (UPSC)","Geography (UPSC)","Polity (UPSC)","Economy (UPSC)","Environment (UPSC)","Science & Technology (UPSC)","Current Affairs (UPSC)"],
    UPSC_MAINS:   ["History (UPSC)","Geography (UPSC)","Polity (UPSC)","Economy (UPSC)","Ethics (UPSC)"],
    UPSC_CSAT:    ["Quantitative Aptitude","General Intelligence","English Language"],
    // State PCS
    UP_PCS:       ["History (UPSC)","Geography (UPSC)","Polity (UPSC)","Economy (UPSC)","UP Special","Current Affairs (UPSC)"],
    MP_PCS:       ["History (UPSC)","Geography (UPSC)","Polity (UPSC)","Economy (UPSC)","Current Affairs (UPSC)"],
    RAS:          ["History (UPSC)","Geography (UPSC)","Polity (UPSC)","Economy (UPSC)","Current Affairs (UPSC)"],
    BPSC:         ["History (UPSC)","Geography (UPSC)","Polity (UPSC)","Economy (UPSC)","Current Affairs (UPSC)"],
    MPSC:         ["History (UPSC)","Geography (UPSC)","Polity (UPSC)","Economy (UPSC)","Current Affairs (UPSC)"],
    // SSC
    SSC_CGL:      ["General Intelligence","Quantitative Aptitude","General Awareness","English Language"],
    SSC_CHSL:     ["General Intelligence","Quantitative Aptitude","General Awareness","English Language"],
    SSC_GD:       ["General Intelligence","Quantitative Aptitude","General Awareness"],
    SSC_MTS:      ["General Intelligence","Quantitative Aptitude","General Awareness"],
    SSC_CPO:      ["General Intelligence","Quantitative Aptitude","General Awareness","English Language"],
    // Railway
    RRB_NTPC:     ["General Intelligence","Quantitative Aptitude","General Awareness"],
    RRB_GROUP_D:  ["General Intelligence","Quantitative Aptitude","General Awareness"],
    // Defence
    NDA:          ["Mathematics","Physics","Chemistry","History (UPSC)","Geography (UPSC)","General Knowledge"],
    CDS:          ["Mathematics","English Language","General Knowledge"],
    // Banking
    IBPS_PO:      ["Quantitative Aptitude","General Intelligence","Banking Awareness","English Language"],
    IBPS_CLERK:   ["Quantitative Aptitude","General Intelligence","Banking Awareness","English Language"],
    SBI_PO:       ["Quantitative Aptitude","General Intelligence","Banking Awareness","English Language"],
    SBI_CLERK:    ["Quantitative Aptitude","General Intelligence","Banking Awareness"],
    RBI_GRADE_B:  ["Economy (UPSC)","Banking Awareness","General Intelligence","English Language"],
    // School
    FOUNDATION:   ["Mathematics","General Knowledge","Social Science"],
    CLASS_9:      ["Mathematics","Biology","Social Science"],
    CLASS_10:     ["Mathematics","Biology","Social Science"],
    CLASS_11_SCI: ["Physics","Chemistry","Mathematics","Biology"],
    CLASS_11_COM: ["Mathematics","Economics","General Knowledge"],
    CLASS_11_ARTS:["History (UPSC)","Geography (UPSC)","Polity (UPSC)"],
    CLASS_12_SCI: ["Physics","Chemistry","Mathematics","Biology"],
    CLASS_12_COM: ["Mathematics","Economics","General Knowledge"],
    CLASS_12_ARTS:["History (UPSC)","Geography (UPSC)","Polity (UPSC)"],
    CLASS_1112_SCI:["Physics","Chemistry","Mathematics","Biology"],
    // Others
    CLAT:         ["English Language","General Knowledge","Polity (UPSC)"],
    CAT:          ["Quantitative Aptitude","General Intelligence","English Language"],
    GATE:         ["Mathematics","General Intelligence"],
    default:      ["General Knowledge","Quantitative Aptitude"],
  };
  const subjects = (EXAM_SUBJECTS[examType] || EXAM_SUBJECTS.default)
    .filter(s => NCERT_DATA[s]);

  const startQuiz = useCallback(async () => {
    setLoading(true);
    setStep("quiz");
    setAnswers({});
    setCurrent(0);
    setResult(null);
    try {
      const res = await testAPI.generate({
        userId: user.id,
        subject: selSubject,
        examType,
        count: qCount,
        topic: selChapter, // pass chapter as topic
      });
      setQuestions(res.data.questions || []);
    } catch(e) {
      alert("Questions generate nahi hue. Try again!");
      setStep("chapter");
    } finally { setLoading(false); }
  }, [selSubject, selChapter, examType, user.id, qCount]);

  const submitQuiz = useCallback(() => {
    let correct = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correctAnswer) correct++;
    });
    const score = Math.round((correct / questions.length) * 100);
    const r = { correct, total: questions.length, score };
    setResult(r);

    // Save progress
    const key = `${selSubject}_${selClass}_${selChapter}`;
    const p = getProgress();
    const prev = p[key];
    p[key] = {
      score,
      attempts: (prev?.attempts || 0) + 1,
      best: Math.max(prev?.best || 0, score),
      lastDate: new Date().toISOString().slice(0,10)
    };
    saveProgress(p);
    setProgress(p);
  }, [questions, answers, selSubject, selClass, selChapter]);

  const getChapterProgress = (subject, cls, chapter) => {
    const key = `${subject}_${cls}_${chapter}`;
    return progress[key];
  };

  const getProgressColor = (score) => {
    if (!score && score !== 0) return "#475569";
    if (score >= 80) return "#10b981";
    if (score >= 60) return "#f59e0b";
    return "#ef4444";
  };

  // ── SUBJECT SELECT ──────────────────────────────────────────────────────────
  if (step === "subject") return (
    <div style={{ padding:"24px", overflowY:"auto", maxHeight:"100vh" }}>
      <h1 style={{ fontSize:"22px", fontWeight:900, marginBottom:"4px" }}>📖 NCERT Chapter Practice</h1>
      <p style={{ color:"var(--text-secondary)", fontSize:"13px", marginBottom:"24px" }}>
        Chapter-wise practice — concept clear karo, exam crack karo!
      </p>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:"12px" }}>
        {subjects.map(s => {
          const chapters = Object.values(NCERT_DATA[s] || {}).flat();
          const done = chapters.filter(c => progress[`${s}_Class 11_${c}`]?.best >= 60 || progress[`${s}_Class 12_${c}`]?.best >= 60).length;
          return (
            <button key={s} onClick={() => { setSubject(s); setStep("class"); }}
              style={{ padding:"20px 16px", borderRadius:"14px", border:"1px solid var(--border)",
                background:"var(--bg-card)", cursor:"pointer", textAlign:"left",
                fontFamily:"var(--font-main)", transition:"all 0.2s" }}
              onMouseOver={e => e.currentTarget.style.borderColor="var(--accent)"}
              onMouseOut={e => e.currentTarget.style.borderColor="var(--border)"}>
              <div style={{ fontSize:"28px", marginBottom:"8px" }}>
                {{"Physics":"⚡","Chemistry":"🧪","Mathematics":"📐","Biology":"🌿","History":"🏛️","Social Science":"🌍","General Knowledge":"📰"}[s] || "📚"}
              </div>
              <div style={{ fontWeight:800, fontSize:"14px", marginBottom:"4px" }}>{s}</div>
              <div style={{ fontSize:"11px", color:"var(--text-muted)" }}>{chapters.length} chapters</div>
              {done > 0 && (
                <div style={{ marginTop:"8px", fontSize:"10px", color:"#10b981", fontWeight:700 }}>
                  ✅ {done} completed
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  // ── CLASS SELECT ────────────────────────────────────────────────────────────
  if (step === "class") return (
    <div style={{ padding:"24px", overflowY:"auto", maxHeight:"100vh" }}>
      <button onClick={() => setStep("subject")} className="btn btn-secondary" style={{ marginBottom:"20px", fontSize:"13px" }}>
        ← Back
      </button>
      <h2 style={{ fontSize:"20px", fontWeight:900, marginBottom:"20px" }}>{selSubject} — Class Chuniye</h2>
      <div style={{ display:"flex", gap:"14px", flexWrap:"wrap" }}>
        {Object.keys(NCERT_DATA[selSubject] || {}).map(cls => {
          const chapters = NCERT_DATA[selSubject][cls];
          const done = chapters.filter(c => getChapterProgress(selSubject, cls, c)?.best >= 60).length;
          const pct = Math.round((done / chapters.length) * 100);
          return (
            <button key={cls} onClick={() => { setSelClass(cls); setStep("chapter"); }}
              style={{ padding:"24px", borderRadius:"14px", border:"1px solid var(--border)",
                background:"var(--bg-card)", cursor:"pointer", textAlign:"left",
                fontFamily:"var(--font-main)", minWidth:"160px", transition:"all 0.2s" }}
              onMouseOver={e => e.currentTarget.style.borderColor="var(--accent)"}
              onMouseOut={e => e.currentTarget.style.borderColor="var(--border)"}>
              <div style={{ fontSize:"32px", marginBottom:"10px" }}>📚</div>
              <div style={{ fontWeight:900, fontSize:"16px", marginBottom:"6px" }}>{cls}</div>
              <div style={{ fontSize:"12px", color:"var(--text-muted)", marginBottom:"8px" }}>{chapters.length} chapters</div>
              <div style={{ height:"6px", background:"var(--bg-secondary)", borderRadius:"3px", overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${pct}%`, background:"#10b981", borderRadius:"3px" }}/>
              </div>
              <div style={{ fontSize:"11px", color:"#10b981", marginTop:"4px", fontWeight:700 }}>{pct}% done</div>
            </button>
          );
        })}
      </div>
    </div>
  );

  // ── CHAPTER SELECT ──────────────────────────────────────────────────────────
  if (step === "chapter") {
    const chapters = NCERT_DATA[selSubject]?.[selClass] || [];
    return (
      <div style={{ padding:"24px", overflowY:"auto", maxHeight:"100vh" }}>
        <button onClick={() => setStep("class")} className="btn btn-secondary" style={{ marginBottom:"16px", fontSize:"13px" }}>
          ← Back
        </button>
        <h2 style={{ fontSize:"18px", fontWeight:900, marginBottom:"4px" }}>{selSubject} — {selClass}</h2>
        <p style={{ color:"var(--text-secondary)", fontSize:"13px", marginBottom:"16px" }}>
          Chapter chuniye aur practice karo!
        </p>

        {/* Questions count selector */}
        <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"16px",
          padding:"12px 16px", background:"var(--bg-card)", borderRadius:"10px", border:"1px solid var(--border)" }}>
          <span style={{ fontSize:"12px", fontWeight:700, color:"var(--text-muted)" }}>Questions:</span>
          {[5, 10, 15, 20].map(n => (
            <button key={n} onClick={() => setQCount(n)}
              style={{ padding:"4px 12px", borderRadius:"6px",
                border:`1px solid ${qCount===n?"var(--accent)":"var(--border)"}`,
                background:qCount===n?"var(--accent-glow)":"transparent",
                color:qCount===n?"var(--accent)":"var(--text-muted)",
                cursor:"pointer", fontSize:"12px", fontWeight:700, fontFamily:"var(--font-main)" }}>
              {n}
            </button>
          ))}
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
          {chapters.map((ch, i) => {
            const prog = getChapterProgress(selSubject, selClass, ch);
            const scoreColor = getProgressColor(prog?.best);
            return (
              <button key={i} onClick={() => { setChapter(ch); startQuiz(); }}
                style={{ padding:"14px 16px", borderRadius:"10px",
                  border:"1px solid var(--border)", background:"var(--bg-card)",
                  cursor:"pointer", textAlign:"left", fontFamily:"var(--font-main)",
                  display:"flex", alignItems:"center", gap:"14px", transition:"all 0.15s" }}
                onMouseOver={e => e.currentTarget.style.borderColor="var(--accent)"}
                onMouseOut={e => e.currentTarget.style.borderColor="var(--border)"}>
                <div style={{ width:"30px", height:"30px", borderRadius:"8px", flexShrink:0,
                  background:"var(--bg-secondary)", border:"1px solid var(--border)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:"12px", fontWeight:700, color:"var(--text-muted)" }}>
                  {i+1}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:"13px" }}>Ch {i+1}: {ch}</div>
                  {prog && (
                    <div style={{ fontSize:"11px", color:"var(--text-muted)", marginTop:"2px" }}>
                      {prog.attempts} attempts • Last: {prog.lastDate}
                    </div>
                  )}
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  {prog ? (
                    <div>
                      <div style={{ fontSize:"16px", fontWeight:900, color:scoreColor }}>{prog.best}%</div>
                      <div style={{ fontSize:"9px", color:"var(--text-muted)" }}>BEST</div>
                    </div>
                  ) : (
                    <div style={{ fontSize:"11px", color:"var(--text-muted)" }}>Not attempted</div>
                  )}
                </div>
                <div style={{ fontSize:"16px" }}>
                  {prog?.best >= 80 ? "✅" : prog?.best >= 60 ? "📈" : prog ? "🔄" : "▶️"}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── QUIZ SCREEN ─────────────────────────────────────────────────────────────
  if (step === "quiz") {
    if (loading) return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100vh", gap:"16px" }}>
        <div className="loader" style={{ width:"36px", height:"36px" }}/>
        <div style={{ fontSize:"16px", fontWeight:700 }}>Questions Generate Ho Rahe Hain...</div>
        <div style={{ fontSize:"13px", color:"var(--text-muted)" }}>Ch: {selChapter}</div>
      </div>
    );

    if (result) {
      const grade = result.score>=90?"🥇":result.score>=70?"🥈":result.score>=50?"🥉":"💪";
      const color = result.score>=70?"#10b981":result.score>=50?"#f59e0b":"#ef4444";
      return (
        <div style={{ padding:"24px", overflowY:"auto", maxHeight:"100vh" }}>
          <div className="card fade-in" style={{ textAlign:"center", padding:"32px", marginBottom:"20px",
            background:`${color}10`, borderColor:`${color}30` }}>
            <div style={{ fontSize:"56px", marginBottom:"8px" }}>{grade}</div>
            <div style={{ fontSize:"42px", fontWeight:900, color, marginBottom:"4px" }}>{result.score}%</div>
            <div style={{ fontSize:"14px", color:"var(--text-muted)", marginBottom:"8px" }}>
              {result.correct}/{result.total} correct
            </div>
            <div style={{ fontSize:"13px", color:"var(--text-secondary)" }}>
              Ch: {selChapter}
            </div>
          </div>

          {/* Answer review */}
          <div className="card" style={{ marginBottom:"16px" }}>
            <h3 style={{ fontSize:"14px", fontWeight:800, marginBottom:"12px" }}>📋 Review</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:"8px", maxHeight:"350px", overflowY:"auto" }}>
              {questions.map((q,i) => {
                const ua = answers[i];
                const ok = ua === q.correctAnswer;
                const skip = !ua;
                const c = skip?"#f59e0b":ok?"#10b981":"#ef4444";
                return (
                  <div key={i} style={{ padding:"10px 12px", borderRadius:"8px",
                    background:`${c}08`, border:`1px solid ${c}25` }}>
                    <div style={{ display:"flex", gap:"8px" }}>
                      <span style={{ fontWeight:800, color:c, fontSize:"11px" }}>Q{i+1}</span>
                      <span style={{ fontSize:"12px", color:"var(--text-secondary)", flex:1 }}>{q.question?.slice(0,80)}...</span>
                      <span style={{ fontSize:"11px", fontWeight:800, color:c }}>{skip?"⭕":ok?"✅":"❌"}</span>
                    </div>
                    {!ok && !skip && (
                      <div style={{ fontSize:"11px", color:"#10b981", marginTop:"4px" }}>
                        ✓ Correct: {q.correctAnswer}
                      </div>
                    )}
                    {q.explanation && (
                      <div style={{ fontSize:"10px", color:"var(--text-muted)", marginTop:"4px", fontStyle:"italic" }}>
                        💡 {q.explanation?.slice(0,100)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display:"flex", gap:"10px" }}>
            <button className="btn btn-primary" onClick={startQuiz} style={{ flex:1, justifyContent:"center" }}>
              🔄 Retry Chapter
            </button>
            <button className="btn btn-secondary" onClick={() => setStep("chapter")} style={{ flex:1, justifyContent:"center" }}>
              ← All Chapters
            </button>
          </div>
        </div>
      );
    }

    const q = questions[current];
    if (!q) return null;

    return (
      <div style={{ display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden" }}>
        {/* Header */}
        <div style={{ padding:"12px 20px", background:"var(--bg-secondary)", borderBottom:"1px solid var(--border)",
          display:"flex", alignItems:"center", gap:"12px", flexShrink:0 }}>
          <button onClick={() => setStep("chapter")} style={{ background:"none", border:"none", color:"var(--text-muted)", cursor:"pointer", fontSize:"18px" }}>✕</button>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:"12px", fontWeight:700, color:"var(--accent)" }}>{selSubject} — Ch {selChapter?.slice(0,30)}</div>
            <div style={{ fontSize:"11px", color:"var(--text-muted)" }}>Q {current+1} of {questions.length}</div>
          </div>
          {/* Progress bar */}
          <div style={{ width:"100px", height:"6px", background:"var(--bg-card)", borderRadius:"3px", overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${((current+1)/questions.length)*100}%`, background:"var(--accent)", borderRadius:"3px", transition:"width 0.3s" }}/>
          </div>
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:"20px" }}>
          {/* Question */}
          <div className="card" style={{ marginBottom:"16px" }}>
            <div style={{ display:"flex", gap:"8px", marginBottom:"8px" }}>
              {q.topic && <span style={{ fontSize:"10px", padding:"3px 8px", borderRadius:"20px", background:"var(--bg-secondary)", color:"var(--text-muted)", fontWeight:700 }}>{q.topic}</span>}
              {q.difficulty && <span style={{ fontSize:"10px", padding:"3px 8px", borderRadius:"20px",
                background:q.difficulty==="hard"?"rgba(239,68,68,0.1)":q.difficulty==="medium"?"rgba(245,158,11,0.1)":"rgba(16,185,129,0.1)",
                color:q.difficulty==="hard"?"#f87171":q.difficulty==="medium"?"#fbbf24":"#10b981", fontWeight:700 }}>
                {q.difficulty}
              </span>}
            </div>
            <p style={{ fontSize:"15px", lineHeight:"1.75", margin:0 }}>{q.question}</p>
          </div>

          {/* Options */}
          <div style={{ display:"flex", flexDirection:"column", gap:"10px", marginBottom:"20px" }}>
            {Object.entries(q.options || {}).map(([key, val]) => {
              const sel = answers[current] === val;
              return (
                <button key={key} onClick={() => setAnswers(p => ({...p,[current]:val}))}
                  style={{ padding:"14px 18px", borderRadius:"10px",
                    border:`1.5px solid ${sel?"var(--accent)":"var(--border)"}`,
                    background:sel?"var(--accent-glow)":"var(--bg-card)",
                    cursor:"pointer", textAlign:"left", fontSize:"14px",
                    color:sel?"var(--accent)":"var(--text-primary)",
                    fontFamily:"var(--font-main)", transition:"all 0.15s",
                    display:"flex", gap:"12px", alignItems:"center" }}>
                  <span style={{ width:"26px", height:"26px", borderRadius:"50%",
                    border:`1.5px solid ${sel?"var(--accent)":"var(--border)"}`,
                    background:sel?"var(--accent)":"transparent",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:"12px", fontWeight:900,
                    color:sel?"white":"var(--text-muted)", flexShrink:0 }}>{key}</span>
                  {val}
                </button>
              );
            })}
          </div>

          {/* Navigation */}
          <div style={{ display:"flex", gap:"10px" }}>
            <button className="btn btn-secondary" onClick={() => setCurrent(c=>Math.max(0,c-1))} disabled={current===0}>← Prev</button>
            <button className="btn btn-secondary" onClick={() => setAnswers(p=>{const n={...p};delete n[current];return n;})}>Clear</button>
            {current < questions.length-1
              ? <button className="btn btn-primary" onClick={() => setCurrent(c=>c+1)}>Next →</button>
              : <button className="btn btn-primary" onClick={submitQuiz} style={{ background:"#10b981" }}>✅ Submit</button>
            }
          </div>
        </div>
      </div>
    );
  }

  return null;
}
