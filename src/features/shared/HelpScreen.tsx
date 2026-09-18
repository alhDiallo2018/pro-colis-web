import { useState } from 'react'
import { Card, Icon } from '@/ds'
import { MarketingHeader } from '@/features/marketing/MarketingHeader'
import { usePublicConfig, useSupportContact } from '@/lib/usePublicConfig'

interface FaqItem { question: string; answer: string }

const topicColors = ['var(--teal-50)', 'var(--blue-50)', 'var(--purple-50)', 'var(--green-50)', 'var(--red-50)', 'var(--amber-50)']

function FaqTile({ item, isLast }: { item: FaqItem; isLast: boolean }) {
    const [open, setOpen] = useState(false)
    return (
        <div
            style={{
                borderBottom: isLast ? 'none' : '1px solid var(--border-subtle)'
            }}
        >
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    padding: '16px 18px',
                    border: 'none',
                    background: open ? 'var(--teal-50)' : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'var(--font-body)',
                    transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => {
                    if (!open) e.currentTarget.style.background = 'var(--surface-page)'
                }}
                onMouseLeave={(e) => {
                    if (!open) e.currentTarget.style.background = 'transparent'
                }}
            >
                <span style={{
                    flex: 1,
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    fontSize: 14,
                    color: 'var(--text-strong)',
                    lineHeight: 1.4
                }}>
                    {item.question}
                </span>
                <span
                    className="material-symbols-rounded"
                    style={{
                        fontSize: 22,
                        color: 'var(--text-muted)',
                        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.25s ease',
                        flexShrink: 0,
                        marginLeft: 12,
                    }}
                >
                    expand_more
                </span>
            </button>
            {open && (
                <div style={{
                    padding: '0 18px 18px 18px',
                    fontSize: 14,
                    color: 'var(--text-body)',
                    lineHeight: 1.6,
                    background: 'var(--teal-50)',
                }}>
                    {item.answer}
                </div>
            )}
        </div>
    )
}

