const Groq = require("groq-sdk");

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Best free model: llama-3.3-70b-versatile (high quality)
// Fast alternative: llama-3.1-8b-instant (more daily requests: 14,400/day)
const CHAT_MODEL = "llama-3.3-70b-versatile";
const TEST_MODEL = "llama-3.3-70b-versatile";

const EXAM_CONFIGS = {
  // ── School ──────────────────────────────────────────────────────────────────
  FOUNDATION:    { subjects:["Mathematics","Science","Social Science","Hindi","English","Sanskrit"], description:"Foundation (Class 6-8)", style:"Very simple language. Real-life examples. NCERT based. Fun learning." },
  CLASS_9:       { subjects:["Mathematics","Science","Social Science","Hindi","English","Sanskrit"], description:"Class 9 (CBSE/State Board)", style:"NCERT based. Simple explanations. Board exam focused." },
  CLASS_10:      { subjects:["Mathematics","Science","Social Science","Hindi","English","Sanskrit"], description:"Class 10 Board Exam", style:"NCERT based. Board exam pattern. Previous year questions. Important for marks." },
  CLASS_11_SCI:  { subjects:["Physics","Chemistry","Mathematics","Biology","English"], description:"Class 11 Science", style:"Conceptual clarity. NCERT + HC Verma/NCERT Exemplar. JEE/NEET foundation." },
  CLASS_11_COM:  { subjects:["Accountancy","Business Studies","Economics","Mathematics","English"], description:"Class 11 Commerce", style:"Practical examples. Business concepts. NCERT based. Board exam focused." },
  CLASS_11_ARTS: { subjects:["History","Geography","Political Science","Economics","Sociology","English"], description:"Class 11 Arts", style:"Analytical thinking. NCERT based. Current affairs connection." },
  CLASS_12_SCI:  { subjects:["Physics","Chemistry","Mathematics","Biology","English"], description:"Class 12 Science Board + JEE/NEET", style:"Board + entrance exam focus. NCERT mastery. Formula based. Previous year papers." },
  CLASS_12_COM:  { subjects:["Accountancy","Business Studies","Economics","Mathematics","English"], description:"Class 12 Commerce Board", style:"Practical business examples. Board exam focused. Case studies." },
  CLASS_12_ARTS: { subjects:["History","Geography","Political Science","Economics","Sociology","English"], description:"Class 12 Arts Board", style:"NCERT analysis. Map based geography. Source based history. Board pattern." },
  CLASS_1112_SCI:{ subjects:["Physics","Chemistry","Mathematics","Biology"], description:"Class 11+12 Science (Combined)", style:"Complete syllabus coverage. Conceptual + numerical. Board + JEE/NEET ready." },
  CLASS_1112_COM:{ subjects:["Accountancy","Business Studies","Economics","Mathematics"], description:"Class 11+12 Commerce (Combined)", style:"Complete commerce syllabus. Board exam focused. Practical examples." },

  // ── Engineering ──────────────────────────────────────────────────────────────
  JEE:      { subjects:["Physics","Chemistry","Mathematics"], description:"JEE Main & Advanced", style:"Conceptual depth + problem solving. NCERT + HC Verma + RD Sharma. Previous JEE papers. Shortcuts and tricks." },
  JEE_MAIN: { subjects:["Physics","Chemistry","Mathematics"], description:"JEE Main", style:"NCERT mastery. Speed and accuracy. MCQ focused. 3 hour exam strategy." },
  BITSAT:   { subjects:["Physics","Chemistry","Mathematics","English","Logical Reasoning"], description:"BITSAT", style:"Speed focused. 150 questions in 3 hours. NCERT + extra topics. Logical reasoning tips." },
  MHT_CET:  { subjects:["Physics","Chemistry","Mathematics","Biology"], description:"MHT-CET Maharashtra", style:"Maharashtra state board + NCERT. Previous MHT-CET papers. State-specific examples." },
  KCET:     { subjects:["Physics","Chemistry","Mathematics","Biology"], description:"KCET Karnataka", style:"Karnataka state board syllabus. PUC pattern. KCET previous papers." },
  WBJEE:    { subjects:["Physics","Chemistry","Mathematics"], description:"WBJEE West Bengal", style:"WB board + JEE level. State-specific patterns. Previous WBJEE papers." },

  // ── Medical ───────────────────────────────────────────────────────────────────
  NEET:     { subjects:["Physics","Chemistry","Biology"], description:"NEET UG Medical Entrance", style:"NCERT mastery essential. Biological diagrams. Mnemonics. Medical concepts. NEET previous papers." },
  NEET_PG:  { subjects:["Anatomy","Physiology","Biochemistry","Pharmacology","Pathology","Medicine","Surgery"], description:"NEET PG", style:"Clinical concepts. Case-based learning. High-yield topics. USMLE style MCQs." },
  AIIMS:    { subjects:["Medicine","Surgery","Obstetrics","Pediatrics","Psychiatry"], description:"AIIMS PG", style:"Advanced clinical reasoning. Recent guidelines. Evidence-based medicine." },

  // ── UPSC ──────────────────────────────────────────────────────────────────────
  UPSC:      { subjects:["History","Geography","Polity","Economy","Science & Technology","Environment","Current Affairs","Ethics"], description:"UPSC CSE (IAS/IPS/IFS)", style:"Analytical answers. Current events connection. Committees and reports. Both sides of issues. 150-200 word answers." },
  UPSC_PRE:  { subjects:["History","Geography","Polity","Economy","Environment","Current Affairs","Science & Technology"], description:"UPSC Prelims", style:"MCQ focused. Facts and dates. Quick revision. Previous year prelims questions. Elimination technique." },
  UPSC_MAINS:{ subjects:["GS1 (History/Society)","GS2 (Polity/IR)","GS3 (Economy/Environment)","GS4 (Ethics)","Essay"], description:"UPSC Mains", style:"Long answers 150-250 words. Intro-Body-Conclusion format. Examples and case studies. Diagrams where needed." },
  UPSC_CSAT: { subjects:["Reading Comprehension","Logical Reasoning","Quantitative Aptitude","Decision Making"], description:"UPSC CSAT Paper 2", style:"Speed and accuracy. Comprehension passages. Logical puzzles. Qualifying paper — 33% marks needed." },

  // ── State PCS ─────────────────────────────────────────────────────────────────
  UP_PCS:    { subjects:["History","Geography","Polity","Economy","UP Special","Current Affairs","Science","Hindi"], description:"UP PCS (UPPSC)", style:"UP-specific focus. UP geography, history, schemes. Hindi terminology. UPPSC previous papers." },
  MP_PCS:    { subjects:["History","Geography","Polity","Economy","MP Special","Current Affairs","Science","Hindi"], description:"MP PCS (MPPSC)", style:"MP-specific topics. Madhya Pradesh tribal issues, geography, schemes. Hindi medium friendly." },
  RAS:       { subjects:["History","Geography","Polity","Economy","Rajasthan Special","Current Affairs","Science","Hindi"], description:"Rajasthan RAS (RPSC)", style:"Rajasthan culture, Rajput history, desert geography. RPSC pattern. Hindi where appropriate." },
  BPSC:      { subjects:["History","Geography","Polity","Economy","Bihar Special","Current Affairs","Science","Hindi"], description:"Bihar BPSC", style:"Bihar history (Magadh, Maurya). Bihar geography and schemes. BPSC previous papers." },
  MPSC:      { subjects:["History","Geography","Polity","Economy","Maharashtra Special","Current Affairs","Science","Marathi"], description:"Maharashtra MPSC", style:"Maratha history. Maharashtra geography and schemes. Marathi terminology. MPSC pattern." },
  UKPSC:     { subjects:["History","Geography","Polity","Economy","Uttarakhand Special","Current Affairs","Science"], description:"Uttarakhand PCS", style:"UK geography (Himalayas). Uttarakhand culture, history, schemes. UKPSC pattern." },
  HPSC:      { subjects:["History","Geography","Polity","Economy","Haryana Special","Current Affairs","Science"], description:"Haryana PSC", style:"Haryana history, geography, culture. HPSC pattern. State-specific schemes." },
  PPSC:      { subjects:["History","Geography","Polity","Economy","Punjab Special","Current Affairs","Science"], description:"Punjab PSC", style:"Punjab history, Sikh history. Punjab geography and schemes. PPSC pattern." },
  JPSC:      { subjects:["History","Geography","Polity","Economy","Jharkhand Special","Current Affairs","Science"], description:"Jharkhand PSC", style:"Jharkhand tribal history, mineral geography. JPSC pattern. State schemes." },
  CGPSC:     { subjects:["History","Geography","Polity","Economy","CG Special","Current Affairs","Science"], description:"Chhattisgarh PSC", style:"CG tribal culture, Bastar, mineral resources. CGPSC pattern." },
  GPSC:      { subjects:["History","Geography","Polity","Economy","Gujarat Special","Current Affairs","Science"], description:"Gujarat PSC", style:"Gujarat history, trade, Gandhi heritage. GPSC pattern. Gujarati examples." },
  KPSC:      { subjects:["History","Geography","Polity","Economy","Karnataka Special","Current Affairs","Science","Kannada"], description:"Karnataka PSC", style:"Kannada culture, Vijayanagara history. KPSC pattern." },
  TNPSC:     { subjects:["History","Geography","Polity","Economy","Tamil Nadu Special","Current Affairs","Science","Tamil"], description:"Tamil Nadu PSC", style:"Tamil culture, Dravidian history. TNPSC Group 1/2/4 pattern." },
  APPSC:     { subjects:["History","Geography","Polity","Economy","AP Special","Current Affairs","Science","Telugu"], description:"Andhra Pradesh PSC", style:"Telugu culture, AP geography. APPSC pattern." },
  TSPSC:     { subjects:["History","Geography","Polity","Economy","Telangana Special","Current Affairs","Science","Telugu"], description:"Telangana PSC", style:"Telangana history (Hyderabad State), culture. TSPSC pattern." },
  WBPSC:     { subjects:["History","Geography","Polity","Economy","West Bengal Special","Current Affairs","Science","Bengali"], description:"West Bengal PSC", style:"Bengal Renaissance, partition history. WBPSC pattern. Bengali context." },
  OPSC:      { subjects:["History","Geography","Polity","Economy","Odisha Special","Current Affairs","Science","Odia"], description:"Odisha PSC", style:"Odisha tribal culture, Kalinga history. OPSC pattern." },
  RPSC:      { subjects:["General Knowledge","Reasoning","Mathematics","Hindi","English"], description:"RPSC 2nd Grade Teacher", style:"Teaching methodology + subject knowledge. RPSC 2nd grade pattern." },

  // ── SSC / Railway / Defence ───────────────────────────────────────────────────
  SSC_CGL:    { subjects:["General Intelligence","General Awareness","Quantitative Aptitude","English Language"], description:"SSC CGL", style:"Speed + accuracy. Shortcuts and tricks. Current affairs. Grammar rules. Tier 1 & 2 pattern." },
  SSC_CHSL:   { subjects:["General Intelligence","General Awareness","Quantitative Aptitude","English Language"], description:"SSC CHSL", style:"10+2 level. Basic concepts. SSC shortcuts. Tier 1 focused." },
  SSC_GD:     { subjects:["General Intelligence","General Knowledge","Mathematics","Hindi/English"], description:"SSC GD Constable", style:"Basic level. Simple language. Physical fitness awareness. SSC GD pattern." },
  SSC_MTS:    { subjects:["General Intelligence","General Awareness","Quantitative Aptitude","English Language"], description:"SSC MTS", style:"Matriculate level. Very basic concepts. Simple shortcuts." },
  SSC_CPO:    { subjects:["General Intelligence","General Knowledge","Quantitative Aptitude","English","Computer"], description:"SSC CPO (SI Police)", style:"Police-related topics. Current affairs. SSC CPO pattern." },
  RRB_NTPC:   { subjects:["Mathematics","General Intelligence","General Awareness","English"], description:"RRB NTPC Railway", style:"Railway-specific GK. Speed maths. CBT 1 & 2 pattern. Previous RRB papers." },
  RRB_GROUP_D:{ subjects:["Mathematics","General Intelligence","General Awareness","Science"], description:"RRB Group D", style:"10th level. Basic science and maths. Railway GK. Simple shortcuts." },
  RRB_JE:     { subjects:["Mathematics","General Intelligence","General Awareness","Technical Ability","Physics","Chemistry"], description:"RRB Junior Engineer", style:"Technical engineering concepts. Railway engineering. CBT pattern." },
  NDA:        { subjects:["Mathematics","English","Physics","Chemistry","Biology","History","Geography","Current Affairs"], description:"NDA (National Defence Academy)", style:"Class 11-12 level. Military context. GAT + Maths pattern. Speed and accuracy." },
  CDS:        { subjects:["English","General Knowledge","Mathematics"], description:"CDS (Combined Defence Services)", style:"Graduate level. Military GK. English comprehension. OTA/IMA/INA/AFA pattern." },
  CAPF:       { subjects:["General Ability","General Studies","Essay"], description:"CAPF AC (BSF/CRPF/CISF/SSB/ITBP)", style:"Police and paramilitary context. Current affairs. Essay writing. Descriptive paper." },
  AFCAT:      { subjects:["Verbal Ability","Numerical Ability","Reasoning","Military Aptitude","General Awareness"], description:"AFCAT Air Force", style:"Air Force context. Aviation GK. Military history. AFCAT pattern." },

  // ── Banking ───────────────────────────────────────────────────────────────────
  IBPS_PO:    { subjects:["Reasoning","Quantitative Aptitude","English","General Awareness","Computer"], description:"IBPS PO Bank", style:"Banking awareness. Mains + Prelims pattern. Current financial news. Speed maths." },
  IBPS_CLERK: { subjects:["Reasoning","Quantitative Aptitude","English","General Awareness","Computer"], description:"IBPS Clerk", style:"Basic banking concepts. Speed and accuracy. Prelims focused. Simple language." },
  SBI_PO:     { subjects:["Reasoning","Quantitative Aptitude","English","General Awareness","Data Analysis"], description:"SBI PO", style:"SBI specific pattern. Data interpretation. Group discussion + interview tips." },
  SBI_CLERK:  { subjects:["Reasoning","Quantitative Aptitude","English","General Awareness"], description:"SBI Clerk", style:"SBI clerk pattern. Basic banking. Speed focused. Prelims + Mains." },
  RBI_GRADE_B:{ subjects:["Economic & Social Issues","Finance & Management","English","Reasoning"], description:"RBI Grade B Officer", style:"Monetary policy. RBI functions. Economic analysis. High-level current affairs." },
  LIC_AAO:    { subjects:["Reasoning","Quantitative Aptitude","English","General Knowledge","Insurance"], description:"LIC AAO/ADO", style:"Insurance concepts. LIC schemes. Data interpretation. English comprehension." },
  NABARD:     { subjects:["Economic & Social Development","Agriculture","Rural Development","English","Reasoning"], description:"NABARD Grade A/B", style:"Agriculture finance. Rural development. NABARD schemes. Development economics." },

  // ── Law & Others ──────────────────────────────────────────────────────────────
  CLAT:       { subjects:["English Language","Current Affairs","Legal Reasoning","Logical Reasoning","Quantitative Techniques"], description:"CLAT Law Entrance", style:"Legal aptitude. Reading comprehension. Current legal affairs. CLAT pattern." },
  AILET:      { subjects:["English","General Knowledge","Legal Aptitude","Reasoning","Mathematics"], description:"AILET NLU Delhi", style:"NLU Delhi focused. Legal reasoning. High-level comprehension. Previous AILET papers." },
  CAT:        { subjects:["Verbal Ability","Data Interpretation","Logical Reasoning","Quantitative Aptitude"], description:"CAT MBA Entrance", style:"IIM level. 100 percentile strategies. DILR tricks. Speed reading. CAT pattern." },
  CUET:       { subjects:["Domain Subjects","Language","General Test"], description:"CUET UG Entrance", style:"Class 12 level. University-specific sections. NTA pattern. Speed and accuracy." },
  NTA_UGC:    { subjects:["Paper 1 (Teaching Aptitude)","Paper 2 (Subject)"], description:"UGC NET/JRF", style:"Teaching aptitude. Research methodology. Subject mastery. NET/JRF pattern." },
  GATE:       { subjects:["Engineering Mathematics","General Aptitude","Core Engineering Subject"], description:"GATE Engineering", style:"Graduate engineering level. Conceptual depth. GATE previous papers. 2 mark questions." },
};

