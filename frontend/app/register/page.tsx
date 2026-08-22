"use client";

import { useState, useRef, type KeyboardEvent, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { saveAuth } from "@/lib/auth";
import { X, Upload } from "lucide-react";

const API_BASE_URL = "http://localhost:5136";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [categoryInput, setCategoryInput] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvAddedCount, setCsvAddedCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  // Ajoute une categorie en evitant les doublons (insensible a la casse)
  const addUniqueCategories = (names: string[]) => {
    setCategories((prev) => {
      const existingLower = new Set(prev.map((c) => c.toLowerCase()));
      const additions: string[] = [];
      for (const raw of names) {
        const name = raw.trim();
        if (!name) continue;
        const lower = name.toLowerCase();
        if (existingLower.has(lower)) continue;
        existingLower.add(lower);
        additions.push(name);
      }
      return [...prev, ...additions];
    });
  };

  const addCategory = () => {
    const name = categoryInput.trim();
    if (!name) return;
    addUniqueCategories([name]);
    setCategoryInput("");
    setError(null);
  };

  const removeCategory = (name: string) => {
    setCategories((prev) => prev.filter((c) => c !== name));
  };

  const handleCategoryKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addCategory();
    }
  };

  // Accepte : une categorie par ligne, ou plusieurs separees par virgule/
  // point-virgule sur une meme ligne, ou un vrai CSV a une colonne. Retire
  // les guillemets eventuels et ignore les lignes vides.
  const handleCsvFile = (file: File) => {
    setCsvError(null);
    setCsvAddedCount(null);

    if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
      setCsvError("Le fichier doit etre au format .csv.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      const names = text
        .split(/\r?\n/)
        .flatMap((line) => line.split(/[,;]/))
        .map((raw) => raw.trim().replace(/^"(.*)"$/, "$1").trim())
        .filter((name) => name.length > 0);

      if (names.length === 0) {
        setCsvError("Aucune categorie trouvee dans ce fichier.");
        return;
      }

      const beforeCount = categories.length;
      addUniqueCategories(names);
      // Le compte exact ajoute est calcule sur le prochain rendu ; on
      // affiche une estimation immediate basee sur les noms uniques lus.
      const uniqueRead = new Set(names.map((n) => n.toLowerCase())).size;
      setCsvAddedCount(uniqueRead);
      setError(null);
      void beforeCount;
    };
    reader.onerror = () => setCsvError("Impossible de lire ce fichier.");
    reader.readAsText(file);
  };

  const handleCsvInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleCsvFile(file);
    e.target.value = ""; // permet de reimporter le meme fichier si besoin
  };

  const handleSubmit = async () => {
    if (categories.length === 0) {
      setError("Ajoutez au moins une categorie de depenses.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password, categories }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Echec de l'inscription.");
      }

      const data = await res.json();
      saveAuth(data.token, { email: data.email, fullName: data.fullName });
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-4">
      <div className="card p-8 w-full max-w-md">
        <h1 className="font-display text-xl font-semibold text-navy mb-1">InvoiceAI</h1>
        <p className="text-sm text-foreground/50 mb-6">
          {step === 1 ? "Creez votre compte" : "Definissez vos categories de depenses"}
        </p>

        {/* Indicateur d'etape */}
        <div className="flex items-center gap-2 mb-6">
          <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? "bg-primary" : "bg-[var(--color-border)]"}`} />
          <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? "bg-primary" : "bg-[var(--color-border)]"}`} />
        </div>

        {error && (
          <p className="text-sm text-danger bg-danger-tint border border-danger/20 rounded-xl px-3 py-2 mb-4">
            {error}
          </p>
        )}

        {step === 1 && (
          <form onSubmit={goToStep2} className="space-y-4">
            <div>
              <label className="text-sm text-foreground/60 block mb-1">Nom complet</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-foreground/60 block mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-foreground/60 block mb-1">Mot de passe</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm"
              />
              <p className="text-xs text-foreground/40 mt-1">6 caracteres minimum</p>
            </div>
            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary-light text-white rounded-xl py-2.5 text-sm font-medium transition-colors"
            >
              Continuer
            </button>
          </form>
        )}

        {step === 2 && (
          <div>
            <p className="text-xs text-foreground/50 mb-4">
              Tapez le nom d&apos;une categorie puis Entree pour l&apos;ajouter, ou importez-les
              depuis un fichier CSV (une categorie par ligne, ou separees par virgules).
              Modifiable plus tard dans Parametres.
            </p>

            <div className="mb-3">
              <input
                type="text"
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                onKeyDown={handleCategoryKeyDown}
                placeholder="Ex: Matieres premieres, Transport..."
                className="w-full border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm"
              />
              <div className="flex items-center justify-between mt-2">
                <button
                  type="button"
                  onClick={addCategory}
                  className="text-sm text-primary hover:underline"
                >
                  + Ajouter cette categorie
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-sm text-foreground/60 hover:text-primary"
                >
                  <Upload size={14} />
                  Importer un CSV
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={handleCsvInputChange}
                />
              </div>
            </div>

            {csvError && (
              <p className="text-xs text-danger mb-3">{csvError}</p>
            )}
            {csvAddedCount !== null && !csvError && (
              <p className="text-xs text-success mb-3">
                {csvAddedCount} categorie(s) lue(s) depuis le fichier.
              </p>
            )}

            <div className="flex flex-wrap gap-2 mb-6 min-h-[2rem]">
              {categories.length === 0 ? (
                <p className="text-xs text-foreground/40">Aucune categorie ajoutee pour l&apos;instant.</p>
              ) : (
                categories.map((category) => (
                  <span
                    key={category}
                    className="flex items-center gap-1.5 bg-accent-tint text-navy text-sm px-3 py-1.5 rounded-full"
                  >
                    {category}
                    <button
                      type="button"
                      onClick={() => removeCategory(category)}
                      className="text-navy/50 hover:text-danger"
                      aria-label={`Retirer ${category}`}
                    >
                      <X size={13} />
                    </button>
                  </span>
                ))
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-sm hover:bg-[var(--color-background)] disabled:opacity-50"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-primary hover:bg-primary-light text-white rounded-xl py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {loading ? "Creation..." : "Creer mon compte"}
              </button>
            </div>
          </div>
        )}

        <p className="text-sm text-foreground/50 mt-5 text-center">
          Deja un compte ?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}