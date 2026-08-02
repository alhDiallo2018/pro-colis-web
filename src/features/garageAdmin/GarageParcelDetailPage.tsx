import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Card, Dialog, EmptyState, StatusBadge, Stepper, Tag } from '@/ds'
import { Panel } from '@/components/Panel'
import * as parcelsApi from '@/lib/api/parcels'
import { buildSteps } from '@/features/client/parcelSteps'
import { formatFcfa, formatWeight, formatDate, toStatusKey } from '@/lib/format'
import { useDeleteGarageParcel } from './hooks'
import type { Parcel } from '@/lib/api/types'

export function GarageParcelDetailPage() {
  const { parcelId } = useParams<{ parcelId: string }>()
  const navigate = useNavigate()
  const [parcel, setParcel] = useState<Parcel | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const deleteMutation = useDeleteGarageParcel()

  const handleDelete = async () => {
    if (!parcelId) return
    try {
      await deleteMutation.mutateAsync(parcelId)
      navigate('/garage/colis')
    } catch {
      setConfirmDelete(false)
    }
  }

  useEffect(() => {
    if (!parcelId) return
    setLoading(true)
    setError(null)
    parcelsApi
      .getParcel(parcelId)
      .then((data) => setParcel(data as unknown as Parcel))
      .catch((e) => setError((e as Error)?.message ?? 'Colis introuvable'))
      .finally(() => setLoading(false))
  }, [parcelId])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <span className="material-symbols-rounded" style={{ fontSize: 32, color: 'var(--text-muted)', animation: 'spin 1s linear infinite' }}>
          progress_activity
        </span>
      </div>
    )
  }

  if (error || !parcel) {
    return (
      <EmptyState icon="search_off" tone="amber" title="Colis introuvable" message={error ?? ''}>
        <Button icon="arrow_back" onClick={() => navigate('/garage/colis')}>
          Retour aux colis
        </Button>
      </EmptyState>
    )
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Button variant="ghost" size="sm" icon="arrow_back" onClick={() => navigate('/garage/colis')}>
          Retour
        </Button>
        <Button
          variant="danger"
          size="sm"
          icon="delete"
          style={{ marginLeft: 'auto' }}
          onClick={() => setConfirmDelete(true)}
        >
          Supprimer
        </Button>
      </div>

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 15, color: 'var(--text-body)' }}>
            {parcel.trackingNumber}
          </span>
          <StatusBadge status={toStatusKey(parcel.status)} />
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {parcel.isUrgent && <Tag express />}
          {parcel.type && <Tag icon="category">{parcel.type}</Tag>}
          {parcel.isInsured && <Tag icon="shield">Assuré</Tag>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Field label="Départ" value={parcel.departureCity ?? parcel.departureZoneName ?? '—'} />
          <span className="material-symbols-rounded" style={{ color: 'var(--teal-400)', fontSize: 20 }}>local_shipping</span>
          <Field label="Arrivée" value={parcel.arrivalCity ?? parcel.arrivalZoneName ?? '—'} align="right" />
          <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--teal-600)' }}>
            {parcel.weight != null ? formatWeight(parcel.weight) : ''}{' '}
            {parcel.price != null ? formatFcfa(parcel.price) : ''}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {parcel.senderName && <Row label="Expéditeur" value={parcel.senderName} />}
          {parcel.senderPhone && <Row label="Tél. expéditeur" value={parcel.senderPhone} />}
          {parcel.receiverName && <Row label="Destinataire" value={parcel.receiverName} />}
          {parcel.receiverPhone && <Row label="Tél. destinataire" value={parcel.receiverPhone} />}
          {parcel.driverName && <Row label="Chauffeur" value={parcel.driverName} />}
          {parcel.description && <Row label="Description" value={parcel.description} />}
          {parcel.createdAt && <Row label="Créé le" value={formatDate(parcel.createdAt)} />}
        </div>
      </Card>

      <Panel title="Historique">
        <Stepper steps={buildSteps(parcel)} />
      </Panel>

      <Dialog
        open={confirmDelete}
        title="Supprimer le colis"
        icon="delete_forever"
        iconTone="danger"
        onClose={() => setConfirmDelete(false)}
      >
        <p style={{ margin: 0 }}>
          Voulez-vous vraiment supprimer le colis <strong>{parcel.trackingNumber}</strong> de votre zone ? Cette action est définitive.
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <Button variant="secondary" onClick={() => setConfirmDelete(false)} block>
            Annuler
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={deleteMutation.isPending} disabled={deleteMutation.isPending} block>
            Supprimer
          </Button>
        </div>
      </Dialog>
    </div>
  )
}

function Field({ label, value, align = 'left' }: { label: string; value: string; align?: 'left' | 'right' }) {
  return (
    <div style={{ textAlign: align }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-faint)', fontFamily: 'var(--font-display)' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--text-strong)' }}>{value}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <span style={{ fontSize: 12, color: 'var(--text-faint)', fontWeight: 600 }}>{label}</span>
      <div style={{ fontSize: 13, color: 'var(--text-strong)', fontWeight: 600 }}>{value}</div>
    </div>
  )
}
