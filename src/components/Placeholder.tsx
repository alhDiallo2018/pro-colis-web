import { EmptyState } from '@/ds'

/** Temporary screen for routes whose UI is not built yet. */
export function Placeholder({ title, message }: { title: string; message?: string }) {
  return (
    <EmptyState
      icon="construction"
      tone="primary"
      title={title}
      message={message ?? 'Cet écran sera bientôt disponible.'}
    />
  )
}
