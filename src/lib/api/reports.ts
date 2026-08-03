import { api } from './client'

/** Un point de la série temporelle : heure du jour ou date ISO selon `bucket`. */
export interface ReportPoint {
  key: string
  created: number
  delivered: number
  revenue: number
}

export interface PeriodReport {
  /** Jour couvert (rapport journalier uniquement), format YYYY-MM-DD. */
  date?: string
  year?: number
  month?: number
  from: string
  to: string
  bucket: 'hour' | 'day'
  totals: {
    created: number
    delivered: number
    cancelled: number
    deliveryRate: number
    revenue: number
    deliveredAmount: number
  }
  parcelsByStatus: Record<string, number>
  series: ReportPoint[]
  topDrivers: { driverId: string; fullName: string | null; delivered: number }[]
}

const EMPTY: PeriodReport = {
  from: '',
  to: '',
  bucket: 'day',
  totals: { created: 0, delivered: 0, cancelled: 0, deliveryRate: 0, revenue: 0, deliveredAmount: 0 },
  parcelsByStatus: {},
  series: [],
  topDrivers: [],
}

function normalize(payload: unknown): PeriodReport {
  const report = (payload ?? {}) as Partial<PeriodReport>
  return {
    ...EMPTY,
    ...report,
    totals: { ...EMPTY.totals, ...(report.totals ?? {}) },
    parcelsByStatus: report.parcelsByStatus ?? {},
    series: report.series ?? [],
    topDrivers: report.topDrivers ?? [],
  }
}

/** Rapport journalier de la zone de l'admin connecté (série horaire). */
export async function garageDaily(date?: string): Promise<PeriodReport> {
  const { data } = await api.get('/garage-admin/reports/daily', { params: { date } })
  return normalize(data.report ?? data.data?.report)
}

/** Rapport mensuel de la zone (série par jour). */
export async function garageMonthly(year: number, month: number): Promise<PeriodReport> {
  const { data } = await api.get('/garage-admin/reports/monthly', { params: { year, month } })
  return normalize(data.report ?? data.data?.report)
}

/** Rapport journalier plateforme (super admin / support). */
export async function adminDaily(date?: string): Promise<PeriodReport> {
  const { data } = await api.get('/super-admin/reports/daily', { params: { date } })
  return normalize(data.report ?? data.data?.report)
}

export async function adminMonthly(year: number, month: number): Promise<PeriodReport> {
  const { data } = await api.get('/super-admin/reports/monthly', { params: { year, month } })
  return normalize(data.report ?? data.data?.report)
}

/**
 * Export brut d'une zone ou de la plateforme. L'API renvoie du JSON : la
 * conversion CSV est faite côté navigateur, sans aller-retour supplémentaire.
 */
export async function garageExport(): Promise<Record<string, unknown>[]> {
  const { data } = await api.get('/garage-admin/reports/export')
  return (data.data ?? []) as Record<string, unknown>[]
}

export async function adminExport(type: 'parcels' | 'users' = 'parcels'): Promise<Record<string, unknown>[]> {
  const { data } = await api.get('/super-admin/export', { params: { type } })
  return (data.data ?? []) as Record<string, unknown>[]
}
