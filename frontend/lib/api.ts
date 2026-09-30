import axios from "axios";
import type {
  Class,
  Module,
  Lesson,
  TrackingTableRow,
  DashboardStats,
  ModuleStats,
  ImportResult,
  NoteStatus,
  Team,
  NoteApplication,
  ApplicationStatus,
  PublicNoteItem,
} from "@/types";

// Relative `/api` by default so browser requests go to the current host (ndtt.suhay.xyz/api/...)
// without baking any hardcoded localhost or domain into client-side JS bundles.
const rawBase = (process.env.NEXT_PUBLIC_API_URL || "").trim().replace(/\/+$/, "");
const API_BASE = rawBase ? `${rawBase}/api` : "/api";

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// Oturum token'ını her istek başlığına ekle
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("ndtt_admin_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// 401 hatası gelirse korumalı sayfalardan login'e yönlendir
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && error.response?.status === 401) {
      const pathname = window.location.pathname;
      const isPublic = pathname.startsWith("/apply") || pathname === "/login";
      if (!isPublic) {
        localStorage.removeItem("ndtt_admin_token");
        window.location.href = `/login?from=${encodeURIComponent(pathname)}`;
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (password: string, username = "admin") =>
    api
      .post<{ access_token: string; token_type: string; expires_in: number }>("/auth/login", {
        username,
        password,
      })
      .then((r) => r.data),
  getMe: () =>
    api.get<{ username: string; role: string }>("/auth/me").then((r) => r.data),
};

// ─── Classes ─────────────────────────────────────────────────────────────────
export const classesApi = {
  list: () => api.get<Class[]>("/classes").then((r) => r.data),
  get: (id: string) => api.get<Class>(`/classes/${id}`).then((r) => r.data),
  create: (data: { name: string; description?: string }) =>
    api.post<Class>("/classes", data).then((r) => r.data),
  update: (id: string, data: { name?: string; description?: string }) =>
    api.put<Class>(`/classes/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/classes/${id}`),
};

// ─── Modules ──────────────────────────────────────────────────────────────────
export const modulesApi = {
  list: (classId: string) =>
    api.get<Module[]>(`/classes/${classId}/modules`).then((r) => r.data),
  get: (id: string) => api.get<Module>(`/modules/${id}`).then((r) => r.data),
  create: (classId: string, data: { name: string; description?: string; order?: number }) =>
    api.post<Module>(`/classes/${classId}/modules`, data).then((r) => r.data),
  update: (id: string, data: { name?: string; description?: string; order?: number }) =>
    api.put<Module>(`/modules/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/modules/${id}`),
};

// ─── Lessons ──────────────────────────────────────────────────────────────────
export const lessonsApi = {
  list: (moduleId: string) =>
    api.get<Lesson[]>(`/modules/${moduleId}/lessons`).then((r) => r.data),
  create: (
    moduleId: string,
    data: {
      subject_name: string;
      order_label?: string | null;
      topic?: string | null;
      lesson_date?: string | null;
      assigned_team?: string | null;
      audio_status?: string | null;
    }
  ) => api.post<Lesson>(`/modules/${moduleId}/lessons`, data).then((r) => r.data),
  update: (
    lessonId: string,
    data: {
      subject_name?: string;
      order_label?: string | null;
      topic?: string | null;
      lesson_date?: string | null;
      assigned_team?: string | null;
      audio_status?: string | null;
    }
  ) => api.put<Lesson>(`/lessons/${lessonId}`, data).then((r) => r.data),
  delete: (lessonId: string) => api.delete(`/lessons/${lessonId}`),
};

// ─── Tracking ─────────────────────────────────────────────────────────────────
export const trackingApi = {
  getModuleTracking: (moduleId: string) =>
    api.get<TrackingTableRow[]>(`/modules/${moduleId}/tracking`).then((r) => r.data),
  getRecent: (days = 10, moduleId?: string) => {
    const url = moduleId
      ? `/tracking/recent?days=${days}&module_id=${moduleId}`
      : `/tracking/recent?days=${days}`;
    return api.get<TrackingTableRow[]>(url).then((r) => r.data);
  },
  updateStatus: (trackingId: string, status: NoteStatus, changedBy?: string) =>
    api
      .put<TrackingTableRow>(`/tracking/${trackingId}/status`, {
        status,
        changed_by: changedBy,
      })
      .then((r) => r.data),
  getHistory: (trackingId: string) =>
    api.get(`/tracking/${trackingId}/history`).then((r) => r.data),
};

// ─── Teams ────────────────────────────────────────────────────────────────────
export const teamsApi = {
  list: () => api.get<Team[]>("/teams").then((r) => r.data),
  get: (id: string) => api.get<Team>(`/teams/${id}`).then((r) => r.data),
  create: (data: { name: string; description?: string; leader?: string; members?: string }) =>
    api.post<Team>("/teams", data).then((r) => r.data),
  update: (
    id: string,
    data: { name?: string; description?: string; leader?: string; members?: string }
  ) => api.put<Team>(`/teams/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/teams/${id}`),
};

// ─── Applications (Admin) ─────────────────────────────────────────────────────
export const applicationsApi = {
  list: (moduleId?: string) => {
    const url = moduleId ? `/applications?module_id=${moduleId}` : "/applications";
    return api.get<NoteApplication[]>(url).then((r) => r.data);
  },
  updateStatus: (id: string, status: ApplicationStatus, admin_note?: string) =>
    api
      .put<NoteApplication>(`/applications/${id}/status`, { status, admin_note })
      .then((r) => r.data),
  delete: (id: string) => api.delete(`/applications/${id}`),
};

// ─── Public (Öğrenci) ─────────────────────────────────────────────────────────
export const publicApi = {
  getModuleNotes: (moduleId: string) =>
    api.get<PublicNoteItem[]>(`/public/modules/${moduleId}/notes`).then((r) => r.data),
  createApplication: (data: {
    module_id: string;
    lesson_id?: string | null;
    student_name: string;
    student_number?: string | null;
    student_email?: string | null;
    message?: string | null;
  }) => api.post<NoteApplication>("/public/applications", data).then((r) => r.data),
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardApi = {
  getStats: () => api.get<DashboardStats>("/dashboard/stats").then((r) => r.data),
  getModuleStats: (moduleId: string) =>
    api.get<ModuleStats>(`/dashboard/module-stats/${moduleId}`).then((r) => r.data),
};

// ─── Import ───────────────────────────────────────────────────────────────────
export interface PdfPreviewResult {
  total: number;
  sunum_count: number;
  uygulama_count: number;
  filename: string;
  lessons: Array<{
    subject_name: string;
    order_label: string;
    topic: string | null;
    lesson_date: string;
    assigned_team: string | null;
    audio_status: string;
  }>;
}

export const importApi = {
  importExcel: (moduleId: string, file: File, overwrite = false) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("overwrite", String(overwrite));
    return api
      .post<ImportResult>(`/import/excel/${moduleId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
  previewPdf: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api
      .post<PdfPreviewResult>("/import/pdf/preview", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
  importPdf: (moduleId: string, file: File, overwrite = false) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("overwrite", String(overwrite));
    return api
      .post<ImportResult>(`/import/pdf/${moduleId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
};

