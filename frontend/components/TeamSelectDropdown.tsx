"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, ChevronDown, Check, Plus, X } from "lucide-react";
import { teamsApi, lessonsApi } from "@/lib/api";

interface TeamSelectDropdownProps {
  lessonId: string;
  currentTeam: string | null;
  moduleId?: string;
  size?: "sm" | "md";
}

export function TeamSelectDropdown({
  lessonId,
  currentTeam,
  moduleId,
  size = "sm",
}: TeamSelectDropdownProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const { data: teams = [] } = useQuery({
    queryKey: ["teams"],
    queryFn: teamsApi.list,
  });

  const mutation = useMutation({
    mutationFn: (newTeam: string | null) =>
      lessonsApi.update(lessonId, { assigned_team: newTeam }),
    onSuccess: () => {
      if (moduleId) {
        queryClient.invalidateQueries({ queryKey: ["tracking", moduleId] });
      }
      queryClient.invalidateQueries({ queryKey: ["recent-tracking"] });
      setOpen(false);
      setShowCustomInput(false);
      setCustomName("");
    },
  });

  const handleSelect = (teamName: string | null) => {
    mutation.mutate(teamName);
  };

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customName.trim()) {
      handleSelect(customName.trim());
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen(!open)}
        disabled={mutation.isPending}
        className={`inline-flex items-center gap-1.5 rounded-md border transition-all cursor-pointer ${
          currentTeam
            ? "bg-slate-100/90 text-slate-800 border-slate-300 hover:bg-slate-200/80 font-medium"
            : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/80"
        } ${size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1.5 text-sm"}`}
        title="Hazırlayan ekibi değiştir"
      >
        <Users className="w-3 h-3 opacity-60 shrink-0" />
        <span className="truncate max-w-[130px]">{currentTeam || "Ekip Ata"}</span>
        <ChevronDown className="w-3 h-3 opacity-50 shrink-0 ml-0.5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-30 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 min-w-[200px] text-xs">
            <div className="px-3 py-1 font-semibold text-slate-500 border-b border-slate-100 flex items-center justify-between">
              <span>Hazırlayan Ekip</span>
              {currentTeam && (
                <button
                  onClick={() => handleSelect(null)}
                  className="text-red-600 hover:text-red-700 hover:underline font-normal text-[11px]"
                >
                  Kaldır
                </button>
              )}
            </div>

            <div className="max-h-48 overflow-y-auto py-1">
              {teams.length === 0 && (
                <p className="px-3 py-1.5 text-slate-400 italic">Kayıtlı ekip yok</p>
              )}
              {teams.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSelect(t.name)}
                  className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center justify-between transition-colors ${
                    currentTeam === t.name ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-700"
                  }`}
                >
                  <span className="truncate">{t.name}</span>
                  {currentTeam === t.name && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                </button>
              ))}
            </div>

            {/* Özel Ekip İsmi Ekleme */}
            <div className="border-t border-slate-100 pt-1.5 px-2">
              {!showCustomInput ? (
                <button
                  onClick={() => setShowCustomInput(true)}
                  className="w-full text-left px-2 py-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 rounded flex items-center gap-1.5 font-medium transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Farklı ekip yaz...</span>
                </button>
              ) : (
                <form onSubmit={handleSaveCustom} className="flex gap-1.5 py-1">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Ekip adı..."
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="flex-1 px-2 py-1 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                  />
                  <button
                    type="submit"
                    className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                  >
                    Ekle
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCustomInput(false)}
                    className="p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
