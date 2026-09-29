"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Plus, Pencil, Trash2, X, ArrowLeft, BookOpen } from "lucide-react";
import { classesApi, modulesApi } from "@/lib/api";
import type { Module } from "@/types";

function ModuleModal({ classId, onClose, initial }: { classId: string; onClose: () => void; initial?: Module }) {
  const qc = useQueryClient();
  const [name, setName] = useState(initial?.name || "");
  const [desc, setDesc] = useState(initial?.description || "");
  const [order, setOrder] = useState(initial?.order || 1);
  const mutation = useMutation({
    mutationFn: () => initial
      ? modulesApi.update(initial.id, { name, description: desc, order })
      : modulesApi.create(classId, { name, description: desc, order }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["modules", classId] }); onClose(); },
  });
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">{initial ? "Modülü Düzenle" : "Yeni Modül"}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Modül adı *"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} placeholder="Sıra"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Açıklama" rows={2}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
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

export default function ClassDetailPage() {
  const { classId } = useParams<{ classId: string }>();
  const qc = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; editing?: Module }>({ open: false });

  const { data: cls } = useQuery({ queryKey: ["class", classId], queryFn: () => classesApi.get(classId) });
  const { data: modules = [], isLoading } = useQuery({ queryKey: ["modules", classId], queryFn: () => modulesApi.list(classId) });
  const deleteMutation = useMutation({
    mutationFn: modulesApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["modules", classId] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/classes" className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{cls?.name || "..."}</h1>
          <p className="text-gray-500 text-sm mt-0.5">Modüller</p>
        </div>
        <button onClick={() => setModal({ open: true })} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus className="w-4 h-4" /> Yeni Modül
        </button>
      </div>
      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_,i) => <div key={i} className="bg-white rounded-xl border p-5 animate-pulse h-20" />)}</div>
      ) : modules.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Henüz modül yok.</p>
          <button onClick={() => setModal({ open: true })} className="mt-3 text-blue-600 text-sm hover:underline">+ Modül Ekle</button>
        </div>
      ) : (
        <div className="space-y-3">
          {modules.sort((a, b) => a.order - b.order).map((mod) => (
            <div key={mod.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
              <Link href={`/classes/${classId}/modules/${mod.id}`} className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center text-sm font-bold">{mod.order}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 hover:text-blue-600">{mod.name}</h3>
                    {mod.description && <p className="text-sm text-gray-500">{mod.description}</p>}
                  </div>
                </div>
              </Link>
              <div className="flex items-center gap-3 ml-3">
                <span className="text-sm text-gray-400">{mod.lesson_count} ders</span>
                <button onClick={() => setModal({ open: true, editing: mod })} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => { if (confirm(`"${mod.name}" silinsin mi?`)) deleteMutation.mutate(mod.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      {modal.open && <ModuleModal classId={classId} onClose={() => setModal({ open: false })} initial={modal.editing} />}
    </div>
  );
}

