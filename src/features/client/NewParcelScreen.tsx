import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { Avatar, Button, Card, Icon, IconButton, Input, Select, Switch, Textarea, Toast } from '@/ds'
import { useCreateParcel, useDrivers, useGarages } from './hooks'
import { ApiError } from '@/lib/api/client'
import { uploadParcelAudio, uploadParcelPhoto, uploadParcelVideo } from '@/lib/api/uploads'
import { useAuthStore } from '@/store/auth'
import { formatFcfa, formatWeight } from '@/lib/format'
import type { User, Garage } from '@/lib/api/types'
import { GarageSearchSelect } from '@/components/GarageSearchSelect'
import { LocationInput } from '@/components/LocationInput'

interface PhotoItem {
  id: string
  dataUrl: string
  name: string
}

interface VoiceNote {
  dataUrl: string
  durationMs: number
}

interface VideoItem {
  id: string
  dataUrl: string
  name: string
}

type Mode = 'free' | 'driver'

const schema = z.object({
  receiverName: z.string().min(2, 'Nom requis'),
  receiverPhone: z.string().min(8, 'Téléphone requis'),
  receiverEmail: z.string().email('Email invalide').optional().or(z.literal('')),
  receiverAddress: z.string().optional(),
  departureGarageId: z.string().min(1, `Zone de départ requise`),
  arrivalGarageId: z.string().min(1, `Zone d'arrivée requise`),
  driverId: z.string().optional(),
  description: z.string().min(1, 'Description requise'),
  type: z.string().optional(),
  weight: z.coerce.number().positive('Poids requis'),
  price: z.coerce.number().nonnegative('Prix invalide').optional(),
  isUrgent: z.boolean().default(false),
  isInsured: z.boolean().default(false),
})

type FormInput = z.input<typeof schema>
type FormOutput = z.output<typeof schema>

// Must match the API's Prisma `ParcelType` enum, else create 500s.
const TYPES = [
  { value: 'document', label: 'Document' },
  { value: 'package', label: 'Colis standard' },
  { value: 'fragile', label: 'Fragile' },
  { value: 'perishable', label: 'Alimentaire / Périssable' },
  { value: 'valuable', label: 'Objet de valeur' },
]

const STEPS = ['Destinataire', 'Livraison', 'Colis', 'Récap']

const required = (label: string): ReactNode => (
  <>
    {label} <span style={{ color: 'var(--color-danger)' }}>*</span>
  </>
)

