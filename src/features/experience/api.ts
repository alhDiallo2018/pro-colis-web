import { api } from "@/lib/api/client";

export interface Receipt {
  id: string;
  amount: number | string;
  method: string;
  reference?: string | null;
  createdAt: string;
  parcelId?: string;
  parcel?: { trackingNumber: string };
}
export interface Experience {
  trackingNumber: string;
  nextAction: { title: string; description: string };
  tracking: {
    lastPositionAt: string | null;
    positionFresh: boolean;
    estimatedDeliveryAt: string | null;
    overdue: boolean;
  };
  finance: {
    agreedPrice: number | null;
    collected: number;
    paymentStatus: string | null;
    commission?: number | null;
    commissionEstimated?: boolean;
    paidCommission?: number | null;
    debtCreated?: number;
    accountCommissionDebt?: number;
    netAfterCommission?: number | null;
    parcelPenaltyDue?: number;
  };
  receipts: Receipt[];
  complaints: {
    id: string;
    reference: string;
    subject: string;
    status: string;
    createdAt: string;
  }[];
  canRepeat: boolean;
}
export interface ShipmentDraft {
  id: string;
  label: string;
  data: Record<string, unknown>;
  completedParcelId?: string | null;
  completedAt?: string | null;
}
export interface Workspace {
  drafts: ShipmentDraft[];
  alerts: {
    id: string;
    departureZoneId: string;
    arrivalZoneId: string;
    expiresAt: string;
  }[];
  receipts: Receipt[];
  hasMore: boolean;
}
export const experience = async (id: string): Promise<Experience> =>
  (await api.get(`/experience/parcels/${id}`)).data.experience;
export const workspace = async (page = 1): Promise<Workspace> =>
  (await api.get("/experience/workspace", { params: { page } })).data;
export const getPrefill = async (
  kind: "repeat" | "draft" | "recipient",
  id: string,
): Promise<Record<string, unknown>> =>
  (
    await api.get(
      kind === "repeat"
        ? `/experience/parcels/${id}/repeat`
        : kind === "recipient"
          ? `/experience/recipients/${id}`
          : `/experience/drafts/${id}`,
    )
  ).data.draft;
export const removeDraft = (id: string) =>
  api.delete(`/experience/drafts/${id}`);
export const ticketStatus = (status: string) =>
  ({
    open: "Reçue",
    pending: "En attente",
    in_progress: "En cours",
    resolved: "Résolue",
  })[status] ?? status;

// Texte local issu uniquement d'un paiement confirmé par l'API. Ce justificatif
// ne prétend pas être une facture fiscale et n'inclut aucune donnée bancaire.
export function receiptText(receipt: Receipt, tracking: string) {
  return [
    "SendProColis — Justificatif de paiement",
    `Colis : ${tracking}`,
    `Référence : ${receipt.reference || receipt.id}`,
    `Montant confirmé : ${Number(receipt.amount).toLocaleString("fr-FR")} FCFA`,
    `Moyen : ${receipt.method}`,
    `Date : ${new Date(receipt.createdAt).toLocaleString("fr-FR")}`,
  ].join("\n");
}
export function downloadReceipt(receipt: Receipt, tracking: string) {
  const url = URL.createObjectURL(
    new Blob([receiptText(receipt, tracking)], {
      type: "text/plain;charset=utf-8",
    }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `recu-${receipt.id}.txt`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
