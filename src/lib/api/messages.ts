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

/** Recent messages for the current user (used to build conversation list). */
export async function conversations(): Promise<ConversationMessage[]> {
  const { data } = await api.get('/messages/conversations')
  return (data.conversations ?? data.messages ?? data.data ?? []) as ConversationMessage[]
}

export interface SupportConversation {
  id: string
  body: string
  isRead: boolean
  createdAt: string
  senderId: string
  receiverId: string
  messageCount: number
  user: {
    id: string
    fullName: string
    profilePhoto: string | null
    role: string
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
  
  // ✅ CORRECTION: L'API retourne { data: { user, support, messages } }
  // On extrait le tableau de messages
  if (data?.data?.messages && Array.isArray(data.data.messages)) {
    return data.data.messages as SupportThreadMessage[]
  }
  
  // Fallback: si data.data est un tableau
  if (data?.data && Array.isArray(data.data)) {
    return data.data as SupportThreadMessage[]
  }
  
  // Fallback: si data est un tableau
  if (Array.isArray(data)) {
    return data as SupportThreadMessage[]
  }
  
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
