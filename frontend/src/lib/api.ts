import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || "";
    const isAuthRoute = url.includes("/auth/login") || url.includes("/auth/register");
    if (err.response?.status === 401 && typeof window !== "undefined" && !isAuthRoute) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Auth ──
export const authApi = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
  register: (data: any) => api.post("/auth/register", data),
  me: () => api.get("/auth/me"),
};

// ── Customers ──
export const customersApi = {
  list: (params?: any) => api.get("/customers", { params }),
  get: (id: number) => api.get(`/customers/${id}`),
  create: (data: any) => api.post("/customers", data),
  update: (id: number, data: any) => api.put(`/customers/${id}`, data),
  delete: (id: number) => api.delete(`/customers/${id}`),
};

// ── Analysis ──
export const analysisApi = {
  runSingle: (customerId: number) =>
    api.post(`/analysis/customer/${customerId}/run`),
  runBulk: () => api.post("/analysis/bulk/run"),
  getScores: (customerId: number) => api.get(`/analysis/customer/${customerId}`),
  recommend: (customerId: number) =>
    api.post(`/analysis/customer/${customerId}/recommend`),
};

// ── Messages ──
export const messagesApi = {
  generate: (customerId: number, data: any) =>
    api.post(`/messages/customer/${customerId}/generate`, data),
  list: (customerId: number) => api.get(`/messages/customer/${customerId}`),
};

// ── Campaigns ──
export const campaignsApi = {
  list: (params?: any) => api.get("/campaigns", { params }),
  create: (data: any) => api.post("/campaigns", data),
  update: (id: number, data: any) => api.put(`/campaigns/${id}`, data),
  updateStatus: (id: number, status: string) =>
    api.post(`/campaigns/${id}/status?new_status=${status}`),
};

// ── Imports ──
export const importsApi = {
  upload: (file: File, importType: string = "customers") => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("import_type", importType);
    return api.post("/imports/upload", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  list: () => api.get("/imports"),
  get: (id: number) => api.get(`/imports/${id}`),
};

// ── Dashboard ──
export const dashboardApi = {
  stats: () => api.get("/dashboard/stats"),
  glExpiryByYear: () => api.get("/dashboard/gl-expiry-by-year"),
  opportunitiesByType: () => api.get("/dashboard/opportunities-by-type"),
  campaignFunnel: () => api.get("/dashboard/campaign-funnel"),
  topUrgent: (limit = 20) =>
    api.get("/dashboard/top-urgent-customers", { params: { limit } }),
  regionOpportunities: () => api.get("/dashboard/region-opportunities"),
};
