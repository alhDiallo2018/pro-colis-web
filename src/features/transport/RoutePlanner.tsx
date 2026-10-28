import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button, Input, Toast } from '@/ds'
import { api, ApiError } from '@/lib/api/client'
import { useAuthStore } from '@/store/auth'
import { queryClient } from '@/lib/queryClient'
import { departures, type RouteTemplate, type Schedule } from './domain'
import './transport.css'
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
    try {
      return JSON.parse(localStorage.getItem(key) || 'null')
    } catch {
      return null
    }
  })
  const [chosen, setChosen] = useState<RouteTemplate | null>(pending?.template ?? null)
  const firstDate = pending ? new Date(pending.payload.departures[0].departureAt) : null
  const [first, setFirst] = useState(
      firstDate
        ? new Date(firstDate.getTime() - firstDate.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16)
        : '',
    ),
    [count, setCount] = useState(pending?.payload.departures.length ?? 1),
    [interval, setInterval] = useState(
      pending && pending.payload.departures.length > 1
        ? (Date.parse(pending.payload.departures[1].departureAt) -
            Date.parse(pending.payload.departures[0].departureAt)) /
            60000
        : 60,
    ),
    [reverse, setReverse] = useState(pending?.payload.departures[0].reverse ?? false),
    [alternate, setAlternate] = useState(
      !!pending &&
        pending.payload.departures.length > 1 &&
        pending.payload.departures[0].reverse !== pending.payload.departures[1].reverse,
    )
  const [weight, setWeight] = useState(pending ? String(pending.payload.availableWeight) : ''),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [error, setError] = useState('')
  const templates = useQuery({
    queryKey: ['route-templates', owner],
    queryFn: async () =>
      (await api.get('/driver/route-templates')).data.templates as RouteTemplate[],
  })
  let preview: Schedule['departures'] = [],
    validation = ''
  try {
    if (chosen && first)
      preview = departures(
        first,
        count,
        interval,
        chosen.data.itinerary.stops.at(-1)!.offsetMinutes,
        reverse,
        alternate,
      )
  } catch (e) {
    validation = (e as Error).message
  }
  if (pending) preview = pending.payload.departures
  function choose(t: RouteTemplate) {
    setChosen(t)
    if (!first) {
      const date=new Date(Date.now()+15*60000)
      setFirst(new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16))
    }
    setInterval(t.data.itinerary.stops.at(-1)!.offsetMinutes + 15)
    setWeight(String(t.data.availableWeight))
    setError('')
    setMessage('')
  }
  async function publish() {
    if (!chosen || busy) return
    setBusy(true)
    setError('')
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
      // Enregistrer AVANT le POST : une réponse perdue doit rejouer exactement
      // la même clé et le même contenu, même après fermeture de la PWA.
      localStorage.setItem(key, JSON.stringify(request))
      setPending(request)
      const { data } = await api.post(
        `/driver/route-templates/${request.template.id}/departures`,
        request.payload,
      )
      localStorage.removeItem(key)
      setPending(null)
      setChosen(null)
      setMessage(`${data.count} départ(s) publié(s).`)
      await queryClient.invalidateQueries({
        queryKey: ['driver', 'advertisements'],
      })
    } catch (e) {
      if (e instanceof ApiError && [400, 401, 403, 404, 409, 422].includes(e.status)) {
        localStorage.removeItem(key)
        setPending(null)
      }
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="transport-panel">
      <h2>Trajets habituels</h2>
      <p className="transport-note">
        Vos arrêts sont mémorisés à chaque publication. Préparez un départ ou toute une série sans
        les ressaisir.
      </p>
      {message && <Toast tone="success" message={message} />}
      {templates.isError && (
        <Button onClick={() => templates.refetch()}>Recharger les trajets</Button>
      )}
      {!pending && (
        <div className="transport-choices">
          {templates.data?.map((t) => (
            <button
              className="transport-choice"
              key={t.id}
              aria-pressed={chosen?.id === t.id}
              onClick={() => choose(t)}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}
      {!templates.isLoading && !templates.data?.length && !pending && (
        <p>Publiez un premier trajet avec ses arrêts pour le retrouver ici.</p>
      )}
      {chosen && (
        <>
          <h3>{chosen.name}</h3>
          <ol className="transport-stops">
            {chosen.data.itinerary.stops.map((s) => (
              <li key={s.zoneId}>
                {s.name} · +{s.offsetMinutes} min
              </li>
            ))}
          </ol>
          {pending ? (
            <p role="status">
              Publication à vérifier : reprenez la même demande pour éviter les doublons.
            </p>
          ) : (
            <div className="transport-fields">
              <Input
                label="Premier départ"
                type="datetime-local"
                value={first}
                onChange={(e) => setFirst(e.target.value)}
              />
              <Input
                label="Nombre de départs (1–100)"
                type="number"
                min={1}
                max={100}
                value={String(count)}
                onChange={(e) => setCount(Number(e.target.value))}
              />
              <Input
                label="Intervalle (minutes)"
                type="number"
                min={1}
                value={String(interval)}
                onChange={(e) => setInterval(Number(e.target.value))}
              />
              <Input
                label="Capacité par départ (kg)"
                type="number"
                min={0.01}
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
              <p className="transport-note"><strong>Prix à négocier</strong><br/>Chaque colis fera l’objet d’une offre du client, puis d’une négociation.</p>
              <label>
                <input
                  type="checkbox"
                  checked={reverse}
                  onChange={(e) => setReverse(e.target.checked)}
                />{' '}
                Commencer dans le sens retour
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={alternate}
                  onChange={(e) => setAlternate(e.target.checked)}
                />{' '}
                Alterner aller et retour
              </label>
            </div>
          )}
          <p className="transport-note">
            Prévoyez le temps de retour et de pause dans l’intervalle. Le suivi GPS s’active
            séparément pour chaque départ.
          </p>
          <ol className="transport-preview">
            {preview.map((d) => (
              <li key={d.departureAt}>
                {new Date(d.departureAt).toLocaleString('fr-SN')} · {d.reverse ? 'Retour' : 'Aller'}
              </li>
            ))}
          </ol>
          {validation && <p role="alert">{validation}</p>}
          <Button
            loading={busy}
            disabled={
              !pending &&
              (!preview.length ||
                Number(weight) <= 0 ||
                !Number.isFinite(Number(weight)))
            }
            onClick={publish}
          >
            {pending
              ? 'Vérifier / reprendre la publication'
              : `Publier ${preview.length} départ(s)`}
          </Button>
        </>
      )}
      {error && <Toast tone="error" message={error} />}
    </section>
  )
}
