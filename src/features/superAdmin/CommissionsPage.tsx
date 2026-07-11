import { useState, type ChangeEvent } from 'react'
import { Button, Card, Input, Select, Dialog, Toast, Badge, Switch } from '@/ds'
import { Panel } from '@/components/Panel'
import { QueryState } from '@/components/QueryState'
import { useCommissionConfig, useUpdateCommissionConfig, useSimulateCommission } from './hooks'
import { formatFcfa } from '@/lib/format'
import type { CommissionConfig, CommissionSimulation } from '@/lib/api/admin-finance'

const PROFILE_LABELS: Record<string, string> = {
  local: 'Local',
  regional: 'Régional',
  express: 'Express',
  international: 'International',
}

function EditConfigDialog({
  config,
  open,
  onClose,
}: {
  config: CommissionConfig | null
  open: boolean
  onClose: () => void
}) {
  const [percentage, setPercentage] = useState(config?.percentage?.toString() ?? '')
  const [minAmount, setMinAmount] = useState(config?.minAmount?.toString() ?? '')
  const [maxAmount, setMaxAmount] = useState(config?.maxAmount?.toString() ?? '')
  const [isActive, setIsActive] = useState(config?.isActive ?? true)
  const mutation = useUpdateCommissionConfig()

  const handleSave = async () => {
    if (!config) return
    try {
      await mutation.mutateAsync({
        profile: config.profile,
        percentage: percentage ? Number(percentage) : undefined,
        minAmount: minAmount ? Number(minAmount) : undefined,
        maxAmount: maxAmount ? Number(maxAmount) : undefined,
        isActive,
      })
      onClose()
    } catch {
      // error handled by mutation state
    }
  }

  return (
    <Dialog open={open} title={`Modifier la commission — ${config ? PROFILE_LABELS[config.profile] ?? config.profile : ''}`} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
        <Select
          label="Profil"
          value={config?.profile ?? ''}
          disabled
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
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSave} loading={mutation.isPending}>Enregistrer</Button>
        </div>
      </div>
    </Dialog>
  )
}

export function CommissionsPage() {
  const [amount, setAmount] = useState('')
  const [editingConfig, setEditingConfig] = useState<CommissionConfig | null>(null)
  const configQuery = useCommissionConfig()
  const simulateMutation = useSimulateCommission()
  const configs = configQuery.data ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <Panel title="Simulateur de commission">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
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
            <Toast tone="error" title="Erreur" message={(simulateMutation.error as Error)?.message ?? 'Erreur de simulation'} />
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
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14.5, color: 'var(--text-strong)' }}>
                          {PROFILE_LABELS[sim.profile] ?? sim.profile}
                        </span>
                        <Badge tone="primary">{sim.percentage}%</Badge>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        Min: {formatFcfa(sim.minAmount)} · Max: {formatFcfa(sim.maxAmount)}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Montant saisi</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 14, color: 'var(--text-body)' }}>
                          {formatFcfa(sim.amount)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Commission calculée</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 18, color: 'var(--teal-600)' }}>
                          {formatFcfa(sim.commission)}
                        </span>
                      </div>
                      {isCappedMin && (
                        <Badge tone="amber">Minimum appliqué</Badge>
                      )}
                      {isCappedMax && (
                        <Badge tone="amber">Maximum appliqué</Badge>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </Panel>

      <Panel title="Configuration des commissions">
        <QueryState
          isLoading={configQuery.isLoading}
          isError={configQuery.isError}
          error={configQuery.error}
          isEmpty={configs.length === 0}
          emptyTitle="Aucune configuration"
          emptyMessage="Aucune configuration de commission trouvée."
          onRetry={() => configQuery.refetch()}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {configs.map((cfg) => (
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
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--text-strong)' }}>
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
            ))}
          </div>
        </QueryState>
      </Panel>

      <EditConfigDialog config={editingConfig} open={!!editingConfig} onClose={() => setEditingConfig(null)} />
    </div>
  )
}
