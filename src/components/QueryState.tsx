import type { ReactNode } from 'react'
import { Button, EmptyState, Icon } from '@/ds'
import { ApiError } from '@/lib/api/client'

interface QueryStateProps {
  isLoading: boolean
  isError: boolean
  error?: unknown
  isEmpty?: boolean
  emptyTitle?: string
  emptyMessage?: string
  emptyAction?: ReactNode
  onRetry?: () => void
  children: ReactNode
}

/** Centralised loading / error / empty handling for query-backed screens. */
export function QueryState({
  isLoading,
  isError,
  error,
  isEmpty,
  emptyTitle = 'Rien à afficher',
  emptyMessage,
  emptyAction,
  onRetry,
  children,
}: QueryStateProps) {
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)', color: 'var(--color-primary)' }}>
        <Icon name="progress_activity" size={32} style={{ animation: 'pc-spin 0.7s linear infinite' }} />
        <style>{`@keyframes pc-spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }
  if (isError) {
    const message = error instanceof ApiError ? error.message : 'Une erreur est survenue. Réessayez.'
    return (
      <EmptyState
        icon="error"
        tone="amber"
        title="Impossible de charger"
        message={message}
        action={onRetry ? <Button variant="secondary" icon="refresh" onClick={onRetry}>Réessayer</Button> : undefined}
      />
    )
  }
  if (isEmpty) {
    return <EmptyState icon="inbox" title={emptyTitle} message={emptyMessage} action={emptyAction} />
  }
  return <>{children}</>
}
