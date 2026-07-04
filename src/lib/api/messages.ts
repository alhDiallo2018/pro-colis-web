import { api } from './client'

export interface ChatMessage {
  id: string
  senderId: string
  receiverId: string
  parcelId?: string | null
  body: string
  audioUrl?: string | null
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
}): Promise<ChatMessage> {
  const { data } = await api.post('/messages', payload)
  return (data.message ?? data.data) as ChatMessage
}

/** Recent messages for the current user (used to build conversation list). */
export async function conversations(): Promise<ConversationMessage[]> {
  const { data } = await api.get('/messages/conversations')
  return (data.conversations ?? data.messages ?? data.data ?? []) as ConversationMessage[]
}
