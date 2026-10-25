import { useState } from 'react'
import { Button, Checkbox, Dialog } from '@/ds'
import type { AssistanceUser } from '@/lib/api/assistances'
import { ManualMessagePanel } from '@/features/superAdmin/ManualMessagePanel'

export function useRecipientSelection() {
  const [selected, setSelected] = useState<AssistanceUser[]>([])
  const ids = new Set(selected.map(user => user.id))
  const checkbox = (user: AssistanceUser, disabled = false) => <Checkbox
    label={<span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clipPath: 'inset(50%)' }}>{`Sélectionner ${user.fullName}`}</span>} checked={ids.has(user.id)}
    disabled={disabled || user.status === 'deleted' || (!ids.has(user.id) && selected.length >= 50)}
    onChange={checked => setSelected(previous => checked
      ? [...previous.filter(item => item.id !== user.id), user] : previous.filter(item => item.id !== user.id))} />
  return { selected, setSelected, checkbox }
}

export function RecipientSelectionActions({ selected, onChange, pageUsers, disabled = false }: {
  selected: AssistanceUser[]; onChange: (users: AssistanceUser[]) => void; pageUsers: AssistanceUser[]; disabled?: boolean
}) {
  const [kind, setKind] = useState<'message' | 'account_summary' | null>(null)
  const [busy, setBusy] = useState(false)
  const eligible = pageUsers.filter(user => user.status !== 'deleted')
  const all = eligible.length > 0 && eligible.every(user => selected.some(item => item.id === user.id))
  const combined = [...new Map([...selected, ...eligible].map(user => [user.id, user])).values()]
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', padding: '12px 18px' }}>
    <Checkbox label="Sélectionner cette page" checked={all} disabled={disabled || !eligible.length || (!all && combined.length > 50)}
      onChange={checked => onChange(checked ? combined : selected.filter(user => !eligible.some(item => item.id === user.id)))} />
    <span role="status">{selected.length}/50 sélectionnés</span>
    <Button size="sm" disabled={!selected.length} onClick={() => setKind('message')}>Envoyer un message</Button>
    <Button size="sm" variant="secondary" disabled={!selected.length} onClick={() => setKind('account_summary')}>Renvoyer leurs données</Button>
    <Button size="sm" variant="ghost" disabled={!selected.length} onClick={() => onChange([])}>Vider la sélection</Button>
    {kind && <Dialog open size="xl" title="Envoi aux comptes sélectionnés" onClose={() => { if (!busy) setKind(null) }}
      actions={<Button variant="secondary" disabled={busy} onClick={() => setKind(null)}>Fermer</Button>}>
      <ManualMessagePanel initialRecipients={selected} initialKind={kind} onBusyChange={setBusy} />
    </Dialog>}
  </div>
}
