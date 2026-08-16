import { DashboardLayout, type NavSection } from '@/layouts/DashboardLayout'
import { NotifButton } from '@/components/actions'
import { BroadcastBanner } from '@/components/BroadcastBanner'
import { useAuthStore } from '@/store/auth'

const BASE_ITEMS = [
  { label: 'Tableau de bord', icon: 'dashboard', to: '/support-admin', end: true },
  { label: 'Support', icon: 'support_agent', to: '/support-admin/conversations' },
  { label: 'Assistances', icon: 'contact_support', to: '/support-admin/assistances' },
  { label: 'Colis', icon: 'package_2', to: '/support-admin/colis' },
  { label: 'Chauffeurs', icon: 'local_shipping', to: '/support-admin/chauffeurs' },
  { label: 'Utilisateurs', icon: 'group', to: '/support-admin/users' },
]

const MODERATION_ROLES = ['super_admin', 'admin', 'support_technique', 'support_commercial']

// Journaux techniques, tickets et incidents relèvent du mandat technique :
// l'API les ferme au support commercial, la navigation ne doit donc pas les
// proposer.
const TECHNIQUE_SECTION: NavSection = {
  heading: 'Supervision',
  items: [
    { label: 'Tickets', icon: 'confirmation_number', to: '/support-admin/tickets' },
    { label: 'Journaux techniques', icon: 'terminal', to: '/support-admin/logs' },
    { label: 'Incidents', icon: 'bolt', to: '/support-admin/incidents' },
    { label: "Journal d'audit", icon: 'history', to: '/support-admin/audit' },
  ],
}

// Pipeline et couverture réseau : mandat commercial, fermé au support
// technique par le RBAC de `/support-commercial/*`.
const COMMERCIAL_SECTION: NavSection = {
  heading: 'Développement',
  items: [
    { label: 'Prospects', icon: 'hub', to: '/support-admin/prospects' },
    { label: 'Couverture réseau', icon: 'map', to: '/support-admin/couverture' },
  ],
}

const AUDIT_ONLY_SECTION: NavSection = {
  heading: 'Supervision',
  items: [{ label: "Journal d'audit", icon: 'history', to: '/support-admin/audit' }],
}

const ACCOUNT_SECTION: NavSection = {
  heading: 'Mon compte',
  items: [{ label: 'Profil', icon: 'person', to: '/support-admin/profil' }],
}

function navForRole(role: string | undefined): NavSection[] {
  const sections: NavSection[] = [{ items: BASE_ITEMS }]
  if (role && MODERATION_ROLES.includes(role)) {
    sections.push({
      heading: 'Modération',
      items: [{ label: 'Modération', icon: 'shield', to: '/support-admin/moderation' }],
    })
  }
  if (role === 'support_technique' || role === 'super_admin') sections.push(TECHNIQUE_SECTION)
  else if (role === 'support') sections.push(AUDIT_ONLY_SECTION)
  if (role === 'support_commercial' || role === 'super_admin') sections.push(COMMERCIAL_SECTION)
  sections.push(ACCOUNT_SECTION)
  return sections
}

/**
 * Coquille de l'espace support. La barre latérale dépend du rôle connecté :
 * les trois comptes support partagent l'espace mais pas les mêmes droits.
 */
export function SupportShell() {
  const role = useAuthStore((state) => state.user?.role)
  return (
    <DashboardLayout
      nav={navForRole(role)}
      roleLabel="Support"
      greetOnIndex
      banner={<BroadcastBanner />}
      actions={<NotifButton />}
    />
  )
}
