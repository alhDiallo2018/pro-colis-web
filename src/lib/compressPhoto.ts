/** Réduire les photos de colis seulement. Les signatures et documents restent
 * inchangés ; un format non décodable conserve son fichier d'origine. */
export async function compressPhoto(blob: Blob): Promise<Blob> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(blob.type) || blob.size < 300_000 || typeof createImageBitmap !== 'function') return blob
  let bitmap: ImageBitmap | undefined
  try {
    bitmap = await createImageBitmap(blob)
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale)
    const context = canvas.getContext('2d'); if (!context) return blob
    context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const result = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.82))
    return result && result.size < blob.size ? result : blob
  } catch { return blob } finally { bitmap?.close() }
}
