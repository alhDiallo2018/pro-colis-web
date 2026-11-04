import { useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button, Input, Toast, LineBadge } from '@/ds'
import { api, ApiError } from '@/lib/api/client'
import { useAuthStore } from '@/store/auth'
import { queryClient } from '@/lib/queryClient'
import { getTransitDraft, getTransitLine, type TransitLineSummary } from '@/lib/api/transit'
import { TransitLinePicker } from './TransitLinePicker'
import { departures, type RouteTemplate, type Schedule } from './domain'
import './transport.css'
import './transit.css'

const CSV_MAX_BYTES = 128 * 1024

function RouteCsvImport({ onImported }: { onImported: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<Record<string, unknown>[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function sendCsv(f: File, previewOnly: boolean) {
    const form = new FormData()
    form.append('file', f, f.name)
    const path = previewOnly
      ? '/driver/route-templates/import/preview'
      : '/driver/route-templates/import'
    const { data } = await api.post(path, form)
    return (data?.templates ?? data ?? []) as Record<string, unknown>[]
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setError('')
    setPreview([])
    if (f.size > CSV_MAX_BYTES) {
      setError('Choisissez un fichier CSV de 128 Ko maximum.')
      setFile(null)
      return
    }
    setFile(f)
    setBusy(true)
    try {
      setPreview(await sendCsv(f, true))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de lire le fichier CSV.')
      setFile(null)
    } finally { setBusy(false) }
  }

  async function confirm() {
    if (!file) return
    setBusy(true); setError('')
    try {
      await sendCsv(file, false)
      setFile(null); setPreview([])
      if (inputRef.current) inputRef.current.value = ''
      onImported()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Import impossible. Réessayez.")
    } finally { setBusy(false) }
  }

  return (
    <details className="transit-panel" style={{ padding: 14 }}>
      <summary style={{ cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
        Import CSV manuel
      </summary>
      <p className="transit-note" style={{ marginTop: 10 }}>
        Fichier de 128 Ko maximum. Aperçu obligatoire avant publication.
      </p>
      <input ref={inputRef} type="file" accept=".csv,text/csv" onChange={onPick} disabled={busy} />
      {preview.length > 0 && (
        <>
          <p style={{ margin: '10px 0 4px', fontWeight: 600 }}>
            Aperçu : {preview.length} trajet{preview.length > 1 ? 's' : ''}
          </p>
          <ol style={{ paddingLeft: 18, fontSize: 13 }}>
            {preview.slice(0, 10).map((row, i) => (
              <li key={i}>{String(row.name ?? row.label ?? `Trajet ${i + 1}`)}</li>
            ))}
            {preview.length > 10 && <li>… +{preview.length - 10}</li>}
          </ol>
          <Button loading={busy} onClick={confirm}>Confirmer l'import</Button>
        </>
      )}
      {error && <Toast tone="error" message={error} />}
    </details>
  )
}

interface Pending {
  template: RouteTemplate
  payload: Schedule
}

export function RoutePlanner() {
  const owner = useAuthStore((s) => s.user?.id)
  return owner ? <Planner key={owner} owner={owner} /> : null
}

function Planner({ owner }: { owner: string }) {
  const key = `procolis-route-schedule:${owner}`
  const [pending, setPending] = useState<Pending | null>(() => {
    try { return JSON.parse(localStorage.getItem(key) || 'null') } catch { return null }
  })
  const [chosen, setChosen] = useState<RouteTemplate | null>(pending?.template ?? null)
  // La ligne de transit choisie : mémorisée pour afficher le badge opérateur dans l'UI.
  const [transitLine, setTransitLine] = useState<TransitLineSummary | null>(null)
  const firstDate = pending ? new Date(pending.payload.departures[0].departureAt) : null
  const [first, setFirst] = useState(
      firstDate
        ? new Date(firstDate.getTime() - firstDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
        : '',
    ),
    [count, setCount] = useState(pending?.payload.departures.length ?? 1),
    [interval, setInterval] = useState(
      pending && pending.payload.departures.length > 1
        ? (Date.parse(pending.payload.departures[1].departureAt) -
            Date.parse(pending.payload.departures[0].departureAt)) / 60000
        : 60,
    ),
    [reverse, setReverse] = useState(pending?.payload.departures[0].reverse ?? false),
    [alternate, setAlternate] = useState(
      !!pending && pending.payload.departures.length > 1 &&
      pending.payload.departures[0].reverse !== pending.payload.departures[1].reverse,
    )
  const [weight, setWeight] = useState(pending ? String(pending.payload.availableWeight) : ''),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [error, setError] = useState('')
  const templates = useQuery({
    queryKey: ['route-templates', owner],
    queryFn: async () => (await api.get('/driver/route-templates')).data.templates as RouteTemplate[],
  })
  let preview: Schedule['departures'] = [], validation = ''
  try {
    if (chosen && first)
      preview = departures(
        first, count, interval,
        chosen.data.itinerary.stops.at(-1)!.offsetMinutes,
        reverse, alternate,
      )
  } catch (e) { validation = (e as Error).message }
  if (pending) preview = pending.payload.departures

  function selectTemplate(t: RouteTemplate) {
    setChosen(t); setTransitLine(null)
    if (!first) {
      const date = new Date(Date.now() + 15 * 60000)
      setFirst(new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16))
    }
    setInterval(t.data.itinerary.stops.at(-1)!.offsetMinutes + 15)
    setWeight(String(t.data.availableWeight))
    setError(''); setMessage('')
  }

  async function selectTransitLine(line: TransitLineSummary | null) {
    setTransitLine(line); setError(''); setMessage('')
    if (!line) { setChosen(null); return }
    // On matérialise la ligne comme un RouteTemplate temporaire pour réutiliser
    // la logique existante de publication (durée, horaires, capacité).
    try {
      const [draft, detail] = await Promise.all([getTransitDraft(line.id), getTransitLine(line.id)])
      const stops = draft.itinerary.stops.map((s, i) => ({
        zoneId: s.zoneId,
        name: detail.stops[i]?.label ?? detail.stops[i]?.zone?.name ?? '',
        offsetMinutes: s.offsetMinutes,
      }))
      const template: RouteTemplate = {
        id: `transit:${line.id}`,
        name: `${line.operator.toUpperCase()} ${line.number} · ${line.origin} → ${line.destination}`,
        data: {
          availableWeight: Number(weight) || 0,
          proposedPrice: null,
          itinerary: { serviceType: 'shuttle', lineNumber: line.number, stops },
        },
      }
      selectTemplate(template)
    } catch (e) {
      setError('Catalogue indisponible. Utilise un trajet habituel ou l\'import CSV.')
    }
  }

  async function publish() {
    if (!chosen || busy) return
    setBusy(true); setError('')
    try {
      if (!navigator.onLine)
        throw new Error('Reconnectez-vous pour publier. Votre préparation reste disponible.')
      const request = pending ?? {
        template: chosen,
        payload: {
          requestId: crypto.randomUUID(),
          departures: preview,
          availableWeight: Number(weight),
          proposedPrice: null,
        },
      }
      localStorage.setItem(key, JSON.stringify(request))
      setPending(request)
      // Templates de transit : gérés via l'endpoint Advertisement direct (pas RouteTemplate perso).
      if (chosen.id.startsWith('transit:')) {
        const transitLineId = chosen.id.replace('transit:', '')
        for (const d of request.payload.departures) {
          await api.post('/advertisements', {
            transitLineId,
            departureAt: d.departureAt,
            availableWeight: request.payload.availableWeight,
            itinerary: { ...chosen.data.itinerary, serviceType: 'shuttle' },
          })
        }
      } else {
        const { data } = await api.post(
          `/driver/route-templates/${request.template.id}/departures`,
          request.payload,
        )
        setMessage(`${data.count} départ(s) publié(s).`)
      }
      localStorage.removeItem(key)
      setPending(null); setChosen(null); setTransitLine(null)
      setMessage((m) => m || `${request.payload.departures.length} départ(s) publié(s).`)
      await queryClient.invalidateQueries({ queryKey: ['driver', 'advertisements'] })
    } catch (e) {
      if (e instanceof ApiError && [400, 401, 403, 404, 409, 422].includes(e.status)) {
        localStorage.removeItem(key); setPending(null)
      }
      setError((e as Error).message)
    } finally { setBusy(false) }
  }

  const isTransit = chosen?.id.startsWith('transit:')

  return (
    <section className="transit-panel">
      <div className="transit-panel-head">
        <h2 className="transit-panel-title">Publier mes voyages</h2>
        {transitLine && <LineBadge operator={transitLine.operator} number={transitLine.number} />}
      </div>
      <p className="transit-note">
        Choisis une ligne officielle (DDD / AFTU) ou un trajet habituel.
        Chaque départ publié devient un voyage unique que les clients peuvent réserver.
      </p>

      {message && <Toast tone="success" message={message} />}

      {!pending && !chosen && (
        <>
          <TransitLinePicker value={transitLine} onChange={selectTransitLine} />

          {!!templates.data?.length && (
            <details className="transit-panel" style={{ padding: 14 }} open={!transitLine}>
              <summary style={{ cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                Mes trajets habituels ({templates.data.length})
              </summary>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                {templates.data.map((t) => (
                  <button
                    className="transport-choice"
                    key={t.id}
                    onClick={() => selectTemplate(t)}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </details>
          )}

          <RouteCsvImport
            onImported={() => queryClient.invalidateQueries({ queryKey: ['route-templates', owner] })}
          />
        </>
      )}

      {chosen && (
        <>
          <div className="transit-picker-selected">
            {isTransit && transitLine && (
              <LineBadge operator={transitLine.operator} number={transitLine.number} size="lg" />
            )}
            <div className="transit-picker-selected-body">
              <div className="transit-picker-route">{chosen.name}</div>
              <div className="transit-picker-direction">
                {chosen.data.itinerary.stops.length} arrêts ·
                {' '}durée ≈ {chosen.data.itinerary.stops.at(-1)!.offsetMinutes} min
              </div>
            </div>
            <Button variant="secondary" onClick={() => { setChosen(null); setTransitLine(null) }}>
              Changer
            </Button>
          </div>

          <ol className="transport-stops">
            {chosen.data.itinerary.stops.map((s, i) => (
              <li key={`${s.zoneId}-${i}`}>
                {s.name || s.zoneId} · +{s.offsetMinutes} min
              </li>
            ))}
          </ol>

          {pending ? (
            <p role="status">
              Publication à vérifier : reprenez la même demande pour éviter les doublons.
            </p>
          ) : (
            <div className="transport-fields">
              <Input label="Premier départ" type="datetime-local"
                value={first} onChange={(e) => setFirst(e.target.value)} />
              <Input label="Nombre de départs (1–100)" type="number" min={1} max={100}
                value={String(count)} onChange={(e) => setCount(Number(e.target.value))} />
              <Input label="Intervalle (minutes)" type="number" min={1}
                value={String(interval)} onChange={(e) => setInterval(Number(e.target.value))} />
              <Input label="Capacité par départ (kg)" type="number" min={0.01}
                value={weight} onChange={(e) => setWeight(e.target.value)} />
              <p className="transit-note">
                <strong>Prix à négocier</strong><br />
                Chaque colis fera l'objet d'une offre du client, puis d'une négociation.
              </p>
              <label>
                <input type="checkbox" checked={reverse}
                  onChange={(e) => setReverse(e.target.checked)} />{' '}
                Commencer dans le sens retour
              </label>
              <label>
                <input type="checkbox" checked={alternate}
                  onChange={(e) => setAlternate(e.target.checked)} />{' '}
                Alterner aller et retour
              </label>
            </div>
          )}

          <p className="transit-note">
            Prévoyez le temps de retour et de pause dans l'intervalle.
            Le suivi GPS s'active séparément pour chaque départ.
          </p>

          <ol className="transport-preview">
            {preview.map((d) => (
              <li key={d.departureAt}>
                {new Date(d.departureAt).toLocaleString('fr-SN')} ·{' '}
                {d.reverse ? 'Retour' : 'Aller'}
              </li>
            ))}
          </ol>

          {validation && <p role="alert">{validation}</p>}

          <Button loading={busy}
            disabled={!pending &&
              (!preview.length || Number(weight) <= 0 || !Number.isFinite(Number(weight)))}
            onClick={publish}>
            {pending ? 'Vérifier / reprendre la publication' : `Publier ${preview.length} départ(s)`}
          </Button>
        </>
      )}

      {error && <Toast tone="error" message={error} />}
    </section>
  )
}
