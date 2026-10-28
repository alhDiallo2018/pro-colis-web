import type { CreateParcelPayload } from "./api/parcels";
import { api } from "./api/client";
export interface PendingMedia {
  id: string;
  kind: "photo" | "video" | "audio";
  name: string;
  data: string;
  sent?: boolean;
}
export interface PendingParcel {
  requestId: string;
  payload: CreateParcelPayload;
  parcelId?: string;
  media: PendingMedia[];
  savedAt: number;
}

function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("sendprocolis-submissions", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("items");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(
        new Error(
          "Stockage local indisponible. Libérez de l’espace avant de publier.",
        ),
      );
  });
}
export async function submissionStore<T>(
  key: string,
  operation: "get" | "put" | "delete",
  value?: T,
): Promise<T | undefined> {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(
          "items",
          operation === "get" ? "readonly" : "readwrite",
        ),
        store = tx.objectStore("items");
      const request =
        operation === "get"
          ? store.get(key)
          : operation === "put"
            ? store.put(value, key)
            : store.delete(key);
      // Attendre le commit, pas seulement la requête : une panne de stockage ne
      // doit pas laisser partir une publication sans clé de reprise durable.
      tx.oncomplete = () => resolve(request.result as T | undefined);
      tx.onerror = () =>
        reject(
          new Error(
            "Sauvegarde locale impossible. Votre envoi n’a pas été relancé.",
          ),
        );
      tx.onabort = () => reject(new Error("Sauvegarde locale interrompue."));
    });
  } finally {
    db.close();
  }
}
export async function clearSubmissionStore() {
  if (typeof indexedDB === "undefined") return;
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("items", "readwrite");
      tx.objectStore("items").clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
export function creationEvent(
  attemptId: string,
  event:
    | "creation_started"
    | "creation_submitted"
    | "creation_failed"
    | "creation_completed",
) {
  void api
    .post("/experience/events", { attemptId, event, platform: "web" })
    .catch(() => {});
}
