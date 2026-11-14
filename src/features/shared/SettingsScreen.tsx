import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, Select, Switch } from '@/ds'
import { Panel } from '@/components/Panel'
import { SUPPORTED_LOCALES, type SupportedLocale } from '@/i18n'

type Theme = 'light' | 'dark' | 'system'

const THEME_KEY = 'procolis-theme'
const PUSH_KEY = 'pref_notifications_push'
const EMAIL_KEY = 'pref_notifications_email'

function readTheme(): Theme {
  const v = localStorage.getItem(THEME_KEY)
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'system'
}

function applyTheme(theme: Theme) {
  const resolved = theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme
  document.documentElement.setAttribute('data-theme', resolved)
}

export function SettingsScreen() {
  const { t, i18n } = useTranslation()
  const [theme, setTheme] = useState<Theme>(() => readTheme())
  const [push, setPush] = useState(() => localStorage.getItem(PUSH_KEY) !== 'false')
  const [email, setEmail] = useState(() => localStorage.getItem(EMAIL_KEY) === 'true')
  const currentLocale = (SUPPORTED_LOCALES as readonly string[]).includes(i18n.resolvedLanguage ?? '')
    ? (i18n.resolvedLanguage as SupportedLocale)
    : 'fr'

  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme('system')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  function onPushChange(v: boolean) {
    setPush(v)
    localStorage.setItem(PUSH_KEY, String(v))
  }
  function onEmailChange(v: boolean) {
    setEmail(v)
    localStorage.setItem(EMAIL_KEY, String(v))
  }

  return (
    <div className="cm-detail-page" style={{ maxWidth: 720 }}>
      <div className="cm-page-head">
        <div className="cm-page-head-body">
          <h1>{t('settings.title')}</h1>
          <p className="cm-page-head-sub">{t('settings.appearance')} · {t('settings.language')} · {t('settings.notifications')}</p>
        </div>
      </div>
      <Panel title={t('settings.appearance')}>
        <Card padding="lg">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input
                type="radio"
                name="theme"
                value="light"
                checked={theme === 'light'}
                onChange={() => setTheme('light')}
              />
              {t('settings.themeLight')}
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input
                type="radio"
                name="theme"
                value="dark"
                checked={theme === 'dark'}
                onChange={() => setTheme('dark')}
              />
              {t('settings.themeDark')}
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input
                type="radio"
                name="theme"
                value="system"
                checked={theme === 'system'}
                onChange={() => setTheme('system')}
              />
              {t('settings.themeSystem')}
            </label>
          </div>
        </Card>
      </Panel>

      <Panel title={t('settings.language')}>
        <Card padding="lg">
          <Select
            value={currentLocale}
            onChange={(e) => {
              const next = e.target.value as SupportedLocale
              void i18n.changeLanguage(next)
            }}
            options={[
              { value: 'fr', label: t('settings.languageFr') },
              { value: 'en', label: t('settings.languageEn') },
              { value: 'wo', label: t('settings.languageWo') },
            ]}
          />
        </Card>
      </Panel>

      <Panel title={t('settings.notifications')}>
        <Card padding="lg">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <SwitchRow
              label="Notifications push"
              description="Recevoir des alertes en temps réel dans le navigateur."
              checked={push}
              onChange={onPushChange}
            />
            <SwitchRow
              label="Notifications e-mail"
              description="Recevoir un courriel pour les événements importants."
              checked={email}
              onChange={onEmailChange}
            />
          </div>
        </Card>
      </Panel>
    </div>
  )
}

function SwitchRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
      <div>
        <div style={{ fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{description}</div>
      </div>
      <Switch checked={checked} onChange={onChange} />
    </div>
  )
}
