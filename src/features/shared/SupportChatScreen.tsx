import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { NegotiationChat } from "@/components/NegotiationChat";
import { Button } from "@/ds";
import {
  mySupportChat,
  openSupportChat,
  supportThread,
} from "@/lib/api/supportChat";

/** Le fil conserve son identifiant lors d'un changement d'agent. */
export function SupportChatScreen() {
  const [params] = useSearchParams();
  const ticketId = params.get("ticket") ?? undefined;
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void mySupportChat()
      .then((chat) => {
        if (active && chat) setId(chat.id);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  const open = useMutation({
    mutationFn: (department: string) => openSupportChat(undefined, department),
    onSuccess: (chat) => setId(chat.id),
  });
  const thread = useQuery({
    queryKey: ["support-chat", id],
    queryFn: () => supportThread(id!),
    enabled: !!id,
    refetchInterval: 4000,
  });
  const chat = thread.data?.conversation;
  if (!id)
    return (
      <div className="cm-detail-page" style={{ maxWidth: 480 }}>
        <div className="cm-page-head">
          <div className="cm-page-head-body">
            <h1>Contacter le support</h1>
            <p className="cm-page-head-sub">
              Un agent prendra votre demande en charge. Vos échanges restent accessibles si un autre agent prend le relais.
            </p>
          </div>
        </div>
        <Button
          disabled={open.isPending}
          icon="support_agent"
          onClick={() => open.mutate("commercial")}
        >
          Aide commerciale
        </Button>
        <Button
          variant="secondary"
          disabled={open.isPending}
          icon="build"
          onClick={() => open.mutate("technique")}
        >
          Aide technique
        </Button>
        {open.isError && <p role="alert">{open.error.message}</p>}
      </div>
    );
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "70vh",
        minHeight: 480,
        gap: 14,
      }}
    >
      <Button variant="secondary" onClick={() => setId(null)}>
        Retour
      </Button>
      <h2 style={{ margin: 0 }}>Support SENDPROCOLIS</h2>
      {ticketId && (
        <p>
          Votre message sera joint à cette réclamation. Le fil conserve tous vos
          échanges avec le support.
        </p>
      )}
      <p role="status" style={{ margin: 0 }}>
        {chat?.assignedTo
          ? `Vous êtes accompagné par ${chat.assignedTo.fullName}.`
          : chat?.status === "closed"
            ? "Conversation clôturée. Un nouveau message rouvrira votre demande."
            : "Votre demande est en attente. Vous pouvez laisser votre message ; un agent vous répondra dès qu’il sera disponible."}
      </p>
      {thread.isError && (
        <p role="alert">
          Chargement impossible.{" "}
          <Button onClick={() => thread.refetch()}>Réessayer</Button>
        </p>
      )}
      {chat && (
        <NegotiationChat
          key={id}
          peerId={chat.userId}
          peerName="Support"
          supportConversationId={id}
          supportTicketId={ticketId}
        />
      )}
    </div>
  );
}