export function NewParcelScreen() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const garages = useGarages()
  const drivers = useDrivers()
  const createParcel = useCreateParcel()

  const [step, setStep] = useState(0)
  const [maxStep, setMaxStep] = useState(0)
  const [mode, setMode] = useState<Mode>('free')
  const [driverError, setDriverError] = useState<string | null>(null)

  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [voice, setVoice] = useState<VoiceNote | null>(null)
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [uploading, setUploading] = useState(false)
  // Once the parcel is created we keep its id so a second submit can never
  // create a duplicate — it just takes the user to the existing parcel.
  const [createdId, setCreatedId] = useState<string | null>(null)
  const [mediaError, setMediaError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    trigger,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { isUrgent: false, isInsured: false },
  })

  // Zones résolues à la volée depuis Google Places (créées en "pending" côté API),
  // ajoutées à la liste pour être immédiatement sélectionnables par le créateur.
  const [extraZones, setExtraZones] = useState<Garage[]>([])
  const garageList = [...(garages.data ?? []), ...extraZones]
  const garageLabel = (id?: string) => {
    const g = garageList.find((x) => x.id === id)
    return g ? (g.city ?? g.name) : '—'
  }

  const addResolvedZone = (g: Garage) =>
    setExtraZones((prev) => [...prev.filter((x) => x.id !== g.id), g])
  const selectedDriver = (drivers.data ?? []).find((d) => d.id === watch('driverId'))

  const goTo = (s: number) => {
    setStep(s)
    setMaxStep((m) => Math.max(m, s))
  }

  const validateStep = async (s: number) => {
    if (s === 0) return trigger(['receiverName', 'receiverPhone', 'receiverEmail'])
    if (s === 1) {
      const ok = await trigger(['departureGarageId', 'arrivalGarageId'])
      if (mode === 'driver' && !watch('driverId')) {
        setDriverError('Choisissez un chauffeur ou publiez une annonce.')
        return false
      }
      setDriverError(null)
      return ok
    }
    if (s === 2) return trigger(['description', 'weight'])
    return true
  }

  const next = async () => {
    if (await validateStep(step)) goTo(Math.min(step + 1, STEPS.length - 1))
  }
  const back = () => setStep((s) => Math.max(s - 1, 0))

  const chooseMode = (m: Mode) => {
    setMode(m)
    setDriverError(null)
    if (m === 'free') setValue('driverId', '')
  }

  const doCreate = handleSubmit(async (values) => {
    if (createdId) {
      navigate(`/client/colis/${createdId}`, { replace: true })
      return
    }

    const driverId = mode === 'driver' ? values.driverId || null : null
    const parcel = await createParcel.mutateAsync({
      ...values,
      senderName: user?.fullName ?? '',
      senderPhone: user?.phone ?? '',
      senderEmail: user?.email ?? null,
      receiverEmail: values.receiverEmail || null,
      driverId,
      isFreeForBidding: mode === 'free',
      weight: values.weight ?? null,
      price: values.price ?? null,
    })
    setCreatedId(parcel.id)

    let failed = 0
    if (photos.length || voice) {
      setUploading(true)
      try {
        const results = await Promise.allSettled([
          ...photos.map((p, i) => uploadParcelPhoto(p.dataUrl, p.name || `photo-${i + 1}.jpg`, parcel.id)),
          ...videos.map((v, i) => uploadParcelVideo(v.dataUrl, v.name || `video-${i + 1}.mp4`, parcel.id)),
          ...(voice ? [uploadParcelAudio(voice.dataUrl, 'note-vocale.webm', parcel.id)] : []),
        ])
        failed = results.filter((r) => r.status === 'rejected').length
      } finally {
        setUploading(false)
      }
    }

    if (failed > 0) {
      setMediaError(`Annonce créée, mais ${failed} pièce(s) jointe(s) n'ont pas pu être envoyée(s).`)
      return
    }

    navigate(`/client/colis/${parcel.id}`, { replace: true })
  })

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (step < STEPS.length - 1) next()
    else doCreate()
  }

  const apiError = createParcel.error instanceof ApiError ? createParcel.error.message : null
  const submitting = createParcel.isPending || uploading

  return (
    <div style={{ width: '100%', maxWidth: 620, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <IconButton icon="arrow_back" aria-label="Retour" onClick={() => navigate(-1)} />
        <div>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--fs-h2)', color: 'var(--text-strong)', letterSpacing: 'var(--ls-snug)' }}>
            Nouvelle annonce
          </h1>
          <p style={{ margin: '2px 0 0', fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>
            Publiez votre colis en {STEPS.length} étapes.
          </p>
        </div>
      </div>

      <Stepper current={step} maxStep={maxStep} onJump={goTo} />

      <form onSubmit={onFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Card>
          {/* STEP 0 — Destinataire */}
          {step === 0 && (
            <StepBody n={1} title="Qui reçoit le colis ?" hint="Les coordonnées du destinataire à l'arrivée.">
              <Input label={required('Nom du destinataire')} icon="person" placeholder="Ex : Awa Ndiaye" error={errors.receiverName?.message} {...register('receiverName')} />
              <Input label={required('Téléphone')} icon="call" placeholder="+221 77 000 00 00" error={errors.receiverPhone?.message} {...register('receiverPhone')} />
              <Input label="Email du destinataire" icon="mail" type="email" placeholder="exemple@email.com" error={errors.receiverEmail?.message} {...register('receiverEmail')} />
              <LocationInput
                label="Adresse de livraison"
                icon="home"
                placeholder="Quartier, repère… (optionnel)"
                value={watch('receiverAddress') ?? ''}
                onChange={(val) => setValue('receiverAddress', val)}
              />
            </StepBody>
          )}

          {/* STEP 1 — Livraison (trajet + mode) */}
          {step === 1 && (
            <StepBody n={2} title="Trajet & mode de livraison" hint="D'où part le colis, où il arrive, et comment il est pris en charge.">
              <GarageSearchSelect
                label={required('Zone de départ')}
                icon="garage"
                placeholder={garages.isLoading ? 'Chargement…' : 'Rechercher une zone...'}
                garages={garageList}
                value={watch('departureGarageId') ?? ''}
                onChange={(id) => setValue('departureGarageId', id, { shouldValidate: true })}
                onAddNew={(g) => { addResolvedZone(g); setValue('departureGarageId', g.id, { shouldValidate: true }) }}
                error={errors.departureGarageId?.message}
              />
              <GarageSearchSelect
                label={required(`Zone d'arrivée`)}
                icon="pin_drop"
                placeholder={garages.isLoading ? 'Chargement…' : 'Rechercher une zone...'}
                garages={garageList}
                value={watch('arrivalGarageId') ?? ''}
                onChange={(id) => setValue('arrivalGarageId', id, { shouldValidate: true })}
                onAddNew={(g) => { addResolvedZone(g); setValue('arrivalGarageId', g.id, { shouldValidate: true }) }}
                error={errors.arrivalGarageId?.message}
              />

              {watch('departureGarageId') && watch('arrivalGarageId') && (
                <RoutePill from={garageLabel(watch('departureGarageId'))} to={garageLabel(watch('arrivalGarageId'))} />
              )}

              <div style={{ marginTop: 4 }}>
                <FieldLabel>Mode de livraison</FieldLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <ModeOption
                    selected={mode === 'free'}
                    onClick={() => chooseMode('free')}
                    icon="campaign"
                    title="Publier une annonce"
                    desc="Les chauffeurs proposent un prix, vous choisissez la meilleure offre."
                  />
                  <ModeOption
                    selected={mode === 'driver'}
                    onClick={() => chooseMode('driver')}
                    icon="local_shipping"
                    title="Confier à un chauffeur"
                    desc="Choisissez un chauffeur ; il devra confirmer la prise en charge."
                  />
                </div>
              </div>

              {mode === 'driver' && (
                <div>
                  <FieldLabel>{required('Chauffeur')}</FieldLabel>
                  {drivers.isLoading ? (
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 'var(--fs-sm)' }}>Chargement des chauffeurs…</p>
                  ) : (drivers.data ?? []).length === 0 ? (
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 'var(--fs-sm)' }}>Aucun chauffeur disponible pour le moment.</p>
                  ) : (
                    <DriverPicker
                      drivers={drivers.data ?? []}
                      value={watch('driverId') ?? ''}
                      onChange={(id) => {
                        setValue('driverId', id)
                        setDriverError(null)
                      }}
                    />
                  )}
                  {driverError && <p style={{ margin: '8px 0 0', fontSize: 'var(--fs-sm)', color: 'var(--color-danger)' }}>{driverError}</p>}
                </div>
              )}
            </StepBody>
          )}

          {/* STEP 2 — Colis */}
          {step === 2 && (
            <StepBody n={3} title="Détails du colis" hint="Décrivez le contenu et ajoutez des pièces jointes.">
              <Select
                label="Type de colis"
                icon="category"
                placeholder="Type de colis (optionnel)"
                options={TYPES}
                value={watch('type') ?? ''}
                onChange={(e) => setValue('type', e.target.value)}
              />
              <div className="pc-field-pair" style={{ gap: 12 }}>
                <Input label={required('Poids (kg)')} type="number" inputMode="decimal" mono error={errors.weight?.message} {...register('weight')} />
                <Input
                  label={mode === 'driver' ? 'Prix convenu (FCFA)' : 'Prix proposé (FCFA)'}
                  type="number"
                  inputMode="numeric"
                  mono
                  help={mode === 'driver' ? 'Le montant convenu avec le chauffeur.' : 'Indicatif — les chauffeurs peuvent surenchérir.'}
                  error={errors.price?.message}
                  {...register('price')}
                />
              </div>
              <Textarea label={required('Description')} placeholder="Contenu du colis, instructions…" maxLength={280} error={errors.description?.message} {...register('description')} />
              <Switch label="Express / urgent" description="Livraison prioritaire" checked={!!watch('isUrgent')} onChange={(v) => setValue('isUrgent', v)} />
              <Switch label="Assurer le colis" description="Protection en cas de perte" checked={!!watch('isInsured')} onChange={(v) => setValue('isInsured', v)} />

              <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />
              <PhotoCapture photos={photos} onChange={setPhotos} />
              <VideoCapture videos={videos} onChange={setVideos} />
              <VoiceNoteRecorder voice={voice} onChange={setVoice} />
            </StepBody>
          )}

          {/* STEP 3 — Récap */}
          {step === 3 && (
            <StepBody n={4} title="Vérifiez et publiez" hint="Un dernier coup d'œil avant de publier l'annonce.">
              <RecapSection icon="person" title="Destinataire" onEdit={() => goTo(0)}>
                <RecapRow label="Nom" value={watch('receiverName')} />
                <RecapRow label="Téléphone" value={watch('receiverPhone')} mono />
                {watch('receiverAddress') && <RecapRow label="Adresse" value={watch('receiverAddress')} />}
              </RecapSection>

              <RecapSection icon="local_shipping" title="Livraison" onEdit={() => goTo(1)}>
                <RecapRow label="Trajet" value={`${garageLabel(watch('departureGarageId'))} → ${garageLabel(watch('arrivalGarageId'))}`} />
                <RecapRow
                  label="Mode"
                  value={mode === 'driver' ? `Chauffeur · ${selectedDriver?.fullName ?? '—'}` : 'Annonce (ouverte aux offres)'}
                />
                {mode === 'driver' && <RecapRow label="Statut" value="En attente de confirmation du chauffeur" />}
              </RecapSection>

              <RecapSection icon="inventory_2" title="Colis" onEdit={() => goTo(2)}>
                {watch('type') && <RecapRow label="Type" value={TYPES.find((t) => t.value === watch('type'))?.label ?? watch('type')} />}
                <RecapRow label="Poids" value={watch('weight') ? formatWeight(Number(watch('weight'))) : '—'} />
                <RecapRow label="Prix" value={watch('price') ? formatFcfa(Number(watch('price'))) : 'À définir'} />
                <RecapRow label="Description" value={watch('description')} />
                {(watch('isUrgent') || watch('isInsured') || photos.length > 0 || voice) && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 8 }}>
                    {watch('isUrgent') && <Chip icon="bolt" tone="danger">Express</Chip>}
                    {watch('isInsured') && <Chip icon="verified_user" tone="teal">Assuré</Chip>}
                    {photos.length > 0 && <Chip icon="photo_camera">{photos.length} photo{photos.length > 1 ? 's' : ''}</Chip>}
                    {voice && <Chip icon="mic">Note vocale</Chip>}
                  </div>
                )}
              </RecapSection>

              {apiError && <Toast tone="error" message={apiError} />}
              {mediaError && <Toast tone="error" message={mediaError} />}
            </StepBody>
          )}
        </Card>

        {/* Footer nav */}
        <div style={{ display: 'flex', gap: 12 }}>
          {step > 0 && !createdId && (
            <Button type="button" variant="secondary" size="lg" icon="chevron_left" onClick={back}>
              Retour
            </Button>
          )}
          {createdId ? (
            <Button type="button" block size="lg" icon="arrow_forward" onClick={() => navigate(`/client/colis/${createdId}`, { replace: true })}>
              Voir l’annonce
            </Button>
          ) : step < STEPS.length - 1 ? (
            <Button type="button" block size="lg" iconTrailing="chevron_right" onClick={next} style={{ marginLeft: 'auto' }}>
              Continuer
            </Button>
          ) : (
            <Button type="submit" block size="lg" icon="campaign" loading={submitting} style={{ marginLeft: 'auto' }}>
              {uploading ? 'Envoi des fichiers…' : 'Publier l’annonce'}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}

/* ---------- Wizard chrome ---------- */

function Stepper({ current, maxStep, onJump }: { current: number; maxStep: number; onJump: (s: number) => void }) {
  const fraction = STEPS.length > 1 ? current / (STEPS.length - 1) : 0
  return (
    <div style={{ position: 'relative', padding: '0 4px' }}>
      <div style={{ position: 'absolute', top: 13, left: '12.5%', right: '12.5%', height: 2, background: 'var(--border-default)' }} />
      <div style={{ position: 'absolute', top: 13, left: '12.5%', width: `calc(${75 * fraction}%)`, height: 2, background: 'var(--teal-500)', transition: 'width 0.3s ease' }} />
      <div style={{ display: 'flex', position: 'relative' }}>
        {STEPS.map((label, i) => {
          const done = i < current
          const active = i === current
          const reachable = i <= maxStep
          return (
            <button
              key={label}
              type="button"
              disabled={!reachable}
              onClick={() => reachable && onJump(i)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 7,
                border: 'none',
                background: 'transparent',
                cursor: reachable ? 'pointer' : 'default',
                padding: 0,
              }}
            >
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: 13,
                  background: done || active ? 'var(--teal-500)' : 'var(--surface-card)',
                  color: done || active ? '#fff' : 'var(--text-faint)',
                  border: `2px solid ${done || active ? 'var(--teal-500)' : 'var(--border-default)'}`,
                  transition: 'background 0.2s, border-color 0.2s',
                }}
              >
                {done ? <Icon name="check" size={16} /> : i + 1}
              </span>
              <span
                style={{
                  fontSize: 'var(--fs-xs)',
                  fontWeight: active ? 700 : 600,
                  fontFamily: 'var(--font-display)',
                  color: active ? 'var(--text-strong)' : done ? 'var(--text-body)' : 'var(--text-faint)',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function StepBody({ n, title, hint, children }: { n: number; title: string; hint: string; children: ReactNode }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 'var(--fs-sm)', color: 'var(--teal-500)' }}>
          {String(n).padStart(2, '0')}
        </span>
        <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--fs-h3)', color: 'var(--text-strong)' }}>
          {title}
        </h2>
      </div>
      <p style={{ margin: '0 0 18px', fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>{hint}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
    </div>
  )
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label style={{ display: 'block', marginBottom: 8, fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, color: 'var(--text-body)' }}>
      {children}
    </label>
  )
}

function RoutePill({ from, to }: { from: string; to: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: '12px 16px',
        background: 'var(--teal-50)',
        border: '1px solid var(--teal-100)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--teal-700)' }}>{from}</span>
      <span style={{ flex: 1, height: 0, borderTop: '2px dashed var(--teal-300)', maxWidth: 80 }} />
      <Icon name="local_shipping" size={18} style={{ color: 'var(--teal-500)' }} />
      <span style={{ flex: 1, height: 0, borderTop: '2px dashed var(--teal-300)', maxWidth: 80 }} />
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--teal-700)' }}>{to}</span>
    </div>
  )
}