function buildSystemPrompt(examType, subject, weakTopics = [], uploadedContext = "") {
  const config = EXAM_CONFIGS[examType] || EXAM_CONFIGS.JEE;
  const weakTopicsStr = weakTopics.length > 0
    ? `\n\nStudent's weak topics (give extra attention): ${weakTopics.map(t => t.topic).join(", ")}`
    : "";

  // Determine explanation level based on exam type (class level)
  const classExplainLevel = {
    "FOUNDATION": "5th class student", "CLASS_6": "6th class student",
    "CLASS_7": "7th class student",    "CLASS_8": "8th class student",
    "CLASS_9": "9th class student",    "CLASS_10": "10th class student",
    "CLASS_11_SCI": "11th class student", "CLASS_12_SCI": "12th class student",
    "JEE": "JEE aspirant", "NEET": "NEET aspirant",
    "UPSC": "UPSC aspirant", "SSC_CGL": "SSC student",
  };
  const studentLevel = classExplainLevel[examType] || "student";
  const isYoungStudent = ["FOUNDATION","CLASS_6","CLASS_7","CLASS_8","CLASS_9"].includes(examType);

  const explainStyle = isYoungStudent
    ? `IMPORTANT: Explain like you are talking to a ${studentLevel}. Use:
- Very simple Hindi/English words (no difficult terms)
- Real-life Indian examples (cricket, dosa, mangoes, school)
- Short sentences
- Fun analogies
- If a formula: explain what each letter means
- Use emojis to make it fun 🎯`
    : `Explain clearly for a ${studentLevel}.`;

  const contextStr = uploadedContext
    ? `\n\n📚 UPLOADED BOOK CONTENT — USE THIS AS PRIMARY SOURCE:\n${uploadedContext}\n\nCRITICAL RULES:
1. Answer DIRECTLY from the uploaded content above
2. ${explainStyle}
3. Mention which chapter/section the answer is from
4. If image/diagram is mentioned in the content, describe it clearly
5. Give exam probability if you can judge from content`
    : `\n\n${explainStyle}`;

  return `You are ExamGuru AI — India's best AI tutor for ${config.description}.

Current Subject: ${subject} | Exam: ${examType}

CRITICAL RULES:
1. Check if the student's question is related to "${subject}"
2. If YES — answer it fully and accurately
3. If NO — politely redirect to correct subject
4. Answer ONLY the LAST user message
5. If uploaded material is provided above — USE IT as primary source
6. Be 100% accurate — no guessing, temperature 0.1
7. Always mention exam probability if you know the topic

FORMAT (only if question is on-topic):
💡 Simple mein: [1-2 line direct answer]
→ [Key point 1]
→ [Key point 2]
→ [Key point 3]
🌍 Example: [Indian real-life example]
🎯 ${examType} Tip: [exam important point]
📊 Exam Probability: [High/Medium/Low — and why]${weakTopicsStr}${contextStr}`;
}

