"use client";

import { useEffect, useState } from "react";
import { Search, Pencil, Trash2, X } from "lucide-react";

// A ajuster selon l'URL reelle de ton backend ASP.NET Core
const API_BASE_URL = "http://localhost:5136";

const MONTHS = [
  { value: "1", label: "Janvier" },
  { value: "2", label: "Fevrier" },
  { value: "3", label: "Mars" },
  { value: "4", label: "Avril" },
  { value: "5", label: "Mai" },
  { value: "6", label: "Juin" },
  { value: "7", label: "Juillet" },
  { value: "8", label: "Aout" },
  { value: "9", label: "Septembre" },
  { value: "10", label: "Octobre" },
  { value: "11", label: "Novembre" },
  { value: "12", label: "Decembre" },
];

const CATEGORIES = [
  "Matieres premieres",
  "Accessoires et garnitures",
  "Emballage",
  "Transport et logistique",
  "Machines et equipements",
  "Maintenance et reparations",
  "Utilites",
  "Fournitures de bureau",
  "Services professionnels",
  "Loyer et installations",
  "Marketing et ventes",
  "Taxes et frais administratifs",
  "Autre",
];

type Facture = {
  id: number;
  merchant: string;
  invoiceDate: string;
  montantHt: number;
  tvaRate: number;
  montantTva: number;
  montantTtc: number;
  category: string;
};

type FilterOptions = {
  categories: string[];
  suppliers: string[];
};

type EditForm = {
  merchant: string;
  date: string;
  montantHt: string;
  tvaRate: string;
  montantTva: string;
  montantTtc: string;
  category: string;
};

