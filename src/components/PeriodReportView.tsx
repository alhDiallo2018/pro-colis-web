import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button, SegmentedControl, StatBox } from '@/ds'
import { PARCEL_STATUS, type ParcelStatus } from '@/ds'
import { Panel } from '@/components/Panel'
import { BarChart } from '@/components/BarChart'
import { QueryState } from '@/components/QueryState'
import type { PeriodReport } from '@/lib/api/reports'
import { formatFcfa, toStatusKey } from '@/lib/format'
import { downloadCsv, fileStamp } from '@/lib/downloadCsv'

export type ReportPeriod = 'day' | 'month'

interface Props {
  /** Préfixe de clé de cache — distingue le rapport de zone du rapport plateforme. */
  scope: string
  fetchDaily: (date: string) => Promise<PeriodReport>
  fetchMonthly: (year: number, month: number) => Promise<PeriodReport>
  /** Export brut, absent si le rôle n'y a pas droit. */
  onExport?: () => Promise<Record<string, unknown>[]>
  exportName?: string
}

const PERIODS = [
  { value: 'day', label: 'Jour', icon: 'today' },
  { value: 'month', label: 'Mois', icon: 'calendar_month' },
]

function todayIso() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

/** Étiquette d'axe : l'heure telle quelle, la date réduite au quantième. */
function pointLabel(key: string, bucket: 'hour' | 'day'): string {
  return bucket === 'hour' ? key : key.slice(8)
}

/**
 * Vue de rapport partagée par l'admin de zone et le super admin. Les chiffres
 * proviennent tous de l'API : aucune valeur n'est simulée côté écran.
 */
export function PeriodReportView({ scope, fetchDaily, fetchMonthly, onExport, exportName = 'export' }: Props) {
  const [period, setPeriod] = useState<ReportPeriod>('day')
  const [date, setDate] = useState(todayIso())
  const [month, setMonth] = useState(() => todayIso().slice(0, 7))
  const [exporting, setExporting] = useState(false)

  const query = useQuery({
    queryKey: [scope, 'report', period, period === 'day' ? date : month],
    queryFn: () => {
      if (period === 'day') return fetchDaily(date)
      const [year, monthPart] = month.split('-')
      return fetchMonthly(Number(year), Number(monthPart))
    },
  })

  const report = query.data
  const bars = useMemo(() => (report?.series ?? []).map((point) => point.created), [report])
  const labels = useMemo(
    () => (report?.series ?? []).map((point) => pointLabel(point.key, report?.bucket ?? 'day')),
    [report],
  )
  // Un axe à 24 ou 31 graduations devient illisible : on n'en garde qu'une sur quatre.
  const sparseLabels = labels.map((label, index) => (index % 4 === 0 ? label : ''))

  const statusEntries = Object.entries(report?.parcelsByStatus ?? {})
  const maxStatus = Math.max(1, ...statusEntries.map(([, count]) => count))

  const runExport = async () => {
    if (!onExport) return
    setExporting(true)
    try {
      const rows = await onExport()
      if (rows.length > 0) downloadCsv(`procolis-${exportName}-${fileStamp()}.csv`, rows)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <SegmentedControl
          options={PERIODS}
          value={period}
          onChange={(value) => setPeriod(value as ReportPeriod)}
        />
        {period === 'day' ? (
          <input
            type="date"
            value={date}
            max={todayIso()}
            onChange={(e) => setDate(e.target.value)}
            style={dateInputStyle}
          />
        ) : (
          <input
            type="month"
            value={month}
            max={todayIso().slice(0, 7)}
            onChange={(e) => setMonth(e.target.value)}
            style={dateInputStyle}
          />
        )}
        <div style={{ flex: 1 }} />
        {onExport && (
          <Button size="sm" variant="secondary" icon="download" loading={exporting} onClick={runExport}>
            Exporter en CSV
          </Button>
        )}
      </div>

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => query.refetch()}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
          <StatBox icon="package_2" tone="primary" value={report?.totals.created ?? 0} label="Colis créés" />
          <StatBox icon="task_alt" tone="green" value={report?.totals.delivered ?? 0} label="Livrés" />
          <StatBox icon="cancel" tone="red" value={report?.totals.cancelled ?? 0} label="Annulés" />
          <StatBox icon="verified" tone="amber" value={`${report?.totals.deliveryRate ?? 0}%`} label="Taux de livraison" />
          <StatBox icon="payments" tone="teal" value={formatFcfa(report?.totals.revenue ?? 0)} label="Encaissé" />
        </div>

        <div className="pc-duo" style={{ marginTop: 22 }}>
          <Panel title={period === 'day' ? 'Colis créés · par heure' : 'Colis créés · par jour'}>
            {bars.length === 0 || bars.every((value) => value === 0) ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13.5 }}>Aucun colis sur la période.</div>
            ) : (
              <BarChart bars={bars} labels={sparseLabels} height={140} />
            )}
          </Panel>

          <Panel title="Répartition par statut">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {statusEntries.length === 0 && (
                <div style={{ color: 'var(--text-muted)', fontSize: 13.5 }}>Aucune donnée.</div>
              )}
              {statusEntries.map(([status, count]) => {
                const key = toStatusKey(status)
                return (
                  <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ width: 110, fontSize: 13, color: 'var(--text-body)', fontWeight: 600 }}>
                      {PARCEL_STATUS[key as ParcelStatus]?.label ?? status}
                    </span>
                    <div style={{ flex: 1, height: 10, background: 'var(--surface-sunken)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
                      <div style={{ width: `${(count / maxStatus) * 100}%`, height: '100%', background: 'var(--color-primary)' }} />
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, color: 'var(--text-strong)', width: 28, textAlign: 'right' }}>
                      {count}
                    </span>
                  </div>
                )
              })}
            </div>
          </Panel>
        </div>

        {(report?.topDrivers.length ?? 0) > 0 && (
          <Panel title="Meilleurs chauffeurs de la période" style={{ marginTop: 22 }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {report!.topDrivers.map((driver, index) => (
                <div
                  key={driver.driverId}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
                    borderTop: index === 0 ? 'none' : '1px solid var(--border-subtle)',
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-faint)', width: 20 }}>
                    {index + 1}
                  </span>
                  <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: 'var(--text-strong)' }}>
                    {driver.fullName ?? 'Chauffeur supprimé'}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, color: 'var(--text-body)' }}>
                    {driver.delivered} livraison{driver.delivered > 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        )}
      </QueryState>
    </div>
  )
}

const dateInputStyle = {
  height: 38,
  padding: '0 12px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-default)',
  background: 'var(--surface-card)',
  color: 'var(--text-strong)',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--fs-sm)',
} as const
