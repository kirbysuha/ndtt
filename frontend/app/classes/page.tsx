"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Plus, Pencil, Trash2, X, Check, FolderOpen } from "lucide-react";
import { classesApi } from "@/lib/api";
import type { Class } from "@/types";

function ClassModal({ onClose, initial }: { onClose: () => void; initial?: Class }) {
  const qc = useQueryClient();
  const [name, setName] = useState(initial?.name || "");
  const [desc, setDesc] = useState(initial?.description || "");

  const mutation = useMutation({
    mutationFn: () =>
      initial
        ? classesApi.update(initial.id, { name, description: desc })
        : classesApi.create({ name, description: desc }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["classes"] }); onClose(); },
  });

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">{initial ? "Sınıfı Düzenle" : "Yeni Sınıf"}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sınıf adı *"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Açıklama (isteğe bağlı)"
            rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" />
        </div>
        <div className="flex gap-2 mt-4 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">İptal</button>
          <button onClick={() => mutation.mutate()} disabled={!name.trim() || mutation.isPending}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {mutation.isPending ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClassesPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; editing?: Class }>({ open: false });

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ["classes"], queryFn: classesApi.list,
  });

  const deleteMutation = useMutation({
    mutationFn: classesApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["classes"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sınıflar</h1>
          <p className="text-gray-500 text-sm mt-1">Sınıfları ve modüllerini yönet</p>
        </div>
        <button onClick={() => setModal({ open: true })}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus className="w-4 h-4" /> Yeni Sınıf
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-xl border p-5 animate-pulse h-32" />)}
        </div>
      ) : classes.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Henüz sınıf yok. İlk sınıfı ekleyin.</p>
          <button onClick={() => setModal({ open: true })} className="mt-3 text-blue-600 text-sm hover:underline">
            + Sınıf Ekle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <div key={cls.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between">
                <Link href={`/classes/${cls.id}`} className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 hover:text-blue-600 truncate">{cls.name}</h3>
                  {cls.description && <p className="text-sm text-gray-500 mt-1 truncate">{cls.description}</p>}
                  <p className="text-sm text-gray-400 mt-2">{cls.module_count} modül</p>
                </Link>
                <div className="flex gap-1 ml-2 flex-shrink-0">
                  <button onClick={() => setModal({ open: true, editing: cls })}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => { if (confirm(`"${cls.name}" silinsin mi?`)) deleteMutation.mutate(cls.id); }}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal.open && <ClassModal onClose={() => setModal({ open: false })} initial={modal.editing} />}
    </div>
  );
}
