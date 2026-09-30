"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { BookOpen, FolderOpen, ArrowRight, Shield, Layers } from "lucide-react";
import { classesApi, modulesApi } from "@/lib/api";

function ModuleList({ classId }: { classId: string }) {
  const { data: modules = [], isLoading } = useQuery({
    queryKey: ["modules", classId],
    queryFn: () => modulesApi.list(classId),
  });

  if (isLoading) {
    return <div className="text-xs text-slate-400 py-3">Modüller yükleniyor...</div>;
  }

  if (modules.length === 0) {
    return (
      <div className="text-xs text-slate-400 py-3 italic">
        Bu dönem için henüz tanımlı modül bulunmuyor.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
      {modules.map((m) => (
        <Link
          key={m.id}
          href={`/apply/${m.id}`}
          className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-500 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                {m.name}
              </div>
              <div className="text-[11px] text-slate-400">
                {m.lesson_count ? `${m.lesson_count} ders kaydı` : "Not listesi ve başvuru"}
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
        </Link>
      ))}
    </div>
  );
}

export default function StudentPortalPage() {
  const { data: classes = [], isLoading } = useQuery({
    queryKey: ["classes"],
    queryFn: () => classesApi.list(),
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      <header className="bg-white border-b border-slate-200 py-6 px-4 sm:px-6 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">
                NDTT Öğrenci Portalı
              </h1>
              <p className="text-xs text-slate-500">
                Ders Notu Durumları & Öğrenci Bildirim Sistemi
              </p>
            </div>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-slate-500" />
            <span>Yönetici Girişi</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-900">Dönem & Modül Seçimi</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Notlarını ve ses durumunu incelemek istediğiniz modülü seçin
          </p>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">Sınıflar yükleniyor...</div>
        ) : classes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <div className="text-sm font-semibold text-slate-700">Henüz sınıf bulunmuyor</div>
          </div>
        ) : (
          <div className="space-y-4">
            {classes.map((cls) => (
              <div
                key={cls.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs"
              >
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <FolderOpen className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-sm text-slate-900">{cls.name}</span>
                </div>
                <ModuleList classId={cls.id} />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
