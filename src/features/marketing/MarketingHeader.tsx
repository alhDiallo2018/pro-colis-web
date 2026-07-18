import { Button } from '@/ds'
import { useNavigate } from 'react-router-dom'

/** Shared header for public marketing/legal pages: brand logo + back button. */
export function MarketingHeader() {
  const navigate = useNavigate()
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/')}>
        <img src="/logo-procolis.png" alt="SendProColis" style={{ width: 38, height: 38, objectFit: 'contain' }} />
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 19, color: 'var(--slate-900)', letterSpacing: '-0.02em' }}>
          SEND<span style={{ color: 'var(--color-primary)' }}>PRO</span>COLIS
        </span>
      </div>
      <Button variant="ghost" icon="arrow_back" onClick={() => navigate(-1)}>
        Retour
      </Button>
    </div>
  )
}