function ModeOption({ selected, onClick, icon, title, desc }: { selected: boolean; onClick: () => void; icon: string; title: string; desc: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        textAlign: 'left',
        width: '100%',
        padding: 14,
        borderRadius: 'var(--radius-lg)',
        border: `2px solid ${selected ? 'var(--teal-500)' : 'var(--border-subtle)'}`,
        background: selected ? 'var(--teal-50)' : 'var(--surface-card)',
        cursor: 'pointer',
        transition: 'border-color 120ms, background 120ms',
      }}
    >
      <span
        style={{
          width: 40,
          height: 40,
          flex: 'none',
          borderRadius: 'var(--radius-md)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: selected ? 'var(--teal-500)' : 'var(--surface-sunken)',
          color: selected ? '#fff' : 'var(--text-muted)',
        }}
      >
        <Icon name={icon} size={22} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-strong)' }}>{title}</div>
        <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>
      </div>
      <span
        style={{
          width: 20,
          height: 20,
          flex: 'none',
          borderRadius: '50%',
          marginTop: 2,
          border: `2px solid ${selected ? 'var(--teal-500)' : 'var(--border-default)'}`,
          background: selected ? 'var(--teal-500)' : 'transparent',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {selected && <Icon name="check" size={13} style={{ color: '#fff' }} />}
      </span>
    </button>
  )
}

