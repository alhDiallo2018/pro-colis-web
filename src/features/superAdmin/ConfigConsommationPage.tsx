import { useEffect, useState, type ChangeEvent } from 'react'
import { Button, Card, Input, Textarea, Select, Dialog, Toast, Badge, Switch } from '@/ds'
import { Panel } from '@/components/Panel'
import { QueryState } from '@/components/QueryState'
import {
  useCommissionConfig,
  useUpdateCommissionConfig,
  useSimulateCommission,
  useAdminConfig,
  useUpdateConfig,
} from './hooks'
import { formatFcfa } from '@/lib/format'
import { ApiError } from '@/lib/api/client'
import type { CommissionConfig, CommissionSimulation } from '@/lib/api/admin-finance'

const PROFILE_LABELS: Record<string, string> = {
  local: 'Local',
  regional: 'Régional',
  express: 'Express',
  international: 'International',
}

// ---- Dialog édition commission ----

function EditConfigDialog({
  config,
  open,
  onClose,
}: {
  config: CommissionConfig | null
  open: boolean
  onClose: () => void
}) {
  const isNew = !config?.id
  const [profile, setProfile] = useState<string>(config?.profile ?? 'local')
  const [percentage, setPercentage] = useState(config?.percentage?.toString() ?? '')
  const [minAmount, setMinAmount] = useState(config?.minAmount?.toString() ?? '')
  const [maxAmount, setMaxAmount] = useState(config?.maxAmount?.toString() ?? '')
  const [isActive, setIsActive] = useState(config?.isActive ?? true)
  const mutation = useUpdateCommissionConfig()

  const handleSave = async () => {
    if (!profile) return
    try {
      await mutation.mutateAsync({
        profile,
        percentage: percentage ? Number(percentage) : undefined,
        minAmount: minAmount ? Number(minAmount) : undefined,
        maxAmount: maxAmount ? Number(maxAmount) : undefined,
        isActive,
      })
      onClose()
    } catch {
      // handled by mutation state
    }
  }

  return (
    <Dialog
      open={open}
      title={isNew ? 'Ajouter une commission' : `Modifier la commission — ${PROFILE_LABELS[profile] ?? profile}`}
      onClose={onClose}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
        <Select
          label="Profil"
          value={profile}
          disabled={!isNew}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setProfile(e.target.value)}
          options={[
            { value: 'local', label: 'Local' },
            { value: 'regional', label: 'Régional' },
            { value: 'express', label: 'Express' },
            { value: 'international', label: 'International' },
          ]}
        />
        <Input
          label="Pourcentage (%)"
          type="number"
          value={percentage}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setPercentage(e.target.value)}
          placeholder="Ex: 10"
          suffix="%"
        />
        <Input
          label="Montant minimum (FCFA)"
          type="number"
          value={minAmount}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setMinAmount(e.target.value)}
          placeholder="Ex: 500"
        />
        <Input
          label="Montant maximum (FCFA)"
          type="number"
          value={maxAmount}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setMaxAmount(e.target.value)}
          placeholder="Ex: 5000"
        />
        <Switch checked={isActive} onChange={setIsActive} label="Actif" />
        {mutation.isError && (
          <Toast tone="error" title="Erreur" message={(mutation.error as Error)?.message ?? 'Erreur inconnue'} />
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSave} loading={mutation.isPending}>
            Enregistrer
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

// ---- Simulateur ----

function SimulatorPanel() {
  const [amount, setAmount] = useState('')
  const simulateMutation = useSimulateCommission()

  return (
    <Panel title="Simulateur de commission">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <Input
            label="Montant de la livraison (FCFA)"
            type="number"
            value={amount}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
            placeholder="Ex: 5000"
            style={{ flex: 1, maxWidth: 300 }}
          />
          <Button
            onClick={() => {
              const val = Number(amount)
              if (val > 0) simulateMutation.mutate(val)
            }}
            loading={simulateMutation.isPending}
          >
            Simuler
          </Button>
        </div>

        {simulateMutation.isError && (
          <Toast
            tone="error"
            title="Erreur"
            message={(simulateMutation.error as Error)?.message ?? 'Erreur de simulation'}
          />
        )}

        {simulateMutation.isSuccess && simulateMutation.data?.length === 0 && (
          <Toast
            tone="info"
            title="Aucune commission active"
            message="Configurez et activez au moins une commission dans la grille ci-dessous pour simuler."
          />
        )}

        {simulateMutation.data && simulateMutation.data.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            {simulateMutation.data.map((sim: CommissionSimulation) => {
              const isCappedMin = sim.commission === sim.minAmount && sim.minAmount > 0
              const isCappedMax = sim.commission === sim.maxAmount && sim.maxAmount > 0
              return (
                <Card key={sim.profile} padding="md">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontWeight: 700,
                          fontSize: 14.5,
                          color: 'var(--text-strong)',
                        }}
                      >
                        {PROFILE_LABELS[sim.profile] ?? sim.profile}
                      </span>
                      <Badge tone="primary">{sim.percentage}%</Badge>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Min: {formatFcfa(sim.minAmount)} · Max: {formatFcfa(sim.maxAmount)}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Montant saisi</span>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 600,
                          fontSize: 14,
                          color: 'var(--text-body)',
                        }}
                      >
                        {formatFcfa(sim.amount)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Commission calculée</span>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 800,
                          fontSize: 18,
                          color: 'var(--teal-600)',
                        }}
                      >
                        {formatFcfa(sim.commission)}
                      </span>
                    </div>
                    {isCappedMin && <Badge tone="amber">Minimum appliqué</Badge>}
                    {isCappedMax && <Badge tone="amber">Maximum appliqué</Badge>}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </Panel>
  )
}

// ---- Liste commissions ----

const ALL_PROFILES = ['local', 'regional', 'express', 'international'] as const

function CommissionListPanel() {
  const [editingConfig, setEditingConfig] = useState<CommissionConfig | null>(null)
  const configQuery = useCommissionConfig()
  const configs = configQuery.data ?? []

  const latestByProfile: Record<string, CommissionConfig | undefined> = {}
  for (const cfg of configs) {
    const existing = latestByProfile[cfg.profile]
    if (!existing || new Date(cfg.createdAt ?? 0) > new Date(existing.createdAt ?? 0)) {
      latestByProfile[cfg.profile] = cfg
    }
  }

  return (
    <>
      <Panel title="Grille des commissions">
        <QueryState
          isLoading={configQuery.isLoading}
          isError={configQuery.isError}
          error={configQuery.error}
          isEmpty={false}
          onRetry={() => configQuery.refetch()}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {ALL_PROFILES.map((profile) => {
              const cfg = latestByProfile[profile]
              if (!cfg) {
                return (
                  <div
                    key={profile}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 14,
                      padding: '14px 16px',
                      border: '1px dashed var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontWeight: 700,
                          fontSize: 14,
                          color: 'var(--text-strong)',
                        }}
                      >
                        {PROFILE_LABELS[profile] ?? profile}
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>
                        Aucune configuration
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setEditingConfig({ profile } as CommissionConfig)}
                    >
                      Ajouter
                    </Button>
                  </div>
                )
              }

              return (
                <div
                  key={cfg.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 14,
                    padding: '14px 16px',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                    <div>
                      <div
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontWeight: 700,
                          fontSize: 14,
                          color: 'var(--text-strong)',
                        }}
                      >
                        {PROFILE_LABELS[cfg.profile] ?? cfg.profile}
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>
                        {cfg.percentage}% · Min: {formatFcfa(cfg.minAmount)} · Max: {formatFcfa(cfg.maxAmount)}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Badge tone={cfg.isActive ? 'green' : 'neutral'}>{cfg.isActive ? 'Actif' : 'Inactif'}</Badge>
                    <Button variant="secondary" size="sm" onClick={() => setEditingConfig(cfg)}>
                      Modifier
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </QueryState>
      </Panel>

      <EditConfigDialog config={editingConfig} open={!!editingConfig} onClose={() => setEditingConfig(null)} />
    </>
  )
}

// ---- Paramètres système ----

type ScalarValue = string | number | boolean

type ConfigSection = {
  title: string
  keys: ConfigField[]
}

type ConfigField = {
  key: string
  label: string
  type: 'number' | 'text' | 'boolean' | 'list' | 'json'
  defaultValue: ScalarValue
}

const CONFIG_SCHEMA: ConfigSection[] = [
  {
    title: 'Tarification',
    keys: [
      { key: 'pricing.baseFee', label: 'Frais de base (FCFA)', type: 'number', defaultValue: 1000 },
      { key: 'pricing.pricePerKg', label: 'Prix par kg (FCFA)', type: 'number', defaultValue: 500 },
      { key: 'pricing.urgentFee', label: 'Frais urgence (FCFA)', type: 'number', defaultValue: 1000 },
      { key: 'pricing.insuranceFee', label: 'Frais assurance (FCFA)', type: 'number', defaultValue: 1000 },
    ],
  },
  {
    title: 'Score & Réputation',
    keys: [
      { key: 'score.deliveryCompleted', label: 'Points par livraison réussie', type: 'number', defaultValue: 0 },
      { key: 'score.signupBonus', label: 'Points bonus inscription', type: 'number', defaultValue: 0 },
      { key: 'score.cfaPerPoint', label: 'Équivalent CFA par point (FCFA)', type: 'number', defaultValue: 1 },
      { key: 'score.commitmentFee', label: 'Points de frais d\'engagement (offre acceptée)', type: 'number', defaultValue: 0 },
      { key: 'score.standardThreshold', label: 'Seuil niveau Standard (points)', type: 'number', defaultValue: 100 },
      { key: 'score.premiumThreshold', label: 'Seuil niveau Premium (points)', type: 'number', defaultValue: 500 },
      { key: 'score.eliteThreshold', label: 'Seuil niveau Elite (points)', type: 'number', defaultValue: 1000 },
      { key: 'score.packs', label: 'Forfaits de points proposés (FCFA, séparés par des virgules)', type: 'list', defaultValue: '' },
    ],
  },
  {
    title: 'Finances — Retraits',
    keys: [
      { key: 'withdrawal.minAmount', label: 'Montant minimum de retrait (FCFA)', type: 'number', defaultValue: 500 },
      { key: 'withdrawal.maxAmount', label: 'Montant maximum de retrait (0=illimité)', type: 'number', defaultValue: 0 },
      { key: 'withdrawal.maxPerDay', label: 'Plafond de retrait par jour (0=illimité)', type: 'number', defaultValue: 0 },
    ],
  },
  {
    title: 'Finances — Commission',
    keys: [
      { key: 'commission.insufficient_rule', label: 'Règle si solde insuffisant (block | warn | debt)', type: 'text', defaultValue: 'block' },
      { key: 'commission.debtLimit', label: 'Plafond de dette de commission (0 = aucune limite)', type: 'number', defaultValue: 0 },
    ],
  },
  {
    title: 'Finances — Déboursement',
    keys: [
      { key: 'disbursement.mode', label: 'Mode (manual ou auto)', type: 'text', defaultValue: 'manual' },
    ],
  },
  {
    title: 'Annulation & Remboursement',
    keys: [
      { key: 'cancellation.penalty.percentage', label: 'Pénalité d\'annulation (%)', type: 'number', defaultValue: 0 },
      { key: 'cancellation.penalty.minAmount', label: 'Pénalité minimum (FCFA)', type: 'number', defaultValue: 0 },
      { key: 'cancellation.penalty.maxAmount', label: 'Pénalité maximum (FCFA)', type: 'number', defaultValue: 0 },
      { key: 'cancellation.penalty.clientSharePercent', label: 'Part client si responsabilité partagée (%)', type: 'number', defaultValue: 0 },
      { key: 'cancellation.fee.paydunyaPercentage', label: 'Frais PayDunya non remboursables (%)', type: 'number', defaultValue: 0 },
      { key: 'cancellation.fee.technicalFixed', label: 'Frais technique fixe non remboursable (FCFA)', type: 'number', defaultValue: 0 },
      { key: 'cancellation.fee.technicalPercentage', label: 'Frais technique non remboursable (%)', type: 'number', defaultValue: 0 },
      { key: 'cancellation.reasons', label: 'Motifs d\'annulation (JSON)', type: 'json', defaultValue: '' },
    ],
  },
  {
    title: 'Uploads',
    keys: [
      { key: 'uploads.maxPhotoMb', label: 'Taille max photo (Mo)', type: 'number', defaultValue: 10 },
    ],
  },
  {
    title: 'Maintenance',
    keys: [
      { key: 'maintenance.enabled', label: 'Mode maintenance', type: 'boolean', defaultValue: false },
    ],
  },
  {
    title: 'Support',
    keys: [
      { key: 'support.phone', label: 'Téléphone commercial', type: 'text', defaultValue: '' },
      { key: 'support.email', label: 'Email commercial', type: 'text', defaultValue: '' },
      { key: 'support.technicalPhone', label: 'Téléphone technique', type: 'text', defaultValue: '' },
      { key: 'support.technicalEmail', label: 'Email technique', type: 'text', defaultValue: '' },
      { key: 'support.responseTime', label: 'Délai de réponse (ex: 24h)', type: 'text', defaultValue: '24h' },
      { key: 'support.availability', label: 'Disponibilité (ex: 7j/7)', type: 'text', defaultValue: '7j/7' },
    ],
  },
  {
    title: 'Informations légales',
    keys: [
      { key: 'legal.companyName', label: 'Raison sociale', type: 'text', defaultValue: '' },
      { key: 'legal.address', label: 'Adresse du siège', type: 'text', defaultValue: '' },
      { key: 'legal.registrationNumber', label: 'Numéro d\'immatriculation', type: 'text', defaultValue: '' },
      { key: 'legal.cdpAuthorization', label: 'Numéro d\'autorisation CDP', type: 'text', defaultValue: '' },
      { key: 'legal.privacyEmail', label: 'Email contact protection des données', type: 'text', defaultValue: '' },
      { key: 'legal.publisherName', label: 'Directeur de la publication', type: 'text', defaultValue: '' },
      { key: 'legal.hostName', label: 'Hébergeur de la plateforme', type: 'text', defaultValue: '' },
      { key: 'legal.directorName', label: 'Directeur Général (nom)', type: 'text', defaultValue: '' },
      { key: 'legal.directorEmail', label: 'Directeur Général (email)', type: 'text', defaultValue: '' },
      { key: 'legal.technicalDirectorName', label: 'Directeur Technique (nom)', type: 'text', defaultValue: '' },
      { key: 'legal.technicalDirectorEmail', label: 'Directeur Technique (email)', type: 'text', defaultValue: '' },
    ],
  },
]

function buildForm(configFromApi: Record<string, unknown>): Record<string, ScalarValue> {
  const form: Record<string, ScalarValue> = {}
  for (const section of CONFIG_SCHEMA) {
    for (const field of section.keys) {
      const apiVal = configFromApi[field.key]
      if (apiVal !== undefined && apiVal !== null) {
        if (field.type === 'list') {
          const arr = Array.isArray(apiVal) ? apiVal : Array.isArray((apiVal as { value?: unknown })?.value) ? (apiVal as { value: unknown[] }).value : []
          form[field.key] = arr.map((n) => String(n)).join(', ')
        } else if (field.type === 'boolean') {
          form[field.key] = apiVal as boolean
        } else if (field.type === 'number') {
          form[field.key] = Number(apiVal)
        } else if (field.type === 'json') {
          form[field.key] = typeof apiVal === 'string' ? apiVal : JSON.stringify(apiVal, null, 2)
        } else {
          form[field.key] = String(apiVal)
        }
      } else {
        form[field.key] = field.defaultValue
      }
    }
  }
  return form
}

/** Convertit le formulaire en valeurs prêtes à être stockées côté API. Les
 *  champs `list` redeviennent des tableaux de nombres (le backend les consomme
 *  ainsi, ex. `score.packs`). */
function serializeForm(form: Record<string, ScalarValue>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const section of CONFIG_SCHEMA) {
    for (const field of section.keys) {
      const v = form[field.key]
      if (field.type === 'list') {
        out[field.key] = String(v ?? '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .map(Number)
          .filter((n) => Number.isFinite(n) && n > 0)
      } else if (field.type === 'number') {
        out[field.key] = Number(v)
      } else if (field.type === 'json') {
        const raw = String(v ?? '').trim()
        if (!raw) {
          out[field.key] = []
          continue
        }
        try {
          out[field.key] = JSON.parse(raw)
        } catch {
          throw new Error(`Champ « ${field.label} » : JSON invalide.`)
        }
      } else {
        out[field.key] = v
      }
    }
  }
  return out
}

function SystemConfigPanel() {
  const config = useAdminConfig()
  const update = useUpdateConfig()
  const [form, setForm] = useState<Record<string, ScalarValue>>(buildForm({}))
  const [saved, setSaved] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (config.data) setForm(buildForm(config.data))
  }, [config.data])

  const set = (k: string, v: ScalarValue) => {
    setForm((f) => ({ ...f, [k]: v }))
    setSaved(false)
  }

  const submit = () => {
    setSaved(false)
    setFormError(null)
    let payload: Record<string, unknown>
    try {
      payload = serializeForm(form)
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Configuration invalide')
      return
    }
    update.mutate(payload, { onSuccess: () => setSaved(true) })
  }

  const error = update.error instanceof ApiError ? update.error.message : null

  const allSections = CONFIG_SCHEMA.map((section) => ({
    title: section.title,
    keys: section.keys.map((f) => f.key),
  }))

  const renderField = (field: ConfigField) => {
    const v = form[field.key]
    if (field.type === 'boolean') {
      return <Switch key={field.key} label={field.label} checked={!!v} onChange={(c) => set(field.key, c)} />
    }
    if (field.type === 'json') {
      return (
        <Textarea
          key={field.key}
          label={field.label}
          rows={7}
          value={String(v ?? '')}
          placeholder={'[{"value":"client_change_of_mind","label":"Changement d\'avis","responsibility":"client","exempt":false}]'}
          help="Tableau JSON : value, label, responsibility (client | driver | shared | exempt), exempt (booléen)."
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => set(field.key, e.target.value)}
          style={{ gridColumn: '1 / -1' }}
        />
      )
    }
    const isNum = field.type === 'number'
    return (
      <Input
        key={field.key}
        label={field.label}
        type={isNum ? 'number' : 'text'}
        mono={isNum || field.type === 'list'}
        placeholder={field.type === 'list' ? 'Ex: 500, 1000, 3000' : undefined}
        value={String(v ?? field.defaultValue)}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          set(field.key, isNum ? Number(e.target.value) : e.target.value)
        }
      />
    )
  }

  return (
    <Panel title="Paramètres système">
      <QueryState
        isLoading={config.isLoading}
        isError={config.isError}
        error={config.error}
        isEmpty={false}
        onRetry={() => config.refetch()}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {allSections.map((sec) => {
            const fields = CONFIG_SCHEMA.find((s) => s.title === sec.title)!.keys
            return (
              <div key={sec.title} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h4
                  style={{
                    margin: 0,
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600,
                    fontSize: 13.5,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {sec.title}
                </h4>
                {/* Les champs sont disposés en grille responsive (2+ colonnes sur
                    desktop, 1 sur mobile) pour éviter qu'ils ne s'entassent en une
                    seule colonne, ce qui rendait la saisie illisible. */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: 16,
                    alignItems: 'start',
                  }}
                >
                  {fields.map(renderField)}
                </div>
              </div>
            )
          })}

          {error && <Toast tone="error" message={error} />}
          {formError && <Toast tone="error" message={formError} />}
          {saved && !error && !formError && <Toast tone="success" message="Configuration enregistrée." />}

          <div>
            <Button icon="save" loading={update.isPending} onClick={submit}>
              Enregistrer
            </Button>
          </div>
        </div>
      </QueryState>
    </Panel>
  )
}

// ---- Page principale ----

export function ConfigConsommationPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <SimulatorPanel />
      <CommissionListPanel />
      <SystemConfigPanel />
    </div>
  )
}
