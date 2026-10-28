import "./message-composer.css";
import { useEffect, useId, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Dialog, Icon } from "@/ds";
import * as messagesApi from "@/lib/api/messages";
import * as bidsApi from "@/lib/api/bids";
import * as adsApi from "@/lib/api/advertisements";
import { isMessageEditable, type ChatMessage } from "@/lib/api/messages";
import {
  uploadChatAudio,
  uploadChatPhoto,
  uploadChatVideo,
} from "@/lib/api/uploads";
import { useAuthStore } from "@/store/auth";
import { supportThread, supportSend } from "@/lib/api/supportChat";

const PRIX_PREFIX = "__PRIX__";

function fmtTime(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDuration(ms: number) {
  const t = Math.round(ms / 1000);
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
}

function nf(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n);
}

interface Props {
  supportTicketId?: string;
  supportConversationId?: string;
  readOnly?: boolean;
  peerId: string;
  peerName: string;
  parcelId?: string;
  bidId?: string;
  advertisementId?: string;
  offerId?: string;
  parcelInfo?: {
    trackingNumber?: string;
    departureCity?: string | null;
    arrivalCity?: string | null;
    description?: string | null;
    receiverName?: string;
    receiverPhone?: string;
    receiverAddress?: string | null;
    weight?: string | null;
    type?: string;
    status?: string;
    photoUrls?: string[];
    videoUrls?: string[];
    audioUrls?: string[];
  };
  isOwner?: boolean;
  /**
   * Autorise l'acceptation d'un prix reçu. Le camp qui vient de proposer ne
   * peut pas accepter son propre montant : le parent le calcule depuis l'état
   * de la négociation (`canClientAccept` / `canDriverAccept`).
   */
  canAccept?: boolean;
  /**
   * Acceptation bloquée (ex. dette de commission impayée) : le bouton Accepter
   * reste visible mais désactivé, avec un libellé explicite. L'API reste seule
   * juge ; ce drapeau n'est qu'un affichage.
   */
  acceptBlocked?: boolean;
  acceptBlockedLabel?: string;
  onCreateBid?: (price: number, message?: string) => void | Promise<void>;
  onAcceptBid?: (price: number, message?: string) => void;
}