/* ---------- Recap ---------- */

function RecapSection({ icon, title, onEdit, children }: { icon: string; title: string; onEdit: () => void; children: ReactNode }) {
  return (
    <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Icon name={icon} size={18} style={{ color: 'var(--teal-500)' }} />
        <span style={{ flex: 1, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--fs-title)', color: 'var(--text-strong)' }}>{title}</span>
        <button type="button" onClick={onEdit} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, border: 'none', background: 'transparent', color: 'var(--text-link)', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'var(--fs-sm)', cursor: 'pointer' }}>
          <Icon name="edit" size={15} /> Modifier
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{children}</div>
    </div>
  )
}

function RecapRow({ label, value, mono }: { label: string; value?: ReactNode; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)', flex: 'none' }}>{label}</span>
      <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--text-strong)', textAlign: 'right', fontFamily: mono ? 'var(--font-mono)' : undefined }}>{value || '—'}</span>
    </div>
  )
}

function Chip({ icon, tone = 'neutral', children }: { icon: string; tone?: 'neutral' | 'teal' | 'danger'; children: ReactNode }) {
  const colors = {
    neutral: { bg: 'var(--surface-sunken)', fg: 'var(--text-body)' },
    teal: { bg: 'var(--teal-50)', fg: 'var(--teal-700)' },
    danger: { bg: 'var(--color-danger-soft)', fg: 'var(--color-danger)' },
  }[tone]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 'var(--radius-pill)', background: colors.bg, color: colors.fg, fontSize: 'var(--fs-xs)', fontWeight: 700 }}>
      <Icon name={icon} size={14} />
      {children}
    </span>
  )
}

