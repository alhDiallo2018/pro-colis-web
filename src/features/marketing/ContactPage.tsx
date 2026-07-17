import { Button } from '@/ds'
import { useNavigate } from 'react-router-dom'

export function ContactPage() {
  const navigate = useNavigate()
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px', fontFamily: 'var(--font-body)', color: 'var(--text-body)', lineHeight: 1.7 }}>
      <Button variant="ghost" icon="arrow_back" onClick={() => navigate(-1)} style={{ marginBottom: 32 }}>
        Retour
      </Button>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: 'var(--text-strong)', marginBottom: 24 }}>CONTACT — SENDPROCOLIS</h1>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>Nous contacter</h2>
      <p>
        Notre équipe est à votre écoute pour toute question, suggestion ou assistance. N'hésitez pas à nous
        joindre par l'un des moyens suivants.
      </p>

      <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 24, margin: '24px 0' }}>
        <div style={{ marginBottom: 16 }}>
          <strong>Email :</strong>{' '}
          <a href="mailto:contact@sendprocolis.com" style={{ color: 'var(--color-primary)' }}>contact@sendprocolis.com</a>
        </div>
        <div style={{ marginBottom: 16 }}>
          <strong>Téléphone :</strong> +221 XX XXX XX XX
        </div>
        <div style={{ marginBottom: 16 }}>
          <strong>Adresse :</strong> Dakar, Sénégal
        </div>
        <div>
          <strong>Heures d'ouverture :</strong><br />
          Lundi au Vendredi : 8h00 – 18h00<br />
          Samedi : 9h00 – 13h00<br />
          Dimanche : Fermé
        </div>
      </div>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>Formulaire de contact</h2>
      <p>
        Vous pouvez également utiliser le formulaire ci-dessous pour nous envoyer un message.
      </p>

      <div style={{ maxWidth: 500, marginTop: 16 }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--text-strong)', marginBottom: 6 }}>
            Nom complet
          </label>
          <input
            type="text"
            placeholder="Votre nom"
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              color: 'var(--text-body)',
              outline: 'none',
              background: 'var(--surface-card)',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--text-strong)', marginBottom: 6 }}>
            Email
          </label>
          <input
            type="email"
            placeholder="votre@email.com"
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              color: 'var(--text-body)',
              outline: 'none',
              background: 'var(--surface-card)',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--text-strong)', marginBottom: 6 }}>
            Message
          </label>
          <textarea
            placeholder="Votre message..."
            rows={5}
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              color: 'var(--text-body)',
              outline: 'none',
              background: 'var(--surface-card)',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <Button variant="primary">Envoyer le message</Button>
      </div>
    </div>
  )
}
