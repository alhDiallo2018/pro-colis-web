// DTOs mirroring the ProColis Express API serializers
// (ProColis-Api/src/utils/{user-serializer,mobile-serializers}.js).

export type Role = 'client' | 'driver' | 'admin' | 'super_admin'
export type UserStatus = 'active' | 'suspended' | 'deleted'
export type DriverStatus = 'available' | 'busy' | 'offline'

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
  type?: string | null
  status: ApiParcelStatus
  departureGarageId?: string | null
  departureGarageName?: string | null
  departureCity?: string | null
  arrivalGarageId?: string | null
  arrivalGarageName?: string | null
  arrivalCity?: string | null
  driverId?: string | null
  driverName?: string | null
  driverPhone?: string | null
  driver?: User | null
  price?: number | null
  proposedPrice?: number | null
  negotiatedPrice?: number | null
  totalAmount?: number | null
  isInsured?: boolean
  isUrgent?: boolean
  isFreeForBidding?: boolean
  selectedBidId?: string | null
  paymentStatus?: string | null
  signatureUrl?: string | null
  notes?: string | null
  pickupDate?: string | null
  deliveryDate?: string | null
  estimatedDeliveryDate?: string | null
  cancellationReason?: string | null
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
