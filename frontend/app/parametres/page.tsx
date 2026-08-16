"use client";

import { useEffect, useState } from "react";
import { authFetch, getStoredUser, saveAuth, getToken } from "@/lib/auth";
import { CheckCircle2 } from "lucide-react";

const API_BASE_URL = "http://localhost:5136";

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

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await authFetch(`${API_BASE_URL}/api/auth/me`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setFullName(data.fullName);
        setEmail(data.email);
        setDefaultTvaRate(data.defaultTvaRate?.toString() ?? "20");
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
      if (token) saveAuth(token, { email, fullName });

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

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Paramètres</h1>
        <p className="text-gray-500 text-sm">Gérez votre profil et vos préférences</p>
      </div>

      {/* --- Profil --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold mb-4">Profil</h2>

        {loadingProfile ? (
          <p className="text-sm text-gray-500">Chargement...</p>
        ) : (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            {profileError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {profileError}
              </p>
            )}
            {profileSaved && (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                <CheckCircle2 size={16} />
                Profil mis à jour
              </div>
            )}

            <div>
              <label className="text-sm text-gray-600 block mb-1">Email</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500"
              />
              <p className="text-xs text-gray-400 mt-1">L'email ne peut pas être modifié</p>
            </div>

            <div>
              <label className="text-sm text-gray-600 block mb-1">Nom complet</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {savingProfile ? "Enregistrement..." : "Enregistrer"}
            </button>
          </form>
        )}
      </div>

      {/* --- Preferences --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold mb-1">Préférences</h2>
        <p className="text-xs text-gray-400 mb-4">
          Le taux de TVA par défaut est utilisé pour préremplir le formulaire lorsque l'IA
          ne parvient pas à le détecter automatiquement sur une facture.
        </p>

        <div className="max-w-xs">
          <label className="text-sm text-gray-600 block mb-1">Taux de TVA par défaut (%)</label>
          <input
            type="number"
            step="0.01"
            value={defaultTvaRate}
            onChange={(e) => setDefaultTvaRate(e.target.value)}
            onBlur={handleSaveProfile}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div className="mt-5">
          <p className="text-sm text-gray-600 mb-2">Catégories de dépenses disponibles</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <span
                key={c}
                className="text-xs bg-gray-50 border border-gray-200 text-gray-600 rounded-full px-3 py-1"
              >
                {c}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Liste fixe définie pour ce projet — non modifiable depuis l'interface.
          </p>
        </div>
      </div>

      {/* --- Changer le mot de passe --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold mb-4">Changer le mot de passe</h2>

        <form onSubmit={handleChangePassword} className="space-y-4">
          {passwordError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {passwordError}
            </p>
          )}
          {passwordSaved && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
              <CheckCircle2 size={16} />
              Mot de passe modifié avec succès
            </div>
          )}

          <div>
            <label className="text-sm text-gray-600 block mb-1">Mot de passe actuel</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-1">Nouveau mot de passe</label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-1">Confirmer le nouveau mot de passe</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={savingPassword}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {savingPassword ? "Modification..." : "Changer le mot de passe"}
          </button>
        </form>
      </div>
    </div>
  );
}