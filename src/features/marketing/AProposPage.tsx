import { MarketingHeader } from './MarketingHeader'

const CONTACT_INFO = {
    email: 'support-commercial@sendprocolis.com',
    phone: '+221 76 516 27 96',
    address: 'Dakar, Sénégal'
}

const VALUES = [
    {
        icon: '🤝',
        title: 'Confiance',
        description: 'Chaque chauffeur est vérifié et évalué par la communauté. Notre système de réputation garantit des prestataires fiables.'
    },
    {
        icon: '⚡',
        title: 'Rapidité',
        description: 'Notre système de mise en relation instantanée permet de trouver un chauffeur en un temps record, souvent inférieur à une heure.'
    },
    {
        icon: '🔍',
        title: 'Transparence',
        description: 'Les prix sont affichés avant validation, le suivi est en temps réel, et aucune commission n\'est cachée.'
    }
]

const STATS = [
    { value: '14', label: 'Régions au Sénégal' },
    { value: '1 200+', label: 'Chauffeurs vérifiés' },
    { value: '45 min', label: 'Délai moyen avant offre' },
    { value: '98,4 %', label: 'Colis livrés à temps' }
]

const STEPS = [
    {
        icon: '📦',
        title: 'Déclarez votre colis',
        description: 'Décrivez le colis (nature, poids, dimensions) et indiquez la ville de départ et la ville d\'arrivée.'
    },
    {
        icon: '💬',
        title: 'Recevez des offres',
        description: 'Les chauffeurs disponibles sur le trajet vous font leurs propositions de prix. Vous choisissez celle qui vous convient le mieux.'
    },
    {
        icon: '📍',
        title: 'Suivez la livraison',
        description: 'Une fois le chauffeur choisi, suivez votre colis en temps réel jusqu\'à sa remise au destinataire avec code PIN de confirmation.'
    }
]

