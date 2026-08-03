import type { ServiceHealth } from '@/lib/api/observability'
import { Icon } from '@/ds'
import { serviceLabel, timeAgo } from './labels'

interface ServiceHealthStripProps {
  services: ServiceHealth[]
  /** Panne de Loki/Prometheus : l'état lui-même n'est plus mesurable. */
  unavailable?: boolean
  isLoading?: boolean
}

function Pastille({ service }: { service: ServiceHealth }) {
  const healthy = service.status === 'healthy'
  return (
    <div
      title={`Vérifié ${timeAgo(service.checkedAt)}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '7px 12px',
        borderRadius: 'var(--radius-pill)',
        background: healthy ? 'var(--green-50)' : 'var(--red-50)',
        border: `1px solid ${healthy ? 'var(--green-100)' : 'var(--red-100)'}`,
        minWidth: 0,
      }}
    >
      <span
        aria-hidden
        style={{
          width: 8,
          height: 8,
          flex: 'none',
          borderRadius: '50%',
          background: healthy ? 'var(--green-600)' : 'var(--red-500)',
        }}
      />
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          fontSize: 12.5,
          color: healthy ? 'var(--green-700)' : 'var(--red-500)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {serviceLabel(service.service)}
      </span>
    </div>
  )
}

/**
 * Santé des six services supervisés. Affiché en tête des journaux : savoir
 * qu'un service est tombé explique souvent la rafale d'erreurs affichée juste
 * en dessous.
 */
export function ServiceHealthStrip({ services, unavailable, isLoading }: ServiceHealthStripProps) {
  if (unavailable) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '11px 14px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--amber-50)',
          color: 'var(--amber-600)',
          fontSize: 13,
        }}
      >
        <Icon name="cloud_off" size={18} />
        <span>
          État des services indisponible — la supervision (Loki / Prometheus) ne répond pas. Les journaux
          affichés peuvent être incomplets.
        </span>
      </div>
    )
  }

  if (isLoading && services.length === 0) {
    return <div style={{ height: 34, borderRadius: 'var(--radius-pill)', background: 'var(--surface-sunken)' }} />
  }

  const down = services.filter((service) => service.status !== 'healthy')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {services.map((service) => (
          <Pastille key={service.service} service={service} />
        ))}
      </div>
      {down.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--red-500)' }}>
          <Icon name="warning" size={16} />
          <span>
            {down.length === 1
              ? `${serviceLabel(down[0].service)} ne répond pas.`
              : `${down.length} services ne répondent pas.`}
          </span>
        </div>
      )}
    </div>
  )
}
