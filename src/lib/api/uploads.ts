import { compressPhoto } from "../compressPhoto";
import { api } from "./client";

type MediaKind = "photo" | "video" | "audio";

/**
 * Upload a file as multipart/form-data and attach it to a parcel.
 * Multipart avoids the ~33% base64 inflation, so large photos/audio stay
 * well within limits. Accepts a Blob or a data-URL string (converted to a Blob).
 */
async function uploadParcelMedia(
  kind: MediaKind,
  file: Blob | string,
  filename: string,
  parcelId: string,
  requestId?: string,
): Promise<string> {
  const blob =
    typeof file === "string" ? await (await fetch(file)).blob() : file;
  // Le journal contient déjà les photos réduites. Une reprise doit conserver
  // exactement leurs octets et leur nom, même après une mise à jour du navigateur.
  const optimized =
    kind === "photo" && !requestId ? await compressPhoto(blob) : blob;
  const form = new FormData();
  form.append(
    "file",
    optimized,
    optimized !== blob ? filename.replace(/\.[^.]+$/, "") + ".jpg" : filename,
  );
  form.append("mediaType", kind);
  form.append("parcelId", parcelId);
  if (requestId) form.append("requestId", requestId);
  const { data } = await api.post("/upload", form);
  return data.url as string;
}

export const uploadParcelPhoto = (
  file: Blob | string,
  filename: string,
  parcelId: string,
  requestId?: string,
) => uploadParcelMedia("photo", file, filename, parcelId, requestId);

export const uploadParcelVideo = (
  file: Blob | string,
  filename: string,
  parcelId: string,
  requestId?: string,
) => uploadParcelMedia("video", file, filename, parcelId, requestId);

export const uploadParcelAudio = (
  file: Blob | string,
  filename: string,
  parcelId: string,
  requestId?: string,
) => uploadParcelMedia("audio", file, filename, parcelId, requestId);

/** Upload a standalone audio clip (e.g. a chat voice message); returns its URL. */
export async function uploadChatAudio(
  file: Blob | string,
  filename = "message.webm",
): Promise<string> {
  const blob =
    typeof file === "string" ? await (await fetch(file)).blob() : file;
  const form = new FormData();
  form.append("file", blob, filename);
  form.append("mediaType", "audio");
  const { data } = await api.post("/upload", form);
  return data.url as string;
}

/** Upload a chat photo; returns its URL. */
export async function uploadChatPhoto(
  file: Blob,
  filename = "photo.jpg",
): Promise<string> {
  const optimized = await compressPhoto(file);
  const form = new FormData();
  form.append(
    "file",
    optimized,
    optimized !== file ? filename.replace(/\.[^.]+$/, "") + ".jpg" : filename,
  );
  form.append("mediaType", "photo");
  const { data } = await api.post("/upload", form);
  return data.url as string;
}

/** Upload a chat video; returns its URL. */
export async function uploadChatVideo(
  file: Blob,
  filename = "video.mp4",
): Promise<string> {
  const form = new FormData();
  form.append("file", file, filename);
  form.append("mediaType", "video");
  const { data } = await api.post("/upload", form);
  return data.url as string;
}

/**
 * Upload a user profile photo. Accepts a Blob or a data-URL string.
 * Compress before calling for best results (max ~1600 px, JPEG @ 0.8).
 * Returns the uploaded file URL.
 */
export async function uploadProfilePhoto(
  file: Blob | string,
  filename = "profile.jpg",
): Promise<string> {
  const blob =
    typeof file === "string" ? await (await fetch(file)).blob() : file;
  const form = new FormData();
  form.append("file", blob, filename);
  form.append("mediaType", "photo");
  const { data } = await api.post("/upload", form);
  return data.url as string;
}
