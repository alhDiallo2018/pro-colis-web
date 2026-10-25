import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Select } from '@/ds'
import { UserSearchSelect } from '@/components/UserSearchSelect'
import { NegotiationChat } from '@/components/NegotiationChat'
import { useAuthStore } from '@/store/auth'
import * as support from '@/lib/api/supportChat'
import { useIsMobile } from '@/lib/useMediaQuery'

export function SupportInboxScreen() {
  const userId = useAuthStore(state => state.user?.id)
  const role = useAuthStore(state => state.user?.role)
  const [targetAgent, setTargetAgent] = useState('')
  const qc = useQueryClient()
  const mobile = useIsMobile()
  const [selected, setSelected] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const chats = useQuery({ queryKey: ['support-chat', 'queue'], queryFn: support.supportChats, refetchInterval: 5000 })
  const thread = useQuery({ queryKey: ['support-chat', selected], queryFn: () => support.supportThread(selected!), enabled: !!selected, refetchInterval: 4000 })
  const conversation = thread.data?.conversation
  const requester = conversation?.userId === userId
  const mine = conversation?.assignedTo?.id === userId
  const canTransfer = !!conversation && !requester && conversation.status === 'open' &&
    (mine || !conversation.assignedTo || role === 'super_admin')
  const agents = useQuery({ queryKey: ['support-chat', 'agents'], queryFn: support.availableSupportAgents,
    enabled: canTransfer, refetchInterval: 10000 })
  const targets = agents.data?.filter(agent => agent.id !== conversation?.userId && agent.id !== conversation?.assignedTo?.id) ?? []
  useEffect(() => {
    // Un changement de dossier ou une réaffectation invalide le choix local ;
    // le prochain transfert doit partir de l'état nouvellement affiché.
    setTargetAgent('')
  }, [conversation?.id, conversation?.assignedTo?.id])
  const act = async (operation: () => Promise<unknown>) => {
    setBusy(true); setError('')
    try { await operation() }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Opération impossible') }
    finally { await qc.invalidateQueries({ queryKey: ['support-chat'] }); setBusy(false) }
  }
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
    <h2 style={{ margin: 0 }}>Boîte support partagée</h2>
    <UserSearchSelect label="Contacter un utilisateur" placeholder="Rechercher par nom, e-mail ou téléphone" disabled={busy}
      onChange={user => { if (user) void act(async () => {
        const chat = await support.openSupportChat(user.id)
        setSelected(chat.id)
        // L'API vérifie l'affectation et refuse une prise simultanée.
        if (chat.userId !== userId && (!chat.assignedTo || chat.assignedTo.id === userId)) await support.claimSupportChat(chat.id)
      }) }} />
    {error && <p role="alert">{error}</p>}
    {chats.isError && <p role="alert">Chargement impossible. <Button onClick={() => chats.refetch()}>Réessayer</Button></p>}
    <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '300px minmax(0,1fr)', gap: 16, minHeight: 480 }}>
      {(!mobile || !selected) && <div style={{ maxHeight: '65vh', overflowY: 'auto' }}>
        {chats.isLoading ? <p>Chargement…</p> : !chats.data?.length ? <p>Aucune demande pour le moment.</p> : chats.data.map(chat => (
          <button key={chat.id} disabled={busy} onClick={() => setSelected(chat.id)} style={{ width: '100%', textAlign: 'left', padding: 14,
            border: '1px solid var(--border-subtle)', borderRadius: 8, marginBottom: 8, color: 'var(--text-strong)',
            background: selected === chat.id ? 'var(--color-primary-soft)' : 'var(--surface-card)' }}>
            <strong>{chat.user.fullName}</strong><br />
            <span>{chat.status === 'closed' ? 'Clôturée' : chat.assignedTo ? `Avec ${chat.assignedTo.fullName}` : 'En attente d’un agent'}</span><br />
            <span>{chat.lastMessage?.body?.slice(0, 100) || (chat.lastMessage ? 'Pièce jointe' : 'Nouvelle conversation')}</span>
            {!!chat.unreadCount && <span> · {chat.unreadCount} non lu(s)</span>}
          </button>
        ))}
      </div>}
      {selected ? <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '65vh', minHeight: 480 }}>
        {mobile && <Button variant="secondary" onClick={() => setSelected(null)}>Retour aux demandes</Button>}
        {conversation && <>
          <strong>{conversation.user.fullName}</strong>
          <span role="status">{conversation.status === 'closed' ? 'Conversation clôturée' : conversation.assignedTo ? `Prise en charge par ${conversation.assignedTo.fullName}` : 'En attente d’un agent disponible'}</span>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {!requester && (!conversation.assignedTo || conversation.status === 'closed') &&
              <Button disabled={busy} onClick={() => act(() => support.claimSupportChat(selected))}>Prendre en charge</Button>}
            {mine && conversation.status === 'open' && <Button variant="secondary" disabled={busy}
              onClick={() => act(() => support.closeSupportChat(selected))}>Clôturer</Button>}
          </div>
          {canTransfer && <div style={{ display: 'grid', gap: 8 }}>
            {agents.isError ? <p role="alert">Liste des supports indisponible. <Button onClick={() => agents.refetch()}>Réessayer</Button></p> :
              <Select label="Affecter à un support disponible" value={targetAgent} disabled={busy || agents.isLoading}
                placeholder={agents.isLoading ? 'Chargement…' : targets.length ? 'Choisir un support' : 'Aucun autre support disponible'}
                options={targets.map(agent => ({ value: agent.id, label: `${agent.fullName} · ${agent.activeCases} dossier(s)` }))}
                onChange={event => setTargetAgent(event.target.value)} />}
            <Button variant="secondary" disabled={busy || agents.isError || !targets.some(agent => agent.id === targetAgent)}
              onClick={() => act(() => support.transferSupportChat(selected, targetAgent, conversation.assignedTo?.id ?? null))}>
              {conversation.assignedTo ? 'Transférer l’assistance' : 'Affecter l’assistance'}
            </Button>
          </div>}
          <NegotiationChat key={selected} peerId={conversation.userId} peerName={conversation.user.fullName}
            supportConversationId={selected} readOnly={!requester && (!mine || conversation.status === 'closed')} />
        </>}
        {thread.isError && <p role="alert">Conversation indisponible. <Button onClick={() => thread.refetch()}>Réessayer</Button></p>}
      </div> : <p>Sélectionnez une demande ou recherchez un utilisateur pour démarrer un échange.</p>}
    </div>
  </div>
}
