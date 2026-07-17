import { useState, useRef, useCallback } from 'react'
import { Button } from '@/ds'
import { ApiError } from '@/lib/api/client'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1'

export interface VoiceRecorderProps {
  onUploaded: (url: string) => void
  existingUrl?: string | null
}

export function VoiceRecorder({ onUploaded, existingUrl }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [url, setUrl] = useState<string | null>(existingUrl ?? null)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const startRecording = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        stream.getTracks().forEach((t) => t.stop())
        await uploadAudio(blob)
      }
      mediaRecorderRef.current = recorder
      recorder.start()
      setRecording(true)
    } catch {
      setError("Accès au microphone refusé ou non disponible.")
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop()
      setRecording(false)
    }
  }, [recording])

  const uploadAudio = async (blob: Blob) => {
    setUploading(true)
    try {
      const token = JSON.parse(localStorage.getItem('sendprocolis-auth') ?? '{}')?.state?.accessToken
      const formData = new FormData()
      formData.append('file', blob, 'voice-note.webm')
      formData.append('mediaType', 'audio')

      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      if (!res.ok) throw new Error('Upload failed')

      const data = await res.json()
      const uploadedUrl: string = data.url ?? data.data?.url ?? ''
      if (uploadedUrl) {
        setUrl(uploadedUrl)
        onUploaded(uploadedUrl)
      } else {
        setError('Échec du téléversement audio.')
      }
    } catch {
      setError('Téléversement impossible.')
    } finally {
      setUploading(false)
    }
  }

  const togglePlay = useCallback(() => {
    if (!url) return
    if (playing) {
      audioRef.current?.pause()
      setPlaying(false)
      return
    }
    if (!audioRef.current) {
      audioRef.current = new Audio(url)
      audioRef.current.onended = () => setPlaying(false)
    }
    audioRef.current.play().then(() => setPlaying(true)).catch(() => setError('Lecture audio impossible.'))
  }, [url, playing])

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {url ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          <Button
            variant="secondary"
            size="sm"
            icon={playing ? 'stop_circle' : 'play_circle'}
            onClick={togglePlay}
            type="button"
            style={{ fontSize: 12 }}
          >
            {playing ? 'Arrêter' : 'Écouter'}
          </Button>
          <span style={{ fontSize: 12, color: 'var(--green-600)', fontWeight: 600 }}>Note vocale enregistrée</span>
        </div>
      ) : uploading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text-muted)' }}>
          <div style={{ width: 16, height: 16, border: '2px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
          Téléversement...
        </div>
      ) : recording ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--red-500)', animation: 'pulse 1s ease-in-out infinite' }} />
          <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--red-500)' }}>Enregistrement...</span>
          <Button variant="secondary" size="sm" icon="stop" onClick={stopRecording} type="button" style={{ fontSize: 12 }}>
            Stop
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          icon="mic"
          onClick={startRecording}
          type="button"
          style={{ fontSize: 12 }}
        >
          Note vocale
        </Button>
      )}
      {error && (
        <span style={{ fontSize: 11.5, color: 'var(--red-500)' }}>{error}</span>
      )}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
