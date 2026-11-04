import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { LineBadge, type TransitDirection, type TransitOperator, Button } from '@/ds'
import { listTransitLines, type TransitLineSummary } from '@/lib/api/transit'
import './transit.css'

interface Props {
  value: TransitLineSummary | null
  onChange: (line: TransitLineSummary | null) => void
}

/**
 * Sélecteur Citymapper-style : opérateur → numéro de ligne → direction.
 * Le catalogue vient du seed DDD/AFTU côté serveur.
 */
export function TransitLinePicker({ value, onChange }: Props) {
  const [operator, setOperator] = useState<TransitOperator | null>(value?.operator ?? null)
  const [search, setSearch] = useState('')

  const lines = useQuery({
    queryKey: ['transit-lines', operator],
    queryFn: () => listTransitLines(operator ?? undefined),
    enabled: !!operator,
  })

  const visibleLines = useMemo(() => {
    const data = lines.data ?? []
    const q = search.trim().toLowerCase()
    if (!q) return data
    return data.filter(
      (l) =>
        l.number.toLowerCase().includes(q) ||
        l.origin.toLowerCase().includes(q) ||
        l.destination.toLowerCase().includes(q),
    )
  }, [lines.data, search])

  // Groupe par numéro pour afficher aller/retour côte à côte quand les deux existent.
  const grouped = useMemo(() => {
    const map = new Map<string, TransitLineSummary[]>()
    for (const l of visibleLines) {
      const k = `${l.operator}-${l.number}`
      const arr = map.get(k) ?? []
      arr.push(l)
      map.set(k, arr)
    }
    return [...map.values()]
  }, [visibleLines])

  if (value) {
    return (
      <div className="transit-picker-selected">
        <LineBadge operator={value.operator} number={value.number} size="lg" />
        <div className="transit-picker-selected-body">
          <div className="transit-picker-route">
            {value.origin} <span aria-hidden>→</span> {value.destination}
          </div>
          <div className="transit-picker-direction">
            {value.direction === 'aller' ? 'Sens aller' : 'Sens retour'}
          </div>
        </div>
        <Button variant="secondary" onClick={() => onChange(null)}>
          Changer
        </Button>
      </div>
    )
  }

  return (
    <div className="transit-picker">
      <div className="transit-picker-step">
        <span className="transit-picker-step-label">1 · Opérateur</span>
        <div className="transit-operators">
          {(['ddd', 'aftu'] as TransitOperator[]).map((op) => (
            <button
              key={op}
              type="button"
              className="transit-operator"
              aria-pressed={operator === op}
              onClick={() => setOperator(op)}
            >
              <LineBadge operator={op} number={op === 'ddd' ? 'DDD' : 'AFTU'} size="md" />
              <span className="transit-operator-label">
                {op === 'ddd' ? 'Dakar Dem Dikk' : 'AFTU — Tata'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {operator && (
        <div className="transit-picker-step">
          <span className="transit-picker-step-label">2 · Ligne</span>
          <input
            type="search"
            className="transit-picker-search"
            placeholder="Rechercher par numéro ou terminus…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {lines.isLoading && <p className="transit-note">Chargement du catalogue…</p>}
          {lines.isError && (
            <p className="transit-note transit-note-error">
              Catalogue indisponible. Réessaie plus tard ou utilise un trajet habituel.
            </p>
          )}
          <div className="transit-lines-grid">
            {grouped.map((group) => (
              <div key={`${group[0].operator}-${group[0].number}`} className="transit-line-group">
                <LineBadge
                  operator={group[0].operator}
                  number={group[0].number}
                  size="lg"
                  style={{ gridRow: 'span 2' }}
                />
                <div className="transit-line-route">
                  <div className="transit-line-route-text">
                    {group[0].origin} <span aria-hidden>→</span> {group[0].destination}
                  </div>
                  <div className="transit-line-directions">
                    {group.map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        className="transit-line-direction"
                        onClick={() => onChange(l)}
                      >
                        {l.direction === 'aller' ? 'Aller' : 'Retour'}
                      </button>
                    ))}
                    {group.length === 1 && (
                      <span className="transit-note" style={{ fontSize: 11 }}>
                        1 sens connu
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {!lines.isLoading && !grouped.length && (
              <p className="transit-note">Aucune ligne trouvée.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function directionLabel(d: TransitDirection) {
  return d === 'aller' ? 'Aller' : 'Retour'
}
