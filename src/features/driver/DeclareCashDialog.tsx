import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Button, Dialog, Icon, IconButton, Input, Textarea } from '@/ds'
import { ApiError } from '@/lib/api/client'
import * as cashApi from '@/lib/api/cash-payments'
import { uploadParcelPhoto } from '@/lib/api/uploads'
import { queryClient } from '@/lib/queryClient'
import { formatFcfa } from '@/lib/format'
import type { Parcel } from '@/lib/api/types'
import { payableAmount, resolvedCollectionPoint } from './cashDeclaration'

/**
 * Déclaration d'encaissement en espèces — pendant web de
 * `declare_cash_payment_sheet.dart`.
 *
 * Sur une course réglée en espèces, la plateforme n'encaisse rien : l'argent
 * passe de main en main. Le chauffeur le signale ici pour que la course soit
 * réconciliée, puis un admin valide.
 */
export function DeclareCashDialog({
  parcel,
  onClose,
  onDeclared,
}: {
  parcel: Parcel | null
  onClose: () => void
  onDeclared?: (parcel: Parcel) => void
}) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [proof, setProof] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const expected = parcel ? payableAmount(parcel) : 0
  const point = parcel ? resolvedCollectionPoint(parcel) : 'receiver_delivery'
  const atPickup = point === 'sender_pickup'

  // Le montant convenu est proposé d'emblée : c'est la valeur attendue dans la
  // très grande majorité des cas.
  useEffect(() => {
    if (!parcel) return
    setAmount(expected > 0 ? String(Math.round(expected)) : '')
    setNote('')
    setProof(null)
    setProofPreview(null)
    setError(null)
  }, [parcel, expected])

  // L'aperçu est un object URL : le révoquer évite de fuir un blob par photo.
  useEffect(() => {
    if (!proof) {
      setProofPreview(null)
      return
    }
    const url = URL.createObjectURL(proof)
    setProofPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [proof])

  const declare = useMutation({
    mutationFn: async (payload: { parcelId: string; amount: number }) => {
      // La preuve est facultative : si le téléversement échoue, on déclare
      // quand même plutôt que de bloquer le chauffeur.
      let proofUrl: string | undefined
      if (proof) {
        try {
          proofUrl = await uploadParcelPhoto(proof, proof.name || 'preuve.jpg', payload.parcelId)
        } catch {
          proofUrl = undefined
        }
      }
      return cashApi.declareCashCollection(payload.parcelId, {
        amount: payload.amount,
        collectionPoint: point,
        note: note.trim() || undefined,
        proofUrl,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver'] })
      queryClient.invalidateQueries({ queryKey: ['parcels'] })
    },
  })

  if (!parcel) return null

  const declared = Number(amount.replace(/\s/g, '')) || 0
  const gap = expected > 0 && declared > 0 && declared !== expected ? declared - expected : 0
  const canSubmit = declared > 0 && !declare.isPending

  const submit = () => {
    if (!canSubmit) return
    setError(null)
    declare.mutate(
      { parcelId: parcel.id, amount: declared },
      {
        onSuccess: () => {
          onClose()
          onDeclared?.(parcel)
        },
        onError: (submitError) => {
          setError(submitError instanceof ApiError ? submitError.message : 'Déclaration impossible. Réessayez.')
        },
      },
    )
  }

  const payer = atPickup
    ? parcel.senderName?.trim() || "l'expéditeur"
    : parcel.receiverName?.trim() || 'le destinataire'

  return (
    <Dialog
      open
      onClose={onClose}
      icon="payments"
      iconTone="amber"
      size="lg"
      title="Encaissement en espèces"
      actions={
        <>
          <Button variant="secondary" block onClick={onClose}>
            Plus tard
          </Button>
          <Button block icon="verified" loading={declare.isPending} disabled={!canSubmit} onClick={submit}>
            Confirmer l’encaissement
          </Button>
        </>
      }
    >
      <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div
          style={{
            padding: 14,
            borderRadius: 'var(--radius-md)',
            background: 'var(--amber-50)',
            color: 'var(--amber-700)',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 13.5 }}>
            <Icon name={atPickup ? 'inventory_2' : 'how_to_reg'} size={17} />
            {atPickup ? "Encaissé auprès de l'expéditeur" : 'Encaissé auprès du destinataire'}
          </div>
          <div style={{ fontSize: 12.5, lineHeight: 1.4 }}>
            Confirmez le montant reçu de {payer} {atPickup ? 'en récupérant le colis' : 'à la remise du colis'}.
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, fontWeight: 700 }}>{parcel.trackingNumber}</div>
          {expected > 0 && (
            <>
              <div style={{ height: 1, background: 'var(--amber-200)', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5 }}>
                <span>Montant convenu</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 14 }}>{formatFcfa(expected)}</span>
              </div>
            </>
          )}
        </div>

        <Input
          label="Montant encaissé (FCFA)"
          icon="payments"
          inputMode="numeric"
          mono
          placeholder={expected > 0 ? String(Math.round(expected)) : 'Ex : 12000'}
          value={amount}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setAmount(e.target.value.replace(/\D/g, ''))}
        />

        {gap !== 0 && (
          <div
            style={{
              display: 'flex',
              gap: 8,
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--amber-50)',
              color: 'var(--amber-700)',
              fontSize: 12,
              fontWeight: 600,
              lineHeight: 1.35,
            }}
          >
            <Icon name="warning" size={17} />
            <span>
              {gap < 0
                ? `Il manque ${formatFcfa(Math.abs(gap))} par rapport au montant convenu.`
                : `Vous déclarez ${formatFcfa(gap)} de plus que le montant convenu.`}{' '}
              Précisez pourquoi dans la note.
            </span>
          </div>
        )}

        <Textarea
          label="Note (optionnel)"
          rows={3}
          maxLength={200}
          placeholder="Ex : payé en billets, remis au garage d’arrivée."
          value={note}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNote(e.target.value)}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--slate-700)' }}>Preuve (optionnel)</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {proofPreview && (
              <img
                src={proofPreview}
                alt="Preuve d’encaissement"
                style={{
                  width: 64,
                  height: 64,
                  objectFit: 'cover',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--slate-200)',
                }}
              />
            )}
            <Button
              variant="secondary"
              icon="photo_camera"
              disabled={declare.isPending}
              onClick={() => fileInput.current?.click()}
            >
              {proof ? 'Remplacer' : 'Photo'}
            </Button>
            {proof && (
              <IconButton
                icon="delete"
                variant="danger"
                aria-label="Retirer la preuve"
                disabled={declare.isPending}
                onClick={() => setProof(null)}
              />
            )}
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={(e: ChangeEvent<HTMLInputElement>) => setProof(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>

        {error && <span style={{ color: 'var(--red-500)', fontSize: 12.5 }}>{error}</span>}

        <span style={{ fontSize: 11.5, color: 'var(--text-muted)', textAlign: 'center' }}>
          Un administrateur validera cet encaissement.
        </span>
      </div>
    </Dialog>
  )
}
