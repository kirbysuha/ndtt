"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { BookOpen, Send, CheckCircle2, Mic, MicOff, AlertCircle } from "lucide-react";
import { publicApi, modulesApi } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import type { NoteStatus } from "@/types";

export default function StudentApplicationPage() {
  const { moduleId } = useParams<{ moduleId: string }>();

  const [studentName, setStudentName] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: mod } = useQuery({
    queryKey: ["module-public", moduleId],
    queryFn: () => modulesApi.get(moduleId),
  });

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["public-notes", moduleId],
    queryFn: () => publicApi.getModuleNotes(moduleId),
  });

  const mutation = useMutation({
    mutationFn: () =>
      publicApi.createApplication({
        module_id: moduleId,
        lesson_id: selectedLessonId || null,
        student_name: studentName.trim(),
        student_number: studentNumber.trim() || null,
        student_email: studentEmail.trim() || null,
        message: message.trim() || null,
      }),
    onSuccess: () => {
      setSuccess(true);
      setStudentName("");
      setStudentNumber("");
      setStudentEmail("");
      setSelectedLessonId("");
      setMessage("");
      setError(null);
    },
    onError: (err: any) => {
      setError(err?.response?.data?.detail || "Başvuru gönderilirken bir hata oluştu.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      setError("Ad Soyad alanı zorunludur.");
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      <header className="bg-white border-b border-slate-200 py-6 px-4 sm:px-6 shadow-xs">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">
                {mod?.name ? `${mod.name} — Not Portalı` : "Not Portalı"}
              </h1>
              <p className="text-xs text-slate-500">Not Takip & Öğrenci Bildirim Sistemi</p>
            </div>
          </div>
          <div className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            Canlı Not Listesi
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 text-base">Ders Notları ve Ses Durumları</h2>
              <p className="text-xs text-slate-500">Modüle ait tüm derslerin güncel durumları</p>
            </div>
            <span className="text-xs font-semibold bg-white border border-slate-200 px-3 py-1 rounded-lg text-slate-600">
              {notes.length} Ders Kaydı
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Sıra</th>
                  <th className="px-4 py-3">Ders Adı</th>
                  <th className="px-4 py-3">Konu</th>
                  <th className="px-4 py-3">Ders Tarihi</th>
                  <th className="px-4 py-3">Not Durumu</th>
                  <th className="px-4 py-3">Ses Durumu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Not durumları yükleniyor...
                    </td>
                  </tr>
                ) : notes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Bu modülde henüz ders bulunmuyor.
                    </td>
                  </tr>
                ) : (
                  notes.map((n, idx) => (
                    <tr
                      key={n.lesson_id}
                      className={`hover:bg-slate-50/60 ${idx % 2 === 1 ? "bg-slate-50/30" : ""}`}
                    >
                      <td className="px-4 py-3 font-mono font-medium text-slate-600">{n.order_label || "—"}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{n.subject_name}</td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={n.topic || ""}>{n.topic || "—"}</td>
                      <td className="px-4 py-3 text-slate-500">{n.lesson_date || "—"}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={n.status as NoteStatus} size="sm" />
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border ${
                            n.audio_status === "Ses yüklendi"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : n.audio_status === "Ses alınamadı"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-gray-100 text-gray-600 border-gray-200"
                          }`}
                        >
                          {n.audio_status === "Ses yüklendi" ? (
                            <Mic className="w-3 h-3 text-emerald-600" />
                          ) : n.audio_status === "Ses alınamadı" ? (
                            <MicOff className="w-3 h-3 text-red-600" />
                          ) : (
                            <AlertCircle className="w-3 h-3 text-gray-400" />
                          )}
                          {n.audio_status || "Ses yüklenmedi"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
        {/* Başvuru / İtiraz / Geri Bildirim Formu */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 md:p-8">
          <div className="max-w-2xl">
            <h2 className="font-bold text-slate-900 text-lg mb-1">
              Not İnceleme / Düzeltme Talebinde Bulun
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Yüklenen notlarda bir hata görüyorsanız, eksik ses kaydı bildirimi yapmak veya not incelemesi istemek için formu doldurabilirsiniz.
            </p>

            {success && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold">Talebiniz başarıyla iletildi!</p>
                  <p className="text-emerald-700">Dönem temsilcileri ve modül ekibi inceleyip değerlendirecektir.</p>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Adınız Soyadınız <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Eren Kaya"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Öğrenci Numaranız
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: 2023101010"
                    value={studentNumber}
                    onChange={(e) => setStudentNumber(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    E-posta Adresiniz
                  </label>
                  <input
                    type="email"
                    placeholder="ornek@ogrenci.edu.tr"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    İlgili Ders (İsteğe Bağlı)
                  </label>
                  <select
                    value={selectedLessonId}
                    onChange={(e) => setSelectedLessonId(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Genel Modül Bildirimi</option>
                    {notes.map((n) => (
                      <option key={n.lesson_id} value={n.lesson_id}>
                        {n.subject_name} {n.order_label ? `(${n.order_label})` : ""} - {n.topic || ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Bildirim Mesajınız / Talebiniz <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Hata veya talep ettiğiniz durumu detaylıca açıklayınız..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={mutation.isPending}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{mutation.isPending ? "Gönderiliyor..." : "Talebi Gönder"}</span>
              </button>
            </form>
          </div>
        </section>

      </main>
    </div>
  );
}
