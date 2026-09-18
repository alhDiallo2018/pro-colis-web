import { api } from './client'

/** Configuration publique exposée par `/public/config` (commission, points,
 *  packs, retraits, politique d'insuffisance, contacts support). Aucune valeur
 *  métier n'est codée en dur côté web : tout provient de la configuration API. */
export interface PublicConfig {
  commission: {
    percentage: number
    minAmount: number
    maxAmount: number
  }
  points: {
    deliveryCompleted: number
    signupBonus: number
    cfaPerPoint: number
    commitmentFee: number
    packs: number[]
  }
  withdrawal: {
    minAmount: number
    maxAmount: number
    maxPerDay: number
  }
  insufficientPolicy: 'block' | 'warn' | 'debt'
  debtLimit: number
  support: {
    phone: string
    email: string
    technicalEmail: string
    technicalPhone: string
    responseTime: string
    availability: string
  }
  /** Contenu du centre d'aide administrable depuis le backend. */
  help: {
    topics: { icon: string; title: string }[]
    faqs: { question: string; answer: string }[]
  }
  /** Motifs d'annulation (value/label uniquement). Les règles financières ne
   *  sont jamais exposées ici : la responsabilité reste calculée côté serveur. */
  cancellation: {
    reasons: { value: string; label: string }[]
  }
  /** Identité légale configurée par l'administrateur (affichée dans les pages
   *  Mentions légales / Confidentialité / CGU). Champs vides = « à compléter ». */
  legal: {
    companyName: string
    address: string
    registrationNumber: string
    cdpAuthorization: string
    privacyEmail: string
    publisherName: string
    hostName: string
    directorName: string
    directorEmail: string
    technicalDirectorName: string
    technicalDirectorEmail: string
  }
}

export async function getPublicConfig(): Promise<PublicConfig> {
  const { data } = await api.get('/public/config')
  return (data.config ?? data.data ?? {}) as PublicConfig
}
