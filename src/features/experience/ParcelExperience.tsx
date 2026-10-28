import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button, Card, Select, Textarea, Toast } from "@/ds";
import { api } from "@/lib/api/client";
import { uploadChatPhoto } from "@/lib/api/uploads";
import { formatFcfa } from "@/lib/format";
import { experience, downloadReceipt, ticketStatus } from "./api";
import "./experience.css";

export function ParcelExperience({ parcelId }: { parcelId: string }) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["experience", parcelId],
    queryFn: () => experience(parcelId),
    refetchInterval: 60_000,
    retry: false,
  });
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("delay");
  const [message, setMessage] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const attempt = useRef<{ key: string; id: string } | null>(null);
  const value = query.data;
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      const body = { reason, message, photos };
      const key = JSON.stringify(body);
      // Le même contenu conserve sa clé après une panne réseau ; une saisie
      // modifiée devient une nouvelle demande explicite.
      if (attempt.current?.key !== key)
        attempt.current = { key, id: crypto.randomUUID() };
      await api.post(`/experience/parcels/${parcelId}/complaints`, {
        ...body,
        requestId: attempt.current.id,
      });
      setOpen(false);
      setMessage("");
      setPhotos([]);
      attempt.current = null;
      await queryClient.invalidateQueries({
        queryKey: ["experience", parcelId],
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  if (query.isLoading) return <p role="status">Chargement du récapitulatif…</p>;
  if (!value)
    return (
      <Card>
        <p>Le récapitulatif est indisponible.</p>
        <Button variant="secondary" onClick={() => query.refetch()}>
          Réessayer
        </Button>
      </Card>
    );
  const f = value.finance;
  const money = (n: number | null | undefined) =>
    n == null ? "À confirmer" : formatFcfa(n);
  return (
    <section
      className="experience-stack"
      aria-label="Actions et récapitulatif du colis"
    >
      <Card>
        <div className="experience-next">
          <h2>{value.nextAction.title}</h2>
          <p>{value.nextAction.description}</p>
        </div>
        {value.tracking.overdue && (
          <Toast
            tone="warning"
            message="L’heure estimée de livraison est dépassée. Contactez le chauffeur pour une mise à jour."
          />
        )}
        {value.tracking.lastPositionAt && (
          <p>
            Dernière position :{" "}
            {new Date(value.tracking.lastPositionAt).toLocaleString("fr-FR")}.{" "}
            {value.tracking.positionFresh
              ? "Position récente."
              : "Position ancienne, le véhicule peut avoir bougé."}
          </p>
        )}
      </Card>
      <Card>
        <details>
          <summary style={{ cursor: "pointer", fontWeight: 700 }}>
            Récapitulatif financier
          </summary>
          <dl className="experience-money">
            <div>
              <dt>Prix convenu</dt>
              <dd>{money(f.agreedPrice)}</dd>
            </div>
            <div>
              <dt>Paiements confirmés</dt>
              <dd>{money(f.collected)}</dd>
            </div>
            {f.commission !== undefined && (
              <>
                <div>
                  <dt>
                    Commission{" "}
                    {f.commissionEstimated ? "(estimation)" : "(enregistrée)"}
                  </dt>
                  <dd>{money(f.commission)}</dd>
                </div>
                <div>
                  <dt>
                    Net après commission{" "}
                    {f.commissionEstimated ? "(estimé)" : ""}
                  </dt>
                  <dd>{money(f.netAfterCommission)}</dd>
                </div>
                <div>
                  <dt>Commission réglée</dt>
                  <dd>{money(f.paidCommission)}</dd>
                </div>
                <div>
                  <dt>Dette créée sur ce colis</dt>
                  <dd>{money(f.debtCreated)}</dd>
                </div>
                <div>
                  <dt>Dette actuelle du compte</dt>
                  <dd>{money(f.accountCommissionDebt)}</dd>
                </div>
              </>
            )}
            {f.parcelPenaltyDue !== undefined && (
              <div>
                <dt>Pénalités restant à régler</dt>
                <dd>{money(f.parcelPenaltyDue)}</dd>
              </div>
            )}
          </dl>
          {f.commissionEstimated && (
            <p>
              Le montant final dépend des écritures enregistrées lors du
              règlement.
            </p>
          )}
          {value.receipts.map((receipt) => (
            <Button
              key={receipt.id}
              variant="secondary"
              icon="download"
              onClick={() => downloadReceipt(receipt, value.trackingNumber)}
            >
              Reçu de {formatFcfa(Number(receipt.amount))}
            </Button>
          ))}
        </details>
      </Card>
      <Card>
        <h2>Besoin d’aide sur ce colis ?</h2>
        {value.complaints.map((c) => (
          <div className="experience-row" key={c.id}>
            <div>
              {c.subject}
              <small>{c.reference}</small>
            </div>
            <div>
              <strong>{ticketStatus(c.status)}</strong>
              <br />
              <Link to={`/support?ticket=${c.id}`}>
                Suivre cette réclamation
              </Link>
            </div>
          </div>
        ))}
        <div className="experience-actions">
          <Button
            variant="secondary"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
          >
            Signaler un problème
          </Button>
          <Link to="/support">Ouvrir la conversation avec le support</Link>
        </div>
        {open && (
          <form
            className="experience-stack"
            onSubmit={submit}
            style={{ marginTop: 16 }}
          >
            <Select
              label="Motif"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              options={[
                { value: "delay", label: "Retard" },
                { value: "damage", label: "Colis endommagé" },
                { value: "missing", label: "Colis manquant" },
                { value: "payment", label: "Paiement" },
                { value: "other", label: "Autre problème" },
              ]}
            />
            <Textarea
              label="Décrivez le problème"
              required
              minLength={10}
              maxLength={3000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <label>
              Photos ({photos.length}/4)
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={busy || photos.length >= 4}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 10 * 1024 * 1024) {
                    setError("Photo trop volumineuse (10 Mo maximum).");
                    return;
                  }
                  setBusy(true);
                  setError("");
                  try {
                    const url = await uploadChatPhoto(file, file.name);
                    setPhotos((p) => [...p, url]);
                  } catch (err) {
                    setError((err as Error).message);
                  } finally {
                    setBusy(false);
                    e.target.value = "";
                  }
                }}
              />
            </label>
            {photos.map((url, index) => (
              <div key={url} className="experience-actions">
                <img
                  src={url}
                  alt={`Pièce jointe ${index + 1}`}
                  width={80}
                  height={80}
                  style={{ objectFit: "cover" }}
                />
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() => setPhotos((p) => p.filter((u) => u !== url))}
                >
                  Retirer la photo {index + 1}
                </Button>
              </div>
            ))}
            {error && <Toast tone="error" message={error} />}
            <Button type="submit" loading={busy}>
              Envoyer la réclamation
            </Button>
          </form>
        )}
      </Card>
      {value.canRepeat && (
        <Link to={`/client/nouveau?source=${parcelId}`}>
          Envoyer un colis similaire
        </Link>
      )}
    </section>
  );
}