async function getChatResponse(messages, examType, subject, weakTopics = [], uploadedContext = "") {
  const systemPrompt = buildSystemPrompt(examType, subject, weakTopics, uploadedContext);

  const response = await client.chat.completions.create({
    model: CHAT_MODEL,
    max_tokens: 1500,
    temperature: 0.1,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content }))
    ]
  });

  return response.choices[0].message.content;
}

async function generateMockTest(examType, subject, numQuestions = 10, difficulty = "mixed") {
  const systemPrompt = `You are an expert MCQ question generator for ${examType} exam.
Generate EXACTLY ${numQuestions} questions for subject: ${subject}.

STRICT JSON FORMAT - output ONLY this, nothing else:
{"questions":[{"id":1,"question":"full question text here","options":{"A":"option text","B":"option text","C":"option text","D":"option text"},"correctAnswer":"A","explanation":"brief explanation","topic":"topic name","difficulty":"medium"}]}

Rules:
- correctAnswer must be exactly "A", "B", "C", or "D"
- All 4 options must be present
- No markdown, no backticks, no extra text before or after JSON
- Questions must be relevant to ${subject} for ${examType} exam`;

  const response = await client.chat.completions.create({
    model: "llama-3.1-8b-instant", // faster + more reliable JSON
    max_tokens: 4000,
    temperature: 0.1,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Generate ${numQuestions} MCQ for ${subject} (${examType}). JSON only:` }
    ]
  });

  let text = response.choices[0].message.content.trim();
  
  // Strip markdown code blocks
  text = text.replace(/^```json\s*/gi, "").replace(/^```\s*/gi, "").replace(/\s*```$/gi, "").trim();
  
  // Extract JSON object
  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}");
  if (jsonStart !== -1 && jsonEnd !== -1) {
    text = text.slice(jsonStart, jsonEnd + 1);
  }

  // Parse with error recovery
  try {
    const parsed = JSON.parse(text);
    // Normalize: support both 'correct' and 'correctAnswer' fields
    if (parsed.questions) {
      parsed.questions = parsed.questions.map((q, i) => ({
        ...q,
        id: i + 1,
        correctAnswer: q.correctAnswer || q.correct || "A",
        options: q.options || { A: "Option A", B: "Option B", C: "Option C", D: "Option D" }
      }));
    }
    return parsed;
  } catch(e) {
    console.error("JSON parse error, trying repair...", e.message);
    // Try to fix common JSON issues
    const repaired = text
      .replace(/,\s*}/g, "}") // trailing commas
      .replace(/,\s*]/g, "]")
      .replace(/([{,]\s*)(\w+):/g, '$1"$2":'); // unquoted keys
    return JSON.parse(repaired);
  }
}

