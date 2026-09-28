"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import { authFetch, saveAuth, getToken } from "@/lib/auth";
import { CheckCircle2, Pencil, Trash2, X, Check } from "lucide-react";

const API_BASE_URL = "http://localhost:5136";

type Category = { id: number; name: string };

export default function ParametresPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [defaultTvaRate, setDefaultTvaRate] = useState("20");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);

  // --- Categories ---
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [addingCategory, setAddingCategory] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await authFetch(`${API_BASE_URL}/api/auth/me`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setFullName(data.fullName);
        setEmail(data.email);
        setDefaultTvaRate(data.defaultTvaRate?.toString() ?? "20");
        if (Array.isArray(data.categories)) {
          setCategories(data.categories);
        }
      } catch {
        setProfileError("Impossible de charger le profil.");
      } finally {
        setLoadingProfile(false);
      }
    }
    loadProfile();
  }, []);

  const handleSaveProfile = async (e?: React.FormEvent | React.FocusEvent) => {
    e?.preventDefault();
    setSavingProfile(true);
    setProfileError(null);
    setProfileSaved(false);

    try {
      const res = await authFetch(`${API_BASE_URL}/api/auth/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          defaultTvaRate: parseFloat(defaultTvaRate) || 0,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Echec de la mise a jour.");
      }

      // Met a jour le nom affiche dans la sidebar (stocke localement)
      const token = getToken();
      if (token) saveAuth(token, { email: email, fullName: fullName, role: data.role });
         

      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (e) {
      setProfileError(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSaved(false);

    if (newPassword.length < 6) {
      setPasswordError("Le nouveau mot de passe doit contenir au moins 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setSavingPassword(true);

    try {
      const res = await authFetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Echec du changement de mot de passe.");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 3000);
    } catch (e) {
      setPasswordError(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;

    setAddingCategory(true);
    setCategoryError(null);

    try {
      const res = await authFetch(`${API_BASE_URL}/api/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Echec de l'ajout de la categorie.");
      }

      const created: Category = await res.json();
      setCategories((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setNewCategoryName("");
    } catch (e) {
      setCategoryError(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setAddingCategory(false);
    }
  };

  const handleAddCategoryKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddCategory();
    }
  };

  const startEditing = (category: Category) => {
    setEditingId(category.id);
    setEditingValue(category.name);
    setCategoryError(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingValue("");
  };

  const saveEditing = async (id: number) => {
    const name = editingValue.trim();
    if (!name) return;

    setCategoryError(null);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Echec du renommage.");
      }

      setCategories((prev) =>
        prev
          .map((c) => (c.id === id ? { ...c, name } : c))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      cancelEditing();
    } catch (e) {
      setCategoryError(e instanceof Error ? e.message : "Erreur inconnue.");
    }
  };

  const deleteCategory = async (category: Category) => {
    const confirmed = window.confirm(
      `Supprimer la categorie "${category.name}" ? Les factures deja classees dans cette categorie repasseront "non classees".`
    );
    if (!confirmed) return;

    setDeletingId(category.id);
    setCategoryError(null);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/categories/${category.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Echec de la suppression.");
      }

      setCategories((prev) => prev.filter((c) => c.id !== category.id));
    } catch (e) {
      setCategoryError(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-navy">Parametres</h1>
        <p className="text-foreground/50 text-sm">Gerez votre profil et vos preferences</p>
      </div>

      {/* --- Profil --- */}
      <div className="card p-6">
        <h2 className="font-display font-semibold mb-4 text-navy">Profil</h2>

        {loadingProfile ? (
          <p className="text-sm text-foreground/50">Chargement...</p>
        ) : (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            {profileError && (
              <p className="text-sm text-danger bg-danger-tint border border-danger/20 rounded-xl px-3 py-2">
                {profileError}
              </p>
            )}
            {profileSaved && (
              <div className="flex items-center gap-2 text-sm text-success bg-success-tint border border-success/20 rounded-xl px-3 py-2">
                <CheckCircle2 size={16} />
                Profil mis a jour
              </div>
            )}

            <div>
              <label className="text-sm text-foreground/60 block mb-1">Email</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm bg-[var(--color-background)] text-foreground/50"
              />
              <p className="text-xs text-foreground/40 mt-1">L&apos;email ne peut pas etre modifie</p>
            </div>

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

            <button
              type="submit"
              disabled={savingProfile}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-light text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              {savingProfile ? "Enregistrement..." : "Enregistrer"}
            </button>
          </form>
        )}
      </div>

      {/* --- Preferences --- */}
      <div className="card p-6">
        <h2 className="font-display font-semibold mb-1 text-navy">Preferences</h2>
        <p className="text-xs text-foreground/40 mb-4">
          Le taux de TVA par defaut est utilise pour preremplir le formulaire lorsque l&apos;IA
          ne parvient pas a le detecter automatiquement sur une facture.
        </p>

        <div className="max-w-xs">
          <label className="text-sm text-foreground/60 block mb-1">Taux de TVA par defaut (%)</label>
          <input
            type="number"
            step="0.01"
            value={defaultTvaRate}
            onChange={(e) => setDefaultTvaRate(e.target.value)}
            onBlur={handleSaveProfile}
            className="w-full border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm font-figures"
          />
        </div>
      </div>

      {/* --- Categories --- */}
      <div className="card p-6">
        <h2 className="font-display font-semibold mb-1 text-navy">Categories de depenses</h2>
        <p className="text-xs text-foreground/40 mb-4">
          Vos propres categories, utilisees pour classer vos factures et guider l&apos;extraction IA.
          Ajoutez, renommez ou supprimez librement.
        </p>

        {categoryError && (
          <p className="text-sm text-danger bg-danger-tint border border-danger/20 rounded-xl px-3 py-2 mb-4">
            {categoryError}
          </p>
        )}

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={handleAddCategoryKeyDown}
            placeholder="Nouvelle categorie..."
            className="flex-1 border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm"
          />
          <button
            onClick={handleAddCategory}
            disabled={addingCategory || !newCategoryName.trim()}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-light text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {addingCategory ? "Ajout..." : "Ajouter"}
          </button>
        </div>

        {categories.length === 0 ? (
          <p className="text-sm text-foreground/40">Aucune categorie pour le moment.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <div key={c.id}>
                {editingId === c.id ? (
                  <div className="flex items-center gap-1 bg-accent-tint rounded-full pl-3 pr-1.5 py-1">
                    <input
                      autoFocus
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEditing(c.id);
                        if (e.key === "Escape") cancelEditing();
                      }}
                      className="bg-transparent text-sm text-navy outline-none w-32"
                    />
                    <button
                      onClick={() => saveEditing(c.id)}
                      className="text-primary hover:text-primary-light shrink-0"
                      title="Enregistrer"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="text-foreground/40 hover:text-danger shrink-0"
                      title="Annuler"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 bg-[var(--color-background)] border border-[var(--color-border)] text-foreground/70 rounded-full pl-3 pr-1.5 py-1 text-sm">
                    {c.name}
                    <button
                      onClick={() => startEditing(c)}
                      className="text-foreground/30 hover:text-primary p-0.5"
                      title="Renommer"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => deleteCategory(c)}
                      disabled={deletingId === c.id}
                      className="text-foreground/30 hover:text-danger p-0.5 disabled:opacity-50"
                      title="Supprimer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- Changer le mot de passe --- */}
      <div className="card p-6">
        <h2 className="font-display font-semibold mb-4 text-navy">Changer le mot de passe</h2>

        <form onSubmit={handleChangePassword} className="space-y-4">
          {passwordError && (
            <p className="text-sm text-danger bg-danger-tint border border-danger/20 rounded-xl px-3 py-2">
              {passwordError}
            </p>
          )}
          {passwordSaved && (
            <div className="flex items-center gap-2 text-sm text-success bg-success-tint border border-success/20 rounded-xl px-3 py-2">
              <CheckCircle2 size={16} />
              Mot de passe modifie avec succes
            </div>
          )}

          <div>
            <label className="text-sm text-foreground/60 block mb-1">Mot de passe actuel</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-sm text-foreground/60 block mb-1">Nouveau mot de passe</label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-sm text-foreground/60 block mb-1">Confirmer le nouveau mot de passe</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={savingPassword}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-light text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {savingPassword ? "Modification..." : "Changer le mot de passe"}
          </button>
        </form>
      </div>
    </div>
  );
}