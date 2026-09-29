"use client";

import { useState, useCallback, useMemo, Fragment } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Mic,
  MicOff,
  AlertCircle,
  FoldVertical,
  UnfoldVertical,
} from "lucide-react";
import { trackingApi, lessonsApi } from "@/lib/api";
import { StatusBadge } from "./StatusBadge";
import { TimerCell } from "./TimerCell";
import { TeamSelectDropdown } from "./TeamSelectDropdown";
import {
  NOTE_STATUSES,
  AUDIO_STATUSES,
  AUDIO_STATUS_COLORS,
  type NoteStatus,
  type AudioStatus,
  type TrackingTableRow,
} from "@/types";

interface TrackingTableProps {
  moduleId: string;
  moduleName: string;
}

const COL_HEADERS = [
  "Ders Adı",
  "Sıra",
  "Konu",
  "Ders Tarihi",
  "Hazırlayan Ekip",
  "Notun Durumu",
  "Ses Kaydı Durumu",
  "Notun Gönderilmesi İçin Kalan Süre",
  "Denetim İçin Kalan Süre",
  "1. Red Tarihi",
  "1. Red Düzeltmesi İçin Kalan Süre",
  "2. Red Tarihi",
  "2. Red Düzeltmesi İçin Kalan Süre",
  "Notun Yüklenmesi İçin Geçen Süre",
  "Son Güncelleme",
];

function fmt(dateStr: string | null, withTime = false): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (withTime)
    return d.toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  return d.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function parseOrderNum(val: string | null): number {
  if (!val) return 999999;
  const match = val.match(/\d+/);
  return match ? parseInt(match[0], 10) : 999999;
}