async function identifyWeakTopics(wrongAnswers) {
  if (!wrongAnswers || wrongAnswers.length === 0) return [];

  const response = await client.chat.completions.create({
    model: "llama-3.1-8b-instant",
    max_tokens: 300,
    temperature: 0.1,
    messages: [
      { role: "system", content: `Analyze wrong answers and return ONLY JSON: {"weak_topics":["topic1","topic2"]}` },
      { role: "user", content: `Wrong answers: ${JSON.stringify(wrongAnswers)}` }
    ]
  });

  let text = response.choices[0].message.content.trim().replace(/```json|```/g, "").trim();
  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}");
  if (jsonStart !== -1 && jsonEnd !== -1) text = text.slice(jsonStart, jsonEnd + 1);
  try { return JSON.parse(text).weak_topics || []; } catch { return []; }
}


// ─── DYNAMIC SVG DIAGRAM GENERATOR ──────────────────────────────────────────
async function generateSVGDiagramWithGemini(concept, subject) {
  try {
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });

    const prompt = `Create a detailed educational SVG diagram for "${concept}" (${subject} student).

REQUIREMENTS:
- Output ONLY SVG code starting with <svg viewBox="0 0 600 420" xmlns="http://www.w3.org/2000/svg">
- Dark background: <rect width="600" height="420" fill="#0a1628" rx="14"/>
- Draw realistic cross-section/structure (not just circles)
- Label all parts with lines using <line> + <text>
- Include title, 8-12 labels minimum
- Colors: greens for biological walls, blues for membranes, purples for nucleus
- All text in light colors (#e2e8f0) on dark background
- NO JavaScript, NO external images
Output ONLY the SVG. Nothing else.`;

    const result = await model.generateContent(prompt);
    let svg = result.response.text().trim();
    svg = svg.replace(/```svg/gi,"").replace(/```xml/gi,"").replace(/```/g,"").trim();
    const match = svg.match(/<svg[\s\S]*<\/svg>/i);
    if (match) svg = match[0];
    if (svg.startsWith('<svg')) return svg;
    return null;
  } catch (e) {
    console.warn("Gemini diagram failed:", e.message);
    return null;
  }
}

async function generateSVGDiagram(concept, subject) {
  // Try Gemini first
  if (process.env.GEMINI_API_KEY) {
    const geminiSvg = await generateSVGDiagramWithGemini(concept, subject);
    if (geminiSvg) return geminiSvg;
  }
  // Fallback to Groq
  const prompt = `You are a world-class scientific illustration expert creating NCERT-level textbook diagrams in SVG format.

Create a HIGHLY DETAILED, ACCURATE diagram of: "${concept}" for ${subject} students.

MANDATORY SVG REQUIREMENTS:
1. Start EXACTLY with: <svg viewBox="0 0 600 420" xmlns="http://www.w3.org/2000/svg">
2. End EXACTLY with: </svg>
3. First element: <rect width="600" height="420" fill="#0a1628" rx="14"/>
4. Add <defs> with arrow marker:
   <defs><marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#94a3b8"/></marker></defs>

DIAGRAM QUALITY RULES (CRITICAL):
- Draw the actual biological/physical structure with REALISTIC shapes, not just circles
- Use gradients and fills to show 3D effect (lighter center, darker edges)
- Draw CROSS-SECTION or LONGITUDINAL SECTION view (like NCERT diagrams)
- Show INTERNAL structure with multiple layers/compartments
- Each part must be a DISTINCT shape with DIFFERENT color
- Use semi-transparent fills so inner parts show through
- Outer structures: detailed border/wall (2-3px stroke, textured)
- Label EVERY important part (minimum 8-12 labels for complex diagrams)
- Labels: white/light text, connected with thin lines (stroke="#475569") to exact part
- Label lines must use markerEnd="url(#arr)"
- Title at top: fontSize="16" fontWeight="bold" fill="#e2e8f0"
- Sub-labels/descriptions in fontSize="9" fill="#94a3b8"
- Show process arrows if applicable (cell division stages, flow directions)
- Scientific names in italic where needed

COLOR SCHEME (dark theme):
- Background: #0a1628
- Outer wall/membrane: stroke="#10b981" fill="rgba(16,185,129,0.15)"  
- Inner structures: various semi-transparent blues, purples, oranges
- Nucleus/core: fill="rgba(99,102,241,0.4)" stroke="#8b5cf6"
- Cytoplasm: fill="rgba(59,130,246,0.08)"
- Labels: fill="#e2e8f0" fontSize="11"
- Dimension lines: stroke="#475569" strokeWidth="0.5"

FOR "${concept}" SPECIFICALLY:
- If it's a CELL/GRAIN/ORGAN: Draw detailed cross-section with all layers visible
- If it's a PROCESS: Show step-by-step stages from left to right
- If it's a SYSTEM: Show all organs connected with flow arrows
- If it's a STRUCTURE: Show labeled parts with callout lines

OUTPUT: ONLY the SVG code. No markdown, no explanation. Just <svg>...</svg>.`;

  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 4000,
    temperature: 0.1,
    messages: [
      { role: "system", content: "You are an expert SVG diagram creator. Output ONLY valid SVG code. No markdown. No explanation. Start with <svg and end with </svg>." },
      { role: "user", content: prompt }
    ]
  });
  
  let svg = response.choices[0].message.content.trim();
  // Remove markdown if present
  svg = svg.replace(/```svg/gi, "").replace(/```xml/gi, "").replace(/```/g, "").trim();
  // Extract SVG if wrapped
  const match = svg.match(/<svg[\s\S]*<\/svg>/i);
  if (match) svg = match[0];
  
  // Validate it's SVG
  if (!svg.startsWith('<svg')) return null;
  return svg;
}