/* ---------- Driver picker ---------- */

const AVATAR_STATUS = { available: 'online', busy: 'busy', offline: 'offline' } as const

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  available: { label: 'Disponible', color: 'var(--green-600)' },
  busy: { label: 'Occupé', color: 'var(--amber-600)' },
  offline: { label: 'Hors ligne', color: 'var(--slate-400)' },
}

function DriverPicker({ drivers, value, onChange }: { drivers: User[]; value: string; onChange: (id: string) => void }) {
  const scroller = useRef<HTMLDivElement>(null)
  const nudge = (dir: number) => scroller.current?.scrollBy({ left: dir * 220, behavior: 'smooth' })

  return (
    <div style={{ position: 'relative' }}>
      <div
        ref={scroller}
        style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollSnapType: 'x mandatory', paddingBottom: 8, WebkitOverflowScrolling: 'touch' }}
      >
        {drivers.map((driver) => {
          const selected = value === driver.id
          const status = STATUS_LABEL[driver.driverStatus ?? 'offline'] ?? STATUS_LABEL.offline
          const rating = Number(driver.rating ?? 0)
          return (
            <DriverCard key={driver.id} selected={selected} onClick={() => onChange(selected ? '' : driver.id)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar name={driver.fullName} src={driver.profilePhoto ?? undefined} size="md" status={AVATAR_STATUS[driver.driverStatus ?? 'offline']} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{driver.fullName}</div>
                  <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {driver.garageName ?? driver.city ?? 'Indépendant'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 'var(--fs-sm)' }}>
                  <Icon name="star" size={16} style={{ color: 'var(--amber-500)' }} />
                  <span style={{ fontWeight: 600, color: 'var(--text-strong)' }}>{rating.toFixed(1)}</span>
                  <span style={{ color: 'var(--text-muted)' }}>· {driver.completedDeliveries ?? 0} livr.</span>
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 'var(--fs-sm)', color: status.color }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: status.color }} />
                  {status.label}
                </span>
              </div>
            </DriverCard>
          )
        })}
      </div>
      <ScrollChevron side="left" onClick={() => nudge(-1)} />
      <ScrollChevron side="right" onClick={() => nudge(1)} />
    </div>
  )
}

