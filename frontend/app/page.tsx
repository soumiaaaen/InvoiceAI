"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Wallet, FileStack, TrendingUp, Tags } from "lucide-react";
import { authFetch } from "@/lib/auth";

// A ajuster selon l'URL reelle de ton backend ASP.NET Core
const API_BASE_URL = "http://localhost:5136";

// Palette utilisee pour la repartition par categorie - cycle si plus
// de couleurs que de categories presentes
const CATEGORY_COLORS = [
  "#1d4ed8", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe", "#dbeafe",
  "#1e40af", "#2563eb", "#4f46e5", "#818cf8", "#a5b4fc", "#c7d2fe", "#e0e7ff",
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

function SummaryCard({
  icon: Icon,
  label,
  value,
  sublabel,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sublabel?: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-start gap-4">
      <div className="w-11 h-11 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
        <Icon size={20} />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-semibold">{value}</p>
        {sublabel && <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSummary() {
      setLoading(true);
      setError(null);
      try {
        const res = await authFetch(`${API_BASE_URL}/api/dashboard/summary`, {
          signal: controller.signal,
        });
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
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bonjour,</h1>
        <p className="text-gray-500 text-sm">
          {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2">
          {error}
        </p>
      )}

      {loading && !summary && (
        <p className="text-sm text-gray-500">Chargement du tableau de bord...</p>
      )}

      {summary && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard icon={Wallet} label="Total du mois" value={formatMad(summary.totalMonth)} />
            <SummaryCard
              icon={FileStack}
              label="Nombre de factures"
              value={summary.totalFactures.toString()}
            />
            <SummaryCard
              icon={TrendingUp}
              label="Montant moyen par facture"
              value={formatMad(summary.averageAmount)}
            />
            <SummaryCard
              icon={Tags}
              label="Categorie la plus depensiere"
              value={summary.topCategory}
              sublabel={formatMad(summary.topCategoryAmount)}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-semibold mb-4">Repartition des depenses par categorie</h2>
              {summary.categoryBreakdown.length === 0 ? (
                <p className="text-sm text-gray-400 py-16 text-center">Aucune donnee pour le moment</p>
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

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-semibold mb-4">Evolution mensuelle des depenses</h2>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={summary.monthlyEvolution}>
                  <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip formatter={(value) => formatMad(Number(value))} />
                  <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <h2 className="font-semibold p-5 pb-0">Factures recentes</h2>
            {summary.recentFactures.length === 0 ? (
              <p className="text-sm text-gray-400 py-10 text-center">Aucune facture pour le moment</p>
            ) : (
              <table className="w-full text-sm mt-4">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="px-5 py-2 font-medium">Fournisseur</th>
                    <th className="px-5 py-2 font-medium">Date</th>
                    <th className="px-5 py-2 font-medium">Montant TTC</th>
                    <th className="px-5 py-2 font-medium">Categorie</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.recentFactures.map((f) => (
                    <tr key={f.id} className="border-b border-gray-50 last:border-0">
                      <td className="px-5 py-3">{f.merchant}</td>
                      <td className="px-5 py-3 text-gray-500">{formatDate(f.invoiceDate)}</td>
                      <td className="px-5 py-3 font-medium">{formatMad(f.montantTtc)}</td>
                      <td className="px-5 py-3 text-gray-500">{f.category}</td>
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