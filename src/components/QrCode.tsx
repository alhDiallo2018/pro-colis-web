import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'

interface QrCodeProps {
  /** Contenu encodé (URL de suivi, code de livraison…). */
  value: string
  size?: number
  /** Légende affichée sous le code. */
  caption?: string
}

/** QR code rendu en canvas — même usage que QrImageView côté mobile. */
export function QrCode({ value, size = 180, caption }: QrCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || !value) return
    QRCode.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 1,
      errorCorrectionLevel: 'L',
      color: { dark: '#111717', light: '#FFFFFF' },
    }).catch(() => {})
  }, [value, size])

  if (!value) return null

  return (
    <figure style={{ margin: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <canvas
        ref={canvasRef}
        style={{
          width: size,
          height: size,
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          background: '#fff',
          padding: 8,
          boxSizing: 'content-box',
        }}
      />
      {caption && (
        <figcaption style={{ fontSize: 12, color: 'var(--text-muted)' }}>{caption}</figcaption>
      )}
    </figure>
  )
}
