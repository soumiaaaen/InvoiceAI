"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  FileText,
  BarChart3,
  ShieldCheck,
  ArrowUpRight,
  UploadCloud,
  CheckCircle2,
  ChevronDown,
  Tags,
} from "lucide-react";
import MagicBento from "@/components/Magicbento";

const CAPABILITIES = [
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
    icon: Tags,
    title: "Categories 100% personnalisables",
    description:
      "Definissez vos propres categories de depenses des l'inscription - aucune liste imposee, adaptee a votre activite.",
  },
  {
    icon: ShieldCheck,
    title: "Validation avant enregistrement",
    description:
      "Chaque extraction est presentee pour verification avant confirmation - vous gardez toujours le controle des donnees.",
  },
];

const DIFFERENTIATORS = [
  {
    number: "01",
    title: "Extraction en quelques secondes",
    description: "Un televersement, et les montants HT/TVA/TTC sont pre-remplis automatiquement.",
  },
  {
    number: "02",
    title: "Categories entierement a vous",
    description: "Pas de nomenclature imposee - vos categories refletent vraiment votre activite.",
  },
  {
    number: "03",
    title: "Export Excel en un clic",
    description: "Depenses par fournisseur et par mois, prets a partager avec votre comptable.",
  },
  {
    number: "04",
    title: "Vos donnees restent les votres",
    description: "Chaque facture est liee a votre compte uniquement - rien n'est partage entre utilisateurs.",
  },
  {
    number: "05",
    title: "Sans engagement",
    description: "Un projet pense pour etre simple a adopter, sans configuration lourde au demarrage.",
  },
];

const STEPS = [
  {
    number: "01",
    icon: UploadCloud,
    title: "On televerse",
    description: "Glissez une facture (PDF, JPG ou PNG) - aucune saisie manuelle requise.",
  },
  {
    number: "02",
    icon: Sparkles,
    title: "L'IA extrait",
    description: "Fournisseur, montants, numero de facture et categorie sont detectes automatiquement.",
  },
  {
    number: "03",
    icon: CheckCircle2,
    title: "Vous validez",
    description: "Verifiez les champs pre-remplis, corrigez si besoin, confirmez - c'est enregistre.",
  },
];

