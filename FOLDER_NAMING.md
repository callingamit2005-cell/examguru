# ExamGuru AI — Folder Naming Convention
## Format: `[EXAM_CODE]_[SUBJECT_CODE]_[TYPE]`

---

## 📐 Rule: 3 parts, underscore se join karo

```
{EXAM_CODE} _ {SUBJECT_CODE} _ {CONTENT_TYPE}
```

---

## 🎓 EXAM CODES

| Code      | Full Name              |
|-----------|------------------------|
| CL6       | Class 6                |
| CL7       | Class 7                |
| CL8       | Class 8                |
| CL9       | Class 9                |
| CL10      | Class 10               |
| CL11S     | Class 11 Science       |
| CL11C     | Class 11 Commerce      |
| CL11A     | Class 11 Arts          |
| CL12S     | Class 12 Science       |
| CL12C     | Class 12 Commerce      |
| JEE       | JEE Main & Advanced    |
| NEET      | NEET UG                |
| UPSC      | UPSC CSE               |
| UPPCS     | UP PCS                 |
| SSCGL     | SSC CGL                |
| IBPSPO    | IBPS PO                |
| NDA       | NDA                    |

---

## 📚 SUBJECT CODES

| Code  | Subject              |
|-------|----------------------|
| MTH   | Mathematics          |
| PHY   | Physics              |
| CHM   | Chemistry            |
| BIO   | Biology              |
| SCI   | Science (General)    |
| HIS   | History              |
| GEO   | Geography            |
| POL   | Polity               |
| ECO   | Economy              |
| ENV   | Environment          |
| CA    | Current Affairs      |
| ETH   | Ethics               |
| GI    | General Intelligence |
| QA    | Quantitative Aptitude|
| ENG   | English              |
| HIN   | Hindi                |
| SST   | Social Science       |
| BNK   | Banking Awareness    |

---

## 📄 CONTENT TYPE CODES

| Code  | Type                    |
|-------|-------------------------|
| NCT   | NCERT Textbook          |
| PYQ   | Previous Year Questions |
| NTS   | Notes / Summary         |
| FRM   | Formulas / Tricks       |
| MCQ   | MCQ Practice Set        |
| SOL   | Solutions               |
| MOD   | Model Paper             |

---

## ✅ EXAMPLES

```
CL6_MTH_NCT     → Class 6 Mathematics NCERT
CL9_SCI_NCT     → Class 9 Science NCERT  
CL10_MTH_PYQ    → Class 10 Maths Previous Year
CL10_SST_NCT    → Class 10 Social Science NCERT
CL12S_PHY_NCT   → Class 12 Science Physics NCERT
CL12S_PHY_PYQ   → Class 12 Physics Previous Year
JEE_MTH_NTS     → JEE Mathematics Notes
JEE_PHY_PYQ     → JEE Physics Previous Year
NEET_BIO_NCT    → NEET Biology NCERT
NEET_BIO_PYQ    → NEET Biology Previous Year
UPSC_HIS_NTS    → UPSC History Notes
UPSC_POL_PYQ    → UPSC Polity Previous Year
UPPCS_GEO_NTS   → UP PCS Geography Notes
SSCGL_GI_MCQ    → SSC CGL Reasoning MCQs
IBPSPO_BNK_NTS  → IBPS PO Banking Notes
```

---

## 🔍 Search Logic

Student: Class 9, Science sawaal
→ System checks folder: `CL9_SCI_NCT`
→ Agar nahi mila → `CL9_SCI_NTS`
→ Agar nahi mila → `CL9_SCI_*` (sabhi CL9 Science)

---

## 📝 Quick Reference Card

```
Class 6  Maths NCERT    → CL6_MTH_NCT
Class 10 Science NCERT  → CL10_SCI_NCT
Class 10 SST NCERT      → CL10_SST_NCT  
JEE Physics PYQ         → JEE_PHY_PYQ
NEET Biology NCERT      → NEET_BIO_NCT
UPSC History Notes      → UPSC_HIS_NTS
SSC Reasoning MCQ       → SSCGL_GI_MCQ
```
