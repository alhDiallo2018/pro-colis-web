import { useEffect, useState, type ChangeEvent } from 'react'
import { Button, Card, Input, Select, Dialog, Toast, Badge, Switch } from '@/ds'
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
  type: 'number' | 'text' | 'boolean'
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
      { key: 'score.deliveryCompleted', label: 'Points par livraison réussie', type: 'number', defaultValue: 120 },
      { key: 'score.signupBonus', label: 'Points bonus inscription', type: 'number', defaultValue: 0 },
      { key: 'score.cfaPerPoint', label: 'Équivalent CFA par point (FCFA)', type: 'number', defaultValue: 1 },
      { key: 'score.commitmentFee', label: 'Points de frais d\'engagement (offre acceptée)', type: 'number', defaultValue: 1 },
      { key: 'score.standardThreshold', label: 'Seuil niveau Standard (points)', type: 'number', defaultValue: 100 },
      { key: 'score.premiumThreshold', label: 'Seuil niveau Premium (points)', type: 'number', defaultValue: 500 },
      { key: 'score.eliteThreshold', label: 'Seuil niveau Elite (points)', type: 'number', defaultValue: 1000 },
    ],
  },
  {
    title: 'Finances — Retraits',
    keys: [
      { key: 'withdrawal.minAmount', label: 'Montant minimum de retrait (FCFA)', type: 'number', defaultValue: 500 },
      { key: 'withdrawal.maxAmount', label: 'Montant maximum de retrait (0=illimité)', type: 'number', defaultValue: 0 },
    ],
  },
  {
    title: 'Finances — Commission',
    keys: [
      { key: 'commission.insufficient_rule', label: 'Règle si solde insuffisant (block | warn | debt)', type: 'text', defaultValue: 'block' },
    ],
  },
  {
    title: 'Finances — Déboursement',
    keys: [
      { key: 'disbursement.mode', label: 'Mode (manual ou auto)', type: 'text', defaultValue: 'manual' },
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
    title: 'PayDunya',
    keys: [
      { key: 'paydunya.masterKey', label: 'Clé principale (Master Key)', type: 'text', defaultValue: '' },
      { key: 'paydunya.privateKey', label: 'Clé privée (Private Key)', type: 'text', defaultValue: '' },
      { key: 'paydunya.publicKey', label: 'Clé publique (Public Key)', type: 'text', defaultValue: '' },
      { key: 'paydunya.token', label: 'Token', type: 'text', defaultValue: '' },
      { key: 'paydunya.mode', label: 'Mode (test ou live)', type: 'text', defaultValue: 'test' },
      { key: 'paydunya.disburse.masterKey', label: 'Disburse — Master Key', type: 'text', defaultValue: '' },
      { key: 'paydunya.disburse.privateKey', label: 'Disburse — Private Key', type: 'text', defaultValue: '' },
      { key: 'paydunya.disburse.publicKey', label: 'Disburse — Public Key', type: 'text', defaultValue: '' },
      { key: 'paydunya.disburse.token', label: 'Disburse — Token', type: 'text', defaultValue: '' },
      { key: 'paydunya.disburse.mode', label: 'Disburse — Mode (test/live)', type: 'text', defaultValue: 'test' },
    ],
  },
]

function buildForm(configFromApi: Record<string, unknown>): Record<string, ScalarValue> {
  const form: Record<string, ScalarValue> = {}
  for (const section of CONFIG_SCHEMA) {
    for (const field of section.keys) {
      const apiVal = configFromApi[field.key]
      if (apiVal !== undefined && apiVal !== null) {
        form[field.key] = typeof apiVal === 'boolean' ? apiVal : (field.type === 'number' ? Number(apiVal) : String(apiVal))
      } else {
        form[field.key] = field.defaultValue
      }
    }
  }
  return form
}

function SystemConfigPanel() {
  const config = useAdminConfig()
  const update = useUpdateConfig()
  const [form, setForm] = useState<Record<string, ScalarValue>>(buildForm({}))
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (config.data) setForm(buildForm(config.data))
  }, [config.data])

  const set = (k: string, v: ScalarValue) => {
    setForm((f) => ({ ...f, [k]: v }))
    setSaved(false)
  }

  const submit = () => {
    setSaved(false)
    update.mutate(form, { onSuccess: () => setSaved(true) })
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
    const isNum = field.type === 'number'
    return (
      <Input
        key={field.key}
        label={field.label}
        type={isNum ? 'number' : 'text'}
        mono={isNum}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {allSections.map((sec) => {
            const fields = CONFIG_SCHEMA.find((s) => s.title === sec.title)!.keys
            return (
              <div key={sec.title} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                {fields.map(renderField)}
              </div>
            )
          })}

          {error && <Toast tone="error" message={error} />}
          {saved && !error && <Toast tone="success" message="Configuration enregistrée." />}

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
