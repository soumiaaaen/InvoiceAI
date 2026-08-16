"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { authFetch } from "@/lib/auth";
import { Download, ChevronLeft, ChevronRight } from "lucide-react";

// A ajuster selon l'URL reelle de ton backend ASP.NET Core
const API_BASE_URL = "http://localhost:5136";

const BAR_COLORS = [
  "#3B5BDB", "#5B7CF0", "#7C93F5", "#13224A", "#1E3A8A", "#9DAAF8", "#DCE4FF",
];

const PAGE_SIZE = 5;

// Correspond exactement au SupplierSummaryDto renvoye par
// GET /api/fournisseurs/summary (camelCase automatique cote ASP.NET Core)
type FournisseurSummary = {
  merchant: string;
  invoiceCount: number;
  totalTtc: number;
  lastInvoiceDate: string;
  topCategory: string;
};

function formatMad(value: number) {
  return `${new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)} MAD`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// Tronque les noms trop longs pour qu'ils restent lisibles sur l'axe du graphique
function truncate(text: string, max = 14) {
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function ExportButton() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7)); // "2026-08"
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = async () => {
    setExporting(true);
    setExportError(null);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/fournisseurs/export?month=${month}`);
      if (!res.ok) throw new Error("Export impossible pour ce mois.");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `depenses_${month}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "Export impossible.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm font-figures bg-white"
        />
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 bg-primary hover:bg-primary-light text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
        >
          <Download size={16} />
          {exporting ? "Export..." : "Exporter en Excel"}
        </button>
      </div>
      {exportError && <p className="text-xs text-danger">{exportError}</p>}
    </div>
  );
}

export default function FournisseursPage() {
  const [summary, setSummary] = useState<FournisseurSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSummary() {
      setLoading(true);
      setError(null);
      try {
        const res = await authFetch(`${API_BASE_URL}/api/fournisseurs/summary`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Impossible de charger les donnees fournisseurs.");
        const data: FournisseurSummary[] = await res.json();
        setSummary(data);
      } catch (e) {
        if (e instanceof Error && e.name !== "AbortError") {
          setError(e.message);
        }
      } finally {
        setLoading(false);
      }
    }

    loadSummary();
    return () => controller.abort();
  }, []);

  const totalGlobal = summary.reduce((sum, s) => sum + s.totalTtc, 0);
  const chartData = summary.map((s) => ({ ...s, label: truncate(s.merchant) }));

  const totalPages = Math.max(1, Math.ceil(summary.length / PAGE_SIZE));
  const paginatedSummary = summary.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy">Fournisseurs</h1>
          <p className="text-foreground/50 text-sm">Repartition des depenses par fournisseur</p>
        </div>
        <ExportButton />
      </div>

      {error && (
        <p className="text-sm text-danger bg-danger-tint border border-danger/20 rounded-xl px-4 py-2">
          {error}
        </p>
      )}

      {loading && (
        <p className="text-sm text-foreground/50">Chargement des fournisseurs...</p>
      )}

      {!loading && !error && summary.length === 0 && (
        <div className="card p-10 text-center text-sm text-foreground/40">
          Aucun fournisseur pour le moment
        </div>
      )}

      {!loading && !error && summary.length > 0 && (
        <>
          <div className="card p-5">
            <h2 className="font-display font-semibold mb-4 text-navy">Montant total paye par fournisseur</h2>
            <ResponsiveContainer width="100%" height={Math.max(280, summary.length * 44)}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 24 }}>
                <XAxis type="number" stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
                <YAxis type="category" dataKey="label" stroke="#9ca3af" fontSize={12} width={110} />
                <Tooltip
                  formatter={(value) => formatMad(Number(value))}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.merchant ?? ""}
                />
                <Bar dataKey="totalTtc" radius={[0, 6, 6, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card overflow-hidden">
            <h2 className="font-display font-semibold p-5 pb-0 text-navy">Detail par fournisseur</h2>
            <table className="w-full text-sm mt-4">
              <thead>
                <tr className="text-left text-foreground/50 border-b border-[var(--color-border)]">
                  <th className="px-5 py-3 font-medium">Fournisseur</th>
                  <th className="px-5 py-3 font-medium">Factures</th>
                  <th className="px-5 py-3 font-medium">Montant total</th>
                  <th className="px-5 py-3 font-medium">Montant moyen</th>
                  <th className="px-5 py-3 font-medium">Part du total</th>
                  <th className="px-5 py-3 font-medium">Derniere facture</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSummary.map((s) => (
                  <tr key={s.merchant} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="px-5 py-3">{s.merchant}</td>
                    <td className="px-5 py-3 text-foreground/50 font-figures">{s.invoiceCount}</td>
                    <td className="px-5 py-3 font-medium font-figures">{formatMad(s.totalTtc)}</td>
                    <td className="px-5 py-3 text-foreground/50 font-figures">
                      {formatMad(s.invoiceCount > 0 ? s.totalTtc / s.invoiceCount : 0)}
                    </td>
                    <td className="px-5 py-3 text-foreground/50 font-figures">
                      {totalGlobal > 0 ? `${((s.totalTtc / totalGlobal) * 100).toFixed(1)}%` : "-"}
                    </td>
                    <td className="px-5 py-3 text-foreground/50 font-figures">{formatDate(s.lastInvoiceDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--color-border)] text-sm">
              <p className="text-foreground/50">
                {summary.length} fournisseur{summary.length > 1 ? "s" : ""} au total
                {totalPages > 1 && ` — page ${currentPage} / ${totalPages}`}
              </p>

              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-[var(--color-border)] text-foreground/50 hover:bg-[var(--color-background)] disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Page precedente"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`w-8 h-8 rounded-lg text-sm font-figures transition-colors ${
                        p === currentPage
                          ? "bg-primary text-white"
                          : "text-foreground/60 hover:bg-[var(--color-background)]"
                      }`}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-[var(--color-border)] text-foreground/50 hover:bg-[var(--color-background)] disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Page suivante"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}