export function AProposPage() {
    return (
        <div style={{
            maxWidth: 900,
            margin: '0 auto',
            padding: '40px 20px 60px',
            fontFamily: 'var(--font-body)',
            color: 'var(--text-body)',
            lineHeight: 1.7
        }}>
            <MarketingHeader />

            {/* En-tête */}
            <div style={{
                textAlign: 'center',
                marginBottom: 48,
                paddingBottom: 32,
                borderBottom: '2px solid var(--border-subtle)'
            }}>
                <h1 style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    fontSize: 'clamp(28px, 4vw, 36px)',
                    color: 'var(--text-strong)',
                    marginBottom: 8
                }}>
                    À PROPOS DE SENDPROCOLIS
                </h1>
                <p style={{
                    fontSize: 16,
                    color: 'var(--text-muted)',
                    margin: 0
                }}>
                    La plateforme qui connecte expéditeurs et chauffeurs
                </p>
                <p style={{
                    fontSize: 13,
                    color: 'var(--text-muted)',
                    marginTop: 8,
                    fontWeight: 500
                }}>
                    Dernière mise à jour : 17 juillet 2026
                </p>
            </div>

            {/* Qui sommes-nous */}
            <Section title="Qui sommes-nous">
                <p>
                    SendProColis est une plateforme de transport de colis née au Sénégal et tournée vers l'Afrique et
                    l'international. Nous connectons les expéditeurs qui souhaitent envoyer des colis avec des chauffeurs
                    transporteurs vérifiés qui se déplacent déjà entre les villes du pays et au-delà des frontières.
                </p>
                <p style={{ marginTop: 12 }}>
                    Fondée à Dakar, notre plateforme s'appuie sur les réalités du marché sénégalais et africain pour offrir
                    une solution de transport rapide, fiable et économique. Nous opérons dans les 14 régions du Sénégal et
                    développons des corridors de livraison vers l'Afrique de l'Ouest et le reste du monde, permettant aux
                    particuliers comme aux entreprises d'envoyer leurs colis en toute sérénité.
                </p>
            </Section>

            {/* Statistiques */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: 16,
                marginTop: 40,
                marginBottom: 40,
                padding: 24,
                background: 'var(--surface-page)',
                borderRadius: 16,
                border: '1px solid var(--border-subtle)'
            }}>
                {STATS.map((stat, index) => (
                    <div key={index} style={{ textAlign: 'center' }}>
                        <div style={{
                            fontFamily: 'var(--font-display)',
                            fontWeight: 800,
                            fontSize: 'clamp(28px, 3vw, 36px)',
                            color: 'var(--color-primary)'
                        }}>
                            {stat.value}
                        </div>
                        <div style={{
                            fontSize: 13,
                            color: 'var(--text-muted)',
                            marginTop: 4
                        }}>
                            {stat.label}
                        </div>
                    </div>
                ))}
            </div>

            {/* Notre mission */}
            <Section title="Notre mission">
                <p>
                    Notre mission est de connecter les expéditeurs et les chauffeurs pour simplifier le transport de
                    colis au Sénégal, en Afrique et à l'international. Nous croyons qu'un service de livraison fiable ne devrait pas
                    être un luxe — c'est un besoin quotidien pour les familles, les commerçants et les entreprises.
                </p>
                <p style={{ marginTop: 12 }}>
                    Nous nous engageons à offrir transparence, sécurité et rapidité à chaque étape : de la déclaration
                    du colis jusqu'à la livraison au destinataire.
                </p>
            </Section>

            {/* Comment ça marche */}
            <Section title="Comment ça marche">
                <p>
                    Envoyer un colis avec SendProColis se fait en trois étapes simples :
                </p>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 16,
                    marginTop: 16
                }}>
                    {STEPS.map((step, index) => (
                        <div key={index} style={{
                            padding: 18,
                            background: 'var(--surface-page)',
                            borderRadius: 12,
                            border: '1px solid var(--border-subtle)',
                            position: 'relative'
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: -10,
                                right: 12,
                                fontSize: 12,
                                fontWeight: 700,
                                color: 'var(--text-muted)',
                                background: 'var(--surface-page)',
                                padding: '0 6px'
                            }}>
                                Étape {index + 1}
                            </div>
                            <div style={{ fontSize: 32, marginBottom: 8 }}>{step.icon}</div>
                            <div style={{
                                fontWeight: 700,
                                fontSize: 15,
                                color: 'var(--text-strong)',
                                marginBottom: 6
                            }}>
                                {step.title}
                            </div>
                            <div style={{
                                fontSize: 13.5,
                                color: 'var(--text-muted)'
                            }}>
                                {step.description}
                            </div>
                        </div>
                    ))}
                </div>
            </Section>

            {/* Nos valeurs */}
            <Section title="Nos valeurs">
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 16,
                    marginTop: 8
                }}>
                    {VALUES.map((value, index) => (
                        <div key={index} style={{
                            padding: 18,
                            background: 'var(--surface-page)',
                            borderRadius: 12,
                            border: '1px solid var(--border-subtle)'
                        }}>
                            <div style={{ fontSize: 32, marginBottom: 8 }}>{value.icon}</div>
                            <div style={{
                                fontWeight: 700,
                                fontSize: 15,
                                color: 'var(--text-strong)',
                                marginBottom: 6
                            }}>
                                {value.title}
                            </div>
                            <div style={{
                                fontSize: 13.5,
                                color: 'var(--text-muted)'
                            }}>
                                {value.description}
                            </div>
                        </div>
                    ))}
                </div>
            </Section>

            {/* Contact */}
            <Section title="Contact">
                <div style={{
                    padding: 20,
                    background: 'var(--surface-page)',
                    borderRadius: 12,
                    border: '1px solid var(--border-subtle)'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 20 }}>📧</span>
                            <span>
                <strong>Email :</strong>{' '}
                                <EmailLink email={CONTACT_INFO.email} />
              </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 20 }}>📞</span>
                            <span>
                <strong>Téléphone :</strong> {CONTACT_INFO.phone}
              </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 20 }}>📍</span>
                            <span>
                <strong>Adresse :</strong> {CONTACT_INFO.address}
              </span>
                        </div>
                    </div>
                    <div style={{
                        marginTop: 12,
                        paddingTop: 12,
                        borderTop: '1px solid var(--border-subtle)',
                        fontSize: 13,
                        color: 'var(--text-muted)'
                    }}>
                        <strong>Horaires :</strong> Lundi au vendredi de 8h à 18h · Samedi de 9h à 13h (GMT)
                    </div>
                </div>
            </Section>

            {/* Footer */}
            <FooterSection />
        </div>
    )
}

// ==================== COMPOSANTS ====================

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ marginTop: 32 }}>
            <h2 style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 'clamp(18px, 2vw, 21px)',
                color: 'var(--text-strong)',
                margin: '0 0 12px 0',
                paddingBottom: 8,
                borderBottom: '2px solid var(--color-primary-soft)'
            }}>
                {title}
            </h2>
            {children}
        </div>
    )
}

function EmailLink({ email }: { email: string }) {
    return (
        <a href={`mailto:${email}`} style={{ color: 'var(--color-primary)' }}>
            {email}
        </a>
    )
}

function FooterSection() {
    return (
        <div style={{
            marginTop: 48,
            paddingTop: 24,
            borderTop: '1px solid var(--border-subtle)',
            textAlign: 'center',
            fontSize: 13,
            color: 'var(--text-muted)'
        }}>
            <p style={{ margin: 0 }}>
                © {new Date().getFullYear()} SendProColis SARL — Tous droits réservés
            </p>
            <p style={{ margin: '4px 0 0' }}>
                Dakar, Sénégal · <EmailLink email={CONTACT_INFO.email} />
            </p>
        </div>
    )
}
