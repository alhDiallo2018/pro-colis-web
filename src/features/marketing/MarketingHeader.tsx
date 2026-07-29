import { Button } from '@/ds'
import { Link, useNavigate } from 'react-router-dom'

/** Shared header for public marketing/legal pages: brand logo + back button. */
export function MarketingHeader() {
  const navigate = useNavigate()
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 32 }}>
      <Link
        to="/"
        aria-label="Retour à l'accueil SendProColis"
        style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'inherit', textDecoration: 'none' }}
      >
        <img src="/logo-procolis.png" alt="" style={{ width: 38, height: 38, objectFit: 'contain' }} />
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 19, color: 'var(--slate-900)', letterSpacing: '-0.02em' }}>
          SEND<span style={{ color: 'var(--color-primary)' }}>PRO</span>COLIS
        </span>
      </Link>
      <Button variant="ghost" icon="arrow_back" onClick={() => navigate(-1)}>
        Retour
      </Button>
    </div>
  )
}