// ─── THINK LIKE EXAMINER MODE ────────────────────────────────────────────────
async function getExaminerThinking(question, subject, examType) {
  const config = EXAM_CONFIGS[examType] || EXAM_CONFIGS.JEE;
  const response = await client.chat.completions.create({
    model: CHAT_MODEL, max_tokens: 800, temperature: 0.1,
    messages: [{
      role: "system",
      content: `You are an expert ${examType} examiner who has set papers for 20 years.
Explain how examiners THINK when setting questions and what TRAPS they set.
Always cover: Common mistakes students make, Tricky parts, What examiners want to see.
Use Hinglish. Be concise.`
    }, {
      role: "user",
      content: `${subject} topic: "${question}"
1. Is topic mein examiner kya trap dalte hain?
2. Students kahan galti karte hain?
3. Perfect answer mein kya hona chahiye?
4. Last 5 saal mein kaise poochha gaya?`
    }]
  });
  return response.choices[0].message.content;
}

// ─── WHY AM I STUDYING THIS ──────────────────────────────────────────────────
async function getWhyStudyThis(topic, subject, examType) {
  const response = await client.chat.completions.create({
    model: CHAT_MODEL, max_tokens: 600, temperature: 0.1,
    messages: [{
      role: "system",
      content: `You are a motivating teacher. Explain WHY a topic is important in real life AND in exam.
Keep it short, motivating, and relatable for Indian students. Use Hinglish.`
    }, {
      role: "user",
      content: `"${topic}" (${subject}, ${examType}) — Student pooch raha hai "Yeh kyun padhna hai?"
Batao: 1. Real life mein kab kaam aata hai, 2. ${examType} exam mein importance, 3. Career connection, 4. Ek motivating line`
    }]
  });
  return response.choices[0].message.content;
}

