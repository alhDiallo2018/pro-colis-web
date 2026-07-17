import { useRef, useState } from 'react'
import { Avatar, Button, Icon } from '@/ds'

async function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.src = src
  })
}

async function compressImage(file: File, maxDim = 1600, quality = 0.8): Promise<string> {
  const original = await readAsDataUrl(file)
  if (!file.type.startsWith('image/')) return original
  try {
    const img = await loadImage(original)
    let { width, height } = img
    const longest = Math.max(width, height)
    if (longest > maxDim) {
      const scale = maxDim / longest
      width = Math.round(width * scale)
      height = Math.round(height * scale)
    }
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return original
    ctx.drawImage(img, 0, 0, width, height)
    return canvas.toDataURL('image/jpeg', quality)
  } catch {
    return original
  }
}

export interface ProfilePhotoCaptureProps {
  currentPhotoUrl?: string | null
  userName: string
  onChange: (dataUrl: string | null) => void
}

/**
 * Photo de profil avec capture en direct ou depuis la galerie.
 * Compression automatique (max 1600 px, JPEG 0.8).
 */
export function ProfilePhotoCapture({ currentPhotoUrl, userName, onChange }: ProfilePhotoCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [removed, setRemoved] = useState(false)

  const displayPhoto = removed ? null : (preview ?? currentPhotoUrl ?? null)

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return
    const file = files[0]
    if (!file.type.startsWith('image/')) return
    const compressed = await compressImage(file)
    setPreview(compressed)
    setRemoved(false)
    onChange(compressed)
  }

  const handleRemove = () => {
    setPreview(null)
    setRemoved(true)
    onChange(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          onFiles(e.target.files)
          e.target.value = ''
        }}
      />

      <div
        onClick={() => inputRef.current?.click()}
        style={{ cursor: 'pointer', position: 'relative' }}
        title="Modifier la photo de profil"
      >
        <Avatar name={userName} src={displayPhoto ?? undefined} size="xl" />
        <span
          style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'var(--color-primary)',
            border: '2px solid var(--surface-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <Icon name="photo_camera" size={14} color="#fff" weight={600} />
        </span>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <Button
          size="sm"
          variant="secondary"
          icon="photo_camera"
          onClick={() => inputRef.current?.click()}
        >
          {displayPhoto ? 'Modifier la photo' : 'Prendre une photo'}
        </Button>
        {(displayPhoto || preview) && (
          <Button
            size="sm"
            variant="ghost"
            icon="delete"
            onClick={handleRemove}
          >
            Supprimer
          </Button>
        )}
      </div>

      <span style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
        Format JPEG recommandé. Photo automatiquement redimensionnée.
      </span>
    </div>
  )
}
