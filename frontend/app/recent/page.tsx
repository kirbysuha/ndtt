"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Clock,
  RefreshCw,
  Search,
  Users,
  Mic,
  MicOff,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  LayoutGrid,
  List,
} from "lucide-react";
import { trackingApi, lessonsApi } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { TimerCell } from "@/components/TimerCell";
import { TeamSelectDropdown } from "@/components/TeamSelectDropdown";
import {
  NOTE_STATUSES,
  AUDIO_STATUSES,
  AUDIO_STATUS_COLORS,
  type NoteStatus,
  type AudioStatus,
  type TrackingTableRow,
} from "@/types";

function fmtDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("tr-TR", {
    weekday: "short",
    day: "numeric",
    month: "long",
  });
}

function getRelativeDateLabel(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.round(
    (new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() -
      new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  if (diffDays === 0) return "Bugün";
  if (diffDays === -1) return "Dün";
  if (diffDays === 1) return "Yarın";
  if (diffDays < 0) return `${Math.abs(diffDays)} gün önce`;
  return `${diffDays} gün sonra`;
}

function StatusButtonDropdown({
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
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer text-xs"
      >
        <StatusBadge status={row.status} size="sm" />
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1.5 z-40 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 min-w-[220px]">
            <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
              Not Durumunu Değiştir
            </div>
            {NOTE_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => {
                  onChange(row.tracking_id, s);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between transition-colors ${
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

function AudioButtonToggle({
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
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border shadow-2xs ${colorClass} hover:opacity-90 transition-opacity cursor-pointer`}
      >
        {status === "Ses yüklendi" ? (
          <Mic className="w-3.5 h-3.5 text-emerald-600" />
        ) : status === "Ses alınamadı" ? (
          <MicOff className="w-3.5 h-3.5 text-red-600" />
        ) : (
          <AlertCircle className="w-3.5 h-3.5 text-gray-500" />
        )}
        <span>{status}</span>
        <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1.5 z-40 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 min-w-[180px]">
            <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
              Ses Durumu
            </div>
            {AUDIO_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => {
                  onChange(lessonId, s);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center gap-2.5 transition-colors ${
                  status === s ? "bg-blue-50 font-medium text-blue-700" : "text-slate-700"
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    s === "Ses yüklendi"
                      ? "bg-emerald-500"
                      : s === "Ses alınamadı"
                      ? "bg-red-500"
                      : "bg-gray-400"
                  }`}
                />
                <span>{s}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function RecentTrackingPage() {
  const queryClient = useQueryClient();
  const [days, setDays] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  const { data: rows = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ["recent-tracking", days],
    queryFn: () => trackingApi.getRecent(days),
    refetchInterval: 60000,
  });

  const statusMutation = useMutation({
    mutationFn: ({ trackingId, status }: { trackingId: string; status: NoteStatus }) =>
      trackingApi.updateStatus(trackingId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recent-tracking"] });
      queryClient.invalidateQueries({ queryKey: ["tracking"] });
    },
  });

  const audioMutation = useMutation({
    mutationFn: ({ lessonId, audioStatus }: { lessonId: string; audioStatus: AudioStatus }) =>
      lessonsApi.update(lessonId, { audio_status: audioStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recent-tracking"] });
      queryClient.invalidateQueries({ queryKey: ["tracking"] });
    },
  });

  const handleStatusChange = (trackingId: string, status: NoteStatus) => {
    statusMutation.mutate({ trackingId, status });
  };

  const handleAudioChange = (lessonId: string, audioStatus: AudioStatus) => {
    audioMutation.mutate({ lessonId, audioStatus });
  };

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchSearch =
        !search ||
        r.subject_name.toLowerCase().includes(search.toLowerCase()) ||
        (r.topic && r.topic.toLowerCase().includes(search.toLowerCase())) ||
        (r.assigned_team && r.assigned_team.toLowerCase().includes(search.toLowerCase())) ||
        (r.order_label && r.order_label.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = statusFilter === "ALL" || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [rows, search, statusFilter]);

  const totalCount = filtered.length;
  const completedCount = filtered.filter(
    (r) => r.status === "Not yüklendi" || r.status === "Not kabul edildi"
  ).length;
  const audioDoneCount = filtered.filter((r) => r.audio_status === "Ses yüklendi").length;
  const unassignedTeamCount = filtered.filter((r) => !r.assigned_team).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Clock className="w-6 h-6 text-blue-600" />
            <span>Son {days} Günün Dersleri</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            İşlenen derslerin not durumunu, ses kaydını ve hazırlayan ekibini anında güncelleyin.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-auto border border-slate-200">
          {[7, 10, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                days === d
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              Son {d} Gün
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Toplam Ders</div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">{totalCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Notu Yüklenenler</div>
            <div className="text-2xl font-bold text-emerald-600 mt-0.5">
              {completedCount}{" "}
              <span className="text-xs text-slate-400 font-normal">/ {totalCount}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Ses Kaydı Hazır</div>
            <div className="text-2xl font-bold text-purple-600 mt-0.5">
              {audioDoneCount}{" "}
              <span className="text-xs text-slate-400 font-normal">/ {totalCount}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Mic className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Ekip Bekleyenler</div>
            <div className="text-2xl font-bold text-amber-600 mt-0.5">{unassignedTeamCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Ders, konu veya ekip ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Tüm Durumlar ({rows.length})</option>
            {NOTE_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50">
            <button
              onClick={() => setViewMode("cards")}
              className={`p-1.5 rounded-md ${
                viewMode === "cards" ? "bg-white shadow-2xs text-blue-600" : "text-slate-400 hover:text-slate-700"
              }`}
              title="Kart Görünümü"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md ${
                viewMode === "table" ? "bg-white shadow-2xs text-blue-600" : "text-slate-400 hover:text-slate-700"
              }`}
              title="Tablo Görünümü"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

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

      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
          Dersler getiriliyor...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
          Son {days} gün içerisinde herhangi bir ders bulunamadı.
        </div>
      ) : viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((r) => {
            const relDate = getRelativeDateLabel(r.lesson_date ? String(r.lesson_date) : null);
            return (
              <div
                key={r.tracking_id}
                className="bg-white rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition-shadow p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md uppercase">
                        {r.subject_name}
                      </span>
                      {r.order_label && (
                        <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md">
                          {r.order_label}
                        </span>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {relDate}
                      </span>
                      <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                        {fmtDate(r.lesson_date ? String(r.lesson_date) : null)}
                      </div>
                    </div>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 min-h-[40px] mb-3">
                    {r.topic || "Konu belirtilmemiş"}
                  </h3>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Not Durumu:</span>
                    <StatusButtonDropdown
                      row={r}
                      onChange={handleStatusChange}
                      disabled={statusMutation.isPending}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Ses Kaydı:</span>
                    <AudioButtonToggle
                      lessonId={r.lesson_id}
                      currentStatus={r.audio_status}
                      onChange={handleAudioChange}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Hazırlayan Ekip:</span>
                    <TeamSelectDropdown
                      lessonId={r.lesson_id}
                      currentTeam={r.assigned_team}
                      size="sm"
                    />
                  </div>

                  {r.submission_time !== "-" && (
                    <div className="mt-2 pt-2 border-t border-dashed border-slate-200 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Gönderilme Süresi:</span>
                      <TimerCell value={r.submission_time} color={r.submission_color} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2.5 text-left">Ders Adı</th>
                  <th className="px-3 py-2.5 text-left">Sıra</th>
                  <th className="px-3 py-2.5 text-left">Konu</th>
                  <th className="px-3 py-2.5 text-left">Tarih</th>
                  <th className="px-3 py-2.5 text-left">Hazırlayan Ekip</th>
                  <th className="px-3 py-2.5 text-left">Not Durumu</th>
                  <th className="px-3 py-2.5 text-left">Ses Kaydı</th>
                  <th className="px-3 py-2.5 text-left">Kalan Süre</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r, idx) => (
                  <tr
                    key={r.tracking_id}
                    className={`hover:bg-blue-50/50 transition-colors ${
                      idx % 2 === 1 ? "bg-slate-50/30" : "bg-white"
                    }`}
                  >
                    <td className="px-3 py-2.5 font-bold text-slate-900">{r.subject_name}</td>
                    <td className="px-3 py-2.5 font-mono font-medium text-slate-600">
                      {r.order_label || "—"}
                    </td>
                    <td className="px-3 py-2.5 max-w-[240px] truncate text-slate-700">
                      {r.topic || "—"}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-slate-600 font-medium">
                      {fmtDate(r.lesson_date ? String(r.lesson_date) : null)}
                    </td>
                    <td className="px-3 py-2.5">
                      <TeamSelectDropdown
                        lessonId={r.lesson_id}
                        currentTeam={r.assigned_team}
                        size="sm"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusButtonDropdown
                        row={r}
                        onChange={handleStatusChange}
                        disabled={statusMutation.isPending}
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <AudioButtonToggle
                        lessonId={r.lesson_id}
                        currentStatus={r.audio_status}
                        onChange={handleAudioChange}
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <TimerCell value={r.submission_time} color={r.submission_color} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
