/**
 * Nettoyage des données envoyées à la collecte d'erreurs.
 *
 * La spec d'observabilité (ProColis-Api/specs/logs/observability.md) interdit
 * de laisser sortir du navigateur : jetons, cookies, identifiants de session,
 * PIN, OTP, emails, téléphones, adresses et coordonnées. Alloy applique déjà
 * des règles équivalentes côté serveur, mais un secret ne doit pas quitter le
 * poste de l'utilisateur en pariant sur le maillon suivant.
 */

export const REDACTED = '[REDACTED]'

/** Clés dont la valeur est remplacée quel que soit son contenu. */
const SENSITIVE_KEY = /^(authorization|cookie|set-cookie|token|access[_-]?token|refresh[_-]?token|pin|otp|password|secret|api[_-]?key|session|phone|telephone|email|address|adresse|lat|lng|latitude|longitude)$/i

const PATTERNS: [RegExp, string][] = [
  // Bearer <jwt> et JWT nus.
  [/\bBearer\s+[A-Za-z0-9._~+/-]+=*/gi, `Bearer ${REDACTED}`],
  [/\beyJ[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]+/g, REDACTED],
  [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[REDACTED_EMAIL]'],
  // Numéros internationaux et locaux (Sénégal, Cameroun…), 8 chiffres minimum.
  [/\+?\d[\d\s.-]{7,}\d/g, '[REDACTED_PHONE]'],
]

export function redactString(value: string): string {
  return PATTERNS.reduce((current, [pattern, replacement]) => current.replace(pattern, replacement), value)
}

/**
 * Retire la query string d'une URL : elle transporte régulièrement un jeton de
 * paiement, un numéro de suivi ou un identifiant de session.
 */
export function redactUrl(value: string): string {
  const [path] = value.split('?')
  return redactString(path)
}

/**
 * Parcours récursif d'une valeur inconnue. La profondeur est bornée : une
 * structure cyclique ou trop profonde ferait planter le hook `beforeSend`, donc
 * l'envoi d'erreur lui-même.
 */
export function redactValue(value: unknown, depth = 0): unknown {
  if (depth > 6) return REDACTED
  if (typeof value === 'string') return redactString(value)
  if (Array.isArray(value)) return value.map((item) => redactValue(item, depth + 1))
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        SENSITIVE_KEY.test(key) ? REDACTED : redactValue(item, depth + 1),
      ]),
    )
  }
  return value
}