// ─── MULTI-TEACHER STYLE ─────────────────────────────────────────────────────
async function getMultiTeacherExplanation(question, subject, examType, teacherStyle) {
  const styles = {
    strict: `You are a strict traditional Indian teacher. Use formal Hindi/English. Give structured answer with numbered points. No casual talk.`,
    friendly: `You are a friendly college senior. Speak like a friend in Hinglish. Use emojis occasionally. Make it fun and relatable.`,
    storyteller: `You are a storytelling teacher. Explain everything as a story with characters. Use "Socho ek baar..." style. Very visual.`,
    coach: `You are an exam coaching expert like Unacademy/BYJU's teacher. Focus on marks, tricks, shortcuts. Very exam-oriented.`,
    simple: `You are a primary school teacher explaining to a 5th standard student. Use very simple words. Give everyday examples.`
  };
  const response = await client.chat.completions.create({
    model: CHAT_MODEL, max_tokens: 800, temperature: 0.1,
    messages: [{ role: "system", content: styles[teacherStyle] || styles.friendly },
    { role: "user", content: `Explain: ${question} (${subject}, ${examType})` }]
  });
  return response.choices[0].message.content;
}

async function detectConfusion(message) {
  const confusionKeywords = [
    "nahi samjha", "samajh nahi", "confuse", "confused", "clear nahi",
    "fir se", "dobara", "kya matlab", "phir batao", "nahi pata",
    "pata nahi", "kuch nahi samjha", "ekdum nahi", "bilkul nahi",
    "what", "how", "why", "explain again", "not clear", "dont understand",
    "समझ नहीं", "फिर से", "दोबारा"
  ];
  const msg = message.toLowerCase();
  return confusionKeywords.some(k => msg.includes(k));
}