export function NegotiationChat({
  supportTicketId,
  supportConversationId,
  readOnly = false,
  peerId,
  peerName,
  parcelId,
  bidId,
  advertisementId,
  offerId,
  parcelInfo,
  isOwner: _isOwner = false,
  canAccept,
  acceptBlocked = false,
  acceptBlockedLabel = "Dette à régler",
  onCreateBid,
  onAcceptBid,
}: Props) {
  // Sans indication du parent, on retombe sur l'ancien comportement : seul le
  // propriétaire du colis pouvait accepter un prix.
  const composerId = useId();
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;
  const role = user?.role;
  // Le contrat API ne prévoit l'acceptation d'une offre d'annonce que pour le
  // chauffeur. Le client peut répondre par une nouvelle contre-proposition.
  const isAdvertisementOffer = Boolean(offerId && advertisementId);
  const acceptAllowed =
    (canAccept ?? _isOwner) && (!isAdvertisementOffer || role === "driver");
  const qc = useQueryClient();
  const key = supportConversationId
    ? ["support-chat", supportConversationId]
    : ["messages", "thread", peerId, parcelId ?? null];

  const thread = useQuery({
    queryKey: key,
    queryFn: async () =>
      supportConversationId
        ? supportThread(supportConversationId)
        : messagesApi.thread(peerId, parcelId),
    enabled: Boolean(peerId),
    refetchInterval: 4000,
  });
  const messages = Array.isArray(thread.data)
    ? thread.data
    : (thread.data?.messages ?? []);

  const send = useMutation({
    mutationFn: (payload: {
      body?: string;
      audioUrl?: string;
      photoUrl?: string;
      videoUrl?: string;
    }) =>
      supportConversationId
        ? supportSend(supportConversationId, {
            ...payload,
            ...(supportTicketId ? { ticketId: supportTicketId } : {}),
          })
        : messagesApi.send({ receiverId: peerId, parcelId, ...payload }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      if (supportConversationId)
        qc.invalidateQueries({ queryKey: ["support-chat", "queue"] });
      qc.invalidateQueries({ queryKey: ["client", "bids"] });
      qc.invalidateQueries({ queryKey: ["driver", "bids"] });
    },
  });

  // Édition / suppression logique d'un message déjà envoyé. Les deux invalident
  // aussi la liste des conversations, dont l'aperçu affiche ce même texte.
  const invalidateThread = () => {
    qc.invalidateQueries({ queryKey: key });
    qc.invalidateQueries({ queryKey: ["messages", "conversations"] });
  };

  const editMessage = useMutation({
    mutationFn: ({ messageId, body }: { messageId: string; body: string }) =>
      messagesApi.update(messageId, body),
    onSuccess: invalidateThread,
  });

  const deleteMessage = useMutation({
    mutationFn: (messageId: string) => messagesApi.remove(messageId),
    onSuccess: invalidateThread,
  });

  const negotiate = useMutation({
    mutationFn: (payload: { price: number; message?: string }) => {
      if (offerId && advertisementId) {
        return adsApi.negotiateOffer(advertisementId, offerId, payload) as any;
      }
      if (!bidId) return Promise.resolve();
      if (role === "driver") {
        return bidsApi.driverRespond(bidId, {
          action: "counter",
          price: payload.price,
          message: payload.message,
        });
      }
      return bidsApi.negotiate(bidId, payload);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const acceptPrice = useMutation({
    mutationFn: async (payload: { amount: number; message?: string }) => {
      if (offerId && advertisementId) {
        if (role !== "driver")
          return Promise.reject(
            new Error("Cette offre doit être acceptée par le chauffeur."),
          );
        return adsApi.acceptOffer(advertisementId, offerId);
      }
      if (!bidId || !parcelId) return Promise.resolve();
      if (role === "driver") {
        return bidsApi.driverRespond(bidId, {
          action: "accept",
          price: payload.amount,
          message: payload.message,
        });
      }
      return bidsApi.accept(parcelId, bidId);
    },
    onSuccess: (result: any) => {
      qc.invalidateQueries({ queryKey: ["client", "bids"] });
      qc.invalidateQueries({ queryKey: ["driver", "bids"] });
      qc.invalidateQueries({ queryKey: ["client", "parcels"] });
      qc.invalidateQueries({ queryKey: ["parcels", "free"] });
      return result;
    },
  });

  const [text, setText] = useState("");
  const [composerError, setComposerError] = useState("");
  const [sendingPrice, setSendingPrice] = useState(false);
  const priceSendingRef = useRef(false);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const input = composerRef.current;
    if (!input) return;
    input.style.height = "auto";
    input.style.height = `${Math.min(160, input.scrollHeight)}px`;
  }, [text]);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [showPrice, setShowPrice] = useState(false);
  const [priceVal, setPriceVal] = useState("");
  const [showParcelDetail, setShowParcelDetail] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight });
  }, [messages.length]);

  const sendText = () => {
    const body = text.trim();
    if (!body || send.isPending || priceSendingRef.current) return;
    const submitted = text;
    setComposerError("");
    // Un échec réseau conserve la saisie. Une réponse tardive ne doit jamais
    // effacer le message suivant que l'utilisateur a commencé à écrire.
    send.mutate(
      { body },
      {
        onSuccess: () =>
          setText((current) => (current === submitted ? "" : current)),
      },
    );
  };

  const sendPrice = async () => {
    const amount = Number(priceVal);
    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      send.isPending ||
      priceSendingRef.current
    )
      return;
    const submitted = text,
      submittedPrice = priceVal,
      msg = text.trim();
    let recorded = false;
    priceSendingRef.current = true;
    setSendingPrice(true);
    setComposerError("");
    try {
      // Confirmer l'opération métier avant d'afficher une proposition envoyée.
      if (!bidId && !offerId && onCreateBid) {
        await onCreateBid(amount, msg || undefined);
        recorded = true;
      } else if (bidId || offerId) {
        await negotiate.mutateAsync({
          price: amount,
          message: msg || undefined,
        });
        recorded = true;
      }
      await send.mutateAsync({
        body: `${PRIX_PREFIX}:${amount}${msg ? `:${msg}` : ""}`,
      });
      setText((current) => (current === submitted ? "" : current));
      setPriceVal((current) => (current === submittedPrice ? "" : current));
      setShowPrice(false);
    } catch (error) {
      if (recorded) {
        // La négociation est déjà enregistrée : ne pas la soumettre deux fois
        // lorsque seul le message d'accompagnement a échoué.
        setPriceVal("");
        setShowPrice(false);
        setComposerError(
          "Votre proposition a été enregistrée, mais son message n’a pas été transmis. Vous pouvez renvoyer le texte.",
        );
      } else
        setComposerError(
          error instanceof Error
            ? error.message
            : "Envoi impossible. Votre saisie est conservée.",
        );
    } finally {
      priceSendingRef.current = false;
      setSendingPrice(false);
    }
  };

  // --- voice message recording ---
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [busyAudio, setBusyAudio] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [busyMedia, setBusyMedia] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedRef = useRef(0);
  const pausedAtRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };
  useEffect(() => stopTimer, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) =>
        e.data.size && chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        setBusyAudio(true);
        try {
          const url = await uploadChatAudio(blob);
          await send.mutateAsync({ audioUrl: url });
        } finally {
          setBusyAudio(false);
        }
      };
      recorderRef.current = recorder;
      startedRef.current = performance.now();
      recorder.start();
      setRecording(true);
      setPaused(false);
      setElapsed(0);
      timerRef.current = setInterval(
        () => setElapsed(performance.now() - startedRef.current),
        200,
      );
    } catch {
      /* mic denied */
    }
  };
  const stopRecording = () => {
    stopTimer();
    setRecording(false);
    setPaused(false);
    recorderRef.current?.stop();
  };
  const pauseRecording = () => {
    stopTimer();
    pausedAtRef.current = performance.now();
    recorderRef.current?.pause();
    setPaused(true);
  };
  const resumeRecording = () => {
    startedRef.current += performance.now() - pausedAtRef.current;
    recorderRef.current?.resume();
    setPaused(false);
    setElapsed(performance.now() - startedRef.current);
    timerRef.current = setInterval(
      () => setElapsed(performance.now() - startedRef.current),
      200,
    );
  };
  const cancelRecording = () => {
    stopTimer();
    setRecording(false);
    setPaused(false);
    const r = recorderRef.current;
    if (r) {
      r.onstop = null;
      try {
        r.stop();
        r.stream.getTracks().forEach((t) => t.stop());
      } catch {
        /* noop */
      }
    }
  };

  const handlePhotoPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusyMedia(true);
    try {
      const url = await uploadChatPhoto(file);
      await send.mutateAsync({ photoUrl: url });
    } finally {
      setBusyMedia(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const handleVideoPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusyMedia(true);
    try {
      const url = await uploadChatVideo(file);
      await send.mutateAsync({ videoUrl: url });
    } finally {
      setBusyMedia(false);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  };

  const handleAcceptPrice = (amount: number) => {
    if (acceptPrice.isPending || acceptBlocked) return;

    if (onAcceptBid) {
      onAcceptBid(amount, `Prix accept\u00e9: ${nf(amount)} FCFA`);
      send.mutate({ body: `J'accepte le prix de ${nf(amount)} FCFA.` });
      return;
    }

    if (!bidId && !offerId) {
      send.mutate({ body: `J'accepte le prix de ${nf(amount)} FCFA.` });
      return;
    }

    if (offerId && advertisementId) {
      acceptPrice.mutate(
        { amount, message: `Prix accept\u00e9: ${nf(amount)} FCFA` },
        {
          onSuccess: () =>
            send.mutate({ body: `J'accepte le prix de ${nf(amount)} FCFA.` }),
        },
      );
      return;
    }

    if (!bidId || !parcelId) return;

    const msg = `Prix accept\u00e9: ${nf(amount)} FCFA`;
    acceptPrice.mutate(
      { amount, message: msg },
      {
        onSuccess: () =>
          send.mutate({ body: `J'accepte le prix de ${nf(amount)} FCFA.` }),
      },
    );
  };

  const handleCounterPrice = (amount: number) => {
    setShowPrice(true);
    setPriceVal("");
    setText(`Contre-proposition a ${nf(amount)} FCFA : `);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 360,
      }}
    >
      {/* Parcel info header */}
      {parcelInfo &&
        (parcelInfo.trackingNumber || parcelInfo.departureCity) && (
          <div
            style={{
              background: "var(--slate-50)",
              borderRadius: "var(--radius-md)",
              padding: "10px 14px",
              marginBottom: 8,
              border: "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: "var(--fs-xs)",
              flexWrap: "wrap",
              cursor: "pointer",
            }}
            onClick={() => setShowParcelDetail(true)}
            title="Cliquer pour voir les details du colis"
          >
            {parcelInfo.trackingNumber && (
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                  color: "var(--teal-600)",
                  background: "var(--teal-50)",
                  padding: "3px 8px",
                  borderRadius: "var(--radius-pill)",
                }}
              >
                {parcelInfo.trackingNumber}
              </span>
            )}
            {(parcelInfo.departureCity || parcelInfo.arrivalCity) && (
              <span
                style={{
                  color: "var(--text-body)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span
                  className="material-symbols-rounded"
                  style={{ fontSize: 14, color: "var(--text-faint)" }}
                >
                  location_on
                </span>
                {parcelInfo.departureCity ?? "-"}
                {parcelInfo.departureCity && parcelInfo.arrivalCity && (
                  <span
                    className="material-symbols-rounded"
                    style={{ fontSize: 14, color: "var(--text-faint)" }}
                  >
                    arrow_right_alt
                  </span>
                )}
                {parcelInfo.arrivalCity ?? "-"}
              </span>
            )}
            {parcelInfo.receiverName && (
              <span
                style={{
                  color: "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span
                  className="material-symbols-rounded"
                  style={{ fontSize: 14 }}
                >
                  person
                </span>
                {parcelInfo.receiverName}
              </span>
            )}
            <span
              className="material-symbols-rounded"
              style={{
                fontSize: 16,
                color: "var(--text-link)",
                marginLeft: "auto",
              }}
            >
              info
            </span>
          </div>
        )}

      {/* messages list */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          padding: "4px 2px",
          background: "var(--surface-page)",
          borderRadius: "var(--radius-md)",
        }}
      >
        {thread.isLoading ? (
          <p
            style={{
              margin: "auto",
              color: "var(--text-muted)",
              fontSize: "var(--fs-sm)",
            }}
          >
            Chargement...
          </p>
        ) : messages.length === 0 ? (
          <div
            style={{
              margin: "auto",
              textAlign: "center",
              color: "var(--text-muted)",
              padding: 20,
            }}
          >
            <Icon
              name="forum"
              size={28}
              style={{ color: "var(--text-faint)" }}
            />
            <p style={{ margin: "6px 0 0", fontSize: "var(--fs-sm)" }}>
              {supportConversationId
                ? `Écrivez votre message à ${peerName}.`
                : `Demarrez la negociation avec ${peerName}.`}
            </p>
          </div>
        ) : (
          (() => {
            const lastNonMinePriceIdx = [...messages]
              .reverse()
              .findIndex(
                (m) => m.senderId !== userId && m.body.startsWith(PRIX_PREFIX),
              );
            const lastNonMinePriceId =
              lastNonMinePriceIdx >= 0
                ? messages[messages.length - 1 - lastNonMinePriceIdx]?.id
                : null;

            return messages.map((m) => (
              <div
                key={m.id}
                style={{ display: "flex", flexDirection: "column", gap: 4 }}
              >
                {supportConversationId && (
                  <span
                    style={{
                      fontSize: 11,
                      textAlign: m.senderId === userId ? "right" : "left",
                      color: "var(--text-muted)",
                    }}
                  >
                    {m.sender?.fullName ?? "Support"}
                  </span>
                )}
                <MessageBubble
                  message={m}
                  supportMessage={!!supportConversationId}
                  mine={m.senderId === userId}
                  isOwner={acceptAllowed}
                  isLastNonMinePrice={m.id === lastNonMinePriceId}
                  acceptBlocked={acceptBlocked}
                  acceptBlockedLabel={acceptBlockedLabel}
                  onAcceptPrice={(amount) => handleAcceptPrice(amount)}
                  onCounterPrice={(amount) => handleCounterPrice(amount)}
                  onEdit={
                    supportConversationId || readOnly
                      ? undefined
                      : (body) => editMessage.mutate({ messageId: m.id, body })
                  }
                  onDelete={
                    supportConversationId || readOnly
                      ? undefined
                      : () => setPendingDelete(m.id)
                  }
                  busy={editMessage.isPending || deleteMessage.isPending}
                />
              </div>
            ));
          })()
        )}
        {busyAudio && (
          <div
            style={{
              alignSelf: "flex-end",
              fontSize: "var(--fs-xs)",
              color: "var(--text-muted)",
              padding: "2px 6px",
            }}
          >
            Envoi du vocal...
          </div>
        )}
      </div>

      {composerError && (
        <p role="alert" className="message-composer-error">
          {composerError}
        </p>
      )}
      {send.isError && !composerError && (
        <p role="alert">
          {send.error instanceof Error
            ? send.error.message
            : "Envoi impossible"}
        </p>
      )}
      {!readOnly && (
        <>
          {showPrice && (
            <div className="message-price-panel">
              <label htmlFor={`${composerId}-amount`}>
                Votre proposition (FCFA)
                <input
                  id={`${composerId}-amount`}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step={1}
                  placeholder="Ex. 2 500"
                  value={priceVal}
                  disabled={sendingPrice}
                  onChange={(e) => setPriceVal(e.target.value)}
                />
              </label>
              <p>
                Proposez un tarif adapté au colis. Il reste à confirmer par
                l’autre partie.
              </p>
            </div>
          )}

          {/* input bar */}
          <div className={recording ? "message-recording" : "message-composer"}>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handlePhotoPick}
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              style={{ display: "none" }}
              onChange={handleVideoPick}
            />
            {recording ? (
              <>
                <button
                  type="button"
                  aria-label="Annuler"
                  onClick={cancelRecording}
                  style={iconBtn("var(--surface-sunken)", "var(--text-muted)")}
                >
                  <Icon name="close" size={20} />
                </button>
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    height: 44,
                    padding: "0 14px",
                    borderRadius: 999,
                    background: paused
                      ? "var(--amber-50)"
                      : "var(--color-danger-soft)",
                    color: paused ? "var(--amber-500)" : "var(--color-danger)",
                    fontWeight: 600,
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: "currentColor",
                    }}
                  />
                  {paused ? "En pause" : "Enregistrement..."}{" "}
                  {fmtDuration(elapsed)}
                </div>
                {paused ? (
                  <button
                    type="button"
                    aria-label="Reprendre l'enregistrement"
                    onClick={resumeRecording}
                    style={iconBtn("var(--teal-500)", "#fff")}
                  >
                    <Icon name="play_arrow" size={20} />
                  </button>
                ) : (
                  <button
                    type="button"
                    aria-label="Mettre en pause"
                    onClick={pauseRecording}
                    style={iconBtn("var(--amber-500)", "#fff")}
                  >
                    <Icon name="pause" size={20} />
                  </button>
                )}
                <button
                  type="button"
                  aria-label="Envoyer le vocal"
                  onClick={stopRecording}
                  style={iconBtn("var(--teal-500)", "#fff")}
                >
                  <Icon name="send" size={20} />
                </button>
              </>
            ) : (
              <>
                <label
                  className="message-composer-label"
                  htmlFor={`${composerId}-message`}
                >
                  Votre message
                </label>
                <textarea
                  id={`${composerId}-message`}
                  ref={composerRef}
                  rows={2}
                  maxLength={2000}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      (e.ctrlKey || e.metaKey) &&
                      !e.nativeEvent.isComposing
                    ) {
                      e.preventDefault();
                      if (showPrice) void sendPrice();
                      else sendText();
                    }
                  }}
                  placeholder={`Écrivez à ${peerName}…`}
                  aria-describedby={`${composerId}-help`}
                />
                <div className="message-composer-toolbar">
                  <div className="message-composer-tools">
                    {!supportConversationId && (
                      <button
                        type="button"
                        className="message-tool"
                        aria-label="Proposer un prix"
                        aria-pressed={showPrice}
                        title="Proposer un prix"
                        disabled={sendingPrice}
                        onClick={() => setShowPrice(!showPrice)}
                      >
                        <Icon name="payments" size={20} />
                      </button>
                    )}
                    <button
                      type="button"
                      className="message-tool"
                      aria-label="Envoyer une photo"
                      title="Ajouter une photo"
                      disabled={busyMedia || send.isPending || sendingPrice}
                      onClick={() => photoInputRef.current?.click()}
                    >
                      <Icon name="photo_camera" size={20} />
                    </button>
                    <button
                      type="button"
                      className="message-tool"
                      aria-label="Envoyer une video"
                      title="Ajouter une vidéo"
                      disabled={busyMedia || send.isPending || sendingPrice}
                      onClick={() => videoInputRef.current?.click()}
                    >
                      <Icon name="videocam" size={20} />
                    </button>
                    <button
                      type="button"
                      className="message-tool"
                      aria-label="Message vocal"
                      title="Enregistrer un message vocal"
                      disabled={busyAudio || send.isPending || sendingPrice}
                      onClick={startRecording}
                    >
                      <Icon name="mic" size={20} />
                    </button>
                  </div>
                  <Button
                    aria-label={showPrice ? "Envoyer l’offre" : "Envoyer"}
                    icon="send"
                    size="sm"
                    loading={send.isPending || sendingPrice}
                    disabled={
                      busyMedia ||
                      busyAudio ||
                      (showPrice
                        ? !Number.isFinite(Number(priceVal)) ||
                          Number(priceVal) <= 0
                        : !text.trim())
                    }
                    onClick={() => (showPrice ? void sendPrice() : sendText())}
                  >
                    {showPrice ? "Envoyer l’offre" : "Envoyer"}
                  </Button>
                </div>
                <div className="message-composer-footer">
                  <span id={`${composerId}-help`}>
                    Entrée : nouvelle ligne · Ctrl/⌘ + Entrée : envoyer
                  </span>
                  <span aria-label="Nombre de caractères">
                    {text.length}/2 000
                  </span>
                </div>
              </>
            )}
          </div>
        </>
      )}
      {/* Suppression d'un message : irréversible côté fil, donc confirmée. */}
      {pendingDelete && (
        <Dialog
          open
          onClose={() => setPendingDelete(null)}
          icon="delete"
          iconTone="danger"
          title="Supprimer ce message ?"
          style={{ maxWidth: 400 }}
          actions={
            <>
              <Button
                variant="secondary"
                block
                onClick={() => setPendingDelete(null)}
              >
                Annuler
              </Button>
              <Button
                variant="danger"
                block
                loading={deleteMessage.isPending}
                onClick={() =>
                  deleteMessage.mutate(pendingDelete, {
                    onSuccess: () => setPendingDelete(null),
                  })
                }
              >
                Supprimer
              </Button>
            </>
          }
        >
          <p
            style={{
              margin: 0,
              fontSize: "var(--fs-sm)",
              color: "var(--text-muted)",
            }}
          >
            Il disparaîtra de la conversation pour vous comme pour {peerName}.
          </p>
        </Dialog>
      )}

      {/* Parcel detail modal */}
      {showParcelDetail && parcelInfo && (
        <Dialog
          open
          onClose={() => setShowParcelDetail(false)}
          icon="package_2"
          iconTone="primary"
          title={
            parcelInfo.trackingNumber
              ? `Colis - ${parcelInfo.trackingNumber}`
              : "Details du colis"
          }
          style={{ maxWidth: 460 }}
          actions={
            <Button
              variant="secondary"
              block
              onClick={() => setShowParcelDetail(false)}
            >
              Fermer
            </Button>
          }
        >
          <div
            style={{
              textAlign: "left",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {parcelInfo.description && (
              <div
                style={{
                  fontSize: "var(--fs-sm)",
                  color: "var(--text-body)",
                  background: "var(--slate-50)",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-md)",
                }}
              >
                {parcelInfo.description}
              </div>
            )}
            <div
              className="pc-field-pair"
              style={{ gap: "6px 16px", fontSize: "var(--fs-sm)" }}
            >
              {parcelInfo.weight != null && (
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Poids</span>
                  <br />
                  <strong>{parcelInfo.weight} kg</strong>
                </div>
              )}
              {parcelInfo.type && (
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Type</span>
                  <br />
                  <strong>{parcelInfo.type}</strong>
                </div>
              )}
              {parcelInfo.status && (
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Statut</span>
                  <br />
                  <strong>{parcelInfo.status}</strong>
                </div>
              )}
              {parcelInfo.receiverName && (
                <div>
                  <span style={{ color: "var(--text-muted)" }}>
                    Destinataire
                  </span>
                  <br />
                  <strong>{parcelInfo.receiverName}</strong>
                </div>
              )}
              {parcelInfo.receiverPhone && (
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Tel</span>
                  <br />
                  <strong
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "var(--fs-xs)",
                    }}
                  >
                    {parcelInfo.receiverPhone}
                  </strong>
                </div>
              )}
              {parcelInfo.receiverAddress && (
                <div style={{ gridColumn: "span 2" }}>
                  <span style={{ color: "var(--text-muted)" }}>Adresse</span>
                  <br />
                  <strong>{parcelInfo.receiverAddress}</strong>
                </div>
              )}
            </div>
            {(parcelInfo.photoUrls?.length ?? 0) > 0 && (
              <div>
                <div
                  style={{
                    fontSize: "var(--fs-xs)",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    marginBottom: 6,
                  }}
                >
                  Photos ({parcelInfo.photoUrls!.length})
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {parcelInfo.photoUrls!.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={url}
                        alt={`Photo ${i + 1}`}
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: "var(--radius-sm)",
                          objectFit: "cover",
                          border: "1px solid var(--border-subtle)",
                        }}
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
            {(parcelInfo.audioUrls?.length ?? 0) > 0 && (
              <div>
                <div
                  style={{
                    fontSize: "var(--fs-xs)",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    marginBottom: 4,
                  }}
                >
                  Messages vocaux
                </div>
                {parcelInfo.audioUrls!.map((url, i) => (
                  <audio
                    key={i}
                    controls
                    src={url}
                    style={{ width: "100%", height: 32, maxWidth: 320 }}
                  />
                ))}
              </div>
            )}
            {(parcelInfo.videoUrls?.length ?? 0) > 0 && (
              <div>
                <div
                  style={{
                    fontSize: "var(--fs-xs)",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    marginBottom: 4,
                  }}
                >
                  Videos
                </div>
                {parcelInfo.videoUrls!.map((url, i) => (
                  <video
                    key={i}
                    controls
                    src={url}
                    style={{
                      width: "100%",
                      maxWidth: 320,
                      borderRadius: "var(--radius-sm)",
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </Dialog>
      )}
    </div>
  );
}

interface BubbleProps {
  supportMessage?: boolean;
  message: ChatMessage;
  mine: boolean;
  isOwner?: boolean;
  isLastNonMinePrice?: boolean;
  acceptBlocked?: boolean;
  acceptBlockedLabel?: string;
  onAcceptPrice?: (amount: number) => void;
  onCounterPrice?: (amount: number) => void;
  onEdit?: (body: string) => void;
  onDelete?: () => void;
  busy?: boolean;
}

function parsePriceProposal(
  body: string,
): { isPrice: boolean; amount: number; message: string } | null {
  if (!body.startsWith(PRIX_PREFIX)) return null;
  const parts = body.slice(PRIX_PREFIX.length + 1).split(":");
  const amount = Number(parts[0]);
  if (Number.isNaN(amount) || amount <= 0) return null;
  return { isPrice: true, amount, message: parts.slice(1).join(":").trim() };
}

function MessageBubble({
  supportMessage = false,
  message,
  mine,
  isOwner = false,
  isLastNonMinePrice = false,
  acceptBlocked = false,
  acceptBlockedLabel = "Dette à régler",
  onAcceptPrice,
  onCounterPrice,
  onEdit,
  onDelete,
  busy = false,
}: BubbleProps) {
  const priceData = supportMessage ? null : parsePriceProposal(message.body);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.body ?? "");

  // La fenêtre d'édition s'écoule pendant que le fil reste ouvert : on la
  // réévalue à l'ouverture du menu plutôt qu'une fois pour toutes au montage.
  const canEdit = Boolean(mine && onEdit && isMessageEditable(message));
  const canDelete = Boolean(mine && onDelete && !priceData);

  if (priceData) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: mine ? "flex-end" : "flex-start",
        }}
      >
        <div
          style={{
            maxWidth: "82%",
            padding: 14,
            borderRadius: 14,
            borderBottomRightRadius: mine ? 4 : 14,
            borderBottomLeftRadius: mine ? 14 : 4,
            background: "var(--amber-50)",
            border: "1px solid var(--amber-200)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 6,
            }}
          >
            <span
              className="material-symbols-rounded"
              style={{ fontSize: 20, color: "var(--amber-600)" }}
            >
              payments
            </span>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 13,
                color: "var(--amber-700)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              {mine ? "Prix propose" : "Proposition de prix"}
            </span>
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              fontSize: 26,
              color: "var(--amber-600)",
              letterSpacing: "-0.01em",
            }}
          >
            {nf(priceData.amount)}{" "}
            <span style={{ fontSize: 14, fontWeight: 600 }}>FCFA</span>
          </div>
          {priceData.message && (
            <div
              style={{
                fontSize: "var(--fs-sm)",
                color: "var(--text-body)",
                marginTop: 6,
              }}
            >
              {priceData.message}
            </div>
          )}
          {!mine && isOwner && isLastNonMinePrice && onAcceptPrice && (
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onCounterPrice?.(priceData.amount)}
              >
                Contre-proposition
              </Button>
              <Button
                size="sm"
                icon={acceptBlocked ? "lock" : "check"}
                disabled={acceptBlocked}
                title={acceptBlocked ? acceptBlockedLabel : undefined}
                onClick={() => onAcceptPrice(priceData.amount)}
              >
                {acceptBlocked ? acceptBlockedLabel : "Accepter"}
              </Button>
            </div>
          )}
          <div
            style={{
              fontSize: 10,
              textAlign: "right",
              marginTop: 8,
              color: "var(--amber-500)",
            }}
          >
            {fmtTime(message.createdAt)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: mine ? "flex-end" : "flex-start",
      }}
    >
      <div
        style={{
          maxWidth: "78%",
          padding:
            (message.audioUrl && !message.body) ||
            (message.photoUrl && !message.body) ||
            (message.videoUrl && !message.body)
              ? 6
              : "8px 12px",
          borderRadius: 14,
          borderBottomRightRadius: mine ? 4 : 14,
          borderBottomLeftRadius: mine ? 14 : 4,
          background: mine ? "var(--teal-500)" : "var(--surface-card)",
          color: mine ? "#fff" : "var(--text-body)",
          border: mine ? "none" : "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-xs)",
        }}
      >
        {editing ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              minWidth: 200,
            }}
          >
            <textarea
              value={draft}
              autoFocus
              rows={Math.min(5, Math.max(2, draft.split("\n").length))}
              onChange={(e) => setDraft(e.target.value.slice(0, 4000))}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setEditing(false);
                  setDraft(message.body ?? "");
                }
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  const next = draft.trim();
                  if (next && next !== message.body) onEdit?.(next);
                  setEditing(false);
                }
              }}
              style={{
                width: "100%",
                resize: "vertical",
                borderRadius: 8,
                padding: "6px 8px",
                border: "1px solid var(--border-default)",
                background: "var(--surface-card)",
                color: "var(--text-strong)",
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-sm)",
              }}
            />
            <div
              style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}
            >
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditing(false);
                  setDraft(message.body ?? "");
                }}
              >
                Annuler
              </Button>
              <Button
                size="sm"
                loading={busy}
                disabled={!draft.trim() || draft.trim() === message.body}
                onClick={() => {
                  onEdit?.(draft.trim());
                  setEditing(false);
                }}
              >
                Enregistrer
              </Button>
            </div>
          </div>
        ) : (
          message.body && (
            <div style={{ fontSize: "var(--fs-sm)", whiteSpace: "pre-wrap" }}>
              {message.body}
            </div>
          )
        )}
        {message.audioUrl && (
          <audio
            controls
            src={message.audioUrl}
            style={{
              height: 36,
              maxWidth: 220,
              display: "block",
              marginTop: message.body ? 6 : 0,
            }}
          />
        )}
        {message.photoUrl && (
          <img
            src={message.photoUrl}
            alt="Photo"
            style={{
              display: "block",
              maxWidth: 220,
              maxHeight: 260,
              borderRadius: 8,
              marginTop: message.body ? 6 : 0,
              cursor: "pointer",
            }}
            onClick={() => window.open(message.photoUrl!, "_blank")}
          />
        )}
        {message.videoUrl && (
          <video
            controls
            src={message.videoUrl}
            style={{
              display: "block",
              maxWidth: 220,
              maxHeight: 260,
              borderRadius: 8,
              marginTop: message.body ? 6 : 0,
            }}
          />
        )}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            justifyContent: "flex-end",
            marginTop: 3,
          }}
        >
          {!editing && (canEdit || canDelete) && (
            <>
              {canEdit && (
                <button
                  type="button"
                  aria-label="Modifier le message"
                  title="Modifier"
                  onClick={() => {
                    setDraft(message.body ?? "");
                    setEditing(true);
                  }}
                  style={bubbleActionBtn(mine)}
                >
                  <Icon name="edit" size={13} />
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  aria-label="Supprimer le message"
                  title="Supprimer"
                  onClick={() => onDelete?.()}
                  style={bubbleActionBtn(mine)}
                >
                  <Icon name="delete" size={13} />
                </button>
              )}
            </>
          )}
          {message.isEdited && (
            <span
              style={{
                fontSize: 10,
                color: mine ? "rgba(255,255,255,0.7)" : "var(--text-faint)",
              }}
            >
              modifié
            </span>
          )}
          <span
            style={{
              fontSize: 10,
              color: mine ? "rgba(255,255,255,0.7)" : "var(--text-faint)",
            }}
          >
            {fmtTime(message.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Petite action discrète posée dans le pied de bulle (édition / suppression). */
function bubbleActionBtn(mine: boolean) {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 20,
    height: 20,
    padding: 0,
    borderRadius: "50%",
    border: "none",
    cursor: "pointer",
    background: "transparent",
    color: mine ? "rgba(255,255,255,0.75)" : "var(--text-faint)",
  } as const;
}

function iconBtn(bg: string, color: string) {
  return {
    flex: "none",
    width: 40,
    height: 40,
    borderRadius: "50%",
    border: "none",
    background: bg,
    color,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  } as const;
}
