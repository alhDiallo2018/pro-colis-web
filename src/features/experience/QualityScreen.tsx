import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { Card, Button } from "@/ds";
import "./experience.css";
interface Quality {
  since: string;
  created: number;
  delivered: number;
  overdue: number;
  payments: Record<string, number>;
  tickets: Record<string, number>;
  creationAttempts: { started: number; abandoned: number };
  firstResponse: { minutes: number | null; sample: number };
}
export function QualityScreen() {
  const query = useQuery({
    queryKey: ["quality"],
    queryFn: async () => (await api.get("/quality")).data.quality as Quality,
  });
  const value = query.data;
  return (
    <main className="experience-stack">
      <h1>Qualité de service</h1>
      <p>
        Indicateurs sur les 30 derniers jours. Les délais de livraison utilisent
        les estimations enregistrées.
      </p>
      <Button
        variant="secondary"
        disabled={query.isFetching}
        onClick={() => query.refetch()}
      >
        Actualiser
      </Button>
      {query.isLoading && <p role="status">Chargement des indicateurs…</p>}
      {query.isError && (
        <p role="alert">Les indicateurs sont temporairement indisponibles.</p>
      )}
      {value && (
        <>
          <div className="experience-grid">
            {[
              ["Colis créés", value.created],
              ["Colis livrés", value.delivered],
              ["Livraisons en retard", value.overdue],
              ["Paiements échoués", value.payments.failed ?? 0],
              ["Créations commencées", value.creationAttempts.started],
              [
                "Abandons présumés après 24 h",
                value.creationAttempts.abandoned,
              ],
              [
                "Première réponse du support",
                value.firstResponse.minutes === null
                  ? "Pas encore de mesure"
                  : `${Math.round(value.firstResponse.minutes)} min`,
              ],
            ].map(([label, count]) => (
              <Card key={label}>
                <h2>{label}</h2>
                <p style={{ fontSize: 32, fontWeight: 700, margin: 0 }}>
                  {count}
                </p>
              </Card>
            ))}
          </div>
          <p>
            Les abandons concernent uniquement les formulaires instrumentés,
            sans création confirmée après 24 heures. Délai moyen du support
            calculé sur {value.firstResponse.sample} conversation(s) ayant une
            première réponse enregistrée.
          </p>
          <Card>
            <h2>Tickets de support</h2>
            {Object.entries(value.tickets).map(([status, count]) => (
              <p key={status}>
                {{
                  open: "Ouverts",
                  pending: "En attente",
                  in_progress: "En cours",
                  resolved: "Résolus",
                }[status] ?? status}{" "}
                : {count}
              </p>
            ))}
          </Card>
        </>
      )}
    </main>
  );
}
