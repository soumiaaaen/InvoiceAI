# InvoiceAI — Gestion intelligente des factures fournisseurs

Application web permettant à une entreprise de centraliser, extraire automatiquement et suivre ses factures fournisseurs, grâce à l'intelligence artificielle — à la place d'une saisie manuelle.

L'utilisateur téléverse une facture (PDF, JPG ou PNG), une IA multimodale extrait automatiquement les informations clés (fournisseur, montants, date, catégorie), les propose pour vérification, puis l'utilisateur confirme l'enregistrement.

> Projet réalisé dans le cadre d'un stage de 6 semaines en génie logiciel (ENSIAS).

---

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Stack technique](#stack-technique)
- [Architecture du projet](#architecture-du-projet)
- [Installation](#installation)
- [Variables d'environnement](#variables-denvironnement)
- [Endpoints API](#endpoints-api-principaux)
- [Décisions techniques](#décisions-techniques)
- [Limitations connues](#limitations-connues)
- [Pistes d'évolution](#pistes-dévolution)

---

## Fonctionnalités

### Authentification et gestion de compte
- Inscription (email, mot de passe, nom complet) avec hachage BCrypt
- Connexion par JWT, attaché automatiquement aux requêtes côté frontend
- Modification du profil (nom, taux de TVA par défaut) et changement de mot de passe

### Catégories de dépenses personnalisées
- Chaque utilisateur **définit lui-même** ses catégories de dépenses (aucune liste imposée)
- Gestion complète (ajout, renommage, suppression) depuis les Paramètres
- Les catégories pilotent à la fois le formulaire d'ajout de facture **et** le prompt envoyé à l'IA
- Si une catégorie est supprimée, les factures associées repassent automatiquement "non classées"

### Extraction automatique par IA
- Téléversement (drag & drop) avec aperçu intégré (PDF et image) pendant le traitement
- Extraction : fournisseur, date, montant HT, taux de TVA, montant TVA, montant TTC, numéro de facture, catégorie
- Prompt structuré distinguant explicitement les montants de détail (lignes) du bloc de totaux finaux
- Résultat présenté dans un **formulaire éditable** avant tout enregistrement — l'IA ne sauvegarde jamais directement
- Avertissement automatique si HT == TTC (signal probable d'une TVA non détectée)

### Gestion des factures
- Liste avec recherche (fournisseur), filtres (catégorie, mois, fournisseur), pagination
- Édition et suppression
- Chaque facture est strictement liée à l'utilisateur connecté

### Tableau de bord
- Total du mois sélectionné, nombre de factures, montant moyen
- Catégorie la plus dépensière
- Répartition des dépenses par catégorie (graphique en anneau)
- Évolution mensuelle des dépenses sur 6 mois (graphique en courbe)
- Factures récentes

### Suivi des fournisseurs
- Vue agrégée : montant total payé, nombre de factures, catégorie dominante, dernière facture
- **Export Excel** (`.xlsx` via ClosedXML) par mois, avec ligne "Total du mois"

---

## Stack technique

| Couche | Technologie |
|---|---|
| Backend | ASP.NET Core (C#) + Entity Framework Core |
| Base de données | SQL Server |
| Frontend | Next.js (App Router) + TypeScript + Tailwind CSS v4 |
| IA d'extraction | Gemini API (`gemini-3.1-flash-lite`), appelée en REST via `HttpClient` |
| Authentification | JWT fait maison (BCrypt pour le hachage) |
| Stockage fichiers | Disque local (`uploads/`), servi en statique |
| Export | ClosedXML (génération de fichiers `.xlsx`) |

**Choix du modèle IA :** comparaison réalisée entre Gemini, Azure AI, Amazon Bedrock, OpenAI et Ollama — Gemini retenu comme seule offre testée combinant extraction et classification en un seul appel, avec un free tier permanent. Parmi les modèles Gemini testés (2.5 Flash, 3.1 Flash-Lite, 3.5 Flash), **Gemini 3.1 Flash-Lite** a été retenu pour la production : résultats d'extraction corrects et coût nettement inférieur (environ **0,0016 $ par facture**, contre 0,0096 $ pour Gemini 3.5 Flash).

---

## Architecture du projet

```
SmartFactureTracker/
├── backend/                    ASP.NET Core (C#)
│   ├── Models/                 User, Facture, Category
│   ├── Data/                   AppDbContext (EF Core)
│   ├── Services/                FactureAiExtraction (appel Gemini)
│   ├── Controllers/             Auth, Categories, Factures, Fournisseurs, Dashboard
│   └── uploads/                 Fichiers de factures stockés localement
│
└── frontend/                   Next.js (App Router)
    ├── app/
    │   ├── (public)/             Landing page, /login, /register
    │   ├── dashboard/
    │   ├── factures/
    │   ├── fournisseurs/
    │   └── parametres/
    ├── components/               Sidebar, AuthGuard, composants UI
    └── lib/auth.ts                Gestion JWT, authFetch()
```

---

## Installation

### Prérequis
- .NET 8 SDK
- Node.js 18+
- SQL Server (local ou instance accessible)
- Une clé API Gemini ([Google AI Studio](https://aistudio.google.com))

### Backend

```bash
cd backend
dotnet restore
dotnet ef database update
dotnet run
```
Le backend démarre sur `http://localhost:5136`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```
Le frontend démarre sur `http://localhost:3000`.

---

## Variables d'environnement

### `backend/appsettings.json`

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=InvoiceAI;Trusted_Connection=True;TrustServerCertificate=True;"
  },
  "Jwt": {
    "Key": "<clé secrète longue et aléatoire>",
    "Issuer": "InvoiceAI",
    "Audience": "InvoiceAIUsers",
    "ExpiryMinutes": 60
  },
  "Gemini": {
    "ApiKey": "<votre clé API Gemini>"
  }
}
```

⚠️ Ne jamais committer ce fichier avec de vraies valeurs — utiliser `appsettings.Development.json` (ignoré par git) ou des variables d'environnement.

---

## Endpoints API principaux

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Inscription |
| `POST` | `/api/auth/login` | Connexion (retourne un JWT) |
| `GET` | `/api/auth/me` | Profil de l'utilisateur connecté |
| `PUT` | `/api/auth/profile` | Mise à jour du profil |
| `POST` | `/api/auth/change-password` | Changement de mot de passe |
| `GET` / `POST` / `PUT` / `DELETE` | `/api/categories` | Gestion des catégories personnalisées |
| `POST` | `/api/factures/extract` | Extraction IA (sans sauvegarde) |
| `POST` | `/api/factures` | Confirmation et enregistrement d'une facture |
| `GET` | `/api/factures` | Liste des factures (recherche/filtres) |
| `PUT` / `DELETE` | `/api/factures/{id}` | Édition / suppression |
| `GET` | `/api/fournisseurs/summary` | Agrégation par fournisseur |
| `GET` | `/api/fournisseurs/export?month=yyyy-MM` | Export Excel |
| `GET` | `/api/dashboard/summary?month=yyyy-MM` | Données du tableau de bord |

Toutes les routes (sauf `register`/`login`) nécessitent un header `Authorization: Bearer <token>`.

---

## Décisions techniques

- **ASP.NET Core plutôt que Spring Boot** : cohérence avec l'environnement C#/SQL Server de l'entreprise d'accueil.
- **Gemini plutôt qu'Azure AI / Bedrock / OpenAI / Ollama** : seule offre combinant extraction + classification en un seul appel avec free tier permanent.
- **Catégories personnalisées plutôt qu'une liste fixe** : une première version à 13 catégories fixes (pensées pour le textile) a été jugée non généralisable et remplacée par un système entièrement personnalisable par utilisateur.
- **Pas de confirmation d'email** : simplification assumée du flux d'inscription, avec le compromis de sécurité documenté ci-dessous.

---

## Limitations connues

- Le niveau gratuit de l'API Gemini autorise Google à utiliser les données pour l'entraînement de ses modèles — recommandation de passer en tier payant pour un déploiement réel.
- Absence de confirmation d'email : n'importe quelle adresse peut créer un compte.
- Stockage des fichiers en local (disque du serveur), pas de stockage cloud redondant.
- Pas de tests automatisés formalisés au-delà des tests manuels.
- Application non déployée publiquement — testée en environnement local de développement.

---

## Pistes d'évolution

- Déploiement (Docker, migration vers Azure SQL Database)
- Réintroduction d'une vérification d'email pour un déploiement réel
- Tests de bout en bout automatisés
- Notifications sur factures en retard (si un champ d'échéance est ajouté)

---

## Auteur

Projet réalisé dans le cadre d'un stage d'ingénieur en génie logiciel — ENSIAS.