const FAQS = [
  {
    question: "Mes donnees sont-elles securisees ?",
    answer:
      "Chaque facture et chaque categorie est liee a votre compte uniquement, protegee par authentification. Les fichiers sont stockes de maniere isolee par utilisateur.",
  },
  {
    question: "Quels formats de facture sont supportes ?",
    answer: "PDF, JPG et PNG, jusqu'a 10 Mo par fichier.",
  },
  {
    question: "L'IA peut-elle se tromper sur les montants ?",
    answer:
      "Oui, c'est pourquoi chaque extraction est presentee dans un formulaire editable avant confirmation - vous verifiez et corrigez si besoin avant l'enregistrement final.",
  },
  {
    question: "Puis-je changer mes categories apres l'inscription ?",
    answer:
      "Oui, ajoutez, renommez ou supprimez vos categories a tout moment depuis Parametres.",
  },
  {
    question: "Puis-je exporter mes donnees ?",
    answer:
      "Oui, un export Excel par fournisseur et par mois est disponible depuis la page Fournisseurs.",
  },
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-[var(--color-border)] py-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-left gap-4"
      >
        <span className="font-medium text-navy text-sm">{question}</span>
        <ChevronDown
          size={18}
          className={`text-foreground/40 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <p className="text-sm text-foreground/60 mt-3 leading-relaxed">{answer}</p>}
    </div>
  );
}

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
            <Image src="/logo.png" alt="InvoiceAI" width={22} height={22} className="object-contain" />
          </div>
          <span className="font-display font-semibold text-lg text-navy">InvoiceAI</span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm text-foreground/60">
          <a href="#fonctionnalites" className="hover:text-navy transition-colors">Fonctionnalites</a>
          <a href="#comment-ca-marche" className="hover:text-navy transition-colors">Comment ca marche</a>
          <a href="#faq" className="hover:text-navy transition-colors">FAQ</a>
        </nav>

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
            autrement.
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

      {/* Capacites */}
      <section id="fonctionnalites" className="relative max-w-5xl mx-auto px-6 pb-24">
        <h2 className="font-display text-2xl font-semibold text-navy text-center mb-10">
          Tout ce qu&apos;il faut pour ne plus saisir une facture a la main
        </h2>
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
          {CAPABILITIES.map(({ icon: Icon, title, description }) => (
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

      {/* La difference */}
      <section className="relative max-w-5xl mx-auto px-6 pb-24 grid grid-cols-1 lg:grid-cols-[minmax(0,320px)_1fr] gap-10">
        <div className="card p-6 h-fit">
          <p className="text-xs text-foreground/40 mb-1">Gratuit · Projet de stage</p>
          <h3 className="font-display text-xl font-semibold text-navy mb-2">InvoiceAI</h3>
          <p className="text-sm text-foreground/60 mb-5">
            Centralisez vos factures et laissez l&apos;IA faire la saisie a votre place.
          </p>
          <Link
            href="/register"
            className="flex items-center justify-center gap-1.5 w-full bg-primary hover:bg-primary-light text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            Creer un compte
            <ArrowUpRight size={15} />
          </Link>
        </div>

        <div>
          <h2 className="font-display text-2xl font-semibold text-navy mb-6">La difference InvoiceAI</h2>
          <div className="space-y-5">
            {DIFFERENTIATORS.map((d) => (
              <div key={d.number} className="flex gap-4">
                <span className="font-figures text-primary/40 font-semibold text-sm shrink-0 w-8">
                  {d.number}
                </span>
                <div>
                  <p className="font-medium text-navy text-sm">{d.title}</p>
                  <p className="text-sm text-foreground/60 mt-0.5">{d.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comment ca marche */}
      <section id="comment-ca-marche" className="relative max-w-5xl mx-auto px-6 pb-24">
        <h2 className="font-display text-2xl font-semibold text-navy text-center mb-2">
          Une routine simple, une saisie qui va droit a l&apos;essentiel.
        </h2>
        <p className="text-sm text-foreground/50 text-center mb-10">
          Le meme flux que vous retrouverez une fois connecte.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {STEPS.map(({ number, icon: Icon, title, description }) => (
            <div key={number} className="card p-6">
              <span className="font-figures text-xs text-foreground/30">{number}</span>
              <div className="w-11 h-11 rounded-xl bg-accent-tint text-primary flex items-center justify-center my-3">
                <Icon size={20} />
              </div>
              <h3 className="font-display font-semibold text-navy mb-1">{title}</h3>
              <p className="text-sm text-foreground/60">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative max-w-3xl mx-auto px-6 pb-24">
        <h2 className="font-display text-2xl font-semibold text-navy text-center mb-10">
          Questions frequentes
        </h2>
        <div className="card p-6 sm:p-8">
          {FAQS.map((faq) => (
            <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-8 py-12 grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center overflow-hidden shrink-0">
                <Image src="/logo.png" alt="InvoiceAI" width={18} height={18} className="object-contain" />
              </div>
              <span className="font-display font-semibold text-navy">InvoiceAI</span>
            </div>
            <p className="text-xs text-foreground/50 max-w-xs">
              La gestion de factures fournisseurs, automatisee par l&apos;IA.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-navy mb-3">Menu</p>
            <ul className="space-y-2 text-sm text-foreground/60">
              <li><a href="#fonctionnalites" className="hover:text-primary transition-colors">Fonctionnalites</a></li>
              <li><a href="#comment-ca-marche" className="hover:text-primary transition-colors">Comment ca marche</a></li>
              <li><a href="#faq" className="hover:text-primary transition-colors">FAQ</a></li>
              <li><Link href="/register" className="hover:text-primary transition-colors">Creer un compte</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold text-navy mb-3">Support</p>
            <ul className="space-y-2 text-sm text-foreground/60">
              <li><Link href="/login" className="hover:text-primary transition-colors">Connexion</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[var(--color-border)] py-6 text-center text-xs text-foreground/40">
          ©2026 InvoiceAI — Projet de stage
        </div>
      </footer>
    </div>
  );
}