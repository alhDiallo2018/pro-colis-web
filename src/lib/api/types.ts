// DTOs mirroring the ProColis Express API serializers
// (ProColis-Api/src/utils/{user-serializer,mobile-serializers}.js).

export type Role =
  | 'client'
  | 'driver'
  | 'admin'
  | 'super_admin'
  /** Rôle support historique — accès transverse à l'espace support. */
  | 'support'
  | 'support_technique'
  | 'support_commercial'

/** Les trois rôles qui partagent l'espace /support-admin. */
export const SUPPORT_ROLES = ['support', 'support_technique', 'support_commercial'] as const

export function isSupportRole(role: Role | undefined | null): boolean {
  return !!role && (SUPPORT_ROLES as readonly string[]).includes(role)
}
export type UserStatus = 'active' | 'suspended' | 'deleted'
export type DriverStatus = 'available' | 'busy' | 'offline'
export type PaymentMethod = 'wave' | 'freemMoney' | 'orange_money' | 'card' | 'cash'
export type PaymentChannel = 'cash' | 'platform'
export type CashCollectionPoint = 'sender_pickup' | 'receiver_delivery'

/** Raw parcel status as stored by the API (Prisma enum). */
export type ApiParcelStatus =
  | 'pending'
  | 'free'
  /** Proposition directe envoyée à un chauffeur, en attente de sa réponse. */
  | 'proposal_sent'
  | 'negotiating'
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
  zoneId?: string | null
  zoneName?: string | null
  primaryZoneId?: string | null
  primaryZoneName?: string | null
  driverStatus?: DriverStatus | null
  rating?: number | null
  totalDeliveries?: number
  completedDeliveries?: number
  cancelledDeliveries?: number
  isEmailVerified?: boolean
  isPhoneVerified?: boolean
  isVerified?: boolean
  isProfileComplete?: boolean
  lastLogin?: string | null
  lastActiveAt?: string | null
  createdAt?: string
  updatedAt?: string
  walletBalance?: number
  vehiclePlate?: string | null
  vehicleModel?: string | null
}

