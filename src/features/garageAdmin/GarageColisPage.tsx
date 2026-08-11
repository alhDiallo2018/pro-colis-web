import { useState } from 'react'
import { SegmentedControl } from '@/ds'
import { Panel } from '@/components/Panel'
import { QueryState } from '@/components/QueryState'
import { ParcelsTable } from '@/components/ParcelsTable'
import { ParcelDetailDialog } from '@/components/ParcelDetailDialog'
import { useGarageParcels } from './hooks'
import type { Parcel } from '@/lib/api/types'

const FILTERS = [
  { value: '', label: 'Tous' },
  { value: 'pending', label: 'En attente' },
  { value: 'negotiating', label: 'En négociation' },
  { value: 'confirmed', label: 'Confirmés' },
  { value: 'in_transit', label: 'En transit' },
  { value: 'delivered', label: 'Livrés' },
]

export function GarageColisPage() {
  const [status, setStatus] = useState('')
  const [detailTarget, setDetailTarget] = useState<Parcel | null>(null)
  const query = useGarageParcels(status ? { status } : {})
  const parcels = query.data?.parcels ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SegmentedControl size="sm" options={FILTERS} value={status} onChange={setStatus} />
      <Panel title={`Colis de la zone${query.data?.pagination ? ` · ${query.data.pagination.total}` : ''}`} flush>
        <QueryState
          isLoading={query.isLoading}
          isError={query.isError}
          error={query.error}
          isEmpty={parcels.length === 0}
          emptyTitle="Aucun colis"
          emptyMessage="Aucun colis ne correspond à ce filtre."
          onRetry={() => query.refetch()}
        >
          <ParcelsTable parcels={parcels} onRowClick={setDetailTarget} />
        </QueryState>
      </Panel>
      <ParcelDetailDialog parcel={detailTarget} onClose={() => setDetailTarget(null)} />
    </div>
  )
}
