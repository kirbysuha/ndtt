"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Plus, Trash2, Shield } from "lucide-react";
import { teamsApi } from "@/lib/api";

export default function TeamsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [leader, setLeader] = useState("");
  const [members, setMembers] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ["teams"],
    queryFn: () => teamsApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      teamsApi.create({
        name: name.trim(),
        leader: leader.trim() || undefined,
        members: members.trim() || undefined,
        description: description.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      setName("");
      setLeader("");
      setMembers("");
      setDescription("");
      setError(null);
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      setError(err?.response?.data?.detail || "Ekip eklenemedi.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => teamsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-blue-600" />
            Hazırlık Ekipleri
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Ders notu ve ses kaydı hazırlayan öğrenci ekipleri yönetimi
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Ekip Oluştur</span>
        </button>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-400">Ekipler yükleniyor...</div>
      ) : teams.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-700 text-base">Henüz bir ekip oluşturulmamış</h3>
          <p className="text-slate-400 text-xs mt-1 mb-4">
            Dersleri sorumlulara atamak için ilk ekibinizi oluşturun.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            Ekip Ekle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow relative flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-slate-900 text-base">{t.name}</h3>
                  <button
                    onClick={() => {
                      if (confirm(`"${t.name}" ekibini silmek istediğinize emin misiniz?`)) {
                        deleteMutation.mutate(t.id);
                      }
                    }}
                    className="text-slate-400 hover:text-red-600 p-1 rounded-lg transition-colors cursor-pointer"
                    title="Ekibi Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {t.description && (
                  <p className="text-xs text-slate-500 mb-3 line-clamp-2">{t.description}</p>
                )}
                {t.leader && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-700 mb-1.5 font-medium">
                    <Shield className="w-3.5 h-3.5 text-blue-600" />
                    <span>Lider: {t.leader}</span>
                  </div>
                )}
                {t.members && (
                  <div className="text-xs text-slate-500 mt-2">
                    <span className="font-medium text-slate-600">Üyeler:</span> {t.members}
                  </div>
                )}
              </div>
              <div className="pt-3 mt-4 border-t border-slate-100 text-[11px] text-slate-400">
                Oluşturulma: {new Date(t.created_at).toLocaleDateString("tr-TR")}
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 mb-1">Yeni Ekip Oluştur</h3>
            <p className="text-xs text-slate-400 mb-4">Ders atamaları için ekip bilgileri girin</p>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs mb-3">
                {error}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!name.trim()) return setError("Ekip adı zorunludur.");
                createMutation.mutate();
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-medium text-slate-700 mb-1">Ekip Adı *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: 1. Komite Anatomi Grubu"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Ekip Sorumlusu (Lider)</label>
                <input
                  type="text"
                  placeholder="Örn: Ahmet Yılmaz"
                  value={leader}
                  onChange={(e) => setLeader(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Ekip Üyeleri</label>
                <input
                  type="text"
                  placeholder="Virgülle ayırarak yazın (Ali, Ayşe, Mehmet)"
                  value={members}
                  onChange={(e) => setMembers(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Açıklama</label>
                <textarea
                  rows={2}
                  placeholder="Ekip hakkında notlar..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-xs disabled:opacity-50"
                >
                  {createMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
