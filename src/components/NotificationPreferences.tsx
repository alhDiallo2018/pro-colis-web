import { useState, useEffect, useCallback } from 'react'
import { Card, Switch, Toast, Button } from '@/ds'
import {
  type NotificationEventType,
  type NotificationChannel,
  type NotificationPreference,
  ALL_EVENT_TYPES,
  loadPreferences,
  savePreferences,
} from '@/lib/notifications'
import { getPreferences, updatePreferences } from '@/lib/api/notifications'

const EVENT_LABELS: Record<NotificationEventType, { label: string; icon: string }> = {
  parcel_created: { label: 'Colis créé', icon: 'package_2' },
  parcel_confirmed: { label: 'Colis confirmé', icon: 'check_circle' },
  parcel_picked_up: { label: 'Colis ramassé', icon: 'inventory' },
  parcel_in_transit: { label: 'Colis en transit', icon: 'local_shipping' },
  parcel_arrived: { label: 'Colis arrivé', icon: 'flag' },
  parcel_out_for_delivery: { label: 'En cours de livraison', icon: 'delivery_dining' },
  parcel_delivered: { label: 'Colis livré', icon: 'verified' },
  parcel_cancelled: { label: 'Colis annulé', icon: 'cancel' },
  bid_received: { label: 'Offre reçue', icon: 'inbox' },
  bid_accepted: { label: 'Offre acceptée', icon: 'thumb_up' },
  bid_rejected: { label: 'Offre refusée', icon: 'thumb_down' },
  driver_assigned: { label: 'Chauffeur assigné', icon: 'person' },
  payment_confirmed: { label: 'Paiement confirmé', icon: 'payment' },
  welcome: { label: 'Bienvenue', icon: 'waving_hand' },
  password_reset: { label: 'Mot de passe oublié', icon: 'lock_reset' },
  verification: { label: 'Vérification', icon: 'verified_user' },
  account_suspended: { label: 'Compte suspendu', icon: 'block' },
}

interface NotificationPreferencesSheetProps {
  userEmail?: string | null
  userPhone?: string | null
}

export function NotificationPreferencesSheet({ userEmail, userPhone }: NotificationPreferencesSheetProps) {
  const [prefs, setPrefs] = useState<NotificationPreference[]>(() => loadPreferences())
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  // Source de vérité : le serveur. Repli sur les défauts locaux si le serveur est vide.
  useEffect(() => {
    let alive = true
    getPreferences()
      .then((server) => {
        if (alive && Array.isArray(server) && server.length > 0) setPrefs(server)
      })
      .catch(() => { /* garde les valeurs locales par défaut */ })
    return () => { alive = false }
  }, [])

  useEffect(() => {
    if (saved) {
      const t = setTimeout(() => setSaved(false), 3000)
      return () => clearTimeout(t)
    }
  }, [saved])

  const toggle = useCallback((eventType: NotificationEventType, channel: NotificationChannel) => {
    setPrefs((prev) => {
      const next = prev.map((p) => {
        if (p.eventType !== eventType) return p
        const has = p.channels.includes(channel)
        const channels = has
          ? p.channels.filter((c) => c !== channel)
          : [...p.channels, channel]
        return { ...p, channels }
      })
      return next
    })
    setSaved(false)
  }, [])

  const handleSave = async () => {
    setSaving(true)
    savePreferences(prefs) // cache local : le déclencheur email/SMS client lit encore le localStorage
    try {
      await updatePreferences(prefs) // persistance serveur (source de vérité)
    } catch {
      /* en cas d'échec réseau, la copie locale reste appliquée */
    } finally {
      setSaving(false)
      setSaved(true)
    }
  }

  return (
    <Card padding="lg">
      <h3 style={{ margin: '0 0 4px', fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h3)', color: 'var(--text-strong)' }}>
        Préférences de notification
      </h3>
      <p style={{ margin: '0 0 16px', fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>
        Choisissez comment vous souhaitez être notifié pour chaque type d'événement.
      </p>

      {!userEmail && !userPhone && (
        <Toast
          tone="info"
          message="Ajoutez votre email ou téléphone dans votre profil pour activer les notifications email et SMS."
          style={{ marginBottom: 16 }}
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '8px 0' }}>
          <div style={{ flex: 1 }} />
          <div style={{ width: 60, textAlign: 'center', fontSize: 'var(--fs-xs)', fontWeight: 600, color: 'var(--text-muted)' }}>App</div>
          <div style={{ width: 60, textAlign: 'center', fontSize: 'var(--fs-xs)', fontWeight: 600, color: !userEmail ? 'var(--text-disabled)' : 'var(--text-muted)' }}>Email</div>
          <div style={{ width: 60, textAlign: 'center', fontSize: 'var(--fs-xs)', fontWeight: 600, color: !userPhone ? 'var(--text-disabled)' : 'var(--text-muted)' }}>SMS</div>
        </div>

        {ALL_EVENT_TYPES.map((eventType) => {
          const entry = prefs.find((p) => p.eventType === eventType)
          const channels = entry?.channels ?? ['in_app']
          const info = EVENT_LABELS[eventType]
          return (
            <div
              key={eventType}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 0',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18, color: 'var(--text-muted)' }}>
                  {info.icon}
                </span>
                <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-strong)' }}>{info.label}</span>
              </div>

              <div style={{ width: 60, display: 'flex', justifyContent: 'center' }}>
                <Switch checked disabled />
              </div>

              <div style={{ width: 60, display: 'flex', justifyContent: 'center' }}>
                <Switch
                  checked={channels.includes('email')}
                  disabled={!userEmail}
                  onChange={() => toggle(eventType, 'email')}
                />
              </div>

              <div style={{ width: 60, display: 'flex', justifyContent: 'center' }}>
                <Switch
                  checked={channels.includes('sms')}
                  disabled={!userPhone}
                  onChange={() => toggle(eventType, 'sms')}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Button icon="save" onClick={handleSave} loading={saving}>
          Enregistrer les préférences
        </Button>
        {saved && <Toast tone="success" message="Préférences enregistrées." />}
      </div>
    </Card>
  )
}
