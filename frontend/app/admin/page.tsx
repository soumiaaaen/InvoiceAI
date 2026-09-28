"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authFetch, isAdmin } from "@/lib/auth";
import { Users, FileText, Wallet, Sparkles, Trash2 } from "lucide-react";

const API_BASE_URL = "http://localhost:5136";

type Stats = {
  totalUsers: number;
  totalFactures: number;
  totalMontantTtc: number;
  estimatedApiCostUsd: number;
};

type AdminUser = {
  id: number;
  email: string;
  fullName: string;
  role: string;
  createdAt: string;
  factureCount: number;
};

function formatMad(value: number) {
  return `${new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)} MAD`;
}

function formatUsd(value: number) {
  return `${value.toFixed(2)} $`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className="w-11 h-11 rounded-xl bg-accent-tint text-primary flex items-center justify-center shrink-0">
        <Icon size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground/60">{label}</p>
        <p className="text-xl font-semibold leading-snug font-figures">{value}</p>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Garde cote client : redirige immediatement un compte non-admin qui
  // arriverait directement sur /admin. La vraie protection reste cote
  // serveur ([Authorize(Roles = "Admin")]) - ceci evite juste un flash
  // de contenu ou un appel API voue a echouer.
  useEffect(() => {
    if (!isAdmin()) {
      router.push("/dashboard");
      return;
    }
    setChecked(true);
  }, [router]);

  useEffect(() => {
    if (!checked) return;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [statsRes, usersRes] = await Promise.all([
          authFetch(`${API_BASE_URL}/api/admin/stats`),
          authFetch(`${API_BASE_URL}/api/admin/users`),
        ]);

        if (!statsRes.ok || !usersRes.ok) throw new Error("Impossible de charger les donnees administrateur.");

        setStats(await statsRes.json());
        setUsers(await usersRes.json());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur inconnue.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [checked]);

  const deleteUser = async (user: AdminUser) => {
    const confirmed = window.confirm(
      `Supprimer le compte de "${user.fullName}" (${user.email}) ? Toutes ses factures et categories seront supprimees. Cette action est irreversible.`
    );
    if (!confirmed) return;

    setDeletingId(user.id);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/admin/users/${user.id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Echec de la suppression.");
      }
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      setStats((prev) => (prev ? { ...prev, totalUsers: prev.totalUsers - 1 } : prev));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setDeletingId(null);
    }
  };

  if (!checked) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-navy">Administration</h1>
        <p className="text-foreground/50 text-sm">Vue d&apos;ensemble et gestion des utilisateurs</p>
      </div>

      {error && (
        <p className="text-sm text-danger bg-danger-tint border border-danger/20 rounded-xl px-4 py-2">
          {error}
        </p>
      )}

      {loading && <p className="text-sm text-foreground/50">Chargement...</p>}

      {stats && !loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Utilisateurs" value={stats.totalUsers.toString()} />
          <StatCard icon={FileText} label="Factures (total)" value={stats.totalFactures.toString()} />
          <StatCard icon={Wallet} label="Montant TTC cumule" value={formatMad(stats.totalMontantTtc)} />
          <StatCard
            icon={Sparkles}
            label="Cout IA estime"
            value={formatUsd(stats.estimatedApiCostUsd)}
          />
        </div>
      )}

      {!loading && !error && (
        <div className="card overflow-hidden">
          <h2 className="font-display font-semibold p-5 pb-3 text-navy">Utilisateurs</h2>
          {users.length === 0 ? (
            <p className="text-sm text-foreground/40 py-10 text-center">Aucun utilisateur.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-foreground/50 border-b border-[var(--color-border)]">
                  <th className="px-5 py-3 font-medium">Nom</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Factures</th>
                  <th className="px-5 py-3 font-medium">Inscrit le</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="px-5 py-3">{u.fullName}</td>
                    <td className="px-5 py-3 text-foreground/50">{u.email}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          u.role === "Admin" ? "bg-accent-tint text-primary" : "bg-[var(--color-background)] text-foreground/50"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-figures text-foreground/50">{u.factureCount}</td>
                    <td className="px-5 py-3 font-figures text-foreground/50">{formatDate(u.createdAt)}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end">
                        <button
                          onClick={() => deleteUser(u)}
                          disabled={deletingId === u.id}
                          className="text-foreground/30 hover:text-danger transition-colors disabled:opacity-50"
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
    </div>
  );
}