async function getReExplanation(originalQuestion, subject, examType, style) {
  const styles = {
    story: "Explain using a fun story or analogy. Make it like a Bollywood movie scene.",
    visual: "Explain using visual description. Say 'Socho ek picture mein...' and describe what student should imagine.",
    simple: "Explain in the simplest possible way. Use only basic words. Like explaining to a 5 year old.",
    example: "Give 3 real-life Indian examples. Cricket, chai, roti, mobile phone, market etc.",
    steps: "Break down into numbered micro-steps. Each step should be one simple action."
  };

  const useStyle = styles[style] || styles.simple;

  const response = await client.chat.completions.create({
    model: CHAT_MODEL,
    max_tokens: 1000,
    temperature: 0.1,
    messages: [{
      role: "system",
      content: `You are a patient Indian tutor for ${examType} ${subject}. ${useStyle} Always end with "Ab samajh aaya? 😊"`
    }, {
      role: "user",
      content: `Re-explain this in a completely different way: ${originalQuestion}`
    }]
  });
  return response.choices[0].message.content;
}

module.exports = { getChatResponse, generateMockTest, identifyWeakTopics, detectConfusion, getReExplanation, getExaminerThinking, getWhyStudyThis, getMultiTeacherExplanation, generateSVGDiagram, EXAM_CONFIGS };
