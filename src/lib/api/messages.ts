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
