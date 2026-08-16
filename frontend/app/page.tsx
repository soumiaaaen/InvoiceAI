import Link from "next/link";
import Image from "next/image";
import { Sparkles, FileText, BarChart3, ShieldCheck } from "lucide-react";

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

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center overflow-hidden shrink-0">
            <Image src="/logo.png" alt="InvoiceAI" width={36} height={36} className="object-contain" />
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
      <section className="max-w-4xl mx-auto text-center px-6 pt-16 pb-20">
        <h1 className="font-display text-4xl sm:text-5xl font-semibold text-navy leading-tight">
          La gestion de vos factures,
          <br />
          automatisee par l&apos;IA
        </h1>
        <p className="mt-5 text-lg text-foreground/60 max-w-2xl mx-auto">
          InvoiceAI extrait, classe et centralise vos factures fournisseurs automatiquement -
          fini la saisie manuelle.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/register"
            className="bg-primary hover:bg-primary-light text-white px-6 py-3 rounded-xl text-sm font-medium transition-colors"
          >
            Commencer gratuitement
          </Link>
          <Link
            href="/login"
            className="border border-[var(--color-border)] hover:bg-white text-navy px-6 py-3 rounded-xl text-sm font-medium transition-colors"
          >
            J&apos;ai deja un compte
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="card p-6">
              <div className="w-11 h-11 rounded-xl bg-accent-tint text-primary flex items-center justify-center mb-4">
                <Icon size={20} />
              </div>
              <h3 className="font-display font-semibold text-navy mb-2">{title}</h3>
              <p className="text-sm text-foreground/60">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-xs text-foreground/40 pb-8">
        InvoiceAI — Projet de stage
      </footer>
    </div>
  );
}