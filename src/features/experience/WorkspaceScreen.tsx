import { parseShipmentLines } from "./shipmentLines";
import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button, Card, Input, Select, Textarea, Toast } from "@/ds";
import { api } from "@/lib/api/client";
import { useZones } from "@/features/client/hooks";
import {
  downloadReceipt,
  removeDraft,
  workspace,
  type ShipmentDraft,
} from "./api";
import { formatFcfa } from "@/lib/format";
import "./experience.css";

export function WorkspaceScreen() {
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["shipment-workspace", page],
    queryFn: () => workspace(page),
  });
  const recipients = useQuery({
    queryKey: ["saved-recipients"],
    queryFn: async () =>
      (await api.get("/experience/recipients")).data.recipients as {
        id: string;
        name: string;
        phone: string;
      }[],
  });
  const [contact, setContact] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });
  const contactRequest = useRef(crypto.randomUUID());
  const zones = useZones();
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<ShipmentDraft[]>([]);
  const [departure, setDeparture] = useState("");
  const [arrival, setArrival] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const running = useRef(false);
  const act = async (operation: () => Promise<unknown>, message: string) => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await operation();
      setNotice(message);
      await query.refetch();
      await recipients.refetch();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      running.current = false;
      setBusy(false);
    }
  };
  const options = (zones.data ?? []).map((z) => ({
    value: z.id,
    label: z.name,
  }));
  const zoneName = (id: string) =>
    options.find((z) => z.value === id)?.label ?? "Zone à vérifier";
  return (
    <main
      className="experience-stack"
      style={{ maxWidth: 960, margin: "0 auto" }}
    >
      <div>
        <h1>Mes outils d’envoi</h1>
        <p>
          Préparez vos envois réguliers, retrouvez vos reçus et surveillez les
          trajets qui vous intéressent.
        </p>
      </div>
      {error && <Toast tone="error" message={error} />}
      {notice && <p role="status">{notice}</p>}
      {query.isError && (
        <Card>
          <p>Impossible de charger vos outils.</p>
          <Button onClick={() => query.refetch()}>Réessayer</Button>
        </Card>
      )}
      {query.isLoading && <p role="status">Chargement…</p>}
      <Card>
        <h2>Préparer plusieurs colis</h2>
        <p>
          Collez jusqu’à 50 lignes. Chaque colis sera relu dans le formulaire
          habituel avant sa publication.
        </p>
        <label className="experience-stack">
          Importer un fichier CSV ou Excel (.xlsx)
          <input
            type="file"
            accept=".csv,.xlsx"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              setPreview([]);
              if (file.size > 2 * 1024 * 1024) {
                setError("Fichier limité à 2 Mo.");
                return;
              }
              void act(async () => {
                const form = new FormData();
                form.append("file", file);
                const { data } = await api.post(
                  "/experience/imports/preview",
                  form,
                );
                if (data.errors.length)
                  throw new Error(
                    data.errors
                      .map(
                        (v: { line: number; message: string }) =>
                          `Ligne ${v.line} : ${v.message}`,
                      )
                      .join(" — "),
                  );
                setPreview(data.drafts);
              }, "Fichier vérifié. Relisez les destinataires avant d’enregistrer.");
            }}
          />
        </label>
        <p>
          Une feuille, 50 colis maximum. En-têtes : nom, téléphone, description,
          poids ; adresse et email facultatifs. Aucune publication automatique.
        </p>
        <Textarea
          label="Nom ; téléphone ; description ; poids en kg"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setPreview([]);
          }}
          placeholder="Awa Diop ; +221770000000 ; Documents ; 1"
          rows={5}
          maxLength={100000}
        />
        <Button
          variant="secondary"
          disabled={busy}
          onClick={() => {
            try {
              setPreview(parseShipmentLines(text));
              setError("");
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        >
          Vérifier les lignes
        </Button>
        {preview.length > 0 && (
          <div className="experience-stack">
            <p>{preview.length} brouillon(s) prêt(s) à enregistrer.</p>
            {preview.map((d, i) => (
              <div className="experience-row" key={d.id}>
                <span>
                  {i + 1}. {d.label} · {String(d.data.receiverPhone)}
                </span>
                <span>{String(d.data.weight)} kg</span>
              </div>
            ))}
            <Button
              loading={busy}
              onClick={() =>
                act(async () => {
                  await api.post("/experience/drafts", { drafts: preview });
                  setPreview([]);
                  setText("");
                }, "Brouillons enregistrés. Ouvrez chaque colis pour le compléter.")
              }
            >
              Enregistrer les brouillons
            </Button>
          </div>
        )}
        {!!query.data?.drafts.length && (
          <p role="status">
            {query.data.drafts.filter((d) => d.completedParcelId).length} /{" "}
            {query.data.drafts.length} colis publiés dans votre liste.
          </p>
        )}
        {(query.data?.drafts ?? []).map((d) => (
          <div className="experience-row" key={d.id}>
            <strong>{d.label}</strong>
            <div className="experience-actions">
              <Button
                size="sm"
                onClick={() =>
                  navigate(
                    d.completedParcelId
                      ? `/client/colis/${d.completedParcelId}`
                      : `/client/nouveau?draft=${d.id}`,
                  )
                }
              >
                {d.completedParcelId ? "Publié · Voir le colis" : "Compléter"}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={busy}
                onClick={() =>
                  act(() => removeDraft(d.id), "Brouillon supprimé.")
                }
              >
                Supprimer
              </Button>
            </div>
          </div>
        ))}
      </Card>
      <Card>
        <h2>Mes destinataires</h2>
        <p>Retrouvez leurs coordonnées pour préparer un nouvel envoi.</p>
        <form
          className="experience-stack"
          onSubmit={(e) => {
            e.preventDefault();
            void act(async () => {
              await api.post("/experience/recipients", {
                ...contact,
                requestId: contactRequest.current,
              });
              contactRequest.current = crypto.randomUUID();
              setContact({ name: "", phone: "", email: "", address: "" });
            }, "Destinataire enregistré.");
          }}
        >
          <div className="experience-grid">
            {(["name", "phone", "email", "address"] as const).map((field) => (
              <Input
                key={field}
                label={
                  {
                    name: "Nom",
                    phone: "Téléphone",
                    email: "Email (facultatif)",
                    address: "Adresse (facultatif)",
                  }[field]
                }
                type={
                  field === "phone"
                    ? "tel"
                    : field === "email"
                      ? "email"
                      : "text"
                }
                required={field === "name" || field === "phone"}
                maxLength={
                  field === "address" ? 500 : field === "phone" ? 30 : 100
                }
                value={contact[field]}
                onChange={(e) => {
                  contactRequest.current = crypto.randomUUID();
                  setContact({ ...contact, [field]: e.target.value });
                }}
              />
            ))}
          </div>
          <Button type="submit" loading={busy}>
            Enregistrer le destinataire
          </Button>
        </form>
        {recipients.isError && (
          <p role="alert">
            Carnet indisponible.{" "}
            <Button onClick={() => recipients.refetch()}>Réessayer</Button>
          </p>
        )}
        {recipients.data?.map((r) => (
          <div className="experience-row" key={r.id}>
            <span>
              {r.name}
              <small>{r.phone}</small>
            </span>
            <div className="experience-actions">
              <Link to={`/client/nouveau?recipient=${r.id}`}>
                Préparer un envoi
              </Link>
              <Button
                size="sm"
                variant="secondary"
                disabled={busy}
                onClick={() =>
                  act(
                    () => api.delete(`/experience/recipients/${r.id}`),
                    "Destinataire supprimé.",
                  )
                }
              >
                Supprimer
              </Button>
            </div>
          </div>
        ))}
      </Card>
      <Card>
        <h2>Alertes de trajet</h2>
        <p>
          Une notification dans l’application lorsqu’un nouveau départ
          correspond au sens choisi. Valable 30 jours, désactivable à tout
          moment.
        </p>
        <form
          className="experience-stack"
          onSubmit={(e) => {
            e.preventDefault();
            void act(async () => {
              await api.post("/experience/alerts", {
                departureZoneId: departure,
                arrivalZoneId: arrival,
                consent,
              });
              setConsent(false);
            }, "Alerte activée pour 30 jours.");
          }}
        >
          <div className="experience-grid">
            <Select
              label="Départ"
              required
              placeholder="Choisir une zone"
              value={departure}
              options={options}
              onChange={(e) => setDeparture(e.target.value)}
            />
            <Select
              label="Arrivée"
              required
              placeholder="Choisir une zone"
              value={arrival}
              options={options}
              onChange={(e) => setArrival(e.target.value)}
            />
          </div>
          <label className="experience-check">
            <input
              type="checkbox"
              checked={consent}
              required
              onChange={(e) => setConsent(e.target.checked)}
            />
            Je souhaite recevoir ces alertes dans SendProColis.
          </label>
          <Button
            type="submit"
            loading={busy}
            disabled={
              !consent || !departure || !arrival || departure === arrival
            }
          >
            Activer l’alerte
          </Button>
        </form>
        {(query.data?.alerts ?? []).map((a) => (
          <div className="experience-row" key={a.id}>
            <div>
              {zoneName(a.departureZoneId)} → {zoneName(a.arrivalZoneId)}
              <small>
                Jusqu’au {new Date(a.expiresAt).toLocaleDateString("fr-FR")}
              </small>
            </div>
            <Button
              variant="secondary"
              size="sm"
              disabled={busy}
              onClick={() =>
                act(
                  () => api.delete(`/experience/alerts/${a.id}`),
                  "Alerte désactivée.",
                )
              }
            >
              Désactiver
            </Button>
          </div>
        ))}
      </Card>
      <Card>
        <h2>Historique et reçus</h2>
        <p>Les reçus apparaissent après confirmation du paiement.</p>
        <Link to="/client/colis">Consulter tous mes envois</Link>
        {query.data?.receipts.length === 0 && (
          <p>Aucun paiement confirmé sur cette page.</p>
        )}
        {(query.data?.receipts ?? []).map((r) => (
          <div className="experience-row" key={r.id}>
            <div>
              <Link to={`/client/colis/${r.parcelId}`}>
                {r.parcel?.trackingNumber}
              </Link>
              <small>
                {new Date(r.createdAt).toLocaleDateString("fr-FR")} ·{" "}
                {formatFcfa(Number(r.amount))}
              </small>
            </div>
            <Button
              variant="secondary"
              size="sm"
              icon="download"
              onClick={() => downloadReceipt(r, r.parcel?.trackingNumber ?? "")}
            >
              Reçu
            </Button>
          </div>
        ))}
        <div className="experience-actions">
          <Button
            variant="secondary"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Précédent
          </Button>
          <span>Page {page}</span>
          <Button
            variant="secondary"
            disabled={!query.data?.hasMore}
            onClick={() => setPage((p) => p + 1)}
          >
            Suivant
          </Button>
        </div>
      </Card>
    </main>
  );
}
