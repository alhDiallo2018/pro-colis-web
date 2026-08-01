import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Dialog, Icon } from '@/ds'
import * as messagesApi from '@/lib/api/messages'
import * as bidsApi from '@/lib/api/bids'
import * as adsApi from '@/lib/api/advertisements'
import type { ChatMessage } from '@/lib/api/messages'
import { uploadChatAudio, uploadChatPhoto, uploadChatVideo } from '@/lib/api/uploads'
import { useAuthStore } from '@/store/auth'

const PRIX_PREFIX = '__PRIX__'

function fmtTime(iso?: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function fmtDuration(ms: number) {
  const t = Math.round(ms / 1000)
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`
}

function nf(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n)
}

interface Props {
  peerId: string
  peerName: string
  parcelId?: string
  bidId?: string
  advertisementId?: string
  offerId?: string
  parcelInfo?: {
    trackingNumber?: string
    departureCity?: string | null
    arrivalCity?: string | null
    description?: string | null
    receiverName?: string
    receiverPhone?: string
    receiverAddress?: string | null
    weight?: string | null
    type?: string
    status?: string
    photoUrls?: string[]
    videoUrls?: string[]
    audioUrls?: string[]
  }
  isOwner?: boolean
  onCreateBid?: (price: number, message?: string) => void
  onAcceptBid?: (price: number, message?: string) => void
}

export function NegotiationChat({ peerId, peerName, parcelId, bidId, advertisementId, offerId, parcelInfo, isOwner: _isOwner = false, onCreateBid, onAcceptBid }: Props) {
  const user = useAuthStore((s) => s.user)
  const userId = user?.id
  const role = user?.role
  const qc = useQueryClient()
  const key = ['messages', 'thread', peerId, parcelId ?? null]

  const thread = useQuery({
    queryKey: key,
    queryFn: () => messagesApi.thread(peerId, parcelId),
    enabled: Boolean(peerId),
    refetchInterval: 4000,
  })
  const messages = thread.data ?? []

  const send = useMutation({
    mutationFn: (payload: { body?: string; audioUrl?: string; photoUrl?: string; videoUrl?: string }) =>
      messagesApi.send({ receiverId: peerId, parcelId, ...payload }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key })
      qc.invalidateQueries({ queryKey: ['client', 'bids'] })
      qc.invalidateQueries({ queryKey: ['driver', 'bids'] })
    },
  })

  const negotiate = useMutation({
    mutationFn: (payload: { price: number; message?: string }) => {
      if (offerId && advertisementId) {
        return adsApi.negotiateOffer(advertisementId, offerId, payload) as any
      }
      if (!bidId) return Promise.resolve()
      if (role === 'driver') {
        return bidsApi.driverRespond(bidId, { action: 'counter', price: payload.price, message: payload.message })
      }
      return bidsApi.negotiate(bidId, payload)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  const acceptPrice = useMutation({
    mutationFn: async (payload: { amount: number; message?: string }) => {
      if (offerId && advertisementId) {
        return adsApi.acceptOffer(advertisementId, offerId)
      }
      if (!bidId || !parcelId) return Promise.resolve()
      if (role === 'driver') {
        return bidsApi.driverRespond(bidId, { action: 'accept', price: payload.amount, message: payload.message })
      }
      return bidsApi.accept(parcelId, bidId)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client', 'bids'] })
      qc.invalidateQueries({ queryKey: ['driver', 'bids'] })
      qc.invalidateQueries({ queryKey: ['client', 'parcels'] })
      qc.invalidateQueries({ queryKey: ['parcels', 'free'] })
    },
  })

  const [text, setText] = useState('')
  const [showPrice, setShowPrice] = useState(false)
  const [priceVal, setPriceVal] = useState('')
  const [showParcelDetail, setShowParcelDetail] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTo({ top: el.scrollHeight })
  }, [messages.length])

  const sendText = () => {
    const body = text.trim()
    if (!body || send.isPending) return
    setText('')
    send.mutate({ body })
  }

  const sendPrice = () => {
    const amount = Number(priceVal)
    if (!amount || amount <= 0 || send.isPending) return
    const msg = text.trim()

    if (!bidId && !offerId && onCreateBid) {
      onCreateBid(amount, msg || undefined)
    } else if ((bidId || offerId) && negotiate) {
      negotiate.mutate({ price: amount, message: msg || undefined })
    }

    const body = `${PRIX_PREFIX}:${amount}${msg ? `:${msg}` : ''}`
    setText('')
    setPriceVal('')
    setShowPrice(false)
    send.mutate({ body })
  }

  // --- voice message recording ---
  const [recording, setRecording] = useState(false)
  const [paused, setPaused] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [busyAudio, setBusyAudio] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const [busyMedia, setBusyMedia] = useState(false)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startedRef = useRef(0)
  const pausedAtRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
  }
  useEffect(() => stopTimer, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data)
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        setBusyAudio(true)
        try {
          const url = await uploadChatAudio(blob)
          await send.mutateAsync({ audioUrl: url })
        } finally {
          setBusyAudio(false)
        }
      }
      recorderRef.current = recorder
      startedRef.current = performance.now()
      recorder.start()
      setRecording(true)
      setPaused(false)
      setElapsed(0)
      timerRef.current = setInterval(() => setElapsed(performance.now() - startedRef.current), 200)
    } catch {
      /* mic denied */
    }
  }
  const stopRecording = () => {
    stopTimer()
    setRecording(false)
    setPaused(false)
    recorderRef.current?.stop()
  }
  const pauseRecording = () => {
    stopTimer()
    pausedAtRef.current = performance.now()
    recorderRef.current?.pause()
    setPaused(true)
  }
  const resumeRecording = () => {
    startedRef.current += performance.now() - pausedAtRef.current
    recorderRef.current?.resume()
    setPaused(false)
    setElapsed(performance.now() - startedRef.current)
    timerRef.current = setInterval(() => setElapsed(performance.now() - startedRef.current), 200)
  }
  const cancelRecording = () => {
    stopTimer()
    setRecording(false)
    setPaused(false)
    const r = recorderRef.current
    if (r) {
      r.onstop = null
      try {
        r.stop()
        r.stream.getTracks().forEach((t) => t.stop())
      } catch { /* noop */ }
    }
  }

  const handlePhotoPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBusyMedia(true)
    try {
      const url = await uploadChatPhoto(file)
      await send.mutateAsync({ photoUrl: url })
    } finally {
      setBusyMedia(false)
      if (photoInputRef.current) photoInputRef.current.value = ''
    }
  }

  const handleVideoPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBusyMedia(true)
    try {
      const url = await uploadChatVideo(file)
      await send.mutateAsync({ videoUrl: url })
    } finally {
      setBusyMedia(false)
      if (videoInputRef.current) videoInputRef.current.value = ''
    }
  }

  const handleAcceptPrice = (amount: number) => {
    if (acceptPrice.isPending) return

    if (onAcceptBid) {
      onAcceptBid(amount, `Prix accept\u00e9: ${nf(amount)} FCFA`)
      send.mutate({ body: `J'accepte le prix de ${nf(amount)} FCFA.` })
      return
    }

    if (!bidId && !offerId) {
      send.mutate({ body: `J'accepte le prix de ${nf(amount)} FCFA.` })
      return
    }

    if (offerId && advertisementId) {
      acceptPrice.mutate(
        { amount, message: `Prix accept\u00e9: ${nf(amount)} FCFA` },
        { onSuccess: () => send.mutate({ body: `J'accepte le prix de ${nf(amount)} FCFA.` }) },
      )
      return
    }

    if (!bidId || !parcelId) return

    const msg = `Prix accept\u00e9: ${nf(amount)} FCFA`
    acceptPrice.mutate(
      { amount, message: msg },
      { onSuccess: () => send.mutate({ body: `J'accepte le prix de ${nf(amount)} FCFA.` }) },
    )
  }

  const handleCounterPrice = (amount: number) => {
    setShowPrice(true)
    setPriceVal('')
    setText(`Contre-proposition a ${nf(amount)} FCFA : `)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 360 }}>
      {/* Parcel info header */}
      {parcelInfo && (parcelInfo.trackingNumber || parcelInfo.departureCity) && (
        <div style={{
          background: 'var(--slate-50)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 14px',
          marginBottom: 8,
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontSize: 'var(--fs-xs)',
          flexWrap: 'wrap',
          cursor: 'pointer',
        }}
        onClick={() => setShowParcelDetail(true)}
        title="Cliquer pour voir les details du colis"
        >
          {parcelInfo.trackingNumber && (
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--teal-600)', background: 'var(--teal-50)', padding: '3px 8px', borderRadius: 'var(--radius-pill)' }}>
              {parcelInfo.trackingNumber}
            </span>
          )}
          {(parcelInfo.departureCity || parcelInfo.arrivalCity) && (
            <span style={{ color: 'var(--text-body)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 14, color: 'var(--text-faint)' }}>location_on</span>
              {parcelInfo.departureCity ?? '-'}
              {parcelInfo.departureCity && parcelInfo.arrivalCity && (
                <span className="material-symbols-rounded" style={{ fontSize: 14, color: 'var(--text-faint)' }}>arrow_right_alt</span>
              )}
              {parcelInfo.arrivalCity ?? '-'}
            </span>
          )}
          {parcelInfo.receiverName && (
            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 14 }}>person</span>
              {parcelInfo.receiverName}
            </span>
          )}
          <span className="material-symbols-rounded" style={{ fontSize: 16, color: 'var(--text-link)', marginLeft: 'auto' }}>info</span>
        </div>
      )}

      {/* messages list */}
      <div
        ref={scrollRef}
        style={{
          flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8,
          padding: '4px 2px', background: 'var(--surface-page)', borderRadius: 'var(--radius-md)',
        }}
      >
        {thread.isLoading ? (
          <p style={{ margin: 'auto', color: 'var(--text-muted)', fontSize: 'var(--fs-sm)' }}>Chargement...</p>
        ) : messages.length === 0 ? (
          <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>
            <Icon name="forum" size={28} style={{ color: 'var(--text-faint)' }} />
            <p style={{ margin: '6px 0 0', fontSize: 'var(--fs-sm)' }}>
              Demarrez la negociation avec {peerName}.
            </p>
          </div>
        ) : (
          (() => {
            const lastNonMinePriceIdx = [...messages].reverse().findIndex(
              (m) => m.senderId !== userId && m.body.startsWith(PRIX_PREFIX)
            )
            const lastNonMinePriceId = lastNonMinePriceIdx >= 0
              ? messages[messages.length - 1 - lastNonMinePriceIdx]?.id
              : null

            return messages.map((m) => (
              <MessageBubble
                key={m.id}
                message={m}
                mine={m.senderId === userId}
                isOwner={_isOwner}
                isLastNonMinePrice={m.id === lastNonMinePriceId}
                onAcceptPrice={(amount) => handleAcceptPrice(amount)}
                onCounterPrice={(amount) => handleCounterPrice(amount)}
              />
            ))
          })()
        )}
        {busyAudio && (
          <div style={{ alignSelf: 'flex-end', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', padding: '2px 6px' }}>
            Envoi du vocal...
          </div>
        )}
      </div>

      {/* price input row */}
      {showPrice && (
        <div style={{ display: 'flex', gap: 8, paddingTop: 8, alignItems: 'center' }}>
          <input
            type="number" inputMode="numeric" placeholder="Montant FCFA"
            value={priceVal}
            onChange={(e) => setPriceVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendPrice()}
            style={{
              flex: 1, height: 40, padding: '0 14px', borderRadius: 999, border: '1px solid var(--amber-400)',
              background: 'var(--amber-50)', fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-body)',
              fontWeight: 600, color: 'var(--text-strong)', outline: 'none', maxWidth: 180,
            }}
          />
          <div style={{ flex: 1, fontSize: 'var(--fs-xs)', color: 'var(--text-faint)' }}>
            {priceVal ? `${nf(Number(priceVal))} FCFA` : 'Saisissez un montant'}
          </div>
          <button type="button" onClick={sendPrice} disabled={!priceVal || Number(priceVal) <= 0} style={iconBtn('var(--amber-500)', '#fff')}>
            <Icon name="send" size={18} />
          </button>
        </div>
      )}

      {/* input bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 10 }}>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handlePhotoPick}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          style={{ display: 'none' }}
          onChange={handleVideoPick}
        />
        {recording ? (
          <>
            <button type="button" aria-label="Annuler" onClick={cancelRecording} style={iconBtn('var(--surface-sunken)', 'var(--text-muted)')}>
              <Icon name="close" size={20} />
            </button>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 8, height: 44, padding: '0 14px',
              borderRadius: 999, background: paused ? 'var(--amber-50)' : 'var(--color-danger-soft)',
              color: paused ? 'var(--amber-500)' : 'var(--color-danger)', fontWeight: 600,
            }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'currentColor' }} />
              {paused ? 'En pause' : 'Enregistrement...'} {fmtDuration(elapsed)}
            </div>
            {paused ? (
              <button type="button" aria-label="Reprendre l'enregistrement" onClick={resumeRecording} style={iconBtn('var(--teal-500)', '#fff')}>
                <Icon name="play_arrow" size={20} />
              </button>
            ) : (
              <button type="button" aria-label="Mettre en pause" onClick={pauseRecording} style={iconBtn('var(--amber-500)', '#fff')}>
                <Icon name="pause" size={20} />
              </button>
            )}
            <button type="button" aria-label="Envoyer le vocal" onClick={stopRecording} style={iconBtn('var(--teal-500)', '#fff')}>
              <Icon name="send" size={20} />
            </button>
          </>
        ) : (
          <>
            <button type="button" aria-label="Proposer un prix" title="Proposer un prix"
              onClick={() => setShowPrice(!showPrice)}
              style={iconBtn(showPrice ? 'var(--amber-500)' : 'var(--surface-sunken)', showPrice ? '#fff' : 'var(--text-muted)')}>
              <Icon name="payments" size={20} />
            </button>
            <button
              type="button"
              aria-label="Envoyer une photo"
              title="Envoyer une photo"
              disabled={busyMedia || send.isPending}
              onClick={() => photoInputRef.current?.click()}
              style={iconBtn('var(--surface-sunken)', 'var(--text-muted)')}
            >
              <Icon name="photo_camera" size={20} />
            </button>
            <button
              type="button"
              aria-label="Envoyer une video"
              title="Envoyer une video"
              disabled={busyMedia || send.isPending}
              onClick={() => videoInputRef.current?.click()}
              style={iconBtn('var(--surface-sunken)', 'var(--text-muted)')}
            >
              <Icon name="videocam" size={20} />
            </button>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (showPrice && priceVal ? sendPrice() : sendText())}
              placeholder={`Message a ${peerName}...`}
              style={{
                flex: 1, height: 44, padding: '0 16px', borderRadius: 999, border: '1px solid var(--border-default)',
                background: 'var(--surface-card)', fontFamily: 'var(--font-body)', fontSize: 'var(--fs-body)',
                color: 'var(--text-strong)', outline: 'none',
              }}
            />
            {text.trim() ? (
              <button type="button" aria-label="Envoyer" onClick={showPrice && priceVal ? sendPrice : sendText}
                style={iconBtn(showPrice && priceVal ? 'var(--amber-500)' : 'var(--teal-500)', '#fff')}>
                <Icon name="send" size={20} />
              </button>
            ) : (
              <button type="button" aria-label="Message vocal" disabled={busyAudio} onClick={startRecording}
                style={iconBtn('var(--teal-500)', '#fff')}>
                <Icon name="mic" size={22} />
              </button>
            )}
          </>
        )}
      </div>

      {/* Parcel detail modal */}
      {showParcelDetail && parcelInfo && (
        <Dialog
          open
          onClose={() => setShowParcelDetail(false)}
          icon="package_2" iconTone="primary"
          title={parcelInfo.trackingNumber ? `Colis - ${parcelInfo.trackingNumber}` : 'Details du colis'}
          style={{ maxWidth: 460 }}
          actions={<Button variant="secondary" block onClick={() => setShowParcelDetail(false)}>Fermer</Button>}
        >
          <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {parcelInfo.description && (
              <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-body)', background: 'var(--slate-50)', padding: '10px 14px', borderRadius: 'var(--radius-md)' }}>
                {parcelInfo.description}
              </div>
            )}
            <div className="pc-field-pair" style={{ gap: '6px 16px', fontSize: 'var(--fs-sm)' }}>
              {parcelInfo.weight != null && <div><span style={{ color: 'var(--text-muted)' }}>Poids</span><br /><strong>{parcelInfo.weight} kg</strong></div>}
              {parcelInfo.type && <div><span style={{ color: 'var(--text-muted)' }}>Type</span><br /><strong>{parcelInfo.type}</strong></div>}
              {parcelInfo.status && <div><span style={{ color: 'var(--text-muted)' }}>Statut</span><br /><strong>{parcelInfo.status}</strong></div>}
              {parcelInfo.receiverName && <div><span style={{ color: 'var(--text-muted)' }}>Destinataire</span><br /><strong>{parcelInfo.receiverName}</strong></div>}
              {parcelInfo.receiverPhone && <div><span style={{ color: 'var(--text-muted)' }}>Tel</span><br /><strong style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-xs)' }}>{parcelInfo.receiverPhone}</strong></div>}
              {parcelInfo.receiverAddress && <div style={{ gridColumn: 'span 2' }}><span style={{ color: 'var(--text-muted)' }}>Adresse</span><br /><strong>{parcelInfo.receiverAddress}</strong></div>}
            </div>
            {(parcelInfo.photoUrls?.length ?? 0) > 0 && (
              <div>
                <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Photos ({parcelInfo.photoUrls!.length})</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {parcelInfo.photoUrls!.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img src={url} alt={`Photo ${i + 1}`} style={{ width: 72, height: 72, borderRadius: 'var(--radius-sm)', objectFit: 'cover', border: '1px solid var(--border-subtle)' }} />
                    </a>
                  ))}
                </div>
              </div>
            )}
            {(parcelInfo.audioUrls?.length ?? 0) > 0 && (
              <div>
                <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Messages vocaux</div>
                {parcelInfo.audioUrls!.map((url, i) => <audio key={i} controls src={url} style={{ width: '100%', height: 32, maxWidth: 320 }} />)}
              </div>
            )}
            {(parcelInfo.videoUrls?.length ?? 0) > 0 && (
              <div>
                <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Videos</div>
                {parcelInfo.videoUrls!.map((url, i) => <video key={i} controls src={url} style={{ width: '100%', maxWidth: 320, borderRadius: 'var(--radius-sm)' }} />)}
              </div>
            )}
          </div>
        </Dialog>
      )}
    </div>
  )
}

