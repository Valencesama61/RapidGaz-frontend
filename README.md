# RapidGaz Frontend

Interface utilisateur de la plateforme **RapidGaz**, permettant aux vendeurs de gérer leurs produits, stocks et localisations, et aux administrateurs de superviser la plateforme. Construite avec **Next.js 14**, **TypeScript** et **Tailwind CSS**.

---

## Table des matières

- [Technologies](#technologies)
- [Architecture du projet](#architecture-du-projet)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Lancer le projet](#lancer-le-projet)
- [Variables d'environnement](#variables-denvironnement)
- [Authentification et routage](#authentification-et-routage)
- [Rôles et espaces utilisateurs](#rôles-et-espaces-utilisateurs)
- [Composants UI](#composants-ui)
- [Gestion de l'état](#gestion-de-létat)
- [PWA](#pwa)
- [Structure des fichiers](#structure-des-fichiers)

---

## Technologies

| Technologie | Version |
|---|---|
| Next.js | 14.2.35 |
| React | 18 |
| TypeScript | 5 |
| Tailwind CSS | 3.4 |
| Zustand | 5 |
| Axios | 1.17 |
| shadcn/ui | 4 |
| jose | 6 |
| js-cookie | 3 |
| lucide-react | 1.17 |
| next-pwa | 5.6 |

---

## Architecture du projet

```
RapidGaz-frontend/
├── app/
│   ├── (admin)/               # Espace administration (layout + pages)
│   │   └── admin/
│   │       ├── catalog/       # Gestion du catalogue (marques, tailles)
│   │       ├── dashboard/     # Tableau de bord admin
│   │       ├── sellers/       # Liste et détail des vendeurs
│   │       └── users/         # Gestion des comptes admin
│   ├── (auth)/                # Pages d'authentification (layout + pages)
│   │   ├── login/             # Connexion
│   │   └── register/          # Inscription vendeur
│   ├── (public)/              # Page d'accueil (recherche publique)
│   ├── (seller)/              # Espace vendeur (layout + pages)
│   │   └── seller/
│   │       ├── dashboard/     # Tableau de bord vendeur
│   │       ├── location/      # Gestion de la localisation
│   │       ├── products/      # Gestion des produits
│   │       └── profile/       # Profil du vendeur
│   ├── globals.css            # Styles globaux Tailwind
│   └── layout.tsx             # Layout racine
│
├── components/
│   ├── layout/
│   │   ├── AdminNav.tsx       # Navigation de l'espace admin
│   │   └── SellerNav.tsx      # Navigation de l'espace vendeur
│   ├── shared/
│   │   ├── SearchResultCard.tsx  # Carte résultat de recherche publique
│   │   └── SellerCard.tsx        # Carte vendeur (liste admin)
│   └── ui/                    # Composants shadcn/ui (Button, Card, Dialog, Input...)
│
├── lib/
│   ├── auth.ts                # Décodage JWT, extraction du rôle
│   ├── axios.ts               # Instance Axios préconfigurée (base URL, intercepteurs)
│   └── utils.ts               # Utilitaires (cn, classnames...)
│
├── stores/
│   └── authStore.ts           # Store Zustand pour l'authentification
│
├── types/
│   └── index.ts               # Types TypeScript globaux (User, Role, AuthState...)
│
├── middleware.ts              # Guard de routing (JWT côté Edge)
├── next.config.js             # Configuration Next.js + PWA
├── tailwind.config.ts         # Configuration Tailwind
└── components.json            # Configuration shadcn/ui
```

---

## Prérequis

- **Node.js** 18 ou supérieur
- **npm** (ou yarn / pnpm)
- L'**API RapidGaz** doit être démarrée et accessible

---

## Installation

```bash
git clone <url-du-repo>
cd RapidGaz-frontend
npm install
```

---

## Lancer le projet

### Mode développement

```bash
npm run dev
```

L'application est disponible sur **http://localhost:3000**.

### Build de production

```bash
npm run build
npm start
```

### Linter

```bash
npm run lint
```

---

## Variables d'environnement

Créer un fichier `.env.local` à la racine (ignoré par git) :

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

> `NEXT_PUBLIC_API_URL` est l'URL de base de l'API Spring Boot. Si absent, Axios utilisera le proxy ou une valeur par défaut.

---

## Authentification et routage

L'authentification repose sur un **JWT stocké en cookie** (`rapidgaz_token`, durée 7 jours).

### Middleware Next.js (`middleware.ts`)

Le middleware s'exécute côté **Edge** avant chaque rendu et gère trois cas :

1. **Route protégée sans token valide** → redirige vers `/login` (+ supprime le cookie périmé si présent)
2. **Page d'accueil ou login avec token valide** → redirige vers le dashboard correspondant au rôle
3. **Page d'accueil avec token expiré** → redirige vers `/login` et nettoie le cookie

Routes protégées couvertes par le middleware : `/`, `/login`, `/register`, `/seller/**`, `/admin/**`

### Décodage JWT (côté client)

Le token n'est **jamais vérifié cryptographiquement côté client** (Edge runtime sans accès à la clé secrète). Seul le payload est décodé pour lire le rôle (`type`) et l'expiration (`exp`). La vérification réelle s'effectue côté API à chaque requête.

---

## Rôles et espaces utilisateurs

| Rôle | Espace | Routes |
|---|---|---|
| Non authentifié | Public | `/` (recherche de vendeurs) |
| `SELLER` | Vendeur | `/seller/dashboard`, `/seller/products`, `/seller/stock`, `/seller/location`, `/seller/profile` |
| `ADMIN` / `SUPER_ADMIN` | Administration | `/admin/dashboard`, `/admin/sellers`, `/admin/catalog`, `/admin/users` |

Le rôle est extrait du champ `type` du payload JWT (`"seller"` ou `"admin"`).

---

## Composants UI

Les composants d'interface sont basés sur **shadcn/ui** (Radix UI + Tailwind) :

| Composant | Description |
|---|---|
| `Button` | Bouton avec variantes (default, outline, ghost...) |
| `Card` | Conteneur carte |
| `Dialog` | Modale accessible |
| `Input` | Champ de saisie |
| `Label` | Étiquette de formulaire |
| `Select` | Liste déroulante |
| `Badge` | Badge de statut |

Les icônes proviennent de **lucide-react**.

---

## Gestion de l'état

L'état d'authentification est géré par **Zustand** (`stores/authStore.ts`) :

```ts
const { user, role, login, logout, rehydrate } = useAuthStore()
```

| Action | Description |
|---|---|
| `login(token, user, role)` | Stocke le token en cookie et met à jour le store |
| `logout()` | Supprime le cookie et réinitialise le store |
| `rehydrate()` | Relit le cookie après hydratation SSR |

Le store s'initialise automatiquement en lisant le cookie au chargement côté client.

---

## PWA

L'application est configurée comme **Progressive Web App** via `next-pwa` :

- Manifeste : `public/manifest.json`
- Service Worker généré automatiquement au build (`public/sw.js`)
- Workbox utilisé pour la gestion du cache

En développement, le service worker est désactivé pour éviter les conflits de cache.

---

## Structure des fichiers

```
RapidGaz-frontend/
├── app/                  # Pages et layouts Next.js (App Router)
├── components/           # Composants réutilisables
├── lib/                  # Utilitaires (auth, axios, cn)
├── stores/               # State management Zustand
├── types/                # Types TypeScript globaux
├── public/               # Assets statiques + PWA
├── middleware.ts          # Guard de routing (Edge)
├── next.config.js         # Config Next.js
├── tailwind.config.ts     # Config Tailwind
├── components.json        # Config shadcn/ui
├── package.json
└── .gitignore
```
