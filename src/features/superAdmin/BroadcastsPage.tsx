import { useState, useEffect } from 'react'
import { Button, Input, Toast } from '@/ds'
import { loadBroadcasts, saveBroadcasts, type Broadcast } from '@/lib/broadcasts'
import { adminLoadBroadcasts, adminSaveBroadcasts } from '@/lib/api/broadcasts'

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function empty(): Broadcast {
  const now = new Date().toISOString().slice(0, 10)
  return {
    id: '',
    title: '',
    message: '',
    imageUrl: '',
    scroll: true,
    targetRoles: ['client', 'driver'],
    type: 'info',
    active: true,
    startsAt: now,
    endsAt: new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10),
    createdAt: now,
  }
}

function roleLabel(r: Broadcast['targetRoles'][number]) {
  return {
    client: 'Client',
    driver: 'Chauffeur',
    admin: 'Admin zone',
    super_admin: 'Super Admin',
    support: 'Support',
    support_technique: 'Support technique',
    support_commercial: 'Support commercial',
  }[r]
}

export default function BroadcastsPage() {
  const [list, setList] = useState<Broadcast[]>([])
  const [editing, setEditing] = useState<Broadcast | null>(null)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminLoadBroadcasts()
      .then((b) => {
        setList(b)
        saveBroadcasts(b)
      })
      .catch(() => { setList(loadBroadcasts()) })
      .finally(() => setLoading(false))
  }, [])

  function persist(next: Broadcast[]) {
    setList(next)
    saveBroadcasts(next)
    adminSaveBroadcasts(next).catch(() => {})
  }

  function save(b: Broadcast) {
    const next = b.id
      ? list.map((x) => (x.id === b.id ? { ...b } : x))
      : [...list, { ...b, id: uid(), createdAt: new Date().toISOString().slice(0, 10) }] as Broadcast[]
    persist(next)
    setEditing(null)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function remove(id: string) {
    persist(list.filter((x) => x.id !== id))
  }

  function toggle(id: string) {
    persist(list.map((x) => (x.id === id ? { ...x, active: !x.active } : x)))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--text-strong)', margin: '0 0 4px' }}>
            Bandeaux d'information
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
            Diffusez un message ciblé dans la barre supérieure des utilisateurs.
          </p>
        </div>
        <Button
          icon="add"
          onClick={() => setEditing(empty())}
          disabled={editing !== null}
        >
          Nouveau bandeau
        </Button>
      </div>

      {saved && <Toast tone="success" message="Bandeau enregistré." />}

      {editing && (
        <BroadcastForm
          broadcast={editing}
          onSave={save}
          onCancel={() => setEditing(null)}
        />
      )}

      {list.length === 0 && !editing && !loading && (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)', fontSize: 14 }}>
          Aucun bandeau pour le moment.
        </div>
      )}
      {loading && (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)', fontSize: 14 }}>
          Chargement...
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {list.map((b) => (
          <div
            key={b.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '14px 18px',
              background: b.active ? 'var(--surface-card)' : 'var(--surface-sunken)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 12,
              opacity: b.active ? 1 : 0.55,
            }}
          >
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36, borderRadius: 8,
              background: b.type === 'warning' ? 'var(--amber-50)' :
                b.type === 'success' ? 'var(--green-50)' :
                b.type === 'promo' ? '#E7EEFC' : '#E7EEFC',
              color: b.type === 'warning' ? 'var(--amber-700)' :
                b.type === 'success' ? 'var(--green-700)' :
                b.type === 'promo' ? '#1D4ED8' : '#1D4ED8',
              flex: 'none',
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: 20 }}>
                {b.type === 'warning' ? 'campaign' : b.type === 'success' ? 'check_circle' : b.type === 'promo' ? 'sell' : 'info'}
              </span>
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--text-strong)' }}>
                  {b.title || 'Sans titre'}
                </span>
                {b.scroll && (
                  <span style={{ fontSize: 10, fontWeight: 700, background: 'var(--color-primary-soft)', color: 'var(--color-primary)', padding: '1px 6px', borderRadius: 99 }}>
                    DÉFILANT
                  </span>
                )}
                {b.imageUrl && (
                  <span className="material-symbols-rounded" style={{ fontSize: 16, color: 'var(--text-muted)' }}>image</span>
                )}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {b.message}
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 11.5, color: 'var(--text-faint)' }}>
                <span>{b.targetRoles.map(roleLabel).join(', ')}</span>
                <span>{b.startsAt} → {b.endsAt}</span>
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', flex: 'none' }}>
              <input type="checkbox" checked={b.active} onChange={() => toggle(b.id)} />
              Actif
            </label>
            <Button variant="ghost" size="sm" icon="edit" onClick={() => setEditing({ ...b })} />
            <Button variant="ghost" size="sm" icon="delete" tone="danger" onClick={() => remove(b.id)} />
          </div>
        ))}
      </div>
    </div>
  )
}