function formatMad(value: number) {
  return `${new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)} MAD`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// Convertit une date ISO (avec heure) en "YYYY-MM-DD" pour un <input type="date">
function toDateInputValue(iso: string) {
  return iso.slice(0, 10);
}

export default function FacturesPage() {
  const [factures, setFactures] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ categories: [], suppliers: [] });

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");
  const [month, setMonth] = useState("");
  const [fournisseur, setFournisseur] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Debounce la recherche texte pour eviter un fetch a chaque frappe
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timeout);
  }, [search]);

  // Charge les options de filtres une seule fois (categories/fournisseurs
  // reellement presents en base)
  useEffect(() => {
    async function loadFilters() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/factures/filters`);
        if (res.ok) {
          const data: FilterOptions = await res.json();
          setFilterOptions(data);
        }
      } catch {
        // Non bloquant : les filtres restent vides si l'appel echoue
      }
    }
    loadFilters();
  }, []);

  async function loadFactures(signal?: AbortSignal) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (category) params.set("category", category);
      if (month) params.set("month", month);
      if (fournisseur) params.set("fournisseur", fournisseur);

      const res = await fetch(`${API_BASE_URL}/api/factures?${params.toString()}`, { signal });
      if (!res.ok) throw new Error("Impossible de charger les factures.");
      const data: Facture[] = await res.json();
      setFactures(data);
    } catch (e) {
      if (e instanceof Error && e.name !== "AbortError") {
        setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  }

  // Recharge la liste des factures a chaque changement de filtre
  useEffect(() => {
    const controller = new AbortController();
    loadFactures(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, category, month, fournisseur]);

  const hasActiveFilters = search || category || month || fournisseur;

  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setMonth("");
    setFournisseur("");
  };

  const openEdit = (f: Facture) => {
    setEditingId(f.id);
    setEditError(null);
    setEditForm({
      merchant: f.merchant,
      date: toDateInputValue(f.invoiceDate),
      montantHt: f.montantHt.toString(),
      tvaRate: f.tvaRate.toString(),
      montantTva: f.montantTva.toString(),
      montantTtc: f.montantTtc.toString(),
      category: f.category,
    });
  };

  const closeEdit = () => {
    setEditingId(null);
    setEditForm(null);
    setEditError(null);
  };

  const updateEditField = (key: keyof EditForm, value: string) => {
    setEditForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const saveEdit = async () => {
    if (!editForm || editingId === null) return;

    if (!editForm.merchant.trim()) {
      setEditError("Le nom du fournisseur est requis.");
      return;
    }
    if (!editForm.date) {
      setEditError("La date est requise.");
      return;
    }

    setSavingEdit(true);
    setEditError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/factures/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant: editForm.merchant,
          date: editForm.date,
          montantHt: parseFloat(editForm.montantHt) || 0,
          tvaRate: parseFloat(editForm.tvaRate) || 0,
          montantTva: parseFloat(editForm.montantTva) || 0,
          montantTtc: parseFloat(editForm.montantTtc) || 0,
          category: editForm.category,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Echec de la mise a jour.");
      }

      closeEdit();
      loadFactures();
    } catch (e) {
      setEditError(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteFacture = async (f: Facture) => {
    const confirmed = window.confirm(
      `Supprimer la facture de "${f.merchant}" du ${formatDate(f.invoiceDate)} ? Cette action est irreversible.`
    );
    if (!confirmed) return;

    setDeletingId(f.id);
    try {
      const res = await fetch(`${API_BASE_URL}/api/factures/${f.id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Echec de la suppression.");
      }
      setFactures((prev) => prev.filter((item) => item.id !== f.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Factures</h1>
        <p className="text-gray-500 text-sm">Toutes vos factures enregistrees</p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un fournisseur..."
            className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm"
          />
        </div>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">Toutes les categories</option>
          {filterOptions.categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">Tous les mois</option>
          {MONTHS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>

        <select
          value={fournisseur}
          onChange={(e) => setFournisseur(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">Tous les fournisseurs</option>
          {filterOptions.suppliers.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {hasActiveFilters && (
          <button onClick={clearFilters} className="text-sm text-blue-600 hover:underline">
            Reinitialiser
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2">
          {error}
        </p>
      )}

      {loading && (
        <p className="text-sm text-gray-500">Chargement des factures...</p>
      )}

      {!loading && !error && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {factures.length === 0 ? (
            <p className="text-sm text-gray-400 py-10 text-center">
              {hasActiveFilters
                ? "Aucune facture ne correspond a ces filtres"
                : "Aucune facture pour le moment"}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="px-5 py-3 font-medium">Fournisseur</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Montant HT</th>
                  <th className="px-5 py-3 font-medium">TVA</th>
                  <th className="px-5 py-3 font-medium">Montant TTC</th>
                  <th className="px-5 py-3 font-medium">Categorie</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {factures.map((f) => (
                  <tr key={f.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-5 py-3">{f.merchant}</td>
                    <td className="px-5 py-3 text-gray-500">{formatDate(f.invoiceDate)}</td>
                    <td className="px-5 py-3">{formatMad(f.montantHt)}</td>
                    <td className="px-5 py-3">{formatMad(f.montantTva)}</td>
                    <td className="px-5 py-3 font-medium">{formatMad(f.montantTtc)}</td>
                    <td className="px-5 py-3 text-gray-500">{f.category}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => openEdit(f)}
                          className="text-gray-400 hover:text-blue-600"
                          title="Modifier"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => deleteFacture(f)}
                          disabled={deletingId === f.id}
                          className="text-gray-400 hover:text-red-600 disabled:opacity-50"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {editingId !== null && editForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Modifier la facture</h2>
              <button onClick={closeEdit} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            {editError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
                {editError}
              </p>
            )}

            <div className="grid grid-cols-2 gap-4">
              <EditField
                label="Fournisseur"
                value={editForm.merchant}
                onChange={(v) => updateEditField("merchant", v)}
              />
              <EditField
                label="Date"
                type="date"
                value={editForm.date}
                onChange={(v) => updateEditField("date", v)}
              />
              <EditField
                label="Montant HT"
                type="number"
                value={editForm.montantHt}
                onChange={(v) => updateEditField("montantHt", v)}
                suffix="MAD"
              />
              <EditField
                label="TVA (%)"
                type="number"
                value={editForm.tvaRate}
                onChange={(v) => updateEditField("tvaRate", v)}
              />
              <EditField
                label="Montant TVA"
                type="number"
                value={editForm.montantTva}
                onChange={(v) => updateEditField("montantTva", v)}
                suffix="MAD"
              />
              <EditField
                label="Montant TTC"
                type="number"
                value={editForm.montantTtc}
                onChange={(v) => updateEditField("montantTtc", v)}
                suffix="MAD"
              />
              <div className="col-span-2">
                <label className="text-sm text-gray-600 block mb-1">Categorie</label>
                <select
                  value={editForm.category}
                  onChange={(e) => updateEditField("category", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={closeEdit}
                disabled={savingEdit}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={saveEdit}
                disabled={savingEdit}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {savingEdit ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EditField({
  label,
  value,
  onChange,
  type = "text",
  suffix,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  suffix?: string;
}) {
  return (
    <div>
      <label className="text-sm text-gray-600 block mb-1">{label}</label>
      <div className="relative">
        <input
          type={type}
          step={type === "number" ? "0.01" : undefined}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
        />
        {suffix && (
          <span className="absolute right-3 top-2 text-xs text-gray-400">{suffix}</span>
        )}
      </div>
    </div>
  );
}