"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Plus, BookOpen } from "lucide-react";
import { lessonsApi, teamsApi } from "@/lib/api";
import { AUDIO_STATUSES, type AudioStatus } from "@/types";

interface LessonModalProps {
  moduleId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function LessonModal({ moduleId, isOpen, onClose }: LessonModalProps) {
  const queryClient = useQueryClient();

  const [subjectName, setSubjectName] = useState("");
  const [orderLabel, setOrderLabel] = useState("");
  const [topic, setTopic] = useState("");
  const [lessonDate, setLessonDate] = useState("");
  const [assignedTeam, setAssignedTeam] = useState("");
  const [audioStatus, setAudioStatus] = useState<AudioStatus>("Ses yüklenmedi");
  const [error, setError] = useState<string | null>(null);

  const { data: teams = [] } = useQuery({
    queryKey: ["teams"],
    queryFn: () => teamsApi.list(),
    enabled: isOpen,
  });

  const mutation = useMutation({
    mutationFn: () =>
      lessonsApi.create(moduleId, {
        subject_name: subjectName.trim(),
        order_label: orderLabel.trim() || null,
        topic: topic.trim() || null,
        lesson_date: lessonDate || null,
        assigned_team: assignedTeam.trim() || null,
        audio_status: audioStatus,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracking", moduleId] });
      queryClient.invalidateQueries({ queryKey: ["module-stats", moduleId] });
      queryClient.invalidateQueries({ queryKey: ["lessons", moduleId] });
      setSubjectName("");
      setOrderLabel("");
      setTopic("");
      setLessonDate("");
      setAssignedTeam("");
      setAudioStatus("Ses yüklenmedi");
      setError(null);
      onClose();
    },
    onError: (err: any) => {
      setError(err?.response?.data?.detail || "Ders eklenirken bir hata oluştu.");
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-sm">Yeni Ders Ekle</h3>
              <p className="text-xs text-slate-400">Modüle manuel ders ve takip kaydı oluşturun</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!subjectName.trim()) {
              setError("Ders adı zorunludur.");
              return;
            }
            mutation.mutate();
          }}
          className="p-6 space-y-4 text-xs"
        >
          {error && <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Ders Adı *</label>
              <input
                type="text"
                required
                placeholder="Örn: Anatomi"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Sıra / Kod</label>
              <input
                type="text"
                placeholder="Örn: s1, s2"
                value={orderLabel}
                onChange={(e) => setOrderLabel(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Konu Başlığı</label>
            <input
              type="text"
              placeholder="Örn: Üst Ekstremite Kemikleri"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Ders Tarihi</label>
              <input
                type="date"
                value={lessonDate}
                onChange={(e) => setLessonDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Hazırlayan Ekip</label>
              <input
                type="text"
                list="teams-list"
                placeholder="Ekip adı"
                value={assignedTeam}
                onChange={(e) => setAssignedTeam(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              />
              <datalist id="teams-list">
                {teams.map((t) => (
                  <option key={t.id} value={t.name} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Ses Kaydı Durumu</label>
            <select
              value={audioStatus}
              onChange={(e) => setAudioStatus(e.target.value as AudioStatus)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {AUDIO_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-xs disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {mutation.isPending ? "Ekleniyor..." : "Ders Ekle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
