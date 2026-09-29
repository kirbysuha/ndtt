"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, FolderOpen, AlertTriangle, Clock, Upload } from "lucide-react";
import { dashboardApi, classesApi } from "@/lib/api";

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: React.ElementType; color: string; }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading: sl } = useQuery({ queryKey: ["dashboard-stats"], queryFn: dashboardApi.getStats, refetchInterval: 60000 });
  const { data: classes = [], isLoading: cl } = useQuery({ queryKey: ["classes"], queryFn: classesApi.list });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Not Durum Takip Sistemi genel görünümü</p>
      </div>
      {sl ? (
        <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_,i) => <div key={i} className="bg-white rounded-xl border p-5 animate-pulse h-24" />)}</div>
      ) : stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Toplam Sınıf" value={stats.total_classes} icon={FolderOpen} color="bg-blue-500" />
            <StatCard label="Toplam Modül" value={stats.total_modules} icon={BookOpen} color="bg-purple-500" />
            <StatCard label="Toplam Ders" value={stats.total_lessons} icon={Clock} color="bg-orange-500" />
            <StatCard label="Geciken Not" value={stats.late_notes} icon={AlertTriangle} color={stats.late_notes > 0 ? "bg-red-500" : "bg-green-500"} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(stats.status_counts).filter(([,c]) => c > 0).map(([s, c]) => (
              <div key={s} className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                <p className="text-xs text-gray-500 leading-tight">{s}</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{c}</p>
              </div>
            ))}
          </div>
        </>
      )}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Sınıflar</h2>
          <Link href="/classes" className="text-sm text-blue-600 hover:underline">Tüm sınıfları yönet →</Link>
        </div>
        {cl ? (
          <div className="grid grid-cols-3 gap-4">{[...Array(3)].map((_,i) => <div key={i} className="bg-white rounded-xl border p-5 animate-pulse h-28" />)}</div>
        ) : classes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-500">Henüz sınıf yok.</p>
            <Link href="/classes" className="text-blue-600 text-sm hover:underline mt-1 inline-block">Sınıf ekle →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls) => (
              <Link key={cls.id} href={`/classes/${cls.id}`} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all">
                <h3 className="font-semibold text-gray-900">{cls.name}</h3>
                {cls.description && <p className="text-sm text-gray-500 mt-1">{cls.description}</p>}
                <p className="text-sm text-gray-400 mt-3">{cls.module_count} modül</p>
              </Link>
            ))}
          </div>
        )}
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
        <Upload className="w-5 h-5 text-blue-600" />
        <div>
          <p className="font-medium text-blue-900 text-sm">Excel dosyanızı import etmek ister misiniz?</p>
          <p className="text-xs text-blue-600 mt-0.5">Mevcut Excel tablonuzu sisteme aktarabilirsiniz.</p>
        </div>
        <Link href="/import" className="ml-auto px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 whitespace-nowrap">Import Et</Link>
      </div>
    </div>
  );
}
