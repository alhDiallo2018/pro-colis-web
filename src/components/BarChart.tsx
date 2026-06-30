interface BarChartProps {
  /** Heights as percentages (0–100). */
  bars: number[]
  labels?: string[]
  height?: number
  /** Highlight the last bar in amber (e.g. "today"). */
  highlightLast?: boolean
}

/** Lightweight CSS bar chart matching the dashboard mockups. */
export function BarChart({ bars, labels, height = 90, highlightLast = false }: BarChartProps) {
  const max = Math.max(...bars, 1)
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height }}>
        {bars.map((b, i) => {
          const last = i === bars.length - 1
          const amber = highlightLast && last
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${Math.max((b / max) * 100, 4)}%`,
                borderRadius: '5px 5px 0 0',
                background: amber ? 'var(--amber-400)' : 'linear-gradient(180deg, var(--teal-400), var(--teal-600))',
                opacity: amber ? 1 : 0.55 + (i / bars.length) * 0.45,
              }}
            />
          )
        })}
      </div>
      {labels && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10.5, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
          {labels.map((l, i) => (
            <span key={i}>{l}</span>
          ))}
        </div>
      )}
    </>
  )
}
