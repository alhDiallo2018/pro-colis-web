import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button, Card, EmptyState, Input, Stepper, StatusBadge, Tag } from '@/ds'
import { QrCode } from '@/components/QrCode'
import { useTrackParcel } from './hooks'
import { buildSteps } from './parcelSteps'
import { formatFcfa, formatWeight, toStatusKey } from '@/lib/format'
import { ApiError } from '@/lib/api/client'

export function SuiviScreen() {
  const { trackingNumber } = useParams<{ trackingNumber: string }>()
  const [input, setInput] = useState(trackingNumber ?? '')
  const [tracking, setTracking] = useState(trackingNumber?.trim().toUpperCase() ?? '')
  const query = useTrackParcel(tracking, !!tracking)
  const parcel = query.data

  // QR mobile → /track/:trackingNumber : lance le suivi dès l'arrivée sur la page.
  useEffect(() => {
    if (!trackingNumber) return
    setInput(trackingNumber)
    setTracking(trackingNumber.trim().toUpperCase())
  }, [trackingNumber])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setTracking(input.trim().toUpperCase())
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <Card padding="lg">
        <h2 style={{ margin: '0 0 4px', fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h3)', color: 'var(--text-strong)' }}>
          Suivre un colis
        </h2>
        <p style={{ margin: '0 0 16px', color: 'var(--text-muted)', fontSize: 'var(--fs-sm)' }}>
          Entrez le numéro de suivi (ex. PC-7F3K-2291).
        </p>
        <form onSubmit={submit} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <Input
            icon="qr_code_2"
            mono
            placeholder="PC-XXXX-XXXX"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{ flex: 1 }}
          />
          <Button type="submit" size="lg" iconTrailing="arrow_forward" loading={query.isFetching} disabled={!input.trim()}>
            Suivre
          </Button>
        </form>
      </Card>

      {query.isError && (
        <EmptyState
          icon="search_off"
          tone="amber"
          title="Colis introuvable"
          message={query.error instanceof ApiError ? query.error.message : 'Vérifiez le numéro de suivi et réessayez.'}
        />
      )}

      {parcel && (
        <>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-body)' }}>{parcel.trackingNumber}</span>
              <StatusBadge status={toStatusKey(parcel.status)} />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {parcel.isUrgent && <Tag express />}
              {parcel.type && <Tag icon="category">{parcel.type}</Tag>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Field label="Départ" value={parcel.departureCity ?? parcel.departureZoneName ?? '—'} />
              <span className="material-symbols-rounded" style={{ color: 'var(--teal-400)', fontSize: 20 }}>local_shipping</span>
              <Field label="Arrivée" value={parcel.arrivalCity ?? parcel.arrivalZoneName ?? '—'} align="right" />
              <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--teal-600)' }}>
                {parcel.weight != null ? formatWeight(parcel.weight) : ''} {parcel.price != null ? `· ${formatFcfa(parcel.price)}` : ''}
              </span>
            </div>
          </Card>

          <Card>
            <h3 style={{ margin: '0 0 12px', fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h3)', color: 'var(--text-strong)' }}>Historique</h3>
            <Stepper steps={buildSteps(parcel)} />
          </Card>

          <Card>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
              <QrCode
                value={`${window.location.origin}/track/${parcel.trackingNumber}`}
                caption="Scanner pour suivre ce colis"
              />
            </div>
          </Card>
        </>
      )}
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
