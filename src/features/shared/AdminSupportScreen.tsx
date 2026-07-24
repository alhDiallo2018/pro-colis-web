import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Avatar, Badge, Icon } from '@/ds'
import { Panel } from '@/components/Panel'
import * as messagesApi from '@/lib/api/messages'
import * as uploadsApi from '@/lib/api/uploads'
import type { SupportConversation, SupportThreadMessage } from '@/lib/api/messages'
import { useAuthStore } from '@/store/auth'
import { useIsMobile } from '@/lib/useMediaQuery'

function fmtTime(iso?: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function fmtDuration(ms: number) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

export function AdminSupportScreen() {
  const userId = useAuthStore((s) => s.user?.id)
  const qc = useQueryClient()
  const isMobile = useIsMobile()
  const bottomRef = useRef<HTMLDivElement>(null)

  const conversationsQuery = useQuery({
    queryKey: ['admin', 'support', 'conversations'],
    queryFn: () => messagesApi.adminSupportConversations(),
    refetchInterval: 6000,
  })

  const [selected, setSelected] = useState<SupportConversation | null>(null)
  const [text, setText] = useState('')

  const threadQuery = useQuery({
    queryKey: ['admin', 'support', 'thread', selected?.supportUser?.id, selected?.user?.id],
    queryFn: async () => {
      if (!selected) return []
      try {
        const result = await messagesApi.adminSupportThread(
          selected.supportUser.id,
          selected.user.id,
        )
        if (Array.isArray(result)) return result
        if (result && typeof result === 'object' && 'messages' in result)
          return (result as any).messages || []
        if (result && typeof result === 'object' && 'data' in result && Array.isArray((result as any).data))
          return (result as any).data
        return []
      } catch {
        return []
      }
    },
    enabled: Boolean(selected),
    refetchInterval: 4000,
  })

  const messages = (threadQuery.data ?? []) as SupportThreadMessage[]

  const sendMutation = useMutation({
    mutationFn: async (payload: { body?: string; audioUrl?: string; photoUrl?: string; videoUrl?: string }) => {
      if (!selected) return null
      return messagesApi.adminSupportReply({
        supportUserId: selected.supportUser.id,
        receiverId: selected.user.id,
        ...payload,
      })
    },
    onSuccess: () => {
      setText('')
      qc.invalidateQueries({
        queryKey: ['admin', 'support', 'thread', selected?.supportUser?.id, selected?.user?.id],
      })
      qc.invalidateQueries({ queryKey: ['admin', 'support', 'conversations'] })
    },
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const conversations = useMemo(() => {
    return (conversationsQuery.data ?? []) as SupportConversation[]
  }, [conversationsQuery.data])

  const [recording, setRecording] = useState(false)
  const [paused, setPaused] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [busyMedia, setBusyMedia] = useState(false)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startedRef = useRef(0)
  const pausedAtRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

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
        setBusyMedia(true)
        try {
          const url = await uploadsApi.uploadChatAudio(blob)
          sendMutation.mutate({ audioUrl: url })
        } finally {
          setBusyMedia(false)
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
      } catch {
        /* noop */
      }
    }
  }

  const handlePhotoPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selected) return
    setBusyMedia(true)
    try {
      const url = await uploadsApi.uploadChatPhoto(file)
      sendMutation.mutate({ photoUrl: url })
    } finally {
      setBusyMedia(false)
      if (photoInputRef.current) photoInputRef.current.value = ''
    }
  }

  const handleVideoPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selected) return
    setBusyMedia(true)
    try {
      const url = await uploadsApi.uploadChatVideo(file)
      sendMutation.mutate({ videoUrl: url })
    } finally {
      setBusyMedia(false)
      if (videoInputRef.current) videoInputRef.current.value = ''
    }
  }

  const handleSendText = () => {
    if (!text.trim() || sendMutation.isPending) return
    sendMutation.mutate({ body: text.trim() })
  }

  const showList = !isMobile || !selected
  const showChat = !isMobile || Boolean(selected)

  const outerStyle: React.CSSProperties = isMobile
    ? { height: 'calc(100dvh - 150px)', minHeight: 420, display: 'flex', flexDirection: 'column' }
    : {
        display: 'grid',
        gridTemplateColumns: '320px minmax(0,1fr)',
        gap: 0,
        height: 'calc(100vh - 160px)',
        minHeight: 480,
      }

  const isSupportMessage = (msg: SupportThreadMessage) => {
    return msg.senderId === selected?.supportUser?.id
  }

  return (
    <div style={outerStyle}>
      {showList && (
        <Panel
          flush
          style={
            isMobile
              ? { flex: 1, minHeight: 0 }
              : { borderRight: 'none', borderTopRightRadius: 0, borderBottomRightRadius: 0 }
          }
        >
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 16,
                color: 'var(--text-strong)',
              }}
            >
              Support
            </div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginTop: 2 }}>
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            </div>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {conversationsQuery.isLoading ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                Chargement...
              </div>
            ) : conversations.length === 0 ? (
              <div
                style={{
                  padding: 32,
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: 'var(--fs-sm)',
                }}
              >
                <Icon name="support_agent" size={32} style={{ color: 'var(--text-faint)', marginBottom: 8 }} />
                <p>Aucune demande de support.</p>
              </div>
            ) : (
              conversations.map((c) => (
                <div
                  key={`${c.supportUser?.id ?? 'support'}::${c.user?.id ?? 'user'}`}
                  onClick={() => setSelected(c)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border-subtle)',
                    background:
                      selected?.user?.id === c.user?.id && selected?.supportUser?.id === c.supportUser?.id
                        ? 'var(--color-primary-soft)'
                        : undefined,
                    transition: 'background 0.15s',
                  }}
                >
                  <Avatar name={c.user?.fullName ?? 'Utilisateur'} size="md" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontWeight: 600,
                          fontSize: 'var(--fs-sm)',
                          color: 'var(--text-strong)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {c.user?.fullName ?? 'Utilisateur inconnu'}
                      </span>
                      {!c.isRead && c.receiverId === c.supportUser?.id && (
                        <Badge tone="primary">!</Badge>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 'var(--fs-xs)',
                        color: 'var(--text-faint)',
                        marginTop: 1,
                      }}
                    >
                      via {c.supportUser?.fullName ?? 'Support'} · {c.messageCount ?? 0} message
                      {(c.messageCount ?? 0) !== 1 ? 's' : ''}
                    </div>
                    {c.lastAgent && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 3, fontSize: 'var(--fs-xs)', fontWeight: 600, color: 'var(--teal-600)', background: 'var(--teal-50)', padding: '1px 8px', borderRadius: 'var(--radius-pill)' }}>
                        <span className="material-symbols-rounded" style={{ fontSize: 13 }}>badge</span>
                        {c.lastAgent.fullName}
                        {(c.agents?.length ?? 0) > 1 ? ` +${(c.agents!.length - 1)}` : ''}
                      </div>
                    )}
                    <div
                      style={{
                        fontSize: 'var(--fs-xs)',
                        color: 'var(--text-faint)',
                        marginTop: 2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {c.body?.slice(0, 60) ?? 'Aucun message'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Panel>
      )}

      {showChat && (
        <Panel
          style={
            isMobile
              ? { flex: 1, minHeight: 0 }
              : { borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }
          }
        >
          {selected ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '0 0 12px',
                  borderBottom: '1px solid var(--border-subtle)',
                  marginBottom: 12,
                }}
              >
                {isMobile && (
                  <button
                    onClick={() => setSelected(null)}
                    aria-label="Retour"
                    style={{
                      flex: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 36,
                      height: 36,
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-body)',
                      cursor: 'pointer',
                    }}
                  >
                    <Icon name="arrow_back" size={22} />
                  </button>
                )}
                <Avatar name={selected.user?.fullName ?? 'Utilisateur'} size="sm" />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 700,
                      fontSize: 'var(--fs-body)',
                      color: 'var(--text-strong)',
                    }}
                  >
                    {selected.user?.fullName ?? 'Utilisateur inconnu'}
                  </div>
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                    {selected.user?.role ?? 'client'} ·{' '}
                    {selected.user?.email ?? selected.user?.phone ?? 'Pas de contact'}
                  </div>
                </div>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                  via {selected.supportUser?.fullName ?? 'Support'}
                </div>
              </div>

              {(selected.agents?.length ?? 0) > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', padding: '8px 4px 10px', borderBottom: '1px solid var(--border-subtle)', marginBottom: 8 }}>
                  <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>Traité par&nbsp;:</span>
                  {selected.agents!.map((a) => (
                    <span key={a.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 'var(--fs-xs)', fontWeight: 600, color: 'var(--teal-700)', background: 'var(--teal-50)', padding: '2px 10px', borderRadius: 'var(--radius-pill)' }}>
                      <span className="material-symbols-rounded" style={{ fontSize: 14 }}>badge</span>
                      {a.fullName}
                    </span>
                  ))}
                </div>
              )}

              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '0 4px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                {threadQuery.isLoading ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
                    Chargement des messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
                    <Icon name="chat" size={32} style={{ color: 'var(--text-faint)', marginBottom: 8 }} />
                    <p>Aucun message dans cette conversation.</p>
                    <p style={{ fontSize: 'var(--fs-xs)' }}>
                      Envoyez un premier message pour commencer.
                    </p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMine = isSupportMessage(m)
                    return (
                      <div
                        key={m.id}
                        style={{
                          display: 'flex',
                          flexDirection: isMine ? 'row-reverse' : 'row',
                          alignItems: 'flex-end',
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            maxWidth: '75%',
                            padding: (m.audioUrl && !m.body) || (m.photoUrl && !m.body) ? 8 : '10px 14px',
                            borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                            background: isMine ? 'var(--teal-500)' : 'var(--surface-raised)',
                            color: isMine ? '#fff' : 'var(--text-body)',
                            fontSize: 'var(--fs-sm)',
                            lineHeight: 1.5,
                            wordBreak: 'break-word',
                          }}
                        >
                          <div
                            style={{
                              fontSize: 'var(--fs-xs)',
                              fontWeight: 600,
                              opacity: 0.7,
                              marginBottom: 2,
                            }}
                          >
                            {isMine
                              ? `${m.handledBy?.fullName ?? m.sender?.fullName ?? 'Support'}${m.handledBy ? ` · ${selected.supportUser?.fullName ?? 'Support'}` : ''}`
                              : m.sender?.fullName ?? 'Utilisateur'}
                          </div>
                          {m.body && <div style={{ whiteSpace: 'pre-wrap' }}>{m.body}</div>}
                          {m.audioUrl && (
                            <audio
                              controls
                              src={m.audioUrl}
                              style={{
                                display: 'block',
                                height: 36,
                                maxWidth: 220,
                                marginTop: m.body ? 6 : 0,
                              }}
                            />
                          )}
                          {m.photoUrl && (
                            <img
                              src={m.photoUrl}
                              alt="Photo"
                              style={{
                                display: 'block',
                                maxWidth: 220,
                                maxHeight: 260,
                                borderRadius: 8,
                                marginTop: m.body ? 6 : 0,
                                cursor: 'pointer',
                              }}
                              onClick={() => window.open(m.photoUrl!, '_blank')}
                            />
                          )}
                          {m.videoUrl && (
                            <video
                              controls
                              src={m.videoUrl}
                              style={{
                                display: 'block',
                                maxWidth: 220,
                                maxHeight: 260,
                                borderRadius: 8,
                                marginTop: m.body ? 6 : 0,
                              }}
                            />
                          )}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-faint)', flex: 'none' }}>
                          {fmtTime(m.createdAt)}
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={bottomRef} />
              </div>

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

              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  paddingTop: 12,
                  borderTop: '1px solid var(--border-subtle)',
                  marginTop: 12,
                }}
              >
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
                        background: paused ? 'var(--amber-50)' : 'var(--color-danger-soft)',
                        color: paused ? 'var(--amber-500)' : 'var(--color-danger)',
                        fontWeight: 600,
                      }}
                    >
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'currentColor' }} />
                      {paused ? 'En pause' : 'Enregistrement...'} {fmtDuration(elapsed)}
                    </div>
                    {paused ? (
                      <button
                        type="button"
                        aria-label="Reprendre"
                        onClick={resumeRecording}
                        style={iconBtn('var(--teal-500)', '#fff')}
                      >
                        <Icon name="play_arrow" size={20} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        aria-label="Pause"
                        onClick={pauseRecording}
                        style={iconBtn('var(--amber-500)', '#fff')}
                      >
                        <Icon name="pause" size={20} />
                      </button>
                    )}
                    <button
                      type="button"
                      aria-label="Envoyer"
                      onClick={stopRecording}
                      style={iconBtn('var(--teal-500)', '#fff')}
                    >
                      <Icon name="send" size={20} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      aria-label="Photo"
                      title="Envoyer une photo"
                      disabled={busyMedia || sendMutation.isPending}
                      onClick={() => photoInputRef.current?.click()}
                      style={iconBtn('var(--surface-sunken)', 'var(--text-muted)')}
                    >
                      <Icon name="photo_camera" size={20} />
                    </button>
                    <button
                      type="button"
                      aria-label="Vidéo"
                      title="Envoyer une vidéo"
                      disabled={busyMedia || sendMutation.isPending}
                      onClick={() => videoInputRef.current?.click()}
                      style={iconBtn('var(--surface-sunken)', 'var(--text-muted)')}
                    >
                      <Icon name="videocam" size={20} />
                    </button>
                    <input
                      type="text"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && text.trim() && !sendMutation.isPending) {
                          handleSendText()
                        }
                      }}
                      placeholder="Ecrivez votre reponse..."
                      disabled={sendMutation.isPending}
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--fs-sm)',
                        fontFamily: 'var(--font-body)',
                        outline: 'none',
                        background: 'var(--surface-input)',
                        color: 'var(--text-body)',
                      }}
                    />
                    {text.trim() ? (
                      <button
                        onClick={handleSendText}
                        disabled={sendMutation.isPending || !text.trim()}
                        style={iconBtn('var(--teal-500)', '#fff')}
                      >
                        {sendMutation.isPending ? (
                          <div
                            style={{
                              width: 20,
                              height: 20,
                              border: '2px solid #fff',
                              borderTopColor: 'transparent',
                              borderRadius: '50%',
                              animation: 'spin 0.8s linear infinite',
                            }}
                          />
                        ) : (
                          <Icon name="send" size={20} />
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        aria-label="Message vocal"
                        disabled={busyMedia || sendMutation.isPending}
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
          ) : (
            <div
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                gap: 12,
              }}
            >
              <Icon name="support_agent" size={48} style={{ color: 'var(--text-faint)' }} />
              <div style={{ fontSize: 'var(--fs-body)', fontWeight: 600 }}>Support clients</div>
              <div style={{ fontSize: 'var(--fs-sm)' }}>
                Selectionnez une conversation pour repondre.
              </div>
            </div>
          )}
        </Panel>
      )}
    </div>
  )
}

function iconBtn(bg: string, color: string) {
  return {
    flex: 'none',
    width: 40,
    height: 40,
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
