import { useState } from 'react'
import { Button, Select, StatusBadge } from '@/ds'
import { Panel } from '@/components/Panel'
import { QueryState } from '@/components/QueryState'
import { ParcelMedia } from '@/components/ParcelMedia'
import { useAssignDriver, useGarageDrivers, useGarageParcels } from './hooks'
import { formatFcfa, toStatusKey } from '@/lib/format'
import type { Parcel, User } from '@/lib/api/types'

export function GarageAssignationsPage() {
  const parcelsQ = useGarageParcels()
  const driversQ = useGarageDrivers()
  const drivers = driversQ.data ?? []
  const pending = (parcelsQ.data?.parcels ?? []).filter((p) => !p.driverId && !['delivered', 'cancelled'].includes(p.status))

  return (
    <div style={{ maxWidth: 920, margin: '0 auto' }}>
      <Panel title={`À assigner · ${pending.length}`} flush>
        <QueryState
          isLoading={parcelsQ.isLoading}
          isError={parcelsQ.isError}
          error={parcelsQ.error}
          isEmpty={pending.length === 0}
          emptyTitle="Rien à assigner"
          emptyMessage="Tous les colis de votre zone ont un chauffeur."
          onRetry={() => parcelsQ.refetch()}
        >
          {pending.map((p) => (
            <AssignRow key={p.id} parcel={p} drivers={drivers} />
          ))}
        </QueryState>
      </Panel>
    </div>
  )
}

function AssignRow({ parcel, drivers }: { parcel: Parcel; drivers: User[] }) {
  const assign = useAssignDriver()
  const [driverId, setDriverId] = useState('')
  const options = drivers.map((d) => ({ value: d.id, label: d.fullName }))

  const hasMedia = Boolean(parcel.photoUrls?.length || parcel.videoUrls?.length || parcel.audioUrls?.length)

  return (
    <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--slate-100)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
      <div style={{ flex: '1 1 220px', minWidth: 0 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14.5, color: 'var(--text-strong)' }}>
          {parcel.departureCity ?? parcel.departureZoneName ?? '—'}
          <span className="material-symbols-rounded" style={{ fontSize: 16, color: 'var(--text-faint)' }}>arrow_right_alt</span>
          {parcel.arrivalCity ?? parcel.arrivalZoneName ?? '—'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
          <span style={{ fontFamily: 'var(--font-mono)' }}>{parcel.trackingNumber}</span>
          {parcel.price != null && ` · ${formatFcfa(parcel.price)}`}
        </div>
      </div>
      <StatusBadge status={toStatusKey(parcel.status)} size="sm" />
      <Select
        placeholder={drivers.length ? 'Choisir un chauffeur' : 'Aucun chauffeur'}
        options={options}
        value={driverId}
        onChange={(e) => setDriverId(e.target.value)}
        style={{ flex: '1 1 180px', minWidth: 160 }}
      />
      <Button
        size="sm"
        icon="how_to_reg"
        disabled={!driverId}
        loading={assign.isPending && assign.variables?.parcelId === parcel.id}
        onClick={() => assign.mutate({ parcelId: parcel.id, driverId })}
      >
        Assigner
      </Button>
      </div>
      {hasMedia && (
        <div style={{ marginTop: 12 }}>
          <ParcelMedia parcel={parcel} size={72} />
        </div>
      )}
    </div>
  )
}
