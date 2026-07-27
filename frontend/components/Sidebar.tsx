"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Search,
  Users,
  Settings,
  LogOut,
} from "lucide-react";
import { clearAuth, getStoredUser } from "@/lib/auth";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/factures", label: "Factures", icon: FileText },
  { href: "/factures/nouvelle", label: "Ajouter une facture", icon: PlusCircle },
  { href: "/recherche", label: "Recherche", icon: Search },
  { href: "/fournisseurs", label: "Fournisseurs", icon: Users },
  { href: "/parametres", label: "Parametres", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    const user = getStoredUser();
    if (user) setUserName(user.fullName);
  }, []);

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  return (
    <aside className="w-64 h-screen fixed top-0 left-0 bg-blue-700 text-white flex flex-col shrink-0 overflow-y-auto">
      <div className="px-6 py-6 flex items-center gap-3 border-b border-blue-600/40">
        <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
          <FileText size={20} />
        </div>
        <span className="font-semibold text-lg leading-tight">
          Smart Facture
          <br />
          Tracker
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-white text-blue-700 font-medium"
                  : "text-blue-100 hover:bg-blue-600/50"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-blue-600/40">
        {userName && (
          <p className="px-3 text-xs text-blue-200 mb-2 truncate">{userName}</p>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-blue-100 hover:bg-blue-600/50 w-full"
        >
          <LogOut size={18} />
          Deconnexion
        </button>
      </div>
    </aside>
  );
}