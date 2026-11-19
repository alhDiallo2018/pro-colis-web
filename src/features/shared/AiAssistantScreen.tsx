import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Icon, Textarea } from '@/ds'
import { Panel } from '@/components/Panel'
import { uploadChatAudio } from '@/lib/api/uploads'
import {
  askAssistant,
  isAssistantConfigured,
  transcribeAudio,
  type AiAssistantResult,
} from '@/lib/api/ai-assistant'
import { saveAiParcelDraft } from './aiDraftStore'

interface ChatMessage {
  fromUser: boolean
  text: string
}

/**
 * Parité mobile `lib/screens/shared/ai_assistant_screen.dart` : chat
 * vertical simple + enregistrement vocal. Si l'intention détectée est
 * `create_parcel`, le draft est stocké en `sessionStorage` et l'utilisateur
 * est redirigé vers le wizard qui le consomme à l'ouverture.
 */
export function AiAssistantScreen() {
  const navigate = useNavigate()

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      fromUser: false,
      text:
        "Bonjour 👋 Je suis l'assistant SendProColis. Décrivez ce que vous voulez envoyer : par exemple « Envoie un carton 5 kg de Dakar à Thiès demain ».",
    },
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [lastResult, setLastResult] = useState<AiAssistantResult | null>(null)
  const [configured, setConfigured] = useState<boolean | null>(null)

  // Voix
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const [recordSeconds, setRecordSeconds] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => {
      const el = scrollRef.current
      if (el) el.scrollTop = el.scrollHeight
    })
  }, [])

  useEffect(() => {
    let active = true
    isAssistantConfigured().then((ok) => {
      if (active) setConfigured(ok)
    })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || sending) return
    setMessages((prev) => [...prev, { fromUser: true, text }])
    setInput('')
    setSending(true)
    scrollToEnd()
    const result = await askAssistant(text)
    setMessages((prev) => [...prev, { fromUser: false, text: result.answerText }])
    setLastResult(result)
    setSending(false)
    scrollToEnd()
  }, [input, sending, scrollToEnd])

  const startRecording = useCallback(async () => {
    if (recording || transcribing || sending) return
    setVoiceError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        streamRef.current = null
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setTranscribing(true)
        try {
          const url = await uploadChatAudio(blob, `ai-voice-${Date.now()}.webm`)
          if (!url) {
            setVoiceError("Transcription indisponible.")
            return
          }
          const text = await transcribeAudio(url)
          if (text) {
            setInput((prev) => (prev ? `${prev} ${text}` : text))
          } else {
            setVoiceError("Transcription indisponible pour le moment.")
          }
        } catch {
          setVoiceError("Transcription indisponible.")
        } finally {
          setTranscribing(false)
        }
      }
      mediaRecorderRef.current = recorder
      recorder.start()
      setRecording(true)
      setRecordSeconds(0)
      timerRef.current = setInterval(() => {
        setRecordSeconds((s) => s + 1)
      }, 1000)
    } catch {
      setVoiceError("Microphone refusé ou indisponible.")
    }
  }, [recording, transcribing, sending])

  const stopRecording = useCallback(() => {
    if (!recording) return
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    mediaRecorderRef.current?.stop()
    setRecording(false)
  }, [recording])

  const applyDraft = useCallback(() => {
    const draft = lastResult?.draft
    if (!draft) return
    saveAiParcelDraft(draft)
    navigate(`/client/nouveau?from=ai`)
  }, [lastResult, navigate])

  const trackTracking = useCallback(() => {
    const t = lastResult?.trackingNumber
    if (!t) return
    navigate(`/client/suivi?tracking=${encodeURIComponent(t)}`)
  }, [lastResult, navigate])

  const showDraftAction = lastResult?.intent === 'create_parcel' && !!lastResult?.draft
  const showTrackAction = lastResult?.intent === 'track_parcel' && !!lastResult?.trackingNumber
  const disabledOverlay = configured === false

  const formatDuration = (seconds: number) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0')
    const s = String(seconds % 60).padStart(2, '0')
    return `${m}:${s}`
  }

  return (
    <div className="cm-detail-page" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="cm-page-head">
        <div className="cm-page-head-body">
          <h1>Assistant IA</h1>
          <p className="cm-page-head-sub">
            Décrivez votre envoi en langage naturel ou enregistrez un message vocal — l'assistant pré-remplit le formulaire pour vous.
          </p>
        </div>
      </div>

      {disabledOverlay && (
        <div
          role="status"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 14px',
            background: 'var(--amber-50)',
            border: '1px solid var(--amber-200)',
            borderRadius: 'var(--radius-md)',
            fontSize: 13.5,
            color: 'var(--amber-700)',
          }}
        >
          <Icon name="info" size={18} />
          <span>
            L'assistant est désactivé côté serveur. Vous pouvez continuer à écrire — la réponse sera une orientation par défaut.
          </span>
        </div>
      )}

      <Panel title="Conversation" flush>
        <div
          ref={scrollRef}
          style={{
            minHeight: 320,
            maxHeight: 'min(520px, 60vh)',
            overflowY: 'auto',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {messages.map((m, idx) => (
            <ChatBubble key={idx} message={m} />
          ))}
        </div>

        {voiceError && (
          <div
            style={{
              padding: '6px 16px 0',
              fontSize: 12.5,
              color: 'var(--red-600)',
            }}
          >
            {voiceError}
          </div>
        )}

        {(showDraftAction || showTrackAction) && (
          <div style={{ padding: '8px 16px 0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {showDraftAction && (
              <Button icon="auto_awesome" onClick={applyDraft}>
                Pré-remplir le formulaire
              </Button>
            )}
            {showTrackAction && (
              <Button variant="secondary" icon="qr_code_2" onClick={trackTracking}>
                Suivre {lastResult?.trackingNumber}
              </Button>
            )}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 8,
            padding: 12,
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <Button
            variant={recording ? 'secondary' : 'ghost'}
            icon={recording ? 'stop_circle' : 'mic'}
            onClick={recording ? stopRecording : startRecording}
            disabled={sending || transcribing}
            aria-label={recording ? 'Arrêter l’enregistrement' : 'Enregistrer un message vocal'}
            type="button"
          >
            {recording ? formatDuration(recordSeconds) : ''}
          </Button>
          <div style={{ flex: 1 }}>
            {recording ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--red-50)',
                  color: 'var(--red-600)',
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: 'var(--red-500)',
                    animation: 'pulse 1s ease-in-out infinite',
                  }}
                />
                Enregistrement… {formatDuration(recordSeconds)}
              </div>
            ) : (
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={transcribing ? 'Transcription…' : 'Tapez votre demande…'}
                disabled={sending || transcribing}
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send()
                  }
                }}
              />
            )}
          </div>
          <Button
            icon={sending ? 'hourglass_empty' : 'send'}
            onClick={send}
            disabled={sending || recording || transcribing || !input.trim()}
            aria-label="Envoyer"
            type="button"
          >
            Envoyer
          </Button>
        </div>
      </Panel>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  )
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const alignSelf = message.fromUser ? 'flex-end' : 'flex-start'
  const bg = message.fromUser ? 'var(--color-primary)' : 'var(--surface-raised)'
  const color = message.fromUser ? '#fff' : 'var(--text-strong)'
  const border = message.fromUser ? 'none' : '1px solid var(--border-subtle)'
  return (
    <div
      style={{
        alignSelf,
        maxWidth: '82%',
        padding: '10px 12px',
        borderRadius: 14,
        background: bg,
        color,
        border,
        whiteSpace: 'pre-wrap',
        fontSize: 14,
        lineHeight: 1.45,
      }}
    >
      {message.text}
    </div>
  )
}