function DriverCard({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      style={{
        position: 'relative',
        scrollSnapAlign: 'start',
        flex: 'none',
        width: 220,
        textAlign: 'left',
        padding: 14,
        borderRadius: 'var(--radius-lg)',
        border: `2px solid ${selected ? 'var(--teal-500)' : 'var(--border-subtle)'}`,
        background: selected ? 'var(--teal-50)' : 'var(--surface-card)',
        boxShadow: selected ? '0 0 0 3px var(--teal-100)' : 'var(--shadow-xs)',
        cursor: 'pointer',
        transition: 'border-color 120ms, box-shadow 120ms, background 120ms',
      }}
    >
      {selected && <Icon name="check_circle" size={20} style={{ position: 'absolute', top: 10, right: 10, color: 'var(--teal-500)' }} />}
      {children}
    </button>
  )
}

function ScrollChevron({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={side === 'left' ? 'Précédent' : 'Suivant'}
      onClick={onClick}
      style={{
        position: 'absolute',
        top: 'calc(50% - 4px)',
        transform: 'translateY(-50%)',
        [side]: -6,
        width: 32,
        height: 32,
        borderRadius: '50%',
        border: '1px solid var(--border-subtle)',
        background: 'var(--surface-card)',
        boxShadow: 'var(--shadow-sm)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      <Icon name={side === 'left' ? 'chevron_left' : 'chevron_right'} size={20} />
    </button>
  )
}

/* ---------- Media helpers ---------- */

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * Downscale + re-encode an image so the upload payload stays small (raw phone
 * photos are multi-MB and used to fail / bloat the request).
 */
async function compressImage(file: File, maxDim = 1600, quality = 0.8): Promise<string> {
  const original = await readAsDataUrl(file)
  if (!file.type.startsWith('image/')) return original
  try {
    const img = await loadImage(original)
    let { width, height } = img
    const longest = Math.max(width, height)
    if (longest > maxDim) {
      const scale = maxDim / longest
      width = Math.round(width * scale)
      height = Math.round(height * scale)
    }
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return original
    ctx.drawImage(img, 0, 0, width, height)
    return canvas.toDataURL('image/jpeg', quality)
  } catch {
    return original
  }
}

function PhotoCapture({ photos, onChange }: { photos: PhotoItem[]; onChange: (next: PhotoItem[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return
    const items = await Promise.all(
      Array.from(files).map(async (f) => ({
        id: crypto.randomUUID(),
        dataUrl: await compressImage(f),
        name: f.name.replace(/\.[^.]+$/, '') + '.jpg',
      })),
    )
    onChange([...photos, ...items])
    if (inputRef.current) inputRef.current.value = ''
  }

  const remove = (id: string) => onChange(photos.filter((p) => p.id !== id))

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Icon name="photo_camera" size={18} style={{ color: 'var(--text-muted)' }} />
        <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--text-muted)' }}>Photos du colis</span>
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple onChange={(e) => onFiles(e.target.files)} style={{ display: 'none' }} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {photos.map((p) => (
          <div key={p.id} style={{ position: 'relative', width: 84, height: 84, borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
            <img src={p.dataUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <button
              type="button"
              aria-label="Supprimer la photo"
              onClick={() => remove(p.id)}
              style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.55)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <Icon name="close" size={14} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          style={{ width: 84, height: 84, borderRadius: 'var(--radius-md)', border: '2px dashed var(--border-strong)', background: 'var(--surface-sunken)', color: 'var(--text-muted)', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, cursor: 'pointer' }}
        >
          <Icon name="add_a_photo" size={22} />
          <span style={{ fontSize: 11 }}>Ajouter</span>
        </button>
      </div>
    </div>
  )
}

function formatDuration(ms: number) {
  const total = Math.round(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function VoiceNoteRecorder({ voice, onChange }: { voice: VoiceNote | null; onChange: (next: VoiceNote | null) => void }) {
  const [recording, setRecording] = useState(false)
  const [paused, setPaused] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startedAtRef = useRef(0)
  const pausedAtRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
  }

  useEffect(() => stopTimer, [])

  const start = async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data)
      }
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        const dataUrl = await readAsDataUrl(blob)
        onChange({ dataUrl, durationMs: performance.now() - startedAtRef.current })
      }
      recorderRef.current = recorder
      startedAtRef.current = performance.now()
      recorder.start()
      setRecording(true)
      setPaused(false)
      setElapsed(0)
      timerRef.current = setInterval(() => setElapsed(performance.now() - startedAtRef.current), 200)
    } catch {
      setError("Micro indisponible — autorisez l'accès au microphone.")
    }
  }

  const stop = () => {
    stopTimer()
    setRecording(false)
    setPaused(false)
    recorderRef.current?.stop()
  }

  const pause = () => {
    stopTimer()
    pausedAtRef.current = performance.now()
    recorderRef.current?.pause()
    setPaused(true)
  }

  const resume = () => {
    startedAtRef.current += performance.now() - pausedAtRef.current
    recorderRef.current?.resume()
    setPaused(false)
    setElapsed(performance.now() - startedAtRef.current)
    timerRef.current = setInterval(() => setElapsed(performance.now() - startedAtRef.current), 200)
  }

  const reset = () => {
    onChange(null)
    setElapsed(0)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Icon name="mic" size={18} style={{ color: 'var(--text-muted)' }} />
        <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--text-muted)' }}>Note vocale</span>
      </div>

      {voice && !recording ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <audio controls src={voice.dataUrl} style={{ height: 40, maxWidth: '100%' }} />
          <Button type="button" variant="ghost" size="sm" icon="delete" onClick={reset}>
            Supprimer
          </Button>
        </div>
      ) : recording ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: paused ? 'var(--amber-500)' : 'var(--color-danger)', fontWeight: 600 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'currentColor', animation: paused ? 'pulse 2s ease-in-out infinite' : 'pulse 1s ease-in-out infinite' }} />
            {paused ? 'En pause' : 'Enregistrement'} {formatDuration(elapsed)}
          </span>
          {paused ? (
            <Button type="button" variant="primary" size="sm" icon="play_arrow" onClick={resume}>
              Reprendre
            </Button>
          ) : (
            <Button type="button" variant="secondary" size="sm" icon="pause" onClick={pause}>
              Pause
            </Button>
          )}
          <Button type="button" variant="danger" size="sm" icon="stop" onClick={stop}>
            Arrêter
          </Button>
        </div>
      ) : (
        <Button type="button" variant="secondary" size="sm" icon="mic" onClick={start}>
          Enregistrer un message
        </Button>
      )}

      {error && <p style={{ margin: '8px 0 0', fontSize: 'var(--fs-sm)', color: 'var(--color-danger)' }}>{error}</p>}
    </div>
  )
}

