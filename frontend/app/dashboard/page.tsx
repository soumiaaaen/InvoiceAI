"use client";
import { authFetch } from "@/lib/auth";
import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Wallet, FileStack, TrendingUp, Tags } from "lucide-react";
import MagicBento from "@/components/Magicbento";
// A ajuster selon l'URL reelle de ton backend ASP.NET Core
const API_BASE_URL = "http://localhost:5136";

// Palette utilisee pour la repartition par categorie - cycle si plus
// de couleurs que de categories presentes
const CATEGORY_COLORS = [
  "#3B5BDB", "#5B7CF0", "#7C93F5", "#13224A", "#1E3A8A",
  "#9DAAF8", "#2541B2", "#4C63D2", "#B8C4FA", "#DCE4FF",
];

type CategoryBreakdown = { category: string; total: number };
type MonthlyTotal = { month: string; total: number };
type RecentFacture = {
  id: number;
  merchant: string;
  invoiceDate: string;
  montantTtc: number;
  category: string;
};

type DashboardSummary = {
  totalMonth: number;
  totalFactures: number;
  averageAmount: number;
  topCategory: string;
  topCategoryAmount: number;
  categoryBreakdown: CategoryBreakdown[];
  monthlyEvolution: MonthlyTotal[];
  recentFactures: RecentFacture[];
};

function formatMad(value: number) {
  return `${new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)} MAD`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function SummaryCardContent({
  icon: Icon,
  label,
  value,
  sublabel,
  numeric = true,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sublabel?: string;
  numeric?: boolean;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-11 h-11 rounded-xl bg-accent-tint text-primary flex items-center justify-center shrink-0">
        <Icon size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground/60">{label}</p>
        <p className={`text-xl font-semibold leading-snug break-words ${numeric ? "font-figures" : "font-display"}`}>
          {value}
        </p>
        {sublabel && <p className="text-xs text-foreground/40 mt-1 font-figures">{sublabel}</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7)); // "2026-08"

  useEffect(() => {
    const controller = new AbortController();

    async function loadSummary() {
      setLoading(true);
      setError(null);
      try {
        const res = await authFetch(
          `${API_BASE_URL}/api/dashboard/summary?month=${selectedMonth}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error("Impossible de charger les donnees du tableau de bord.");
        const data: DashboardSummary = await res.json();
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
  }, [selectedMonth]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy">Bonjour,</h1>
          <p className="text-foreground/50 text-sm">
            {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        <div>
          <label className="text-xs text-foreground/50 block mb-1">Mois affiche</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm font-figures bg-white"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-danger bg-danger-tint border border-danger/20 rounded-xl px-4 py-2">
          {error}
        </p>
      )}

      {loading && !summary && (
        <p className="text-sm text-foreground/50">Chargement du tableau de bord...</p>
      )}

      {summary && (
        <>
          

<MagicBento
  glowColor="59, 91, 219"
  spotlightRadius={300}
  particleCount={10}
  enableStars
  enableSpotlight
  enableBorderGlow
  enableTilt={false}
  enableMagnetism={false}
  clickEffect
  textAutoHide
>
  <SummaryCardContent icon={Wallet} label="Total du mois" value={formatMad(summary.totalMonth)} />
  <SummaryCardContent icon={FileStack} label="Nombre de factures" value={summary.totalFactures.toString()} />
  <SummaryCardContent icon={TrendingUp} label="Montant moyen par facture" value={formatMad(summary.averageAmount)} />
  <SummaryCardContent
    icon={Tags}
    label="Categorie la plus depensiere"
    value={summary.topCategory}
    sublabel={formatMad(summary.topCategoryAmount)}
    numeric={false}
  />
</MagicBento>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card p-5">
              <h2 className="font-display font-semibold mb-4 text-navy">Repartition des depenses par categorie</h2>
              {summary.categoryBreakdown.length === 0 ? (
                <p className="text-sm text-foreground/40 py-16 text-center">Aucune donnee pour le moment</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={summary.categoryBreakdown}
                      dataKey="total"
                      nameKey="category"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                    >
                      {summary.categoryBreakdown.map((entry, i) => (
                        <Cell key={entry.category} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatMad(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="card p-5">
              <h2 className="font-display font-semibold mb-4 text-navy">Evolution mensuelle des depenses</h2>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={summary.monthlyEvolution}>
                  <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip formatter={(value) => formatMad(Number(value))} />
                  <Line type="monotone" dataKey="total" stroke="#3B5BDB" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card overflow-hidden">
            <h2 className="font-display font-semibold p-5 pb-0 text-navy">Factures recentes</h2>
            {summary.recentFactures.length === 0 ? (
              <p className="text-sm text-foreground/40 py-10 text-center">Aucune facture pour le moment</p>
            ) : (
              <table className="w-full text-sm mt-4">
                <thead>
                  <tr className="text-left text-foreground/50 border-b border-[var(--color-border)]">
                    <th className="px-5 py-2 font-medium">Fournisseur</th>
                    <th className="px-5 py-2 font-medium">Date</th>
                    <th className="px-5 py-2 font-medium">Montant TTC</th>
                    <th className="px-5 py-2 font-medium">Categorie</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.recentFactures.map((f) => (
                    <tr key={f.id} className="border-b border-[var(--color-border)] last:border-0">
                      <td className="px-5 py-3">{f.merchant}</td>
                      <td className="px-5 py-3 text-foreground/50">{formatDate(f.invoiceDate)}</td>
                      <td className="px-5 py-3 font-medium font-figures">{formatMad(f.montantTtc)}</td>
                      <td className="px-5 py-3 text-foreground/50">{f.category}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}