// DTOs mirroring the ProColis Express API serializers
// (ProColis-Api/src/utils/{user-serializer,mobile-serializers}.js).

export type Role = 'client' | 'driver' | 'admin' | 'super_admin'
export type UserStatus = 'active' | 'suspended' | 'deleted'
export type DriverStatus = 'available' | 'busy' | 'offline'
export type PaymentMethod = 'wave' | 'freeMoney' | 'orangeMoney' | 'card' | 'cash'

/** Raw parcel status as stored by the API (Prisma enum). */
export type ApiParcelStatus =
  | 'pending'
  | 'free'
  | 'confirmed'
  | 'picked_up'
  | 'in_transit'
  | 'arrived'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'

export interface User {
  id: string
  email: string | null
  phone: string
  fullName: string
  role: Role
  status: UserStatus
  profilePhoto?: string | null
  address?: string | null
  city?: string | null
  region?: string | null
  gender?: string | null
  garageId?: string | null
  garageName?: string | null
  primaryZoneId?: string | null
  primaryZoneName?: string | null
  driverStatus?: DriverStatus | null
  rating?: number | null
  totalDeliveries?: number
  completedDeliveries?: number
  cancelledDeliveries?: number
  isEmailVerified?: boolean
  isPhoneVerified?: boolean
  isProfileComplete?: boolean
  lastLogin?: string | null
  lastActiveAt?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface Garage {
  id: string
  name: string
  country?: string | null
  city?: string | null
  region?: string | null
  address?: string | null
  phone?: string | null
  latitude?: number | null
  longitude?: number | null
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface Zone {
  id: string
  name: string
  displayName?: string | null
  placeId?: string | null
  country?: string | null
  city?: string | null
  latitude: number
  longitude: number
  radius: number
  boundary?: number[][] | null
  type: 'CIRCLE' | 'POLYGON'
  isActive: boolean
  parentId?: string | null
  metadata?: Record<string, unknown> | null
  _count?: { driverZones?: number; parcels?: number }
  driverZones?: ZoneDriver[]
  parent?: { id: string; name: string } | null
  children?: { id: string; name: string; type: string }[]
  createdAt: string
  updatedAt: string
}

export interface ZoneDriver {
  driverId: string
  isPrimary: boolean
  createdAt: string
  driver: {
    id: string
    fullName: string
    phone: string
    driverStatus?: string | null
    rating?: number | null
    totalDeliveries?: number
    completedDeliveries?: number
  }
}

export type BidStatus = 'pending' | 'accepted' | 'rejected' | string

export interface Bid {
  id: string
  parcelId: string
  driverId: string
  driverName?: string
  driverPhone?: string
  price: number
  message?: string | null
  status: BidStatus
  responseMessage?: string | null
  audioUrl?: string | null
  respondedAt?: string | null
  createdAt?: string
  updatedAt?: string
  parcel?: { id: string; trackingNumber?: string; status?: string; receiverName?: string } | null
}

export interface ParcelEvent {
  id: string
  parcelId: string
  status: ApiParcelStatus
  description?: string | null
  location?: string | null
  userId?: string | null
  userName?: string | null
  userRole?: Role | null
  photoUrl?: string | null
  timestamp?: string
  createdAt?: string
}

export interface Parcel {
  id: string
  trackingNumber: string
  senderId?: string | null
  senderName: string
  senderPhone: string
  senderEmail?: string | null
  receiverName: string
  receiverPhone: string
  receiverEmail?: string | null
  receiverAddress?: string | null
  description?: string | null
  weight?: number | null
  length?: number | null
  width?: number | null
  height?: number | null
  type?: string | null
  status: ApiParcelStatus
  departureGarageId?: string | null
  departureGarageName?: string | null
  departureCity?: string | null
  arrivalGarageId?: string | null
  arrivalGarageName?: string | null
  arrivalCity?: string | null
  zoneId?: string | null
  driverId?: string | null
  driverName?: string | null
  driverPhone?: string | null
  driver?: User | null
  price?: number | null
  proposedPrice?: number | null
  negotiatedPrice?: number | null
  deliveryFees?: number | null
  totalAmount?: number | null
  insuranceAmount?: number | null
  urgentFee?: number | null
  isInsured?: boolean
  isUrgent?: boolean
  isFreeForBidding?: boolean
  selectedBidId?: string | null
  paymentMethod?: PaymentMethod | string | null
  paymentPhoneNumber?: string | null
  paymentStatus?: string | null
  signatureUrl?: string | null
  notes?: string | null
  pickupDate?: string | null
  deliveryDate?: string | null
  estimatedDeliveryDate?: string | null
  cancellationReason?: string | null
  cancelledBy?: string | null
  cancelledAt?: string | null
  createdBy?: string | null
  createdAt?: string
  updatedAt?: string
  bids?: Bid[]
  events?: ParcelEvent[]
  photoUrls?: string[]
  videoUrls?: string[]
  audioUrls?: string[]
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ListParams {
  page?: number
  limit?: number
  status?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  [key: string]: string | number | undefined
}

export interface AuthSession {
  user: User
  accessToken: string
  refreshToken: string
}