function BroadcastForm({
  broadcast,
  onSave,
  onCancel,
}: {
  broadcast: Broadcast
  onSave: (b: Broadcast) => void
  onCancel: () => void
}) {
  const [b, setB] = useState<Broadcast>({ ...broadcast })

  function set<K extends keyof Broadcast>(k: K, v: Broadcast[K]) {
    setB((p) => ({ ...p, [k]: v }))
  }

  function toggleRole(r: Broadcast['targetRoles'][number]) {
    setB((p) => ({
      ...p,
      targetRoles: p.targetRoles.includes(r) ? p.targetRoles.filter((x) => x !== r) : [...p.targetRoles, r],
    }))
  }

  return (
    <div style={{
      background: 'var(--surface-card)', border: '1px solid var(--border-subtle)',
      borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 18,
    }}>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--text-strong)' }}>
        {b.id ? 'Modifier le bandeau' : 'Nouveau bandeau'}
      </div>

      <Input label="Titre" value={b.title} onChange={(e) => set('title', e.target.value)} placeholder="Offre spéciale, maintenance..." />

      <div>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-body)', display: 'block', marginBottom: 6 }}>
          Message
        </label>
        <textarea
          value={b.message}
          onChange={(e) => set('message', e.target.value)}
          rows={3}
          placeholder="Votre message aux utilisateurs..."
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border-subtle)',
            fontFamily: 'var(--font-body)', fontSize: 14, resize: 'vertical', boxSizing: 'border-box',
          }}
        />
      </div>

      <div>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-body)', display: 'block', marginBottom: 8 }}>
          Type
        </label>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {(['info', 'warning', 'success', 'promo'] as const).map((t) => (
            <button
              key={t}
              onClick={() => set('type', t)}
              style={{
                padding: '8px 16px', borderRadius: 'var(--radius-pill)', border: b.type === t ? '2px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                background: b.type === t ? 'var(--color-primary-soft)' : 'var(--surface-card)',
                fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                color: 'var(--text-body)',
              }}
            >
              {t === 'info' ? 'Info' : t === 'warning' ? 'Alerte' : t === 'success' ? 'Succès' : 'Promo'}
            </button>
          ))}
        </div>
      </div>

      <Input
        label="Image (URL)"
        icon="image"
        value={b.imageUrl ?? ''}
        onChange={(e) => set('imageUrl', e.target.value)}
        placeholder="https://exemple.com/logo-partenaire.png (optionnel)"
      />
      {b.imageUrl && (
        <div style={{ marginTop: -8 }}>
          <img
            src={b.imageUrl}
            alt="Aperçu"
            style={{ maxWidth: 200, maxHeight: 80, borderRadius: 8, border: '1px solid var(--border-subtle)', objectFit: 'cover' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        </div>
      )}

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: 'var(--text-body)' }}>
        <input type="checkbox" checked={b.scroll ?? false} onChange={(e) => set('scroll', e.target.checked)} />
        <span>Faire défiler le message en continu (idéal pour les annonces longues ou partenaires)</span>
      </label>

      <div>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-body)', display: 'block', marginBottom: 8 }}>
          Cibler les rôles
        </label>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {(['client', 'driver', 'admin', 'super_admin', 'support', 'support_technique', 'support_commercial'] as const).map((r) => (
            <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" checked={b.targetRoles.includes(r)} onChange={() => toggleRole(r)} />
              {roleLabel(r)}
            </label>
          ))}
        </div>
      </div>

      <div className="pc-field-pair" style={{ gap: 14 }}>
        <Input label="Du" type="date" value={b.startsAt} onChange={(e) => set('startsAt', e.target.value)} />
        <Input label="Au" type="date" value={b.endsAt} onChange={(e) => set('endsAt', e.target.value)} />
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <Button variant="ghost" onClick={onCancel}>Annuler</Button>
        <Button icon="check" onClick={() => onSave(b)} disabled={!b.message.trim()}>
          {b.id ? 'Modifier' : 'Créer'}
        </Button>
      </div>
    </div>
  )
}