function StatusDropdown({
  row,
  onChange,
  disabled,
}: {
  row: TrackingTableRow;
  onChange: (id: string, s: NoteStatus) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={disabled}
        className="flex items-center gap-1 hover:opacity-80 transition-opacity"
      >
        <StatusBadge status={row.status} size="sm" />
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 bg-white rounded-lg shadow-xl border border-slate-200 py-1 min-w-[220px]">
            {NOTE_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => {
                  onChange(row.tracking_id, s);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center ${
                  row.status === s ? "bg-blue-50 font-medium" : ""
                }`}
              >
                <StatusBadge status={s} size="sm" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function AudioDropdown({
  lessonId,
  currentStatus,
  onChange,
}: {
  lessonId: string;
  currentStatus: string | null;
  onChange: (lessonId: string, status: AudioStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const status: AudioStatus = (currentStatus as AudioStatus) || "Ses yüklenmedi";
  const colorClass = AUDIO_STATUS_COLORS[status] || "bg-gray-100 text-gray-600";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border ${colorClass} hover:opacity-85 transition-opacity cursor-pointer`}
      >
        {status === "Ses yüklendi" ? (
          <Mic className="w-3 h-3 text-emerald-600" />
        ) : status === "Ses alınamadı" ? (
          <MicOff className="w-3 h-3 text-red-600" />
        ) : (
          <AlertCircle className="w-3 h-3 text-gray-400" />
        )}
        <span>{status}</span>
        <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 bg-white rounded-lg shadow-xl border border-slate-200 py-1 min-w-[170px]">
            {AUDIO_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => {
                  onChange(lessonId, s);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 flex items-center gap-2 ${
                  status === s ? "bg-blue-50 font-medium text-blue-700" : "text-slate-700"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    s === "Ses yüklendi"
                      ? "bg-emerald-500"
                      : s === "Ses alınamadı"
                      ? "bg-red-500"
                      : "bg-gray-400"
                  }`}
                />
                {s}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
function TrackingTableRowItem({
  r,
  idx,
  moduleId,
  onStatusChange,
  statusPending,
  onAudioChange,
}: {
  r: TrackingTableRow;
  idx: number;
  moduleId: string;
  onStatusChange: (id: string, s: NoteStatus) => void;
  statusPending: boolean;
  onAudioChange: (lessonId: string, s: AudioStatus) => void;
}) {
  return (
    <tr
      className={`hover:bg-blue-50/50 transition-colors ${
        idx % 2 === 1 ? "bg-slate-50/40" : "bg-white"
      }`}
    >
      <td className="px-3 py-2 whitespace-nowrap font-medium text-slate-900 border-r border-slate-100">
        {r.subject_name}
      </td>
      <td className="px-3 py-2 whitespace-nowrap text-slate-600 font-mono font-medium border-r border-slate-100">
        {r.order_label || "—"}
      </td>
      <td
        className="px-3 py-2 max-w-[220px] truncate text-slate-700 border-r border-slate-100"
        title={r.topic || ""}
      >
        {r.topic || "—"}
      </td>
      <td className="px-3 py-2 whitespace-nowrap text-slate-600 border-r border-slate-100">
        {fmt(r.lesson_date ? String(r.lesson_date) : null)}
      </td>
      <td className="px-3 py-2 whitespace-nowrap border-r border-slate-100">
        <TeamSelectDropdown
          lessonId={r.lesson_id}
          currentTeam={r.assigned_team}
          moduleId={moduleId}
          size="sm"
        />
      </td>
      <td className="px-3 py-2 whitespace-nowrap border-r border-slate-100">
        <StatusDropdown row={r} onChange={onStatusChange} disabled={statusPending} />
      </td>
      <td className="px-3 py-2 whitespace-nowrap border-r border-slate-100">
        <AudioDropdown
          lessonId={r.lesson_id}
          currentStatus={r.audio_status}
          onChange={onAudioChange}
        />
      </td>
      <td className="px-3 py-2 whitespace-nowrap border-r border-slate-100">
        <TimerCell value={r.submission_time} color={r.submission_color} />
      </td>
      <td className="px-3 py-2 whitespace-nowrap border-r border-slate-100">
        <TimerCell value={r.review_time} color={r.review_color} />
      </td>
      <td className="px-3 py-2 whitespace-nowrap text-slate-500 border-r border-slate-100">
        {fmt(r.first_reject_date ? String(r.first_reject_date) : null)}
      </td>
      <td className="px-3 py-2 whitespace-nowrap border-r border-slate-100">
        <TimerCell value={r.first_reject_correction} color={r.first_reject_color} />
      </td>
      <td className="px-3 py-2 whitespace-nowrap text-slate-500 border-r border-slate-100">
        {fmt(r.second_reject_date ? String(r.second_reject_date) : null)}
      </td>
      <td className="px-3 py-2 whitespace-nowrap border-r border-slate-100">
        <TimerCell value={r.second_reject_correction} color={r.second_reject_color} />
      </td>
      <td className="px-3 py-2 whitespace-nowrap text-slate-600 font-mono border-r border-slate-100">
        {r.upload_duration || "—"}
      </td>
      <td className="px-3 py-2 whitespace-nowrap font-mono text-[11px] text-slate-400">
        {fmt(r.last_updated ? String(r.last_updated) : null, true)}
      </td>
    </tr>
  );
}



export function TrackingTable({ moduleId }: TrackingTableProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const { data: rows = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ["tracking", moduleId],
    queryFn: () => trackingApi.getModuleTracking(moduleId),
    refetchInterval: 60000,
  });

  const statusMutation = useMutation({
    mutationFn: ({ trackingId, status }: { trackingId: string; status: NoteStatus }) =>
      trackingApi.updateStatus(trackingId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracking", moduleId] });
      queryClient.invalidateQueries({ queryKey: ["module-stats", moduleId] });
    },
  });

  const audioMutation = useMutation({
    mutationFn: ({ lessonId, audioStatus }: { lessonId: string; audioStatus: AudioStatus }) =>
      lessonsApi.update(lessonId, { audio_status: audioStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracking", moduleId] });
    },
  });

  const handleStatusChange = useCallback(
    (trackingId: string, status: NoteStatus) => {
      statusMutation.mutate({ trackingId, status });
    },
    [statusMutation]
  );

  const handleAudioChange = useCallback(
    (lessonId: string, audioStatus: AudioStatus) => {
      audioMutation.mutate({ lessonId, audioStatus });
    },
    [audioMutation]
  );

  // Filtreleme ve Doğal / Numerik Sıralama
  const filtered = rows
    .filter((r) => {
      const matchSearch =
        !search ||
        r.subject_name.toLowerCase().includes(search.toLowerCase()) ||
        (r.topic && r.topic.toLowerCase().includes(search.toLowerCase())) ||
        (r.assigned_team && r.assigned_team.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = statusFilter === "ALL" || r.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      const subjCompare = a.subject_name.localeCompare(b.subject_name, "tr");
      if (subjCompare !== 0) return subjCompare;
      return parseOrderNum(a.order_label) - parseOrderNum(b.order_label);
    });

  // Ders adına göre gruplama
  const groupedBySubject = useMemo(() => {
    const groups: Record<string, TrackingTableRow[]> = {};
    for (const r of filtered) {
      if (!groups[r.subject_name]) {
        groups[r.subject_name] = [];
      }
      groups[r.subject_name].push(r);
    }
    return groups;
  }, [filtered]);

  // Katlanabilir grup durumları (varsayılan olarak hepsi katlı/collapsed)
  const [collapsedMap, setCollapsedMap] = useState<Record<string, boolean>>({});

  const isCollapsed = useCallback(
    (subj: string) => {
      if (search.trim()) return false;
      return collapsedMap[subj] !== false;
    },
    [collapsedMap, search]
  );

  const toggleSubject = (subj: string) => {
    setCollapsedMap((prev) => ({
      ...prev,
      [subj]: prev[subj] === false ? true : false,
    }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    Object.keys(groupedBySubject).forEach((s) => (next[s] = false));
    setCollapsedMap(next);
  };

  const collapseAll = () => {
    const next: Record<string, boolean> = {};
    Object.keys(groupedBySubject).forEach((s) => (next[s] = true));
    setCollapsedMap(next);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <input
            type="text"
            placeholder="Ders adı, konu veya ekip ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Tüm Durumlar ({rows.length})</option>
            {NOTE_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 font-medium"
            title="Tüm ders gruplarını aç"
          >
            <UnfoldVertical className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Tümünü Aç</span>
          </button>
          <button
            onClick={collapseAll}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 font-medium"
            title="Tüm ders gruplarını daralt"
          >
            <FoldVertical className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Tümünü Daralt</span>
          </button>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 font-medium"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-blue-600" : ""}`} />
            Yenile
          </button>
        </div>
      </div>

      <div className="overflow-x-auto max-h-[calc(100vh-260px)]">
        <table className="w-full text-xs border-collapse">
          <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0 z-10 border-b border-slate-200">
            <tr>
              {COL_HEADERS.map((h, i) => (
                <th
                  key={i}
                  className="px-3 py-2.5 text-left whitespace-nowrap font-semibold border-r border-slate-200 last:border-r-0"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={COL_HEADERS.length} className="py-12 text-center text-slate-400">
                  Yükleniyor...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={COL_HEADERS.length} className="py-12 text-center text-slate-400">
                  Kayıt bulunamadı.
                </td>
              </tr>
            ) : (
              Object.entries(groupedBySubject).map(([subjName, subjRows]) => {
                const collapsed = isCollapsed(subjName);
                const uploadedCount = subjRows.filter(
                  (r) => r.status === "Not yüklendi" || r.status === "Not kabul edildi"
                ).length;

                return (
                  <Fragment key={subjName}>
                    {/* Grup Başlığı Satırı */}
                    <tr
                      onClick={() => toggleSubject(subjName)}
                      className="bg-slate-100 hover:bg-slate-200/90 cursor-pointer select-none transition-colors border-y-2 border-slate-300"
                    >
                      <td colSpan={COL_HEADERS.length} className="px-3 py-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            {collapsed ? (
                              <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-blue-600 shrink-0" />
                            )}
                            <span className="text-xs font-bold text-slate-900 tracking-wide uppercase">
                              {subjName}
                            </span>
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                              {subjRows.length} Ders
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <span className="inline-flex items-center gap-1 font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              {uploadedCount} Yüklendi
                            </span>
                            {subjRows.length - uploadedCount > 0 && (
                              <span className="inline-flex items-center gap-1 font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                {subjRows.length - uploadedCount} Bekleyen
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Grup İçi Ders Satırları */}
                    {!collapsed &&
                      subjRows.map((r, idx) => (
                        <TrackingTableRowItem
                          key={r.tracking_id}
                          r={r}
                          idx={idx}
                          moduleId={moduleId}
                          onStatusChange={handleStatusChange}
                          statusPending={statusMutation.isPending}
                          onAudioChange={handleAudioChange}
                        />
                      ))}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/70 flex justify-between items-center text-xs text-slate-500">
        <span>
          {filtered.length} ders gösteriliyor (toplam {rows.length})
        </span>
        <span>Sayaçlar her 60 saniyede bir otomatik güncellenir</span>
      </div>
    </div>
  );
}
