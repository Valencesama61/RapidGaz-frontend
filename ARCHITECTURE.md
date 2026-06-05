# ARCHITECTURE - RapidGaz Frontend

## 1. Stack & Dépendances

### Framework & Build
- next: 14.2.x (App Router, Server Components)
- react: 18.x
- react-dom: 18.x
- typescript: 5.x

### UI & Styles
- tailwindcss: 3.4.x
- @tailwindcss/forms: 0.5.x
- shadcn/ui (via CLI - composants copiés dans components/ui/)
- lucide-react: 0.400.x (icônes)
- class-variance-authority: 0.7.x
- clsx: 2.x
- tailwind-merge: 2.x

### State & Data
- zustand: 4.5.x
- axios: 1.7.x
- js-cookie: 3.0.x
- @types/js-cookie: 3.0.x

### PWA
- next-pwa: 5.6.x

### Utilitaires
- jose: 5.x (décodage JWT côté client sans vérification de signature)

---

## 2. Design Patterns

### Routing - Next.js App Router avec Route Groups
Les route groups permettent de regrouper les layouts sans affecter l'URL :
- `(public)` - accessible sans authentification, layout minimal
- `(auth)` - pages login uniquement, layout centré
- `(seller)` - layout avec SellerNav (bottom bar / sidebar), middleware vérifie rôle SELLER
- `(admin)` - layout avec AdminNav, middleware vérifie rôle ADMIN ou SUPER_ADMIN

Chaque groupe dispose de son propre `layout.tsx` qui injecte la navigation adaptée.

### Authentification JWT - Zustand + js-cookie
```
login() → appel API → reçoit accessToken
       → stocker dans js-cookie (httpOnly impossible côté client, donc cookie standard)
       → stocker dans Zustand store (mémoire)
       → décoder JWT avec jose pour extraire { sub, role, name }
       → mettre à jour authStore.user et authStore.role
       → redirect selon rôle
```
La persistance entre rechargements fonctionne via js-cookie : au démarrage de l'app,
`authStore` lit le cookie pour réhydrater le token.

### Intercepteur Axios
`lib/axios.ts` crée une instance avec `baseURL = http://localhost:8080`.
L'intercepteur `request` lit le token depuis `Cookies.get('rapidgaz_token')` et injecte
`Authorization: Bearer {token}` sur chaque requête.
L'intercepteur `response` intercepte les 401 : vide le store et redirige vers `/login`.

### Protection de routes - middleware.ts
Le middleware Next.js s'exécute sur le Edge Runtime avant le rendu.
Il lit le cookie `rapidgaz_token`, vérifie sa présence (pas la signature - Edge Runtime
ne peut pas importer jose facilement).
- `/seller/*` : redirige vers `/login` si pas de token
- `/admin/*` : redirige vers `/login` si pas de token
- `/login` : redirige vers le dashboard approprié si token présent

---

## 3. Schéma de Données (Types TypeScript)

```typescript
// types/index.ts

export type Role = 'SELLER' | 'ADMIN' | 'SUPER_ADMIN'

export interface User {
  id: number
  email: string
  name: string
  role: Role
}

export interface Location {
  latitude: number
  longitude: number
}

export interface Seller {
  id: number
  displayName: string
  email: string
  phone: string
  isOpen: boolean
  isSuspended: boolean
  location?: Location
  createdAt?: string
}

export type Brand = 'SonaGaz' | 'Sodigaz' | 'Total' | 'Oryx'
export type GasSize = 6 | 12.5 | 25

export interface Product {
  id: number
  brand: Brand
  size: GasSize
  price: number
  stockQuantity: number
}

export interface AuthState {
  token: string | null
  user: User | null
  role: Role | null
  login: (token: string, user: User, role: Role) => void
  logout: () => void
}

export interface SearchResult {
  seller: {
    id: number
    displayName: string
    phone: string
    location: Location
  }
  product: Product
  distance: string  // ex: "1.2 km"
}

export interface AdminStats {
  totalSellers: number
  activeSellers: number
  suspendedSellers: number
  openSellers: number
  totalProducts: number
  totalAdmins: number
}

export interface LoginResponse {
  accessToken: string
  refreshToken?: string
  tokenType?: string
  role?: string
  name?: string
}
```

---

## 4. Structure des Fichiers

