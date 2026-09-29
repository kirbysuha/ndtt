"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, BarChart3, Plus, ExternalLink } from "lucide-react";
import { modulesApi, classesApi, dashboardApi } from "@/lib/api";
import { TrackingTable } from "@/components/TrackingTable";
import { LessonModal } from "@/components/LessonModal";

export default function ModuleTrackingPage() {
  const { classId, moduleId } = useParams<{ classId: string; moduleId: string }>();
  const [isAddLessonOpen, setIsAddLessonOpen] = useState(false);

  const { data: mod } = useQuery({
    queryKey: ["module", moduleId],
    queryFn: () => modulesApi.get(moduleId),
  });

  const { data: cls } = useQuery({
    queryKey: ["class", classId],
    queryFn: () => classesApi.get(classId),
  });

  const { data: stats } = useQuery({
    queryKey: ["module-stats", moduleId],
    queryFn: () => dashboardApi.getModuleStats(moduleId),
    refetchInterval: 60000,
  });

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/classes" className="hover:text-slate-800">Sınıflar</Link>
        <span>/</span>
        <Link href={`/classes/${classId}`} className="hover:text-slate-800">{cls?.name || "..."}</Link>
        <span>/</span>
        <span className="text-slate-900 font-semibold">{mod?.name || "..."}</span>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/classes/${classId}`}
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{mod?.name || "..."}</h1>
            <p className="text-slate-500 text-xs">Not Durum Takip Tablosu</p>
          </div>
        </div>

        {/* Actions & Stats */}
        <div className="flex items-center gap-3">
          {stats && (
            <div className="hidden sm:flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-3.5 py-2 shadow-xs">
              <BarChart3 className="w-4 h-4 text-slate-400" />
              <div className="text-xs">
                <span className="font-semibold text-slate-900">{stats.uploaded}</span>
                <span className="text-slate-500">/{stats.total_lessons} yüklendi</span>
              </div>
              <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${stats.completion_rate}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-slate-700">{stats.completion_rate}%</span>
            </div>
          )}

          <Link
            href={`/apply/${moduleId}`}
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-medium shadow-xs transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
            <span>Öğrenci Görünümü</span>
          </Link>

          <button
            onClick={() => setIsAddLessonOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium shadow-xs shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ders Ekle</span>
          </button>
        </div>
      </div>

      {/* Tracking Table */}
      <TrackingTable moduleId={moduleId} moduleName={mod?.name || ""} />

      {/* Manual Lesson Creation Modal */}
      <LessonModal
        moduleId={moduleId}
        isOpen={isAddLessonOpen}
        onClose={() => setIsAddLessonOpen(false)}
      />
    </div>
  );
}
