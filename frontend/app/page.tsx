import Link from "next/link";
import Image from "next/image";
import { Sparkles, FileText, BarChart3, ShieldCheck, ArrowUpRight } from "lucide-react";
import MagicBento from "@/components/Magicbento";

const FEATURES = [
  {
    icon: Sparkles,
    title: "Extraction automatique par IA",
    description:
      "Televersez une facture (image ou PDF) et laissez l'IA extraire fournisseur, montants HT/TVA/TTC et categorie en quelques secondes.",
  },
  {
    icon: FileText,
    title: "Centralisation des factures",
    description:
      "Toutes vos factures fournisseurs au meme endroit, recherchables et filtrables par categorie, mois ou fournisseur.",
  },
  {
    icon: BarChart3,
    title: "Tableau de bord et rapports",
    description:
      "Suivez vos depenses par categorie et par fournisseur, avec export Excel en un clic.",
  },
  {
    icon: ShieldCheck,
    title: "Validation avant enregistrement",
    description:
      "Chaque extraction est presentee pour verification avant confirmation - vous gardez toujours le controle des donnees.",
  },
];

// Hauteurs statiques pour la mini-maquette du graphique dans l'apercu
// du dashboard (purement decoratif, pas de vraies donnees)
const MOCK_BARS = [38, 62, 45, 80, 55, 70];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--color-background)] overflow-hidden">
      {/* Formes decoratives en arriere-plan */}
      <div className="pointer-events-none absolute top-[-120px] right-[-100px] w-[420px] h-[420px] rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute top-[280px] left-[-140px] w-[380px] h-[380px] rounded-full bg-accent-tint/60 blur-3xl" />

      {/* Header */}
      <header className="relative flex items-center justify-between px-8 py-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center overflow-hidden shrink-0">
            <Image src="/logo.jpg" alt="InvoiceAI" width={36} height={36} className="object-contain" />
          </div>
          <span className="font-display font-semibold text-lg text-navy">InvoiceAI</span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-foreground/70 hover:text-navy transition-colors px-4 py-2"
          >
            Connexion
          </Link>
          <Link
            href="/register"
            className="text-sm font-medium bg-primary hover:bg-primary-light text-white px-4 py-2 rounded-xl transition-colors"
          >
            Creer un compte
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative max-w-6xl mx-auto px-6 pt-12 pb-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-accent-tint text-primary text-xs font-medium px-3 py-1.5 rounded-full mb-5">
            <Sparkles size={13} />
            Extraction par IA en un televersement
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold text-navy leading-tight">
            La gestion de vos factures,
            <br />
            automatisee par l&apos;IA
          </h1>
          <p className="mt-5 text-lg text-foreground/60 max-w-lg">
            InvoiceAI extrait, classe et centralise vos factures fournisseurs automatiquement -
            fini la saisie manuelle.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <Link
              href="/register"
              className="flex items-center gap-1.5 bg-primary hover:bg-primary-light text-white px-6 py-3 rounded-xl text-sm font-medium transition-colors"
            >
              Commencer gratuitement
              <ArrowUpRight size={16} />
            </Link>
            <Link
              href="/login"
              className="border border-[var(--color-border)] hover:bg-white text-navy px-6 py-3 rounded-xl text-sm font-medium transition-colors"
            >
              J&apos;ai deja un compte
            </Link>
          </div>
        </div>

        {/* Apercu decoratif du dashboard - pas de vraies donnees */}
        <div className="relative hidden lg:block">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="font-display text-sm font-semibold text-navy">Tableau de bord</span>
              <span className="text-[10px] text-foreground/40 font-figures">Aout 2026</span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-xl bg-[var(--color-background)] p-3">
                <p className="text-[10px] text-foreground/50">Total du mois</p>
                <p className="font-figures font-semibold text-navy text-sm mt-0.5">6 120,00 MAD</p>
              </div>
              <div className="rounded-xl bg-[var(--color-background)] p-3">
                <p className="text-[10px] text-foreground/50">Factures</p>
                <p className="font-figures font-semibold text-navy text-sm mt-0.5">12</p>
              </div>
            </div>

            <div className="rounded-xl bg-[var(--color-background)] p-3 mb-4">
              <p className="text-[10px] text-foreground/50 mb-2">Evolution mensuelle</p>
              <div className="flex items-end gap-1.5 h-16">
                {MOCK_BARS.map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-sm bg-primary/70"
                    style={{ height: `${h}%`, opacity: 0.5 + (i / MOCK_BARS.length) * 0.5 }}
                  />
                ))}
              </div>
            </div>

            <div className="receipt-divider pt-3 flex items-center justify-between">
              <span className="text-xs text-foreground/50">Categorie principale</span>
              <span className="text-xs font-medium text-navy">Matieres premieres</span>
            </div>
          </div>

          {/* Petite carte flottante "extraction IA" en overlay */}
          <div className="absolute -bottom-5 -left-6 card px-4 py-3 flex items-center gap-2.5 shadow-lg">
            <div className="w-8 h-8 rounded-lg bg-success-tint text-success flex items-center justify-center shrink-0">
              <Sparkles size={15} />
            </div>
            <div>
              <p className="text-xs font-medium text-navy">Facture extraite</p>
              <p className="text-[10px] text-foreground/40">en 2,3 secondes</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative max-w-5xl mx-auto px-6 pb-24">
        <MagicBento
          gridClassName="grid grid-cols-1 sm:grid-cols-2 gap-5"
          glowColor="59, 91, 219"
          spotlightRadius={280}
          particleCount={8}
          enableStars
          enableSpotlight
          enableBorderGlow
          enableTilt={false}
          enableMagnetism={false}
          clickEffect={false}
        >
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title}>
              <div className="w-11 h-11 rounded-xl bg-accent-tint text-primary flex items-center justify-center mb-4">
                <Icon size={20} />
              </div>
              <h3 className="font-display font-semibold text-navy mb-2">{title}</h3>
              <p className="text-sm text-foreground/60">{description}</p>
            </div>
          ))}
        </MagicBento>
      </section>

      {/* Footer */}
      <footer className="relative text-center text-xs text-foreground/40 pb-8">
        InvoiceAI — Projet de stage
      </footer>
    </div>
  );
}