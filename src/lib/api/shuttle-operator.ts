// Wrappers `/shuttle-operator/*` — CRUD lignes de transit, flotte et horaires
// rattachés au `shuttle_operator` connecté. Le back renvoie 404 sur les
// ressources d'un autre opérateur (voir shuttle.controller.js) : toute 404
// signifie « pas à moi » et non « n'existe pas tout court ».

import { api } from './client'

export type TransitOperatorKind = 'ddd' | 'aftu'
export type TransitDirection = 'aller' | 'retour'
export type ShuttleVehicleStatus = 'available' | 'maintenance' | 'retired'
export type ShuttleVehicleType = 'bus' | 'minibus' | 'car' | 'van'

export interface ShuttleLineStop {
  order: number
  label: string
  zoneId: string
}

export interface ShuttleLine {
  id: string
  operator: TransitOperatorKind
  number: string
  direction: TransitDirection
  name: string
  origin: string
  destination: string
  operatorUserId: string | null
  stops: ShuttleLineStop[]
  createdAt: string
  updatedAt: string
}

export interface ShuttleVehicle {
  id: string
  operatorUserId: string
  plateNumber: string
  model: string
  type: ShuttleVehicleType
  capacity: number
  status: ShuttleVehicleStatus
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface ShuttleSchedule {
  id: string
  operatorUserId: string
  transitLineId: string
  daysOfWeek: number[]
  departureTime: string
  activeFrom: string
  activeUntil: string | null
  notes?: string | null
  transitLine?: { id: string; name: string; number: string; direction: TransitDirection }
  createdAt: string
  updatedAt: string
}

export interface ShuttleOverview {
  lineCount: number
  vehicleCount: number
  availableVehicleCount: number
  scheduleCount: number
  activeScheduleCount: number
}

export interface CreateLinePayload {
  operator: TransitOperatorKind
  number: string
  direction: TransitDirection
  name: string
  origin: string
  destination: string
  source?: string | null
  stops: ShuttleLineStop[]
}
export interface UpdateLinePayload {
  name?: string
  number?: string
  origin?: string
  destination?: string
  direction?: TransitDirection
  stops?: ShuttleLineStop[]
}

export interface CreateVehiclePayload {
  plateNumber: string
  model: string
  type: ShuttleVehicleType
  capacity: number
  status?: ShuttleVehicleStatus
  notes?: string | null
}
export interface UpdateVehiclePayload {
  plateNumber?: string
  model?: string
  type?: ShuttleVehicleType
  capacity?: number
  status?: ShuttleVehicleStatus
  notes?: string | null
}

export interface CreateSchedulePayload {
  transitLineId: string
  daysOfWeek: number[]
  departureTime: string
  activeFrom?: string
  activeUntil?: string | null
  notes?: string | null
}
export interface UpdateSchedulePayload {
  daysOfWeek?: number[]
  departureTime?: string
  activeFrom?: string
  activeUntil?: string | null
  notes?: string | null
}

export async function getOverview(): Promise<ShuttleOverview> {
  const { data } = await api.get('/shuttle-operator/overview')
  const d = (data?.data ?? {}) as Partial<ShuttleOverview>
  return {
    lineCount: d.lineCount ?? 0,
    vehicleCount: d.vehicleCount ?? 0,
    availableVehicleCount: d.availableVehicleCount ?? 0,
    scheduleCount: d.scheduleCount ?? 0,
    activeScheduleCount: d.activeScheduleCount ?? 0,
  }
}

export async function listLines(): Promise<ShuttleLine[]> {
  const { data } = await api.get('/shuttle-operator/lines')
  return data?.data?.lines ?? []
}
export async function createLine(payload: CreateLinePayload): Promise<ShuttleLine> {
  const { data } = await api.post('/shuttle-operator/lines', payload)
  return data.data.line
}
export async function updateLine(lineId: string, payload: UpdateLinePayload): Promise<ShuttleLine> {
  const { data } = await api.patch(`/shuttle-operator/lines/${lineId}`, payload)
  return data.data.line
}
export async function deleteLine(lineId: string): Promise<void> {
  await api.delete(`/shuttle-operator/lines/${lineId}`)
}

export async function listVehicles(): Promise<ShuttleVehicle[]> {
  const { data } = await api.get('/shuttle-operator/vehicles')
  return data?.data?.vehicles ?? []
}
export async function createVehicle(payload: CreateVehiclePayload): Promise<ShuttleVehicle> {
  const { data } = await api.post('/shuttle-operator/vehicles', payload)
  return data.data.vehicle
}
export async function updateVehicle(vehicleId: string, payload: UpdateVehiclePayload): Promise<ShuttleVehicle> {
  const { data } = await api.patch(`/shuttle-operator/vehicles/${vehicleId}`, payload)
  return data.data.vehicle
}
export async function deleteVehicle(vehicleId: string): Promise<void> {
  await api.delete(`/shuttle-operator/vehicles/${vehicleId}`)
}

export async function listSchedules(): Promise<ShuttleSchedule[]> {
  const { data } = await api.get('/shuttle-operator/schedules')
  return data?.data?.schedules ?? []
}
export async function createSchedule(payload: CreateSchedulePayload): Promise<ShuttleSchedule> {
  const { data } = await api.post('/shuttle-operator/schedules', payload)
  return data.data.schedule
}
export async function updateSchedule(scheduleId: string, payload: UpdateSchedulePayload): Promise<ShuttleSchedule> {
  const { data } = await api.patch(`/shuttle-operator/schedules/${scheduleId}`, payload)
  return data.data.schedule
}
export async function deleteSchedule(scheduleId: string): Promise<void> {
  await api.delete(`/shuttle-operator/schedules/${scheduleId}`)
}

// SCP-006 — Supervision temps réel : trajets actifs sur les lignes de l'opérateur.
export interface ShuttleLivePosition {
  latitude: number
  longitude: number
  accuracyMeters: number
  capturedAt: string
  expiresAt: string
}

export interface ShuttleLiveNextStop {
  order: number
  label: string
  zoneId: string
}

export interface ShuttleLiveConfirmations {
  pickupDone: number
  pickupTotal: number
  dropoffDone: number
  dropoffTotal: number
}

export interface ShuttleLiveJourney {
  advertisementId: string
  departureAt: string | null
  driver: { id: string; fullName: string | null } | null
  line: { id: string; number: string; name: string; direction: TransitDirection } | null
  position: ShuttleLivePosition | null
  stopsTotal: number
  stopsReached: number
  nextStop: ShuttleLiveNextStop | null
  confirmations: ShuttleLiveConfirmations
}

export interface ShuttleLiveFleet {
  available: number
  maintenance: number
  retired: number
}

export interface ShuttleLiveSnapshot {
  activeJourneys: ShuttleLiveJourney[]
  fleet: ShuttleLiveFleet
  generatedAt: string
}

export async function getLive(): Promise<ShuttleLiveSnapshot> {
  const { data } = await api.get('/shuttle-operator/live')
  const d = (data?.data ?? {}) as Partial<ShuttleLiveSnapshot>
  return {
    activeJourneys: d.activeJourneys ?? [],
    fleet: d.fleet ?? { available: 0, maintenance: 0, retired: 0 },
    generatedAt: d.generatedAt ?? new Date().toISOString(),
  }
}

export const DAY_LABELS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
export function formatDaysOfWeek(days: number[]): string {
  if (!days.length) return '—'
  return days
    .slice()
    .sort((a, b) => a - b)
    .map((d) => DAY_LABELS_FR[d] ?? String(d))
    .join(' · ')
}
