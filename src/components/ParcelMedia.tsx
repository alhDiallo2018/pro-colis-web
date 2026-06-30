import type { Parcel } from '@/lib/api/types'

interface ParcelMediaProps {
  parcel: Pick<Parcel, 'photoUrls' | 'videoUrls' | 'audioUrls'>
  /** Thumbnail edge size in px. */
  size?: number
}

/**
 * Renders a parcel's attached photos, videos and voice notes.
 * Returns null when nothing is attached, so callers can drop it in freely.
 */
export function ParcelMedia({ parcel, size = 96 }: ParcelMediaProps) {
  const photos = parcel.photoUrls ?? []
  const videos = parcel.videoUrls ?? []
  const audios = parcel.audioUrls ?? []
  if (!photos.length && !videos.length && !audios.length) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {(photos.length > 0 || videos.length > 0) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {photos.map((url) => (
            <a key={url} href={url} target="_blank" rel="noreferrer" style={{ display: 'block', lineHeight: 0 }}>
              <img
                src={url}
                alt="Photo du colis"
                loading="lazy"
                style={{
                  width: size,
                  height: size,
                  objectFit: 'cover',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--surface-sunken)',
                }}
              />
            </a>
          ))}
          {videos.map((url) => (
            <video
              key={url}
              src={url}
              controls
              style={{
                width: size,
                height: size,
                objectFit: 'cover',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                background: '#000',
              }}
            />
          ))}
        </div>
      )}
      {audios.map((url) => (
        <audio key={url} controls src={url} style={{ width: '100%', maxWidth: 360, height: 40 }} />
      ))}
    </div>
  )
}
