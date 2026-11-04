import { usePwa } from '@/features/pwa/context'

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.sendprocolis.app'
/** iOS version isn't on the App Store yet — we route users to the PWA installer. */
const IOS_INSTALL_URL = '/installer'

/** Multi-color official Google Play logomark. */
export function GooglePlayIcon({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 512 512" width={size} height={size} aria-hidden="true">
      <path d="M382.369,175.623C322.891,142.356,227.427,88.937,79.355,6.028 C69.372-0.565,57.886-1.429,47.962,1.93l254.05,254.05L382.369,175.623z" fill="#32BBFF" />
      <path d="M47.962,1.93c-1.86,0.63-3.67,1.39-5.401,2.308C31.602,10.166,23.549,21.573,23.549,36v439.96 c0,14.427,8.052,25.834,19.012,31.761c1.728,0.917,3.537,1.68,5.395,2.314L302.012,255.98L47.962,1.93z" fill="#32BBFF" />
      <path d="M302.012,255.98L47.956,510.035c9.927,3.384,21.413,2.586,31.399-4.103 c143.598-80.41,237.986-133.196,298.152-166.746c1.675-0.941,3.316-1.861,4.938-2.772L302.012,255.98z" fill="#32BBFF" />
      <path d="M23.549,255.98v219.98c0,14.427,8.052,25.834,19.012,31.761c1.728,0.917,3.537,1.68,5.395,2.314 L302.012,255.98H23.549z" fill="#2C9FD9" />
      <path d="M79.355,6.028C67.5-1.8,53.52-1.577,42.561,4.239l255.595,255.596l84.212-84.212 C322.891,142.356,227.427,88.937,79.355,6.028z" fill="#29CC5E" />
      <path d="M298.158,252.126L42.561,507.721c10.96,5.815,24.939,6.151,36.794-1.789 c143.598-80.41,237.986-133.196,298.152-166.746c1.675-0.941,3.316-1.861,4.938-2.772L298.158,252.126z" fill="#D93F21" />
      <path d="M488.45,255.98c0-12.19-6.151-24.492-18.342-31.314c0,0-22.799-12.721-92.682-51.809l-83.123,83.123 l83.204,83.205c69.116-38.807,92.6-51.892,92.6-51.892C482.299,280.472,488.45,268.17,488.45,255.98z" fill="#FFD500" />
      <path d="M470.108,287.294c12.191-6.822,18.342-19.124,18.342-31.314H294.303l83.204,83.205 C446.624,300.379,470.108,287.294,470.108,287.294z" fill="#FFAA00" />
    </svg>
  )
}

/** Apple logo (App Store mark). */
export function AppleIcon({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d="M17.07 12.37c-.03-3 2.45-4.45 2.56-4.52-1.4-2.05-3.58-2.33-4.35-2.36-1.85-.19-3.61 1.09-4.55 1.09-.95 0-2.4-1.07-3.94-1.04-2.02.03-3.9 1.18-4.94 2.99-2.11 3.66-.54 9.07 1.51 12.04 1 1.45 2.19 3.08 3.76 3.02 1.52-.06 2.09-.98 3.92-.98 1.83 0 2.35.98 3.95.95 1.63-.03 2.66-1.48 3.66-2.94 1.16-1.69 1.64-3.33 1.66-3.42-.04-.02-3.19-1.22-3.22-4.85zM14.08 3.6c.84-1.02 1.4-2.43 1.25-3.84-1.21.05-2.67.8-3.53 1.81-.77.9-1.44 2.34-1.26 3.72 1.35.11 2.7-.68 3.54-1.69z"/>
    </svg>
  )
}

