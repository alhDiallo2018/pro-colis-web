import { api } from './client'

type MediaKind = 'photo' | 'video' | 'audio'

/**
 * Upload a file as multipart/form-data and attach it to a parcel.
 * Multipart avoids the ~33% base64 inflation, so large photos/audio stay
 * well within limits. Accepts a Blob or a data-URL string (converted to a Blob).
 */
async function uploadParcelMedia(kind: MediaKind, file: Blob | string, filename: string, parcelId: string): Promise<string> {
  const blob = typeof file === 'string' ? await (await fetch(file)).blob() : file
  const form = new FormData()
  form.append('file', blob, filename)
  form.append('mediaType', kind)
  form.append('parcelId', parcelId)
  const { data } = await api.post('/upload', form)
  return data.url as string
}

export const uploadParcelPhoto = (file: Blob | string, filename: string, parcelId: string) =>
  uploadParcelMedia('photo', file, filename, parcelId)

export const uploadParcelVideo = (file: Blob | string, filename: string, parcelId: string) =>
  uploadParcelMedia('video', file, filename, parcelId)

export const uploadParcelAudio = (file: Blob | string, filename: string, parcelId: string) =>
  uploadParcelMedia('audio', file, filename, parcelId)

/** Upload a standalone audio clip (e.g. a chat voice message); returns its URL. */
export async function uploadChatAudio(file: Blob | string, filename = 'message.webm'): Promise<string> {
  const blob = typeof file === 'string' ? await (await fetch(file)).blob() : file
  const form = new FormData()
  form.append('file', blob, filename)
  form.append('mediaType', 'audio')
  const { data } = await api.post('/upload', form)
  return data.url as string
}

/**
 * Upload a user profile photo. Accepts a Blob or a data-URL string.
 * Compress before calling for best results (max ~1600 px, JPEG @ 0.8).
 * Returns the uploaded file URL.
 */
export async function uploadProfilePhoto(file: Blob | string, filename = 'profile.jpg'): Promise<string> {
  const blob = typeof file === 'string' ? await (await fetch(file)).blob() : file
  const form = new FormData()
  form.append('file', blob, filename)
  form.append('mediaType', 'photo')
  const { data } = await api.post('/upload', form)
  return data.url as string
}
