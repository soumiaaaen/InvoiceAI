"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { clearAuth, getStoredUser } from "@/lib/auth";
import { useEffect, useState } from "react";
import LineSidebar from "./LineSidebar";

const navItems = [
  { href: "/dashboard", label: "Tableau de bord" },
  { href: "/factures", label: "Factures" },
  { href: "/factures/nouvelle", label: "Ajouter une facture" },
  { href: "/fournisseurs", label: "Fournisseurs" },
  { href: "/parametres", label: "Parametres" },
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

  const initials = userName
    ? userName
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "";

  // LineSidebar is uncontrolled internally but accepts activeIndex to stay
  // in sync with the actual route (e.g. after using browser back/forward).
  const activeIndex = Math.max(
    0,
    navItems.findIndex((item) => item.href === pathname)
  );

  return (
    <aside className="w-64 h-screen fixed top-0 left-0 bg-navy text-white flex flex-col shrink-0 overflow-y-auto">
      <div className="px-6 py-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center overflow-hidden shrink-0">
          <Image src="/logo.png" alt="InvoiceAI" width={22} height={22} className="object-contain" />
        </div>
        <span className="font-display font-semibold text-lg leading-tight tracking-tight">
          InvoiceAI
        </span>
      </div>

      <nav className="flex-1 px-6 py-6">
        <LineSidebar
          items={navItems.map((item) => item.label)}
          activeIndex={activeIndex}
          onItemClick={(index) => router.push(navItems[index].href)}
          accentColor="#5B7CF0"
          textColor="#8A9AC4"
          markerColor="#3A4A72"
          showIndex
          showMarker
          proximityRadius={90}
          maxShift={18}
          falloff="smooth"
          markerLength={28}
          markerGap={10}
          tickScale={0.4}
          scaleTick
          itemGap={22}
          fontSize={0.95}
          smoothing={120}
        />
      </nav>

      <div className="px-3 py-5 mt-auto">
        {userName && (
          <div className="flex items-center gap-2.5 px-3 py-2.5 mb-2 rounded-xl bg-white/5">
            <div className="w-7 h-7 rounded-full bg-primary-light flex items-center justify-center text-[11px] font-display font-semibold shrink-0">
              {initials}
            </div>
            <p className="text-xs text-white/70 truncate">{userName}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/60 hover:bg-white/10 hover:text-white w-full transition-colors"
        >
          <LogOut size={18} />
          Deconnexion
        </button>
      </div>
    </aside>
  );
}