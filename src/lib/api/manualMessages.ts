import type { AssistanceUser } from './assistances'
import type { Pagination } from './types'
import { api } from './client'

export type MessageChannel = 'email' | 'sms' | 'in_app' | 'chat'
export interface ManualMessagePayload {
  requestId: string
  userId: string
  channel: MessageChannel
  subject: string
  content: string
  kind?: 'message' | 'account_summary'
}
export interface ManualMessageResult {
  requestId: string
  userId: string
  channel: MessageChannel
  status: 'processing' | 'sent' | 'skipped' | 'unknown'
  message?: string
  messageId?: string | null
}

export async function sendManualMessage(payload: ManualMessagePayload): Promise<ManualMessageResult> {
  const { data } = await api.post('/admin/notifications/messages', payload)
  return data.result
}

export async function getManualMessageResult(requestId: string): Promise<ManualMessageResult> {
  const { data } = await api.get(`/admin/notifications/messages/${requestId}`)
  return data.result
}

export async function listMessageRecipients(params: { search?: string; role?: string; page?: number; limit?: number }): Promise<{ users: AssistanceUser[]; pagination: Pagination }> {
  const { data } = await api.get('/admin/notifications/recipients', { params })
  return data
}
