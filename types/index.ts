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

// Enums stricts - valeurs exactes utilisées par le backend
export type Brand = 'ORYX' | 'JNP' | 'TOTAL'
export type GasSize = 'KG_6' | 'KG_12' | 'KG_25'

// Labels affichés à l'utilisateur
export const BRAND_LABELS: Record<Brand, string> = {
  ORYX: 'Oryx',
  JNP: 'JNP',
  TOTAL: 'Total',
}

export const SIZE_LABELS: Record<GasSize, string> = {
  KG_6: '6 kg',
  KG_12: '12 kg',
  KG_25: '25 kg',
}

export interface Product {
  id: number
  brand: Brand
  size: GasSize
  price: number
  stockQuantity?: number
}

export interface AuthState {
  token: string | null
  user: User | null
  role: Role | null
  login: (token: string, user: User, role: Role) => void
  logout: () => void
  rehydrate: () => void
}

// Réponse plate de l'API /api/public/sellers
export interface SearchResult {
  displayName: string
  phone: string
  distance: number
  googleMapsUrl: string
  product: {
    brand: string
    size: string
    price: number
    stockQuantity: number
  }
}

export interface AdminSeller {
  id: number
  displayName: string
  email: string
  phone: string
  isOpen: boolean
  isActive: boolean
  createdAt?: string
}

export interface AdminUser {
  id: number
  name: string
  email: string
  role: 'ADMIN' | 'SUPER_ADMIN'
  isActive: boolean
  createdAt?: string
}

export interface PagedResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
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
