"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, CheckCircle2, XCircle, Clock, Trash2, MessageSquare } from "lucide-react";
import { applicationsApi } from "@/lib/api";
import type { NoteApplication, ApplicationStatus } from "@/types";

export default function ApplicationsAdminPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("ALL");

  const { data: apps = [], isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: () => applicationsApi.list(),
    refetchInterval: 30000,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: ApplicationStatus; note?: string }) =>
      applicationsApi.updateStatus(id, status, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => applicationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });

  const filtered = apps.filter((a) => {
    if (filter === "ALL") return true;
    return a.status === filter;
  });

  const getStatusBadge = (status: ApplicationStatus) => {
    if (status === "Onaylandı")
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800"><CheckCircle2 className="w-3.5 h-3.5" /> Onaylandı</span>;
    if (status === "Reddedildi")
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800"><XCircle className="w-3.5 h-3.5" /> Reddedildi</span>;
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800"><Clock className="w-3.5 h-3.5" /> Beklemede</span>;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-blue-600" />
            Öğrenci Not Başvuruları
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Öğrencilerin inceleme ve talep bildirimlerini yönetin
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white border border-slate-200 p-1 rounded-xl shadow-xs text-xs">
          {["ALL", "Beklemede", "Onaylandı", "Reddedildi"].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                filter === st
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {st === "ALL" ? `Tümü (${apps.length})` : st}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400">Başvurular yükleniyor...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-700 text-base">Henüz başvuru bulunmuyor</h3>
          <p className="text-slate-400 text-xs mt-1">
            Öğrenciler not bağlantısı üzerinden talep gönderdiklerinde burada listelenecektir.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="divide-y divide-slate-100">
            {filtered.map((app) => (
              <div
                key={app.id}
                className="p-5 hover:bg-slate-50/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5">
                    {getStatusBadge(app.status)}
                    <span className="font-bold text-slate-900 text-sm">{app.student_name}</span>
                    {app.student_number && (
                      <span className="text-xs text-slate-500 font-mono">({app.student_number})</span>
                    )}
                    {app.student_email && (
                      <span className="text-xs text-slate-400">• {app.student_email}</span>
                    )}
                  </div>

                  <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                    {app.module_name && (
                      <span><strong className="text-slate-700">Modül:</strong> {app.module_name}</span>
                    )}
                    {app.lesson_name && (
                      <span><strong className="text-slate-700">İlgili Ders:</strong> {app.lesson_name}</span>
                    )}
                    <span className="text-slate-400">Tarih: {new Date(app.created_at).toLocaleString("tr-TR")}</span>
                  </div>

                  {app.message && (
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-700 mt-1.5 flex items-start gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                      <span>{app.message}</span>
                    </div>
                  )}

                  {app.admin_note && (
                    <div className="text-xs text-blue-700 bg-blue-50/70 p-2 rounded-lg border border-blue-100">
                      <strong>Admin Notu:</strong> {app.admin_note}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => statusMutation.mutate({ id: app.id, status: "Onaylandı" })}
                    disabled={statusMutation.isPending || app.status === "Onaylandı"}
                    className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-lg text-xs font-semibold disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    Onayla
                  </button>
                  <button
                    onClick={() => statusMutation.mutate({ id: app.id, status: "Reddedildi" })}
                    disabled={statusMutation.isPending || app.status === "Reddedildi"}
                    className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-lg text-xs font-semibold disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    Reddet
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Bu başvuruyu kalıcı olarak silmek istiyor musunuz?")) {
                        deleteMutation.mutate(app.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                    title="Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
