import { api } from './client'

export interface ChatMessage {
  id: string
  senderId: string
  receiverId: string
  parcelId?: string | null
  body: string
  audioUrl?: string | null
  photoUrl?: string | null
  videoUrl?: string | null
  isRead: boolean
  createdAt?: string
  /** Date de la dernière réécriture par l'auteur (null si jamais modifié). */
  editedAt?: string | null
  isEdited?: boolean
}

/** Fenêtre d'édition côté API (`MESSAGE_EDIT_WINDOW_MS`), rejouée ici pour ne
 *  proposer « Modifier » que tant que le serveur l'acceptera. */
export const MESSAGE_EDIT_WINDOW_MS = 15 * 60 * 1000

export function isMessageEditable(message: ChatMessage): boolean {
  if (!message.createdAt) return false
  // Une proposition de prix engage la négociation : l'API la refuse.
  if (message.body?.startsWith('__PRIX__')) return false
  if (!message.body?.trim()) return false
  return Date.now() - new Date(message.createdAt).getTime() < MESSAGE_EDIT_WINDOW_MS
}

/** From GET /messages/conversations */
export interface ConversationSummary {
  id: string
  body: string
  isRead: boolean
  createdAt: string
  parcelId?: string | null
  trackingNumber?: string | null
  unreadCount?: number
  otherUser: {
    id: string
    fullName: string
    profilePhoto?: string | null
    role: string
  }
}

export interface ConversationMessage extends ChatMessage {
  sender?: { id: string; fullName: string }
  receiver?: { id: string; fullName: string }
  parcel?: {
    id: string
    trackingNumber: string
    description?: string | null
    weight?: string | null
    type?: string
    status?: string
    receiverName?: string
    receiverPhone?: string
    receiverAddress?: string | null
    photoUrls?: string[]
    videoUrls?: string[]
    audioUrls?: string[]
  } | null
}

/** Messages exchanged with a peer about a parcel (chronological). */
export async function thread(peerId: string, parcelId?: string): Promise<ChatMessage[]> {
  const { data } = await api.get('/messages/thread', { params: { peerId, parcelId } })
  return (data.messages ?? []) as ChatMessage[]
}

export async function send(payload: {
  receiverId: string
  parcelId?: string
  body?: string
  audioUrl?: string
  photoUrl?: string
  videoUrl?: string
}): Promise<ChatMessage> {
  const { data } = await api.post('/messages', payload)
  return (data.message ?? data.data) as ChatMessage
}

/** Réécrit un message que l'on a envoyé (PATCH /messages/:id). */
export async function update(messageId: string, body: string): Promise<ChatMessage> {
  const { data } = await api.patch(`/messages/${messageId}`, { body })
  return (data.message ?? data.data) as ChatMessage
}

/** Suppression logique : le message disparaît des fils, l'historique reste en base. */
export async function remove(messageId: string): Promise<void> {
  await api.delete(`/messages/${messageId}`)
}

/** Recent messages for the current user (used to build conversation list). */
export async function conversations(): Promise<ConversationSummary[]> {
  const { data } = await api.get('/messages/conversations')
  return (data.conversations ?? data.data ?? []) as ConversationSummary[]
}

export interface SupportConversation {
  id: string
  body: string
  isRead?: boolean
  createdAt: string
  senderId: string
  receiverId: string
  messageCount: number
  user: {
    id: string
    fullName: string
    profilePhoto: string | null
    role: string
    email?: string | null
    phone?: string | null
  }
  supportUser: {
    id: string
    fullName: string
  }
  /** Agents (comptes) ayant réellement répondu dans cette conversation. */
  agents?: { id: string; fullName: string }[]
  /** Dernier agent ayant répondu (le plus récent). */
  lastAgent?: { id: string; fullName: string } | null
}

export interface SupportThreadMessage {
  id: string
  body: string
  senderId: string
  receiverId: string
  isRead: boolean
  createdAt: string
  audioUrl?: string | null
  photoUrl?: string | null
  videoUrl?: string | null
  /** Agent réel (compte) ayant tapé la réponse — distinct du compte support partagé. */
  handledById?: string | null
  handledBy?: { id: string; fullName: string; role?: string } | null
  sender: { id: string; fullName: string; profilePhoto: string | null; role: string }
  receiver: { id: string; fullName: string; profilePhoto: string | null; role: string }
}

/** Admin: list all support conversations. */
export async function adminSupportConversations(): Promise<SupportConversation[]> {
  const { data } = await api.get('/messages/admin/support/conversations')
  if (Array.isArray(data.data)) return data.data as SupportConversation[]
  if (Array.isArray(data)) return data as SupportConversation[]
  const conversations = Object.values(data).filter(
    (v): v is SupportConversation =>
      v !== null && typeof v === 'object' && 'id' in v && 'body' in v && 'user' in v,
  )
  return conversations
}

/** Admin: get thread between a support user and another user. */
export async function adminSupportThread(
  supportUserId: string,
  userId: string,
): Promise<SupportThreadMessage[]> {
  const { data } = await api.get(`/messages/admin/support/conversations/${supportUserId}/${userId}`)
  const payload = data.data ?? data

  // Le contrat courant enveloppe les messages dans data.messages ; les deux
  // variantes de tableau restent acceptées pour les déploiements plus anciens.
  if (Array.isArray(payload.messages)) return payload.messages as SupportThreadMessage[]
  if (Array.isArray(payload)) return payload as SupportThreadMessage[]
  return []
}

/** Admin: reply as a support user. */
export async function adminSupportReply(payload: {
  supportUserId: string
  receiverId: string
  body?: string
  audioUrl?: string | null
  photoUrl?: string | null
  videoUrl?: string | null
}): Promise<ChatMessage> {
  const { data } = await api.post('/messages/admin/support/reply', payload)
  return (data.data ?? data.message) as ChatMessage
}
