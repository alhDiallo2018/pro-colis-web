import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Icon } from '@/ds'
import * as messagesApi from '@/lib/api/messages'
import type { ChatMessage } from '@/lib/api/messages'
import { uploadChatAudio } from '@/lib/api/uploads'
import { useAuthStore } from '@/store/auth'

function fmtTime(iso?: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function fmtDuration(ms: number) {
  const t = Math.round(ms / 1000)
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`
}

interface Props {
  peerId: string
  peerName: string
  parcelId?: string
}

export function NegotiationChat({ peerId, peerName, parcelId }: Props) {
  const userId = useAuthStore((s) => s.user?.id)
  const qc = useQueryClient()
  const key = ['messages', 'thread', peerId, parcelId ?? null]

  const thread = useQuery({
    queryKey: key,
    queryFn: () => messagesApi.thread(peerId, parcelId),
    refetchInterval: 4000,
  })
  const messages = thread.data ?? []

  const send = useMutation({
    mutationFn: (payload: { body?: string; audioUrl?: string }) =>
      messagesApi.send({ receiverId: peerId, parcelId, ...payload }),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  const [text, setText] = useState('')
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

  // --- voice message recording ---
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [busyAudio, setBusyAudio] = useState(false)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startedRef = useRef(0)
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
      setElapsed(0)
      timerRef.current = setInterval(() => setElapsed(performance.now() - startedRef.current), 200)
    } catch {
      /* mic denied — ignore */
    }
  }
  const stopRecording = () => {
    stopTimer()
    setRecording(false)
    recorderRef.current?.stop()
  }
  const cancelRecording = () => {
    stopTimer()
    setRecording(false)
    const r = recorderRef.current
    if (r) {
      r.onstop = null // drop the upload-and-send handler so the clip is discarded
      try {
        r.stop()
        r.stream.getTracks().forEach((t) => t.stop())
      } catch {
        /* noop */
      }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'min(64vh, 480px)', width: '100%' }}>
      {/* messages */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          padding: '4px 2px',
          background: 'var(--surface-page)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        {thread.isLoading ? (
          <p style={{ margin: 'auto', color: 'var(--text-muted)', fontSize: 'var(--fs-sm)' }}>Chargement…</p>
        ) : messages.length === 0 ? (
          <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>
            <Icon name="forum" size={28} style={{ color: 'var(--text-faint)' }} />
            <p style={{ margin: '6px 0 0', fontSize: 'var(--fs-sm)' }}>
              Démarrez la négociation avec {peerName}.
            </p>
          </div>
        ) : (
          messages.map((m) => <MessageBubble key={m.id} message={m} mine={m.senderId === userId} />)
        )}
        {busyAudio && (
          <div style={{ alignSelf: 'flex-end', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', padding: '2px 6px' }}>
            Envoi du vocal…
          </div>
        )}
      </div>

      {/* input bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 10 }}>
        {recording ? (
          <>
            <button
              type="button"
              aria-label="Annuler"
              onClick={cancelRecording}
              style={iconBtn('var(--surface-sunken)', 'var(--text-muted)')}
            >
              <Icon name="close" size={20} />
            </button>
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                height: 44,
                padding: '0 14px',
                borderRadius: 999,
                background: 'var(--color-danger-soft)',
                color: 'var(--color-danger)',
                fontWeight: 600,
              }}
            >
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'currentColor' }} />
              Enregistrement… {fmtDuration(elapsed)}
            </div>
            <button type="button" aria-label="Envoyer le vocal" onClick={stopRecording} style={iconBtn('var(--teal-500)', '#fff')}>
              <Icon name="send" size={20} />
            </button>
          </>
        ) : (
          <>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendText()}
              placeholder={`Message à ${peerName}…`}
              style={{
                flex: 1,
                height: 44,
                padding: '0 16px',
                borderRadius: 999,
                border: '1px solid var(--border-default)',
                background: 'var(--surface-card)',
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--fs-body)',
                color: 'var(--text-strong)',
                outline: 'none',
              }}
            />
            {text.trim() ? (
              <button type="button" aria-label="Envoyer" onClick={sendText} style={iconBtn('var(--teal-500)', '#fff')}>
                <Icon name="send" size={20} />
              </button>
            ) : (
              <button
                type="button"
                aria-label="Message vocal"
                disabled={busyAudio}
                onClick={startRecording}
                style={iconBtn('var(--teal-500)', '#fff')}
              >
                <Icon name="mic" size={22} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function MessageBubble({ message, mine }: { message: ChatMessage; mine: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
      <div
        style={{
          maxWidth: '78%',
          padding: message.audioUrl && !message.body ? 6 : '8px 12px',
          borderRadius: 14,
          borderBottomRightRadius: mine ? 4 : 14,
          borderBottomLeftRadius: mine ? 14 : 4,
          background: mine ? 'var(--teal-500)' : 'var(--surface-card)',
          color: mine ? '#fff' : 'var(--text-body)',
          border: mine ? 'none' : '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        {message.body && <div style={{ fontSize: 'var(--fs-sm)', whiteSpace: 'pre-wrap' }}>{message.body}</div>}
        {message.audioUrl && (
          <audio controls src={message.audioUrl} style={{ height: 36, maxWidth: 220, display: 'block', marginTop: message.body ? 6 : 0 }} />
        )}
        <div
          style={{
            fontSize: 10,
            textAlign: 'right',
            marginTop: 3,
            color: mine ? 'rgba(255,255,255,0.7)' : 'var(--text-faint)',
          }}
        >
          {fmtTime(message.createdAt)}
        </div>
      </div>
    </div>
  )
}

function iconBtn(bg: string, color: string) {
  return {
    flex: 'none',
    width: 44,
    height: 44,
    borderRadius: '50%',
    border: 'none',
    background: bg,
    color,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  } as const
}
