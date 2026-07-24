import { useState, useEffect, useRef } from 'react'
import { Card, Badge, Toast } from '@/ds'
import { useAuthStore } from '@/store/auth'

const DOC_TYPES = [
  { type: 'driver_license', label: 'Permis de conduire', icon: 'badge' },
  { type: 'vehicle_registration', label: 'Carte grise', icon: 'article' },
  { type: 'insurance', label: 'Assurance', icon: 'verified_user' },
  { type: 'id_card', label: "Pièce d'identité (CNI)", icon: 'perm_identity' },
]

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1'

function resolveUrl(url: string): string {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${API_BASE.replace(/\/api\/v1$/, '')}${url}`
}

export function VehicleDocumentsScreen() {
  const isVerified = useAuthStore((s) => s.user?.isVerified)
  const [loading, setLoading] = useState(true)
  const [vehiclePhotos, setVehiclePhotos] = useState<string[]>([])
  const [docUrls, setDocUrls] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState<Set<string>>(new Set())
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingSlot, setPendingSlot] = useState<{ docType: string; side: string } | null>(null)

  useEffect(() => {
    loadIdentity()
  }, [])

  const loadIdentity = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('sendprocolis-auth')
        ? JSON.parse((localStorage.getItem('sendprocolis-auth') ?? '{}')).state?.accessToken
        : null
      if (!token) {
        setLoading(false)
        return
      }

      const res = await fetch(`${API_BASE}/identity/status`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed')

      const data = await res.json()
      const identity = data.identity
      if (identity?.documents && Array.isArray(identity.documents)) {
        const photos: string[] = []
        const docs: Record<string, string> = {}
        for (const d of identity.documents) {
          const type = d.documentType
          const side = d.side
          const url = d.url
          if (!type || !url) continue
          if (type === 'vehicle_photo') {
            photos.push(url)
          } else if (side) {
            docs[`${type}_${side}`] = url
          }
        }
        setVehiclePhotos(photos)
        setDocUrls(docs)
      }

      const vehRes = await fetch(`${API_BASE}/driver/vehicle`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (vehRes.ok) {
        const vehData = await vehRes.json()
        setVehicle(vehData.vehicle)
      }
    } catch {
      // Non-fatal
    } finally {
      setLoading(false)
    }
  }

  const [vehicle, setVehicle] = useState<Record<string, unknown> | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const token = JSON.parse(localStorage.getItem('sendprocolis-auth') ?? '{}')?.state?.accessToken
      const formData = new FormData()
      formData.append('file', file)
      formData.append('mediaType', 'photo')
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await res.json()
      return data.url ?? data.data?.url ?? null
    } catch {
      return null
    }
  }

  const persistDoc = async (documentType: string, side: string, url: string) => {
    try {
      const token = JSON.parse(localStorage.getItem('sendprocolis-auth') ?? '{}')?.state?.accessToken
      await fetch(`${API_BASE}/identity/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentType, side, url }),
      })
    } catch {
      // Non-fatal
    }
  }

  const handleFileSelected = async (file: File) => {
    if (!pendingSlot) return
    const slotKey = `${pendingSlot.docType}_${pendingSlot.side}`
    setUploading((s) => new Set(s).add(slotKey))
    setPendingSlot(null)

    const url = await uploadFile(file)
    if (url) {
      await persistDoc(pendingSlot.docType, pendingSlot.side, url)
      if (pendingSlot.docType === 'vehicle_photo') {
        setVehiclePhotos((p) => [...p, url])
      } else {
        setDocUrls((p) => ({ ...p, [slotKey]: url }))
      }
    } else {
      showToast('Échec du téléversement')
    }
    setUploading((s) => {
      const next = new Set(s)
      next.delete(slotKey)
      return next
    })
  }

  const triggerUpload = (docType: string, side: string) => {
    setPendingSlot({ docType, side })
    fileInputRef.current?.click()
  }

  const triggerVehiclePhotoUpload = () => {
    setPendingSlot({ docType: 'vehicle_photo', side: 'front' })
    fileInputRef.current?.click()
  }

  const isDocComplete = (docType: string) =>
    docUrls[`${docType}_front`] && docUrls[`${docType}_back`]

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Chargement...</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 'var(--radius-md)',
        background: isVerified ? 'var(--green-50)' : 'var(--amber-50)',
        border: `1px solid ${isVerified ? 'var(--green-200)' : 'var(--amber-200)'}`,
        color: isVerified ? 'var(--green-700)' : 'var(--amber-700)',
      }}>
        <span className="material-symbols-rounded" style={{ fontSize: 22 }}>
          {isVerified ? 'verified' : 'gpp_maybe'}
        </span>
        <div style={{ fontSize: 13.5, fontWeight: 600 }}>
          {isVerified
            ? 'Identité vérifiée — vous pouvez enchérir et publier des annonces.'
            : 'Identité non vérifiée. Envoyez vos documents ci-dessous : un administrateur les validera.'}
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFileSelected(file)
          e.target.value = ''
        }}
      />

      {toastMessage && <Toast tone="warning" message={toastMessage} />}

      <div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--text-strong)', margin: '0 0 10px' }}>
          Véhicule
        </h3>
        <Card padding="lg">
          {vehicle ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--teal-50)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span className="material-symbols-rounded" style={{ color: 'var(--color-primary)' }}>
                    directions_car
                  </span>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: 'var(--text-strong)' }}>
                    {String(vehicle.model ?? 'Véhicule')}
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                    {String(vehicle.type ?? 'Type non renseigné')}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>Plaque</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-strong)' }}>{String(vehicle.plateNumber ?? 'Non renseignée')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>Capacité</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-strong)' }}>{String(vehicle.capacity ?? 'Non renseignée')}</span>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 16, color: 'var(--text-muted)' }}>
              Renseignez votre véhicule dans les Paramètres.
            </div>
          )}
        </Card>
      </div>

      <div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--text-strong)', margin: '0 0 10px' }}>
          Photos du véhicule
        </h3>
        <Card padding="lg">
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {vehiclePhotos.map((url, i) => (
              <div key={i} style={{ width: 96, height: 96, borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                <img src={resolveUrl(url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
            <button
              type="button"
              onClick={triggerVehiclePhotoUpload}
              style={{
                width: 96,
                height: 96,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                background: 'var(--teal-50)',
                border: '1px dashed var(--teal-200)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
              }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 24, color: 'var(--color-primary)' }}>add_a_photo</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-primary)' }}>Ajouter</span>
            </button>
          </div>
        </Card>
      </div>

      <div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--text-strong)', margin: '0 0 10px' }}>
          Documents officiels
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {DOC_TYPES.map((doc) => (
            <Card key={doc.type} padding="lg">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--teal-50)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 20, color: 'var(--color-primary)' }}>{doc.icon}</span>
                </div>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14.5, color: 'var(--text-strong)', flex: 1 }}>
                  {doc.label}
                </span>
                {isDocComplete(doc.type) && <Badge tone="green">Complet</Badge>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {(['front', 'back'] as const).map((side) => {
                  const slotKey = `${doc.type}_${side}`
                  const url = docUrls[slotKey]
                  const isUploading = uploading.has(slotKey)
                  return (
                    <div key={side}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--slate-500)' }}>
                          {side === 'front' ? 'Recto' : 'Verso'}
                        </span>
                        {url && (
                          <span className="material-symbols-rounded" style={{ fontSize: 16, color: 'var(--green-500)' }}>check_circle</span>
                        )}
                      </div>
                      {isUploading ? (
                        <div
                          style={{
                            height: 96,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'var(--surface-sunken)',
                            border: '1px solid var(--border-default)',
                            borderRadius: 'var(--radius-md)',
                          }}
                        >
                          <div style={{ width: 22, height: 22, border: '2px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                        </div>
                      ) : url ? (
                        <div style={{ position: 'relative' }}>
                          <img
                            src={resolveUrl(url)}
                            alt=""
                            style={{
                              width: '100%',
                              height: 96,
                              objectFit: 'cover',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--border-subtle)',
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => triggerUpload(doc.type, side)}
                            style={{
                              position: 'absolute',
                              right: 6,
                              bottom: 6,
                              background: 'rgba(0,0,0,0.55)',
                              borderRadius: '50%',
                              border: 'none',
                              color: '#fff',
                              width: 28,
                              height: 28,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                            }}
                          >
                            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>refresh</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => triggerUpload(doc.type, side)}
                          style={{
                            width: '100%',
                            height: 96,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                            background: 'var(--surface-sunken)',
                            border: '1px solid var(--border-default)',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                          }}
                        >
                          <span className="material-symbols-rounded" style={{ fontSize: 26, color: 'var(--text-faint)' }}>add_photo_alternate</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Ajouter</span>
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>
          ))}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
