import { api } from './client'

export interface PilotMetricsWindow {
  days: number
  from: string
  to: string
}

export interface PilotMetrics {
  window: PilotMetricsWindow
  parcels: Record<string, number>
  handovers: Record<string, number>
  stopEvents: number
  offersAccepted: number
  webhooks: Record<string, number>
  whatsapp: Record<string, number>
  anomalies: Record<string, number>
  customsSigned: number
  shipmentBatches: Record<string, number>
}

export async function getPilotMetrics(windowDays?: number): Promise<PilotMetrics> {
  const params = windowDays ? { windowDays } : undefined
  const { data } = await api.get('/super-admin/pilot-metrics/14d', { params })
  return data.data ?? data
}
