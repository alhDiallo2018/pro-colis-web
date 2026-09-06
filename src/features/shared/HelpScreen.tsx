import { useState } from 'react'
import { Card } from '@/ds'
import { MarketingHeader } from '@/features/marketing/MarketingHeader'

interface FaqItem {
    question: string
    answer: string
}

const FAQS: FaqItem[] = [
    {
        question: 'Comment fonctionne le libre service ?',
        answer: 'Vous publiez votre colis, des chauffeurs vérifiés font des offres, vous acceptez celle qui vous convient.',
    },
    {
        question: 'Que se passe-t-il à la livraison ?',
        answer: 'Le destinataire communique un code PIN au chauffeur pour confirmer la remise du colis.',
    },
    {
        question: 'Comment sont calculés les points ?',
        answer: 'Chaque colis livré crédite des points utilisables en réductions sur vos prochains envois.',
    },
    {
        question: 'Comment payer mes envois ?',
        answer: 'Vous pouvez payer par carte, Orange Money, Wave, Free Money ou en espèces. Le paiement est débité une fois le colis livré.',
    },
    {
        question: 'Comment suivre mon colis ?',
        answer: 'Connectez-vous à votre compte et allez dans "Suivi". Entrez votre numéro de suivi pour voir les statuts en temps réel.',
    },
    {
        question: 'Puis-je annuler un colis ?',
        answer: 'Oui, vous pouvez annuler un colis tant qu\'il n\'a pas encore été confirmé par un chauffeur. Au-delà, contactez notre support.',
    },
    {
        question: 'Comment devenir chauffeur ?',
        answer: 'Créez un compte en sélectionnant le rôle "Conduire", remplissez votre profil, ajoutez vos documents et votre véhicule. Notre équipe vérifiera vos informations.',
    },
    {
        question: 'Quels documents sont nécessaires pour les chauffeurs ?',
        answer: 'Permis de conduire, carte grise du véhicule, assurance, et pièce d\'identité (CNI ou passeport).',
    },
    {
        question: 'Comment sont protégés mes paiements ?',
        answer: 'Tous les paiements sont sécurisés via PayDunya. Les fonds sont conservés sur un compte séquestre jusqu\'à la confirmation de livraison.',
    },
    {
        question: 'Que faire en cas de colis endommagé ?',
        answer: 'Contactez notre support dans les 48 heures avec des photos du colis et votre numéro de suivi. Nous traiterons votre réclamation rapidement.',
    },
]

const TOPICS = [
    { icon: '📦', title: 'Créer et envoyer un colis' },
    { icon: '💰', title: 'Libre service et offres' },
    { icon: '📍', title: 'Suivi et livraison' },
    { icon: '💳', title: 'Points et paiements' },
    { icon: '🛡️', title: 'Sécurité et litiges' },
    { icon: '👤', title: 'Mon compte' },
]

const topicColors: Record<string, string> = {
    'Créer et envoyer un colis': 'var(--teal-50)',
    'Libre service et offres': 'var(--blue-50)',
    'Suivi et livraison': 'var(--purple-50)',
    'Points et paiements': 'var(--green-50)',
    'Sécurité et litiges': 'var(--red-50)',
    'Mon compte': 'var(--amber-50)',
}

function FaqTile({ item, index }: { item: FaqItem; index: number }) {
    const [open, setOpen] = useState(false)
    return (
        <div
            style={{
                borderBottom: index < FAQS.length - 1 ? '1px solid var(--border-subtle)' : 'none'
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
    const [query, setQuery] = useState('')

    const visibleFaqs = FAQS.filter(
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
                {TOPICS.map((t, index) => (
                    <div key={`topic-${index}`} style={{ cursor: 'pointer' }}>
                        <Card padding="md">
                            <div
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 'var(--radius-sm)',
                                    background: topicColors[t.title] || 'var(--teal-50)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 10,
                                    fontSize: 22,
                                }}
                            >
                                {t.icon}
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
                        Aucun résultat pour "<strong>{query}</strong>"
                        <br />
                        <span style={{ fontSize: 13 }}>Essayez d'autres mots-clés ou contactez notre support.</span>
                    </div>
                ) : (
                    <>
                        {visibleFaqs.map((f, index) => (
                            <div key={`faq-${index}`}>
                                <FaqTile item={f} index={index} />
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
                            Notre équipe est disponible pour vous assister
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
                        <a
                            href="mailto:support-commercial@sendprocolis.com"
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
                        </a>
                    </div>
                </div>
            </Card>
        </div>
    )
}
