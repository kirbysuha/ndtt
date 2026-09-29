// Durum enum - backend NoteStatus ile birebir
export type NoteStatus =
  | "Not henüz ulaşmadı"
  | "Not mailde"
  | "Not denetimde"
  | "Not 2. Kez denetimde"
  | "Not kabul edildi"
  | "Not 1. Kez reddedildi"
  | "Not 2. Kez reddedildi"
  | "Not yüklendi";

export const NOTE_STATUSES: NoteStatus[] = [
  "Not henüz ulaşmadı",
  "Not mailde",
  "Not denetimde",
  "Not kabul edildi",
  "Not 1. Kez reddedildi",
  "Not 2. Kez denetimde",
  "Not 2. Kez reddedildi",
  "Not yüklendi",
];

// Ses kaydı durumları
export type AudioStatus = "Ses yüklenmedi" | "Ses alınamadı" | "Ses yüklendi";

export const AUDIO_STATUSES: AudioStatus[] = [
  "Ses yüklenmedi",
  "Ses alınamadı",
  "Ses yüklendi",
];

export const AUDIO_STATUS_COLORS: Record<AudioStatus, string> = {
  "Ses yüklenmedi": "bg-gray-100 text-gray-600 border-gray-200",
  "Ses alınamadı": "bg-red-50 text-red-700 border-red-200 font-medium",
  "Ses yüklendi": "bg-emerald-50 text-emerald-700 border-emerald-200 font-medium",
};

export const STATUS_COLORS: Record<NoteStatus, string> = {
  "Not henüz ulaşmadı": "bg-slate-100 text-slate-700 border-slate-200",
  "Not mailde": "bg-sky-50 text-sky-700 border-sky-200",
  "Not denetimde": "bg-amber-50 text-amber-700 border-amber-200",
  "Not 2. Kez denetimde": "bg-orange-50 text-orange-700 border-orange-200",
  "Not kabul edildi": "bg-teal-50 text-teal-700 border-teal-200",
  "Not 1. Kez reddedildi": "bg-rose-50 text-rose-700 border-rose-200",
  "Not 2. Kez reddedildi": "bg-red-100 text-red-800 border-red-300 font-semibold",
  "Not yüklendi": "bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold",
};

export const STATUS_DOT_COLORS: Record<NoteStatus, string> = {
  "Not henüz ulaşmadı": "bg-slate-400",
  "Not mailde": "bg-sky-500",
  "Not denetimde": "bg-amber-500",
  "Not 2. Kez denetimde": "bg-orange-500",
  "Not kabul edildi": "bg-teal-500",
  "Not 1. Kez reddedildi": "bg-rose-500",
  "Not 2. Kez reddedildi": "bg-red-600",
  "Not yüklendi": "bg-emerald-500",
};

export interface Class {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  module_count: number;
}

export interface Module {
  id: string;
  class_id: string;
  name: string;
  description: string | null;
  order: number;
  created_at: string;
  updated_at: string;
  lesson_count: number;
}

export interface Lesson {
  id: string;
  module_id: string;
  subject_name: string;
  order_label: string | null;
  topic: string | null;
  lesson_date: string | null;
  assigned_team: string | null;
  audio_status: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrackingTableRow {
  tracking_id: string;
  lesson_id: string;
  last_updated: string | null;
  subject_name: string;
  order_label: string | null;
  topic: string | null;
  lesson_date: string | null;
  assigned_team: string | null;
  status: NoteStatus;
  submission_time: string;
  review_time: string;
  first_reject_correction: string;
  second_reject_correction: string;
  upload_duration: string;
  submission_color: "green" | "orange" | "red" | "gray";
  review_color: "green" | "red" | "gray";
  first_reject_color: "green" | "red" | "gray";
  second_reject_color: "green" | "red" | "gray";
  audio_status: string | null;
  first_reject_date: string | null;
  second_reject_date: string | null;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  leader: string | null;
  members: string | null;
  created_at: string;
  updated_at: string;
}

export type ApplicationStatus = "Beklemede" | "Onaylandı" | "Reddedildi";

export interface NoteApplication {
  id: string;
  module_id: string;
  lesson_id: string | null;
  student_name: string;
  student_number: string | null;
  student_email: string | null;
  message: string | null;
  status: ApplicationStatus;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  module_name?: string | null;
  lesson_name?: string | null;
}

export interface PublicNoteItem {
  lesson_id: string;
  subject_name: string;
  order_label: string | null;
  topic: string | null;
  lesson_date: string | null;
  status: string;
  audio_status: string | null;
}

export interface DashboardStats {
  total_classes: number;
  total_modules: number;
  total_lessons: number;
  total_tracking: number;
  status_counts: Record<NoteStatus, number>;
  late_notes: number;
}

export interface ModuleStats {
  module_id: string;
  total_lessons: number;
  uploaded: number;
  pending: number;
  completion_rate: number;
  status_counts: Record<NoteStatus, number>;
}

export interface ImportResult {
  message: string;
  module_id: string;
  filename: string;
  total: number;
  created: number;
  updated: number;
  skipped: number;
}

