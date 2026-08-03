import { useState } from 'react'
import { PeriodReportView } from '@/components/PeriodReportView'
import { SegmentedControl } from '@/ds'
import * as reportsApi from '@/lib/api/reports'

const EXPORT_KINDS = [
  { value: 'parcels', label: 'Colis', icon: 'package_2' },
  { value: 'users', label: 'Utilisateurs', icon: 'group' },
]

/** Rapports d'activité de la plateforme (super admin et support). */
export function RapportsPage() {
  const [exportKind, setExportKind] = useState<'parcels' | 'users'>('parcels')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>Jeu de données exporté</span>
        <SegmentedControl
          options={EXPORT_KINDS}
          value={exportKind}
          onChange={(value) => setExportKind(value as 'parcels' | 'users')}
        />
      </div>

      <PeriodReportView
        scope="admin"
        fetchDaily={(date) => reportsApi.adminDaily(date)}
        fetchMonthly={(year, month) => reportsApi.adminMonthly(year, month)}
        onExport={() => reportsApi.adminExport(exportKind)}
        exportName={exportKind}
      />
    </div>
  )
}