function VideoCapture({ videos, onChange }: { videos: VideoItem[]; onChange: (next: VideoItem[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return
    const items = await Promise.all(
      Array.from(files).map(async (f) => ({
        id: crypto.randomUUID(),
        dataUrl: await readAsDataUrl(f),
        name: f.name,
      })),
    )
    onChange([...videos, ...items])
    if (inputRef.current) inputRef.current.value = ''
  }

  const remove = (id: string) => onChange(videos.filter((v) => v.id !== id))

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Icon name="videocam" size={18} style={{ color: 'var(--text-muted)' }} />
        <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--text-muted)' }}>Videos du colis</span>
      </div>
      <input ref={inputRef} type="file" accept="video/*" multiple onChange={(e) => onFiles(e.target.files)} style={{ display: 'none' }} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {videos.map((v) => (
          <div key={v.id} style={{ position: 'relative', width: 84, height: 84, borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-subtle)', background: '#000' }}>
            <video src={v.dataUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <button
              type="button"
              aria-label="Supprimer la video"
              onClick={() => remove(v.id)}
              style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.55)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <Icon name="close" size={14} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          style={{ width: 84, height: 84, borderRadius: 'var(--radius-md)', border: '2px dashed var(--border-strong)', background: 'var(--surface-sunken)', color: 'var(--text-muted)', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, cursor: 'pointer' }}
        >
          <Icon name="videocam" size={22} />
          <span style={{ fontSize: 11 }}>Ajouter</span>
        </button>
      </div>
    </div>
  )
}