interface BubbleProps {
  message: ChatMessage
  mine: boolean
  isOwner?: boolean
  isLastNonMinePrice?: boolean
  onAcceptPrice?: (amount: number) => void
  onCounterPrice?: (amount: number) => void
}

function parsePriceProposal(body: string): { isPrice: boolean; amount: number; message: string } | null {
  if (!body.startsWith(PRIX_PREFIX)) return null
  const parts = body.slice(PRIX_PREFIX.length + 1).split(':')
  const amount = Number(parts[0])
  if (Number.isNaN(amount) || amount <= 0) return null
  return { isPrice: true, amount, message: parts.slice(1).join(':').trim() }
}

function MessageBubble({ message, mine, isOwner = false, isLastNonMinePrice = false, onAcceptPrice, onCounterPrice }: BubbleProps) {
  const priceData = parsePriceProposal(message.body)

  if (priceData) {
    return (
      <div style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
        <div style={{
          maxWidth: '82%', padding: 14, borderRadius: 14,
          borderBottomRightRadius: mine ? 4 : 14, borderBottomLeftRadius: mine ? 14 : 4,
          background: 'var(--amber-50)', border: '1px solid var(--amber-200)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span className="material-symbols-rounded" style={{ fontSize: 20, color: 'var(--amber-600)' }}>payments</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--amber-700)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {mine ? 'Prix propose' : 'Proposition de prix'}
            </span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 26, color: 'var(--amber-600)', letterSpacing: '-0.01em' }}>
            {nf(priceData.amount)} <span style={{ fontSize: 14, fontWeight: 600 }}>FCFA</span>
          </div>
          {priceData.message && (
            <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-body)', marginTop: 6 }}>{priceData.message}</div>
          )}
          {!mine && isOwner && isLastNonMinePrice && onAcceptPrice && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <Button size="sm" variant="secondary" onClick={() => onCounterPrice?.(priceData.amount)}>Contre-proposition</Button>
              <Button size="sm" icon="check" onClick={() => onAcceptPrice(priceData.amount)}>Accepter</Button>
            </div>
          )}
          <div style={{ fontSize: 10, textAlign: 'right', marginTop: 8, color: 'var(--amber-500)' }}>
            {fmtTime(message.createdAt)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
      <div style={{
        maxWidth: '78%', padding: (message.audioUrl && !message.body) || (message.photoUrl && !message.body) || (message.videoUrl && !message.body) ? 6 : '8px 12px',
        borderRadius: 14, borderBottomRightRadius: mine ? 4 : 14, borderBottomLeftRadius: mine ? 14 : 4,
        background: mine ? 'var(--teal-500)' : 'var(--surface-card)', color: mine ? '#fff' : 'var(--text-body)',
        border: mine ? 'none' : '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-xs)',
      }}>
        {message.body && <div style={{ fontSize: 'var(--fs-sm)', whiteSpace: 'pre-wrap' }}>{message.body}</div>}
        {message.audioUrl && (
          <audio controls src={message.audioUrl} style={{ height: 36, maxWidth: 220, display: 'block', marginTop: message.body ? 6 : 0 }} />
        )}
        {message.photoUrl && (
          <img
            src={message.photoUrl}
            alt="Photo"
            style={{ display: 'block', maxWidth: 220, maxHeight: 260, borderRadius: 8, marginTop: message.body ? 6 : 0, cursor: 'pointer' }}
            onClick={() => window.open(message.photoUrl!, '_blank')}
          />
        )}
        {message.videoUrl && (
          <video controls src={message.videoUrl} style={{ display: 'block', maxWidth: 220, maxHeight: 260, borderRadius: 8, marginTop: message.body ? 6 : 0 }} />
        )}
        <div style={{ fontSize: 10, textAlign: 'right', marginTop: 3, color: mine ? 'rgba(255,255,255,0.7)' : 'var(--text-faint)' }}>
          {fmtTime(message.createdAt)}
        </div>
      </div>
    </div>
  )
}

function iconBtn(bg: string, color: string) {
  return {
    flex: 'none', width: 40, height: 40, borderRadius: '50%', border: 'none',
    background: bg, color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  } as const
}