export interface Zone {
  id: string
  name: string
  displayName?: string | null
  placeId?: string | null
  country?: string | null
  /** Sérialisé par l'API (colonne `zones.region`) — l'ancien type Garage l'avait
   *  aussi, d'où les écrans qui l'affichent depuis la migration garage → zone. */
  region?: string | null
  city?: string | null
  latitude: number
  longitude: number
  radius: number
  boundary?: number[][] | null
  type: 'CIRCLE' | 'POLYGON'
  isActive: boolean
  status?: 'approved' | 'pending' | 'rejected'
  source?: string
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

export type BidStatus = 'pending' | 'countered' | 'accepted' | 'rejected' | string

/** Camp qui a posé le dernier prix : seul l'autre peut accepter. */
export type NegotiationSide = 'client' | 'driver'

export type ProposalStatus = 'pending' | 'accepted' | 'rejected' | 'countered' | 'expired'

/** Proposition directe : le client a choisi son chauffeur, qui doit répondre. */
export interface ParcelProposal {
  status: ProposalStatus
  driverId?: string | null
  driverName?: string | null
  price?: number | null
  lastCounterPrice?: number | null
  lastMessage?: string | null
  lastMessageAt?: string | null
  lastOfferBy: NegotiationSide
  negotiationCount: number
  canClientAccept: boolean
  canDriverAccept: boolean
  history?: {
    id: string
    fromUserId: string
    fromUserRole: NegotiationSide
    price: number
    message?: string | null
    createdAt: string
  }[]
}

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
  /** Dernier prix échangé et le commentaire qui l'accompagne. */
  lastOfferBy?: NegotiationSide
  lastPrice?: number | null
  lastMessage?: string | null
  lastMessageAt?: string | null
  canClientAccept?: boolean
  canDriverAccept?: boolean
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

/**
 * Dernière position GPS réelle du chauffeur associé au colis, telle qu'exposée
 * par l'API de tracking. `available` est `false` tant que le chauffeur n'a pas
 * commencé à émettre sa position — le Web n'affiche alors aucune position.
 */
export interface DriverLocation {
  available: boolean
  latitude?: number | null
  longitude?: number | null
  /** ISO timestamp de la dernière position reçue depuis l'appareil du chauffeur. */
  updatedAt?: string | null
}

/** Zone aplatie renvoyée par l'API de tracking (départ / arrivée). Les
 *  coordonnées sont optionnelles : elles ne sont pas encore exposées par toutes
 *  les versions de l'API. */
export interface ParcelZoneRef {
  id: string
  name: string
  city?: string | null
  latitude?: number | null
  longitude?: number | null
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
  departureZoneId?: string | null
  departureZoneName?: string | null
  departureCity?: string | null
  departureZone?: ParcelZoneRef | null
  /** Coordonnées plates du départ (exposées par l'endpoint public de tracking). */
  departureLatitude?: number | null
  departureLongitude?: number | null
  arrivalZoneId?: string | null
  arrivalZoneName?: string | null
  arrivalCity?: string | null
  arrivalZone?: ParcelZoneRef | null
  /** Coordonnées plates de l'arrivée (exposées par l'endpoint public de tracking). */
  arrivalLatitude?: number | null
  arrivalLongitude?: number | null
  zoneId?: string | null
  driverId?: string | null
  driverName?: string | null
  driverPhone?: string | null
  driver?: User | null
  /** Position GPS temps réel du chauffeur (null si l'API ne l'expose pas). */
  driverLocation?: DriverLocation | null
  /** Chauffeur retenu (null tant que la proposition n'est pas acceptée). */
  assignedDriverId?: string | null
  assignedDriver?: User | null
  proposedDriverId?: string | null
  proposedDriverName?: string | null
  proposedDriver?: User | null
  proposal?: ParcelProposal | null
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
  paymentChannel?: PaymentChannel | null
  acceptedPaymentChannels?: PaymentChannel[]
  cashCollectionPoint?: CashCollectionPoint | null
  cashCollectedAmount?: number | null
  cashCollectedAt?: string | null
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
  /** Conséquences d'annulation (pénalité, remboursement, répartition) exposées
   *  par le backend quand il les calcule. `null` = aucune donnée disponible.
   *  Contrat mobile imbriqué : voir `ParcelCancellation`. */
  cancellation?: ParcelCancellation | null
  createdBy?: string | null
  createdAt?: string
  updatedAt?: string
  bids?: Bid[]
  events?: ParcelEvent[]
  photoUrls?: string[]
  videoUrls?: string[]
  audioUrls?: string[]
}

/**
 * Responsabilité d'une annulation, décidée exclusivement par le backend.
 * Le Web ne doit jamais supposer une répartition (ex. 50/50) : il affiche la
 * valeur retournée.
 */
export type CancellationResponsibility = 'client' | 'driver' | 'shared' | 'exempt' | string

/** Statut du remboursement tel qu'exposé par l'API. */
export type RefundStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'none' | string

/** Conséquences financières pour une partie (client ou chauffeur). */
export interface CancellationPartyBreakdown {
  /** Pénalité imputée à cette partie. */
  penalty?: number | null
  /** Frais imputés à cette partie (hors pénalité). */
  fees?: number | null
  /** Montant remboursé à cette partie. */
  refund?: number | null
  /** Prélèvement wallet (chauffeur). */
  walletDeduction?: number | null
  walletBefore?: number | null
  walletAfter?: number | null
  /** Prélèvement de points (chauffeur). */
  pointsDeduction?: number | null
  pointsBefore?: number | null
  pointsAfter?: number | null
  /** Dette créée (chauffeur). */
  debtAmount?: number | null
  debtBefore?: number | null
  debtAfter?: number | null
}

export interface CancellationReasonOption {
  value: string
  label: string
}

/**
 * Contrat mobile d'annulation imbriqué, exposé par le backend dans le champ
 * `parcel.cancellation` (via `snapshotToCancellation`). Il est distinct du
 * contrat web plat (`CancellationOutcome`) renvoyé par les endpoints de devis
 * et d'annulation : mêmes données, champs imbriqués et partiellement masqués
 * selon le rôle (ex. `refund` est `null` pour un chauffeur).
 */
export interface ParcelCancellation {
  allowed: boolean
  penalized: boolean
  /** Responsabilité décidée par le backend (équivalent mobile de `responsibility`). */
  responsibleParty: CancellationResponsibility | null
  penalty: {
    amount: number | null
    currency: string | null
    label: string | null
    applied: boolean
    clientShare: number | null
    driverShare: number | null
  }
  refund: {
    initialAmount: number | null
    fees: number | null
    paydunyaFee: number | null
    penaltyAmount: number | null
    refundedAmount: number | null
    status: RefundStatus | null
  } | null
  wallet: { before: number | null; deduction: number | null; after: number | null }
  points: { before: number | null; deduction: number | null; after: number | null }
  debt: { before: number | null; created: number | null; after: number | null }
}

/**
 * Conséquences d'une annulation calculées et exposées par le backend.
 * Tous les montants sont optionnels et jamais recalculés côté Web : le Web
 * affiche uniquement ce que l'API retourne.
 */
export interface CancellationOutcome {
  /** L'annulation est-elle autorisée ? (décidé par le backend) */
  allowed: boolean
  /** L'annulation est-elle pénalisée ? */
  penalized: boolean
  /** L'annulation est-elle exonérée de pénalité ? */
  exempt: boolean
  /** Responsabilité décidée par le backend. */
  responsibility: CancellationResponsibility | null
  /** Montant initialement payé. */
  paidAmount?: number | null
  /** Frais globaux (PayDunya + techniques). */
  fees?: number | null
  /** Frais PayDunya (distincts de la pénalité). */
  paydunyaFee?: number | null
  /** Frais techniques. */
  technicalFee?: number | null
  /** Pénalité totale. */
  penalty?: number | null
  /** Montant remboursé. */
  refund?: number | null
  refundStatus?: RefundStatus | null
  /** Message de conséquence fourni par le backend. */
  message?: string | null
  /** Motifs d'annulation fournis par la configuration/API. */
  reasons?: CancellationReasonOption[] | null
  /** Part client (affichée uniquement au client). */
  client?: CancellationPartyBreakdown | null
  /** Part chauffeur (affichée uniquement au chauffeur/admin autorisé). */
  driver?: CancellationPartyBreakdown | null
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
