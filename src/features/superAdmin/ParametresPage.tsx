import { useEffect, useState } from 'react'
import { Button, Input, Switch, Toast } from '@/ds'
import { Panel } from '@/components/Panel'
import { QueryState } from '@/components/QueryState'
import { useAdminConfig, useUpdateConfig } from './hooks'
import { ApiError } from '@/lib/api/client'

type ConfigValue = string | number | boolean

function prettyKey(k: string) {
  return k.replace(/[_-]/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^\w/, (c) => c.toUpperCase())
}

export function ParametresPage() {
  const config = useAdminConfig()
  const update = useUpdateConfig()
  const [form, setForm] = useState<Record<string, ConfigValue>>({})
  const [saved, setSaved] = useState(false)

  // Seed editable form once config loads (only scalar keys are editable here).
  useEffect(() => {
    if (config.data) {
      const scalars: Record<string, ConfigValue> = {}
      for (const [k, v] of Object.entries(config.data)) {
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') scalars[k] = v
      }
      setForm(scalars)
    }
  }, [config.data])

  const entries = Object.entries(form)
  const set = (k: string, v: ConfigValue) => {
    setForm((f) => ({ ...f, [k]: v }))
    setSaved(false)
  }

  const submit = () => {
    setSaved(false)
    update.mutate(form, { onSuccess: () => setSaved(true) })
  }

  const error = update.error instanceof ApiError ? update.error.message : null

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <Panel title="Configuration système">
        <QueryState
          isLoading={config.isLoading}
          isError={config.isError}
          error={config.error}
          isEmpty={entries.length === 0}
          emptyTitle="Aucun paramètre"
          emptyMessage="La configuration système ne contient aucun paramètre modifiable."
          onRetry={() => config.refetch()}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {entries.map(([k, v]) =>
              typeof v === 'boolean' ? (
                <Switch key={k} label={prettyKey(k)} checked={v} onChange={(c) => set(k, c)} />
              ) : (
                <Input
                  key={k}
                  label={prettyKey(k)}
                  type={typeof v === 'number' ? 'number' : 'text'}
                  mono={typeof v === 'number'}
                  value={String(v)}
                  onChange={(e) => set(k, typeof v === 'number' ? Number(e.target.value) : e.target.value)}
                />
              ),
            )}

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
    </div>
  )
}