```
/home/valence/VisionProject/LearnJava/RapidGaz/frontend/
│
├── ARCHITECTURE.md
│
├── app/
│   ├── layout.tsx                    ← Root layout : <html>, <body>, fonts
│   ├── globals.css                   ← Tailwind directives + variables CSS
│   │
│   ├── (public)/
│   │   ├── layout.tsx                ← Layout minimal (header simple)
│   │   └── page.tsx                  ← Page recherche visiteur (Module F2)
│   │
│   ├── (auth)/
│   │   ├── layout.tsx                ← Layout centré (card login)
│   │   └── login/
│   │       └── page.tsx              ← Page login vendeur + admin (Module F3)
│   │
│   ├── (seller)/
│   │   ├── layout.tsx                ← Layout avec SellerNav
│   │   ├── dashboard/page.tsx        ← Dashboard vendeur (F4.1)
│   │   ├── profile/page.tsx          ← Profil vendeur (F4.2)
│   │   ├── location/page.tsx         ← Localisation vendeur (F4.3)
│   │   └── products/page.tsx         ← Produits & stocks vendeur (F4.4)
│   │
│   └── (admin)/
│       ├── layout.tsx                ← Layout avec AdminNav
│       ├── dashboard/page.tsx        ← Dashboard admin (F5.1)
│       ├── sellers/
│       │   ├── page.tsx              ← Liste vendeurs (F5.2)
│       │   └── [id]/page.tsx         ← Détail vendeur
│       └── users/page.tsx            ← Gestion admins (F5.3)
│
├── components/
│   ├── ui/                           ← Composants shadcn/ui générés
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   └── badge.tsx
│   │
│   ├── layout/
│   │   ├── SellerNav.tsx             ← Bottom bar mobile + sidebar desktop (seller)
│   │   └── AdminNav.tsx              ← Bottom bar mobile + sidebar desktop (admin)
│   │
│   └── shared/
│       ├── SearchResultCard.tsx      ← Carte résultat recherche
│       ├── ProductRow.tsx            ← Ligne produit avec actions stock
│       └── SellerCard.tsx            ← Carte vendeur (admin)
│
├── lib/
│   ├── axios.ts                      ← Instance Axios + intercepteurs
│   └── auth.ts                       ← decodeToken(), isTokenExpired()
│
├── stores/
│   └── authStore.ts                  ← Zustand store auth
│
├── types/
│   └── index.ts                      ← Interfaces TypeScript
│
├── middleware.ts                     ← Protection routes Next.js
│
├── public/
│   ├── manifest.json                 ← PWA manifest
│   └── icons/                        ← Icônes PWA (192x192, 512x512)
│
├── next.config.js                    ← Config Next.js + next-pwa
├── tailwind.config.ts                ← Config Tailwind
├── tsconfig.json
├── components.json                   ← Config shadcn/ui
└── package.json
```

---

## 5. Contrat API (Endpoints Consommés)

### Public (sans authentification)

#### Recherche vendeurs
```
GET /api/public/sellers/search
Query params: lat={number}&lng={number}&radius={number}
Body: { brand: string, size: number }
Response: SearchResult[]
```

### Authentification Vendeur

#### Login vendeur
```
POST /api/seller/auth/login
Body: { email: string, password: string }
Response: { accessToken: string, refreshToken: string }
```

### Authentification Admin

#### Login admin
```
POST /api/admin/auth/login
Body: { email: string, password: string }
Response: { accessToken: string, tokenType: string, role: string, name: string }
```

### Endpoints Vendeur (Authorization: Bearer {token})

#### Profil
```
GET  /api/seller/me
Response: Seller

PUT  /api/seller/me
Body: { displayName?: string, phone?: string, isOpen?: boolean }
Response: Seller

PUT  /api/seller/me/password
Body: { oldPassword: string, newPassword: string }
Response: 200 OK
```

#### Localisation
```
GET  /api/seller/me/location
Response: Location | null

POST /api/seller/me/location
Body: { latitude: number, longitude: number }
Response: Location

PUT  /api/seller/me/location
Body: { latitude: number, longitude: number }
Response: Location
```

#### Produits
```
GET    /api/seller/me/products
Response: Product[]

POST   /api/seller/me/products
Body: { brand: string, size: number, price: number }
Response: Product

PUT    /api/seller/me/products/{id}
Body: { brand?: string, size?: number, price?: number }
Response: Product

DELETE /api/seller/me/products/{id}
Response: 204 No Content
```

#### Stock
```
PATCH /api/seller/me/products/{id}/stock/increment
Body: { amount: number }
Response: Product

PATCH /api/seller/me/products/{id}/stock/decrement
Body: { amount: number }
Response: Product

PATCH /api/seller/me/products/{id}/stock/reset
Response: Product
```