/** Delivery van illustration — brand colors, used on auth pages & hero visuals. */
export function ShippingIcon({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 120 80" width={size} height={size} aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      {/* Ground shadow */}
      <ellipse cx="60" cy="72" rx="48" ry="4" fill="rgba(0,0,0,0.15)" />
      {/* Cargo box */}
      <rect x="10" y="20" width="60" height="42" rx="6" fill="var(--teal-500)" />
      <rect x="10" y="20" width="60" height="42" rx="6" fill="url(#vanGrad)" opacity="0.4" />
      {/* Cargo door split */}
      <line x1="40" y1="24" x2="40" y2="58" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
      {/* Cargo handle */}
      <rect x="38.5" y="40" width="3" height="6" rx="1" fill="rgba(255,255,255,0.4)" />
      {/* Cabin */}
      <path d="M70 32 L88 32 Q94 32 97 37 L105 50 L105 62 Q105 64 103 64 L70 64 Z" fill="var(--amber-400)" />
      {/* Cabin highlight */}
      <path d="M70 32 L88 32 Q94 32 97 37 L105 50" fill="url(#cabinHl)" opacity="0.4" />
      {/* Windshield */}
      <path d="M73 36 L87 36 Q91 36 93 39 L98 47 L75 47 Z" fill="#B8E3F0" />
      <path d="M73 36 L87 36 Q91 36 93 39 L98 47 L75 47 Z" fill="url(#glass)" opacity="0.6" />
      {/* Side window */}
      <rect x="75" y="51" width="18" height="8" rx="2" fill="rgba(255,255,255,0.25)" />
      {/* Headlight */}
      <circle cx="102" cy="55" r="2.5" fill="#FFF8DC" />
      <circle cx="102" cy="55" r="1.5" fill="#FFD700" />
      {/* Wheel wells */}
      <circle cx="26" cy="63" r="10" fill="#111717" />
      <circle cx="84" cy="63" r="10" fill="#111717" />
      {/* Tires (lighter ring) */}
      <circle cx="26" cy="63" r="9" fill="#2A3838" />
      <circle cx="84" cy="63" r="9" fill="#2A3838" />
      {/* Hubcaps */}
      <circle cx="26" cy="63" r="4" fill="#C4CFCF" />
      <circle cx="84" cy="63" r="4" fill="#C4CFCF" />
      <circle cx="26" cy="63" r="1.5" fill="#677474" />
      <circle cx="84" cy="63" r="1.5" fill="#677474" />
      {/* Logo swoosh on side */}
      <path d="M18 34 Q24 30 32 32 Q40 34 46 30" stroke="var(--amber-300)" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Motion lines */}
      <line x1="2" y1="40" x2="8" y2="40" stroke="var(--amber-400)" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <line x1="0" y1="48" x2="7" y2="48" stroke="var(--amber-400)" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <defs>
        <linearGradient id="vanGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.4" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="cabinHl" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.6" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.7" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export interface StoreBadgesProps {
  /** Compact pill variant (navbar). Otherwise, a full "disponible sur" card. */
  size?: 'sm' | 'md' | 'lg'
  /** Only show the applicable store for the current device. Defaults to both on desktop/android, iOS on iPhone. */
  only?: 'auto' | 'both' | 'android' | 'ios'
  className?: string
}

/** Pair of download badges. Falls back to PWA installer on iOS. */
export function StoreBadges({ size = 'md', only = 'auto', className }: StoreBadgesProps) {
  const { appleMobile } = usePwa()
  const showIOS = only === 'ios' || only === 'both' || (only === 'auto' && appleMobile)
  const showAndroid = only === 'android' || only === 'both' || (only === 'auto' && !appleMobile)

  return (
    <div className={`mkt-store-badges mkt-store-badges--${size}${className ? ` ${className}` : ''}`}>
      {showAndroid && (
        <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className="mkt-store-badge mkt-store-badge--play" aria-label="Télécharger sur Google Play">
          <GooglePlayIcon size={size === 'sm' ? 20 : size === 'lg' ? 32 : 26} />
          <div className="mkt-store-badge-text">
            <span className="mkt-store-badge-caption">Disponible sur</span>
            <span className="mkt-store-badge-name">Google Play</span>
          </div>
        </a>
      )}
      {showIOS && (
        <a
          href={IOS_INSTALL_URL}
          className="mkt-store-badge mkt-store-badge--apple"
          aria-label={appleMobile ? "Installer la PWA sur iPhone / iPad" : "Installer la version iPhone — bientôt sur l'App Store"}
        >
          <span className="mkt-store-badge-flag">Bientôt</span>
          <AppleIcon size={size === 'sm' ? 20 : size === 'lg' ? 30 : 24} />
          <div className="mkt-store-badge-text">
            <span className="mkt-store-badge-caption">{appleMobile ? 'Installer via' : 'Bientôt sur'}</span>
            <span className="mkt-store-badge-name">App Store</span>
          </div>
        </a>
      )}
    </div>
  )
}

/** Compact topbar chip. On iOS → PWA installer (iOS App Store coming soon). */
export function StoreChip() {
  const { appleMobile } = usePwa()
  const href = appleMobile ? IOS_INSTALL_URL : PLAY_STORE_URL
  const target = appleMobile ? undefined : '_blank'
  return (
    <a href={href} target={target} rel={target ? 'noopener noreferrer' : undefined} aria-label="Télécharger l'application" className="mkt-app-chip">
      {appleMobile ? <AppleIcon size={16} /> : <GooglePlayIcon size={16} />}
      <span>App</span>
    </a>
  )
}
