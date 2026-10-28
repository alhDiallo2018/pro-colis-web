export const prefix = 'procolis-offline-history:'
interface Entry {
  id: string
  trackingNumber: string
  status: string
  departure: string
  arrival: string
  updatedAt?: string
  price?: number | null
}
interface Snapshot {
  savedAt: string
  entries: Entry[]
}
export function readHistory(owner: string): Snapshot | null {
  try {
    const value=JSON.parse(localStorage.getItem(prefix + owner) || 'null')
    if(!value || typeof value.savedAt!=='string' || !Array.isArray(value.entries))return null
    return {...value,entries:value.entries.filter((entry: Entry)=>entry && typeof entry.id==='string' && typeof entry.trackingNumber==='string')}
  } catch {
    return null
  }
}