### Endpoints Admin (Authorization: Bearer {token})

#### Statistiques
```
GET /api/admin/stats
Response: AdminStats
```

#### Vendeurs
```
GET /api/admin/sellers
Response: Seller[] (paginée, paramètres page/size optionnels)

GET /api/admin/sellers/{id}
Response: Seller (avec produits et localisation)

PUT /api/admin/sellers/{id}/suspend
Response: Seller

PUT /api/admin/sellers/{id}/reactivate
Response: Seller
```

#### Admins (SUPER_ADMIN uniquement)
```
GET  /api/admin/users
Response: User[]

POST /api/admin/users
Body: { name: string, email: string, password: string }
Response: User
```

---

## 6. Modèle de Sécurité

### Flux d'authentification
```
1. User saisit email + password sur /login
2. Frontend POST vers /api/seller/auth/login ou /api/admin/auth/login
3. Backend retourne accessToken (JWT)
4. Frontend :
   a. Stocke le token dans js-cookie : Cookies.set('rapidgaz_token', token, { expires: 7 })
   b. Décode le JWT (jose/decodeJwt) pour extraire { sub, role, name, exp }
   c. Met à jour Zustand authStore : { token, user, role }
   d. Redirige vers /seller/dashboard ou /admin/dashboard selon role
```

### Règles de redirection par rôle
| Rôle | Destination après login |
|------|------------------------|
| SELLER | /seller/dashboard |
| ADMIN | /admin/dashboard |
| SUPER_ADMIN | /admin/dashboard |

### Protection middleware (middleware.ts)
```
Matcher: ['/seller/:path*', '/admin/:path*', '/login']

Pour /seller/* et /admin/* :
  - Lire cookie 'rapidgaz_token'
  - Si absent → redirect('/login')
  - Si présent → laisser passer (la vérification de rôle se fait côté layout/page)

Pour /login :
  - Si cookie présent → redirect vers dashboard selon rôle stocké dans cookie
  - Sinon → laisser passer
```

### Gestion des tokens expirés
- L'intercepteur Axios réponse intercepte HTTP 401
- Il appelle `authStore.logout()` : vide Zustand + supprime cookie
- Il redirige vers `/login` via `window.location.href = '/login'`
- Pas de refresh token automatique (le backend vendeur retourne un refreshToken mais la logique de refresh n'est pas requise dans ce MVP)

### Isolation par rôle dans les layouts
- Le layout `(seller)/layout.tsx` vérifie `authStore.role === 'SELLER'` et redirige sinon
- Le layout `(admin)/layout.tsx` vérifie `authStore.role === 'ADMIN' || 'SUPER_ADMIN'`
- La section "Admins" dans AdminNav est masquée si `role !== 'SUPER_ADMIN'`

---

## 7. Identité Visuelle

### Palette de couleurs
| Usage | Couleur | Tailwind |
|-------|---------|----------|
| Principal | #f97316 | orange-500 |
| Principal hover | #ea6c0a | orange-600 |
| Fond principal | #ffffff | white |
| Fond secondaire | #f9fafb | gray-50 |
| Texte principal | #111827 | gray-900 |
| Texte secondaire | #6b7280 | gray-500 |
| Bordure | #e5e7eb | gray-200 |
| Succès | #22c55e | green-500 |
| Erreur | #ef4444 | red-500 |
| Warning | #f59e0b | amber-500 |

### Composants shadcn/ui utilisés
- `Button` - variante `default` (orange) et `outline`
- `Card`, `CardContent`, `CardHeader`, `CardTitle`
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`
- `Input`
- `Label`
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`
- `Badge` - pour statuts (ouvert/fermé, actif/suspendu)

### Conventions CSS/Tailwind
```
Bouton principal   : bg-orange-500 hover:bg-orange-600 text-white rounded-lg h-12 px-6 font-semibold
Carte              : rounded-xl shadow-sm border border-gray-200 bg-white
Input              : h-12 rounded-lg border-gray-300 focus:border-orange-500 focus:ring-orange-500
Bottom nav (mobile): fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around
Sidebar (desktop)  : hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-screen fixed
Zone tactile min   : min-h-[48px] (touches mobiles)
```

### Typographie
- Font : Inter (via `next/font/google`)
- Titre page : `text-2xl font-bold text-gray-900`
- Sous-titre : `text-sm text-gray-500`
- Label card : `text-xs font-medium text-gray-500 uppercase tracking-wide`
- Valeur card : `text-2xl font-bold text-gray-900`
