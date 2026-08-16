"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Sparkles, CheckCircle2, ExternalLink, FileText } from "lucide-react";
import { authFetch } from "@/lib/auth";

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

type FactureForm = {
  merchant: string;
  date: string;
  montantHt: string;
  tvaRate: string;
  montantTva: string;
  montantTtc: string;
  numeroFacture: string;
  category: string;
};

// A ajuster selon l'URL reelle de ton backend ASP.NET Core
const API_BASE_URL = "http://localhost:5136";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function UploadFacturePage() {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<FactureForm | null>(null);

  // Garde une reference vers l'URL objet courante pour pouvoir la revoquer
  // proprement (evite les fuites memoire) des qu'un nouveau fichier arrive
  // ou que le composant est demonte.
  const previewUrlRef = useRef<string | null>(null);
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const updateField = (key: keyof FactureForm, value: string) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleFile = async (selected: File) => {
    setFile(selected);
    setError(null);
    setForm(null);
    setSaved(false);

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    // PDF et image se previsualisent tous les deux via un object URL -
    // seul le rendu (iframe vs img) differe plus bas.
    const isPreviewable = selected.type.startsWith("image/") || selected.type === "application/pdf";
    const url = isPreviewable ? URL.createObjectURL(selected) : null;
    previewUrlRef.current = url;
    setPreviewUrl(url);

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", selected);

      const res = await authFetch(`${API_BASE_URL}/api/factures/extract`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail || "Echec de l'extraction automatique.");
      }

      const data = await res.json();
      setForm({
        merchant: data.merchant ?? "",
        date: data.date ?? "",
        montantHt: data.montant_ht?.toString() ?? "",
        tvaRate: data.tva_rate?.toString() ?? "",
        montantTva: data.montant_tva?.toString() ?? "",
        montantTtc: data.montant_ttc?.toString() ?? "",
        numeroFacture: data.numero_facture ?? "",
        category: data.category ?? "Autre",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) handleFile(dropped);
  };

  const handleCancel = () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setFile(null);
    setPreviewUrl(null);
    setForm(null);
    setError(null);
    setSaved(false);
  };

  const handleConfirm = async () => {
    if (!form || !file) return;

    if (!form.merchant.trim()) {
      setError("Le nom du fournisseur est requis.");
      return;
    }
    if (!form.date) {
      setError("La date est requise.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("Merchant", form.merchant);
      formData.append("Date", form.date);
      formData.append("MontantHt", form.montantHt || "0");
      formData.append("TvaRate", form.tvaRate || "0");
      formData.append("MontantTva", form.montantTva || "0");
      formData.append("MontantTtc", form.montantTtc || "0");
      formData.append("NumeroFacture", form.numeroFacture || "");
      formData.append("Category", form.category);
      formData.append("file", file);

      const res = await authFetch(`${API_BASE_URL}/api/factures`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Echec de l'enregistrement.");
      }

      setSaved(true);
      setTimeout(() => {
        router.push("/factures");
      }, 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setSaving(false);
    }
  };

  const needsReview =
    form &&
    form.montantHt !== "" &&
    form.montantTtc !== "" &&
    Math.abs(parseFloat(form.montantHt) - parseFloat(form.montantTtc)) < 0.01;

  const isPdf = file?.type === "application/pdf";
  const isImage = file?.type.startsWith("image/");

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-2xl font-semibold text-navy mb-6">Ajouter une facture</h1>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="border-2 border-dashed border-primary/30 rounded-2xl bg-accent-tint/40 py-16 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-accent-tint/60 transition-colors"
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <UploadCloud className="text-primary mb-3" size={36} />
        <p className="font-medium text-navy">Glissez votre facture ici</p>
        <p className="text-sm text-foreground/50">ou cliquez pour parcourir (PDF, JPG, PNG)</p>
        <input
          id="file-input"
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>

      {loading && (
        <p className="text-sm text-primary mt-4">Analyse de la facture en cours...</p>
      )}

      {error && (
        <p className="text-sm text-danger mt-4 bg-danger-tint border border-danger/20 rounded-xl px-4 py-2">
          {error}
        </p>
      )}

      {saved && (
        <div className="flex items-center gap-2 text-sm text-success mt-4 bg-success-tint border border-success/20 rounded-xl px-4 py-2">
          <CheckCircle2 size={16} />
          Facture enregistree - redirection...
        </div>
      )}

      {form && !saved && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <div className="card p-3">
            {/* Barre d'info : nom du fichier, taille, ouverture en plein onglet */}
            {file && (
              <div className="flex items-center justify-between px-2 py-1.5 mb-2 text-xs text-foreground/50">
                <span className="flex items-center gap-1.5 truncate">
                  <FileText size={13} className="shrink-0" />
                  <span className="truncate">{file.name}</span>
                  <span className="shrink-0">· {formatFileSize(file.size)}</span>
                </span>
                {previewUrl && (
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline shrink-0 ml-2"
                  >
                    <ExternalLink size={13} />
                    Ouvrir
                  </a>
                )}
              </div>
            )}

            {isPdf && previewUrl ? (
              <iframe
                src={previewUrl}
                title="Apercu facture"
                className="w-full rounded-lg border border-[var(--color-border)]"
                style={{ height: 520 }}
              />
            ) : isImage && previewUrl ? (
              <img src={previewUrl} alt="Apercu facture" className="rounded-lg w-full" />
            ) : (
              <div className="h-64 flex items-center justify-center text-foreground/40 text-sm">
                {file?.name}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 text-primary bg-accent-tint rounded-xl px-3 py-2 text-sm mb-4 w-fit">
              <Sparkles size={16} />
              Extrait automatiquement par IA - veuillez verifier
            </div>

            {needsReview && (
              <div className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mb-4">
                La TVA n'a pas ete detectee automatiquement - verifiez les montants avant de confirmer.
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Fournisseur"
                value={form.merchant}
                onChange={(v) => updateField("merchant", v)}
              />
              <Field
                label="N° Facture"
                value={form.numeroFacture}
                onChange={(v) => updateField("numeroFacture", v)}
              />
              <Field
                label="Date"
                type="date"
                value={form.date}
                onChange={(v) => updateField("date", v)}
              />
              <Field
                label="Montant HT"
                type="number"
                value={form.montantHt}
                onChange={(v) => updateField("montantHt", v)}
                suffix="MAD"
              />
              <Field
                label="TVA (%)"
                type="number"
                value={form.tvaRate}
                onChange={(v) => updateField("tvaRate", v)}
              />
              <Field
                label="Montant TVA"
                type="number"
                value={form.montantTva}
                onChange={(v) => updateField("montantTva", v)}
                suffix="MAD"
              />
              <Field
                label="Montant TTC"
                type="number"
                value={form.montantTtc}
                onChange={(v) => updateField("montantTtc", v)}
                suffix="MAD"
              />
              <div className="col-span-2">
                <label className="text-sm text-foreground/60 block mb-1">Categorie</label>
                <select
                  value={form.category}
                  onChange={(e) => updateField("category", e.target.value)}
                  className="w-full border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-4 py-2 rounded-xl border border-[var(--color-border)] text-sm hover:bg-[var(--color-background)] disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirm}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-light text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                {saving ? "Enregistrement..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
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