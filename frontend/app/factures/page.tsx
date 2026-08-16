"use client";

import { useEffect, useState } from "react";
import { Search, Pencil, Trash2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { authFetch } from "@/lib/auth";
import AnimatedList from "@/components/Animatedlist";

// A ajuster selon l'URL reelle de ton backend ASP.NET Core
const API_BASE_URL = "http://localhost:5136";

const PAGE_SIZE = 5;

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
  numeroFacture: string | null;
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
  numeroFacture: string;
  category: string;
};

// Colonnes partagees entre l'en-tete et chaque ligne de la liste, pour
// garder l'alignement sans utiliser une vraie balise <table>.
const ROW_GRID = "grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1.4fr_0.8fr]";

function formatMad(value: number) {
  return `${new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)} MAD`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

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

  const [currentPage, setCurrentPage] = useState(1);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    async function loadFilters() {
      try {
        const res = await authFetch(`${API_BASE_URL}/api/factures/filters`);
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

      const res = await authFetch(`${API_BASE_URL}/api/factures?${params.toString()}`, { signal });
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

  useEffect(() => {
    const controller = new AbortController();
    loadFactures(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, category, month, fournisseur]);

  // Revient a la page 1 a chaque changement de filtre/recherche, sinon
  // on pourrait se retrouver sur une page vide si le nouveau resultat
  // a moins de pages que la position actuelle.
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, category, month, fournisseur]);

  const hasActiveFilters = search || category || month || fournisseur;

  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setMonth("");
    setFournisseur("");
  };

  const totalPages = Math.max(1, Math.ceil(factures.length / PAGE_SIZE));
  const paginatedFactures = factures.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

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
      numeroFacture: f.numeroFacture ?? "",
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
      const res = await authFetch(`${API_BASE_URL}/api/factures/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant: editForm.merchant,
          date: editForm.date,
          montantHt: parseFloat(editForm.montantHt) || 0,
          tvaRate: parseFloat(editForm.tvaRate) || 0,
          montantTva: parseFloat(editForm.montantTva) || 0,
          montantTtc: parseFloat(editForm.montantTtc) || 0,
          numeroFacture: editForm.numeroFacture,
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
      const res = await authFetch(`${API_BASE_URL}/api/factures/${f.id}`, { method: "DELETE" });
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
        <h1 className="font-display text-2xl font-semibold text-navy">Factures</h1>
        <p className="text-foreground/50 text-sm">Toutes vos factures enregistrees</p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un fournisseur..."
            className="w-full border border-[var(--color-border)] rounded-xl pl-9 pr-3 py-2 text-sm bg-white"
          />
        </div>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm bg-white"
        >
          <option value="">Toutes les categories</option>
          {filterOptions.categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm bg-white"
        >
          <option value="">Tous les mois</option>
          {MONTHS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>

        <select
          value={fournisseur}
          onChange={(e) => setFournisseur(e.target.value)}
          className="border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm bg-white"
        >
          <option value="">Tous les fournisseurs</option>
          {filterOptions.suppliers.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {hasActiveFilters && (
          <button onClick={clearFilters} className="text-sm text-primary hover:underline">
            Reinitialiser
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm text-danger bg-danger-tint border border-danger/20 rounded-xl px-4 py-2">
          {error}
        </p>
      )}

      {loading && (
        <p className="text-sm text-foreground/50">Chargement des factures...</p>
      )}

      {!loading && !error && (
        <div className="card overflow-hidden">
          {factures.length === 0 ? (
            <p className="text-sm text-foreground/40 py-10 text-center">
              {hasActiveFilters
                ? "Aucune facture ne correspond a ces filtres"
                : "Aucune facture pour le moment"}
            </p>
          ) : (
            <>
              <div className={`grid ${ROW_GRID} text-left text-foreground/50 border-b border-[var(--color-border)] text-sm`}>
                <div className="px-5 py-3 font-medium">Fournisseur</div>
                <div className="px-5 py-3 font-medium">N° Facture</div>
                <div className="px-5 py-3 font-medium">Date</div>
                <div className="px-5 py-3 font-medium">Montant HT</div>
                <div className="px-5 py-3 font-medium">TVA</div>
                <div className="px-5 py-3 font-medium">Montant TTC</div>
                <div className="px-5 py-3 font-medium">Categorie</div>
                <div className="px-5 py-3 font-medium text-right">Actions</div>
              </div>

              <AnimatedList<Facture>
                items={paginatedFactures}
                onItemSelect={(f) => openEdit(f)}
                showGradients
                enableArrowNavigation
                displayScrollbar={false}
                maxHeight={560}
                renderItem={(f, i, isSelected) => (
                  <div
                    className={`grid ${ROW_GRID} items-center text-sm cursor-pointer border-b border-[var(--color-border)] last:border-0 transition-colors ${
                      isSelected ? "bg-accent-tint" : "hover:bg-[var(--color-background)]"
                    }`}
                  >
                    <div className="px-5 py-3 truncate">{f.merchant}</div>
                    <div className="px-5 py-3 text-foreground/50 font-figures truncate">{f.numeroFacture || "-"}</div>
                    <div className="px-5 py-3 text-foreground/50 font-figures">{formatDate(f.invoiceDate)}</div>
                    <div className="px-5 py-3 font-figures">{formatMad(f.montantHt)}</div>
                    <div className="px-5 py-3 font-figures">{formatMad(f.montantTva)}</div>
                    <div className="px-5 py-3 font-medium font-figures">{formatMad(f.montantTtc)}</div>
                    <div className="px-5 py-3 text-foreground/50 truncate">{f.category}</div>
                    <div className="px-5 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(f);
                          }}
                          className="text-foreground/30 hover:text-primary transition-colors"
                          title="Modifier"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteFacture(f);
                          }}
                          disabled={deletingId === f.id}
                          className="text-foreground/30 hover:text-danger transition-colors disabled:opacity-50"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              />

              <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--color-border)] text-sm">
                <p className="text-foreground/50">
                  {factures.length} facture{factures.length > 1 ? "s" : ""} au total
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
            </>
          )}
        </div>
      )}

      {editingId !== null && editForm && (
        <div className="fixed inset-0 bg-navy/40 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-lg text-navy">Modifier la facture</h2>
              <button onClick={closeEdit} className="text-foreground/40 hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            {editError && (
              <p className="text-sm text-danger bg-danger-tint border border-danger/20 rounded-xl px-3 py-2 mb-4">
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
                label="N° Facture"
                value={editForm.numeroFacture}
                onChange={(v) => updateEditField("numeroFacture", v)}
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
                <label className="text-sm text-foreground/60 block mb-1">Categorie</label>
                <select
                  value={editForm.category}
                  onChange={(e) => updateEditField("category", e.target.value)}
                  className="w-full border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm"
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
                className="px-4 py-2 rounded-xl border border-[var(--color-border)] text-sm hover:bg-[var(--color-background)] disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={saveEdit}
                disabled={savingEdit}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-light text-white text-sm font-medium transition-colors disabled:opacity-50"
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
      <label className="text-sm text-foreground/60 block mb-1">{label}</label>
      <div className="relative">
        <input
          type={type}
          step={type === "number" ? "0.01" : undefined}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm font-figures"
        />
        {suffix && (
          <span className="absolute right-3 top-2 text-xs text-foreground/40">{suffix}</span>
        )}
      </div>
    </div>
  );
}