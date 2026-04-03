import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "https://examguru-tfcf.onrender.com/api";

const API = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
  headers: { "Content-Type": "application/json" }
});

API.interceptors.response.use(
  res => res,
  err => {
    const message = err.response?.data?.error || err.message || "Something went wrong";
    return Promise.reject(new Error(message));
  }
);

// ─── CLIENT-SIDE CACHE (60 second TTL) ────────────────────────────────────────
const _cache = new Map();
const CACHE_TTL = 60000;

function cachedGet(path) {
  const hit = _cache.get(path);
  if (hit && Date.now() - hit.ts < CACHE_TTL) {
    return Promise.resolve({ data: hit.data });
  }
  return API.get(path).then(res => {
    _cache.set(path, { data: res.data, ts: Date.now() });
    return res;
  });
}

export function clearCache(pattern) {
  for (const k of _cache.keys()) {
    if (!pattern || k.includes(pattern)) _cache.delete(k);
  }
}

// ─── APIs ──────────────────────────────────────────────────────────────────────
export const userAPI = {
  register:   (data) => API.post("/user/register", data),
  getProfile: (id)   => cachedGet(`/user/profile/${id}`),
  getSubjects:(code) => cachedGet(`/user/subjects/${code}`),
};

export const chatAPI = {
  sendMessage: (data) => API.post("/chat/message", data),
  reExplain:   (data) => API.post("/chat/reexplain", data),
  examiner:    (data) => API.post("/chat/examiner", data),
  whyStudy:    (data) => API.post("/chat/whystudy", data),
  teacherStyle:(data) => API.post("/chat/teacherstyle", data),
  getHistory:  (sid)  => API.get(`/chat/history/${sid}`),
  getSessions: (uid)  => API.get(`/chat/sessions/${uid}`),
};

export const testAPI = {
  generate:   (data) => API.post("/test/generate", data),
  submit:     (data) => API.post("/test/submit", data),
  getHistory: (uid)  => cachedGet(`/test/history/${uid}`),
};

export const analyticsAPI = {
  getDashboard: (uid) => cachedGet(`/analytics/dashboard/${uid}`),
};

// Helper to get admin email
const getAdminEmail = () => {
  try { return JSON.parse(localStorage.getItem("examguru_user") || "{}").email || ""; }
  catch { return ""; }
};

export const adminAPI = {
  getStats:    () => { const e = getAdminEmail(); return API.get(`/admin/stats?adminEmail=${encodeURIComponent(e)}`); },
  getStudents: () => { const e = getAdminEmail(); return API.get(`/admin/students?adminEmail=${encodeURIComponent(e)}`); },
  getCourses:  () => cachedGet("/admin/courses"),
  enroll:      (adminEmail, data) => { const e = adminEmail || getAdminEmail(); return API.post(`/admin/enroll?adminEmail=${encodeURIComponent(e)}`, { ...data, adminEmail: e }); },
  unenroll:    (adminEmail, data) => { const e = adminEmail || getAdminEmail(); return API.post(`/admin/unenroll?adminEmail=${encodeURIComponent(e)}`, { ...data, adminEmail: e }); },
  makeAdmin:   (email, secretKey) => API.post("/admin/make-admin", { email, secretKey }),
};

export default API;
