"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Upload,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  FileText,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { classesApi, modulesApi, importApi, type PdfPreviewResult } from "@/lib/api";
import type { ImportResult } from "@/types";

export default function ImportPage() {
  const [tab, setTab] = useState<"pdf" | "excel">("pdf");
  const [cls, setCls] = useState("");
  const [mod, setMod] = useState("");
  const [ow, setOw] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [preview, setPreview] = useState<PdfPreviewResult | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const { data: classes = [] } = useQuery({ queryKey: ["classes"], queryFn: classesApi.list });
  const { data: modules = [] } = useQuery({
    queryKey: ["modules", cls],
    queryFn: () => modulesApi.list(cls),
    enabled: !!cls,
  });

  const importMutation = useMutation({
    mutationFn: () => {
      if (tab === "pdf") {
        return importApi.importPdf(mod, file!, ow);
      }
      return importApi.importExcel(mod, file!, ow);
    },
    onSuccess: (d) => {
      setResult(d);
      setErr(null);
      setFile(null);
      setPreview(null);
      if (ref.current) ref.current.value = "";
    },
    onError: (e: unknown) => {
      setErr(e instanceof Error ? e.message : "Aktarma sırasında hata oluştu");
      setResult(null);
    },
  });

  const handleFileChange = async (selected: File | null) => {
    setFile(selected);
    setResult(null);
    setErr(null);
    setPreview(null);
    if (selected && tab === "pdf" && selected.name.toLowerCase().endsWith(".pdf")) {
      setIsPreviewing(true);
      try {
        const p = await importApi.previewPdf(selected);
        setPreview(p);
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : "PDF ayrıştırılamadı");
      } finally {
        setIsPreviewing(false);
      }
    }
  };


  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Ders Programı & İçe Aktarma</h1>
        <p className="text-gray-500 text-sm mt-1">
          Haftalık ders programı PDF dosyasından veya mevcut Excel takip tablosundan dersleri sisteme aktarın.
        </p>
      </div>

      {/* Sekmeler */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          onClick={() => {
            setTab("pdf");
            setFile(null);
            setResult(null);
            setPreview(null);
            if (ref.current) ref.current.value = "";
          }}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            tab === "pdf"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Haftalık Program (PDF)</span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
            Önerilen
          </span>
        </button>

        <button
          onClick={() => {
            setTab("excel");
            setFile(null);
            setResult(null);
            setPreview(null);
            if (ref.current) ref.current.value = "";
          }}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            tab === "excel"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Excel Import (.xlsx)</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        {tab === "pdf" && (
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-800 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900">Otomatik Filtreleme & Birleştirme</p>
              <p className="mt-0.5 text-blue-700 leading-relaxed">
                Yalnızca <strong>Sunum</strong> ve <strong>Uygulama</strong> dersleri taranır. PDÖ, Seçmeli ve Bağımsız Çalışma elenir. 1.Y ve 2.Y uygulama dersleri tek ders kaydında birleştirilir.
              </p>
            </div>
          </div>
        )}

        {/* Sınıf & Modül Seçimi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Hedef Sınıf</label>
            <select
              value={cls}
              onChange={(e) => {
                setCls(e.target.value);
                setMod("");
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sınıf seçin...</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Hedef Modül</label>
            <select
              value={mod}
              onChange={(e) => setMod(e.target.value)}
              disabled={!cls}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="">Modül seçin...</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Dosya Seçim Alanı */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {tab === "pdf" ? "Haftalık Ders Programı Dosyası (.pdf)" : "Excel Dosyası (.xlsx)"}
          </label>
          <div
            className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/20 transition-colors"
            onClick={() => ref.current?.click()}
          >
            {file ? (
              <div className="flex items-center justify-center gap-2">
                {tab === "pdf" ? (
                  <FileText className="w-6 h-6 text-red-600" />
                ) : (
                  <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                )}
                <span className="text-sm font-medium text-gray-800">{file.name}</span>
                <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
            ) : (
              <div>
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                <p className="text-sm text-gray-600">
                  Dosya seçmek için tıklayın ({tab === "pdf" ? ".pdf" : ".xlsx, .xls"})
                </p>
              </div>
            )}
          </div>
          <input
            ref={ref}
            type="file"
            accept={tab === "pdf" ? ".pdf" : ".xlsx,.xls"}
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
          />
        </div>


        {/* PDF Önizleme Bilgi Kutusu */}
        {isPreviewing && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span>PDF analiz ediliyor, dersler ayıklanıyor...</span>
          </div>
        )}

        {preview && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                PDF Ayrıştırma Önizlemesi
              </span>
              <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                Analiz Başarılı
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <div className="text-lg font-bold text-slate-900">{preview.total}</div>
                <div className="text-[11px] text-slate-500 font-medium">Toplam Ders</div>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <div className="text-lg font-bold text-blue-600">{preview.sunum_count}</div>
                <div className="text-[11px] text-slate-500 font-medium">Sunum</div>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <div className="text-lg font-bold text-purple-600">{preview.uygulama_count}</div>
                <div className="text-[11px] text-slate-500 font-medium">Uygulama</div>
              </div>
            </div>

            <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 bg-white rounded-lg border border-slate-200 text-xs">
              {preview.lessons.slice(0, 10).map((l, i) => (
                <div key={i} className="px-3 py-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate max-w-[340px]">
                    <span className="font-bold text-slate-800 shrink-0">{l.subject_name}</span>
                    <span className="font-mono text-slate-500 shrink-0">{l.order_label}</span>
                    <span className="text-slate-400 truncate">{l.topic}</span>
                  </div>
                  <span className="text-slate-500 text-[11px] shrink-0 font-medium ml-2">
                    {new Date(l.lesson_date).toLocaleDateString("tr-TR")}
                  </span>
                </div>
              ))}
              {preview.lessons.length > 10 && (
                <div className="px-3 py-1.5 text-center text-slate-400 text-[11px] bg-slate-50">
                  ... ve {preview.lessons.length - 10} ders daha
                </div>
              )}
            </div>
          </div>
        )}

        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={ow}
            onChange={(e) => setOw(e.target.checked)}
            className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
          />
          <span>Mevcut derslerin üzerine yaz (güncelle)</span>
        </label>

        {err && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
            <span>{err}</span>
          </div>
        )}

        {result && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-sm font-medium text-emerald-800">{result.message}</p>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-xs mt-2">
              <div className="bg-white rounded p-2 border border-emerald-100">
                <p className="font-bold text-gray-800 text-base">{result.total}</p>
                <p className="text-gray-500">Toplam</p>
              </div>
              <div className="bg-white rounded p-2 border border-emerald-100">
                <p className="font-bold text-emerald-600 text-base">{result.created}</p>
                <p className="text-gray-500">Oluşturuldu</p>
              </div>
              <div className="bg-white rounded p-2 border border-emerald-100">
                <p className="font-bold text-blue-600 text-base">{result.updated}</p>
                <p className="text-gray-500">Güncellendi</p>
              </div>
              <div className="bg-white rounded p-2 border border-emerald-100">
                <p className="font-bold text-orange-600 text-base">{result.skipped}</p>
                <p className="text-gray-500">Atlandı</p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => importMutation.mutate()}
          disabled={!(mod && file) || importMutation.isPending}
          className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-xs"
        >
          {importMutation.isPending
            ? "Aktarılıyor..."
            : tab === "pdf"
            ? "Ders Programını Modüle Aktar"
            : "Excel'i İçe Aktar"}
        </button>
      </div>
    </div>
  );
}

