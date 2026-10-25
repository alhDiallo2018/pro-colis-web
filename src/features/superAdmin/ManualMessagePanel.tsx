import { useEffect, useRef, useState } from 'react'
import { Button, Checkbox, Input, Select, Textarea } from '@/ds'
import { RecipientPicker } from '@/components/RecipientPicker'
import { useAuthStore } from '@/store/auth'
import { Panel } from '@/components/Panel'
import { UserSearchSelect } from '@/components/UserSearchSelect'
import type { AssistanceUser } from '@/lib/api/assistances'
import { ApiError } from '@/lib/api/client'
import { getManualMessageResult, sendManualMessage, type ManualMessageResult, type MessageChannel } from '@/lib/api/manualMessages'

const CHANNELS: Record<MessageChannel, string> = { email: 'Email', sms: 'SMS', in_app: 'Notification dans l’application', chat: 'Chat privé' }
type Delivery = ManualMessageResult & { name: string }

export function ManualMessagePanel({ initialRecipients = [], initialKind = 'message', onBusyChange }: {
  initialRecipients?: AssistanceUser[]
  initialKind?: 'message' | 'account_summary'
  onBusyChange?: (busy: boolean) => void
}) {
  const [recipients, setRecipients] = useState<AssistanceUser[]>(() => [...new Map(initialRecipients.map(user => [user.id, user])).values()].slice(0, 50))
  const [kind, setKind] = useState(initialKind)
  const [pickerOpen, setPickerOpen] = useState(false)
  const role = useAuthStore(state => state.user?.role)
  const [channels, setChannels] = useState<MessageChannel[]>(['email'])
  const [subject, setSubject] = useState(initialKind === 'account_summary' ? 'Vos informations ProColis' : '')
  const [content, setContent] = useState('')
  const [results, setResults] = useState<Delivery[]>([])
  const [sending, setSending] = useState(false)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')
  const active = useRef(true)
  const busy = useRef(false)
  useEffect(() => {
    active.current = true
    return () => { active.current = false }
  }, [])
  useEffect(() => { onBusyChange?.(sending || checking) }, [sending, checking, onBusyChange])
  const locked = sending || results.length > 0
  const maxLength = channels.includes('sms') ? 1600 : 5000

  const updateResult = (result: ManualMessageResult) => {
    if (active.current) setResults(previous => previous.map(row =>
      row.requestId === result.requestId ? { ...row, ...result } : row))
  }

  const send = async () => {
    if (busy.current || locked) return
    if (!recipients.length || !channels.length || !subject.trim() || (kind === 'message' && !content.trim())) {
      setError('Choisissez au moins un destinataire et un canal, puis renseignez l’objet et le message.')
      return
    }
    if (kind === 'message' && content.length > maxLength) {
      setError(`Le message est limité à ${maxLength} caractères pour les canaux choisis.`)
      return
    }
    busy.current = true
    setSending(true)
    setError('')
    const deliveries: Delivery[] = recipients.flatMap(user => channels.map(channel => ({
      requestId: crypto.randomUUID(), userId: user.id, name: user.fullName, channel,
      status: 'processing' as const, message: 'En attente de traitement',
    })))
    setResults(deliveries)
    let cursor = 0
    // Trois requêtes au maximum. Chaque couple utilisateur/canal possède une
    // référence persistée côté serveur : un retry HTTP ne produit pas de doublon.
    const worker = async () => {
      while (active.current && cursor < deliveries.length) {
        const delivery = deliveries[cursor++]
        try {
          const result = await sendManualMessage({ requestId: delivery.requestId,
            userId: delivery.userId, channel: delivery.channel, subject: subject.trim(), content: kind === 'account_summary' ? '' : content.trim(), kind })
          updateResult(result)
        } catch (cause) {
          updateResult({ ...delivery, status: 'unknown',
            message: cause instanceof ApiError ? cause.message : 'Réponse non reçue. Vérifiez le résultat avant de renvoyer.' })
        }
      }
    }
    try { await Promise.all(Array.from({ length: Math.min(3, deliveries.length) }, worker)) }
    finally {
      busy.current = false
      if (active.current) setSending(false)
    }
  }

  const checkResults = async () => {
    setChecking(true)
    for (const row of results.filter(row => row.status === 'unknown' || row.status === 'processing')) {
      try { updateResult(await getManualMessageResult(row.requestId)) }
      catch (cause) {
        updateResult({ ...row, message: cause instanceof ApiError ? cause.message : 'Résultat toujours indisponible.' })
      }
    }
    if (active.current) setChecking(false)
  }

  const sent = results.filter(row => row.status === 'sent').length
  return (
    <Panel title="Envoyer un message aux utilisateurs" style={{ overflow: 'visible' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>
          Sélectionnez jusqu’à 50 utilisateurs, puis les canaux et le contenu à envoyer.
          Chaque destinataire reçoit un envoi individuel, y compris dans son chat privé.
        </p>
        {role !== 'admin' && <UserSearchSelect key={recipients.map(user => user.id).join(',')}
          label="Ajouter un destinataire" placeholder="Nom, e-mail ou téléphone"
          disabled={locked || recipients.length >= 50}
          onChange={user => {
            if (user) setRecipients(previous => previous.some(item => item.id === user.id) ? previous : [...previous, user])
          }} />}
        <Button variant="secondary" disabled={locked} onClick={() => setPickerOpen(value => !value)}>
          {pickerOpen ? 'Masquer le répertoire' : 'Sélectionner plusieurs destinataires'}
        </Button>
        {pickerOpen && !locked && <RecipientPicker selected={recipients} onChange={setRecipients} />}
        <div aria-label="Destinataires sélectionnés" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {recipients.map(user => (
            <div key={user.id} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ minWidth: 0, flex: '1 1 220px', overflowWrap: 'anywhere' }}>
                <strong>{user.fullName}</strong> · {user.email || 'Sans email'} · {user.phone || 'Sans téléphone'}
              </span>
              <Button variant="ghost" size="sm" disabled={locked} aria-label={`Retirer ${user.fullName}`}
                onClick={() => setRecipients(previous => previous.filter(item => item.id !== user.id))}>Retirer</Button>
            </div>
          ))}
        </div>
        <fieldset disabled={locked} style={{ border: 0, padding: 0, margin: 0 }}>
          <legend style={{ marginBottom: 10 }}>Canaux d’envoi</legend>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {(Object.entries(CHANNELS) as [MessageChannel, string][]).map(([channel, label]) => (
              <Checkbox key={channel} label={label} disabled={locked} checked={channels.includes(channel)}
                onChange={checked => setChannels(previous => checked ? [...previous, channel] : previous.filter(item => item !== channel))} />
            ))}
          </div>
        </fieldset>
        <Select label="Contenu à envoyer" value={kind} disabled={locked}
            onChange={event => {
              const next = event.target.value as 'message' | 'account_summary'
              setKind(next)
              if (next === 'account_summary') setSubject('Vos informations ProColis')
            }} options={[{ value: 'message', label: 'Message personnalisé' },
              { value: 'account_summary', label: 'Renvoyer les données du compte' }]} />
        {kind === 'account_summary' && <p role="note">Chaque personne reçoit uniquement sa propre fiche : nom, e-mail, téléphone, profil, ville et statut. Les codes PIN et mots de passe ne sont pas envoyés.</p>}
        <Input label="Objet / titre" value={subject} maxLength={160} disabled={locked}
          onChange={event => setSubject(event.target.value)} />
        {kind === 'message' && <Textarea label="Message" rows={6} value={content} maxLength={maxLength} disabled={locked}
          help={channels.includes('sms') ? 'Un SMS long peut être facturé en plusieurs segments.' : undefined}
          onChange={event => setContent(event.target.value)} />}
        {channels.includes('email') && recipients.some(user => !user.email) &&
          <p role="status" style={{ margin: 0 }}>Les comptes sans email seront ignorés pour ce canal ; les autres canaux choisis restent disponibles.</p>}
        {error && <p role="alert" style={{ color: 'var(--color-danger)', margin: 0 }}>{error}</p>}
        {!results.length && <Button icon="send" disabled={sending} loading={sending} onClick={send}
          aria-label={`Envoyer à ${recipients.length} utilisateur${recipients.length > 1 ? 's' : ''}`}>
          Envoyer à {recipients.length} utilisateur{recipients.length > 1 ? 's' : ''}
        </Button>}
        {!!results.length && <>
          <p role="status" style={{ margin: 0 }}>
            {sending ? 'Envoi en cours… Gardez cette page ouverte jusqu’à la fin du traitement. ' : 'Traitement terminé. '}{sent}/{results.length} envois acceptés ou notifications ajoutées.
          </p>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>L’acceptation par le prestataire ne confirme pas la livraison. Un résultat incertain doit être vérifié avant tout nouvel envoi.</p>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {results.map(row => <li key={row.requestId} style={{ marginBottom: 8 }}>
              <strong>{row.name}</strong> · {CHANNELS[row.channel]} : {row.message || row.status}
            </li>)}
          </ul>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {results.some(row => row.status === 'unknown' || row.status === 'processing') &&
              <Button variant="secondary" disabled={sending || checking} loading={checking}
                onClick={checkResults}>Vérifier les résultats</Button>}
            <Button variant="secondary" disabled={sending || checking} onClick={() => setResults([])}>Nouvel envoi</Button>
          </div>
        </>}
      </div>
    </Panel>
  )
}