export function HelpScreen() {
    const support = useSupportContact()
    const publicConfig = usePublicConfig()
    const [query, setQuery] = useState('')
    const topics = publicConfig.data?.help?.topics ?? []
    const faqs = publicConfig.data?.help?.faqs ?? []

    const visibleFaqs = faqs.filter(
        (f) =>
            f.question.toLowerCase().includes(query.toLowerCase()) ||
            f.answer.toLowerCase().includes(query.toLowerCase()),
    )

    return (
        <div style={{
            maxWidth: 900,
            margin: '0 auto',
            padding: '24px 20px 64px',
            fontFamily: 'var(--font-body)',
            color: 'var(--text-body)',
        }}>
            <MarketingHeader />

            {/* En-tête */}
            <div style={{
                textAlign: 'center',
                marginBottom: 32,
                paddingBottom: 24,
                borderBottom: '2px solid var(--border-subtle)'
            }}>
                <h1 style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    fontSize: 'clamp(28px, 4vw, 36px)',
                    color: 'var(--text-strong)',
                    marginBottom: 8
                }}>
                    Centre d'aide
                </h1>
                <p style={{
                    fontSize: 16,
                    color: 'var(--text-muted)',
                    margin: 0
                }}>
                    Trouvez des réponses à vos questions sur SendProColis
                </p>
            </div>

            {/* Recherche */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                height: 52,
                padding: '0 16px',
                background: 'var(--surface-card)',
                border: '2px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                maxWidth: 520,
                margin: '0 auto 32px',
                transition: 'border-color 0.2s ease',
            }}
            >
                <span className="material-symbols-rounded" style={{ fontSize: 22, color: 'var(--text-faint)' }}>
                    search
                </span>
                <input
                    placeholder="Rechercher une question..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    style={{
                        flex: 1,
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        fontFamily: 'var(--font-body)',
                        fontSize: 14,
                        fontWeight: 600,
                        color: 'var(--text-strong)',
                    }}
                />
                {query && (
                    <button
                        onClick={() => setQuery('')}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 4,
                            color: 'var(--text-muted)',
                        }}
                    >
                        <span className="material-symbols-rounded" style={{ fontSize: 18 }}>
                            close
                        </span>
                    </button>
                )}
            </div>

            {/* Catégories */}
            <h3 style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: 16,
                color: 'var(--text-strong)',
                margin: '0 0 14px'
            }}>
                Parcourir par catégorie
            </h3>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: 12,
                marginBottom: 32
            }}>
                {topics.map((t, index) => (
                    <div key={`topic-${index}`} style={{ cursor: 'pointer' }}>
                        <Card padding="md">
                            <div
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 'var(--radius-sm)',
                                    background: topicColors[index % topicColors.length],
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 10,
                                    fontSize: 22,
                                }}
                            >
                                {/^[a-z][a-z0-9_]*$/.test(t.icon)
                                    ? <Icon name={t.icon} size={22} />
                                    : t.icon}
                            </div>
                            <div style={{
                                fontFamily: 'var(--font-display)',
                                fontWeight: 700,
                                fontSize: 13.5,
                                color: 'var(--text-strong)',
                                lineHeight: 1.25
                            }}>
                                {t.title}
                            </div>
                        </Card>
                    </div>
                ))}
            </div>

            {/* FAQ */}
            <h3 style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: 16,
                color: 'var(--text-strong)',
                margin: '0 0 14px'
            }}>
                {query ? 'Résultats de recherche' : 'Questions fréquentes'}
            </h3>
            <Card
                padding="none"
                style={{
                    overflow: 'hidden',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-subtle)',
                }}
            >
                {visibleFaqs.length === 0 ? (
                    <div style={{
                        padding: 32,
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        fontSize: 14,
                    }}>
                        <span style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>🔍</span>
                        {publicConfig.isLoading
                            ? 'Chargement du contenu d’aide…'
                            : query
                              ? <>Aucun résultat pour « <strong>{query}</strong> »</>
                              : 'Le contenu d’aide n’est pas encore configuré.'}
                        <br />
                        <span style={{ fontSize: 13 }}>{query ? 'Essayez d’autres mots-clés ou contactez notre support.' : 'Vous pouvez contacter directement notre support.'}</span>
                    </div>
                ) : (
                    <>
                        {visibleFaqs.map((f, index) => (
                            <div key={`faq-${index}`}>
                                <FaqTile item={f} isLast={index === visibleFaqs.length - 1} />
                            </div>
                        ))}
                    </>
                )}
            </Card>

            {/* Contact support */}
            <Card
                padding="lg"
                style={{
                    marginTop: 32,
                    background: 'linear-gradient(135deg, var(--teal-50), var(--teal-100))',
                    border: '1px solid var(--teal-200)',
                    borderRadius: 'var(--radius-lg)',
                }}
            >
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    flexWrap: 'wrap',
                }}>
                    <div
                        style={{
                            width: 52,
                            height: 52,
                            borderRadius: 'var(--radius-md)',
                            background: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >
                        <span className="material-symbols-rounded" style={{ fontSize: 30, color: 'var(--color-primary)' }}>
                            support_agent
                        </span>
                    </div>
                    <div style={{ flex: 1, minWidth: 180 }}>
                        <div style={{
                            fontFamily: 'var(--font-display)',
                            fontWeight: 800,
                            fontSize: 16,
                            color: 'var(--text-strong)',
                        }}>
                            Besoin d'aide ?
                        </div>
                        <div style={{
                            fontSize: 13.5,
                            color: 'var(--text-muted)',
                            marginTop: 2,
                        }}>
                            {[support.availability, support.responseTime && `réponse ${support.responseTime}`].filter(Boolean).join(' · ') || 'Notre équipe est disponible pour vous assister'}
                        </div>
                    </div>
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 8,
                    }}>
                        <a
                            href="/support"
                            style={{
                                textDecoration: 'none',
                                color: '#fff',
                                background: 'var(--color-primary)',
                                fontFamily: 'var(--font-display)',
                                fontWeight: 700,
                                fontSize: 13,
                                padding: '10px 20px',
                                borderRadius: 'var(--radius-pill)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                            }}
                        >
                            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>chat</span>
                            Chat support
                        </a>
                        {support.email && <a
                            href={`mailto:${support.email}`}
                            style={{
                                textDecoration: 'none',
                                color: 'var(--color-primary)',
                                fontFamily: 'var(--font-display)',
                                fontWeight: 700,
                                fontSize: 13,
                                padding: '10px 16px',
                                borderRadius: 'var(--radius-pill)',
                                background: '#fff',
                                border: '1px solid var(--teal-200)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                            }}
                        >
                            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>mail</span>
                            Par e-mail
                        </a>}
                    </div>
                </div>
            </Card>
        </div>
    )
}
