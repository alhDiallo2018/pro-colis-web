import { MarketingHeader } from './MarketingHeader'

const CONTACT_INFO = {
    email: 'support-commercial@sendprocolis.com',
    address: 'Dakar, Sénégal'
}

export function ConfidentialitePage() {
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
                    POLITIQUE DE CONFIDENTIALITÉ
                </h1>
                <p style={{
                    fontSize: 16,
                    color: 'var(--text-muted)',
                    margin: 0
                }}>
                    SendProColis — Protection de vos données personnelles
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

            {/* Introduction */}
            <div style={{
                padding: 24,
                background: 'var(--surface-page)',
                borderRadius: 16,
                marginBottom: 40,
                border: '1px solid var(--border-subtle)'
            }}>
                <p style={{ margin: 0, fontSize: 15 }}>
                    SendProColis accorde une importance primordiale à la protection de vos données personnelles. La présente
                    politique de confidentialité décrit les données que nous collectons, comment nous les utilisons et les
                    droits dont vous disposez.
                </p>
            </div>

            {/* Section 1 : Données collectées */}
            <Section title="1. Données collectées">
                <p>Dans le cadre de l'utilisation de la plateforme, nous collectons les données suivantes :</p>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 12,
                    marginTop: 16
                }}>
                    {[
                        { icon: '🪪', label: 'Données d\'identification', desc: 'nom, prénom, téléphone, email' },
                        { icon: '👤', label: 'Données de profil', desc: 'photo, adresse, ville de résidence' },
                        { icon: '📍', label: 'Données de localisation', desc: 'position pour le suivi des colis' },
                        { icon: '📦', label: 'Données relatives aux colis', desc: 'nature, poids, dimensions, valeur' },
                        { icon: '💳', label: 'Données de transaction', desc: 'historique, montants, moyens de paiement' },
                        { icon: '💻', label: 'Données techniques', desc: 'IP, appareil, OS, journaux de connexion' }
                    ].map((item, index) => (
                        <div key={index} style={{
                            padding: 14,
                            background: 'var(--surface-page)',
                            borderRadius: 12,
                            border: '1px solid var(--border-subtle)'
                        }}>
                            <div style={{ fontSize: 24, marginBottom: 4 }}>{item.icon}</div>
                            <div style={{
                                fontWeight: 700,
                                fontSize: 14,
                                color: 'var(--text-strong)'
                            }}>{item.label}</div>
                            <div style={{
                                fontSize: 12.5,
                                color: 'var(--text-muted)',
                                marginTop: 2
                            }}>{item.desc}</div>
                        </div>
                    ))}
                </div>
            </Section>

            {/* Section 2 : Finalités */}
            <Section title="2. Finalités du traitement">
                <p>Vos données sont collectées et traitées pour les finalités suivantes :</p>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 12,
                    marginTop: 16
                }}>
                    {[
                        { icon: '👤', label: 'Gestion de compte', desc: 'création et gestion de votre compte utilisateur' },
                        { icon: '📦', label: 'Suivi des expéditions', desc: 'traitement et suivi de vos colis' },
                        { icon: '🤝', label: 'Mise en relation', desc: 'entre expéditeurs et chauffeurs' },
                        { icon: '💳', label: 'Paiements', desc: 'traitement des paiements et des commissions' },
                        { icon: '🔒', label: 'Sécurité', desc: 'sécurisation de la plateforme et lutte contre la fraude' },
                        { icon: '📈', label: 'Amélioration', desc: 'amélioration continue du service' },
                        { icon: '💬', label: 'Communication', desc: 'notifications, confirmations, support' }
                    ].map((item, index) => (
                        <div key={index} style={{
                            padding: 14,
                            background: 'var(--surface-page)',
                            borderRadius: 12,
                            border: '1px solid var(--border-subtle)'
                        }}>
                            <div style={{ fontSize: 24, marginBottom: 4 }}>{item.icon}</div>
                            <div style={{
                                fontWeight: 700,
                                fontSize: 14,
                                color: 'var(--text-strong)'
                            }}>{item.label}</div>
                            <div style={{
                                fontSize: 12.5,
                                color: 'var(--text-muted)',
                                marginTop: 2
                            }}>{item.desc}</div>
                        </div>
                    ))}
                </div>
            </Section>

            {/* Section 3 : Base légale */}
            <Section title="3. Base légale">
                <p>Le traitement de vos données repose sur les bases légales suivantes :</p>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 12,
                    marginTop: 16
                }}>
                    {[
                        { icon: '📄', label: 'Exécution du contrat', desc: 'nécessaire à la fourniture de nos services' },
                        { icon: '✅', label: 'Votre consentement', desc: 'pour certains traitements spécifiques' },
                        { icon: '⚖️', label: 'Obligation légale', desc: 'conservation des données comptables et fiscales' },
                        { icon: '🎯', label: 'Intérêt légitime', desc: 'amélioration du service, sécurité, prévention de la fraude' }
                    ].map((item, index) => (
                        <div key={index} style={{
                            padding: 14,
                            background: 'var(--surface-page)',
                            borderRadius: 12,
                            border: '1px solid var(--border-subtle)'
                        }}>
                            <div style={{ fontSize: 24, marginBottom: 4 }}>{item.icon}</div>
                            <div style={{
                                fontWeight: 700,
                                fontSize: 14,
                                color: 'var(--text-strong)'
                            }}>{item.label}</div>
                            <div style={{
                                fontSize: 12.5,
                                color: 'var(--text-muted)',
                                marginTop: 2
                            }}>{item.desc}</div>
                        </div>
                    ))}
                </div>
            </Section>

            {/* Section 4 : Conservation */}
            <Section title="4. Conservation des données">
                <p>Vos données personnelles sont conservées pour une durée limitée :</p>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 12,
                    marginTop: 16
                }}>
                    {[
                        { icon: '👤', label: 'Données de compte', desc: 'pendant toute la durée du compte + 3 ans' },
                        { icon: '📊', label: 'Données de transaction', desc: '10 ans (obligations comptables)' },
                        { icon: '📍', label: 'Données de localisation', desc: '6 mois après chaque expédition' },
                        { icon: '💻', label: 'Données de connexion', desc: '12 mois maximum' }
                    ].map((item, index) => (
                        <div key={index} style={{
                            padding: 14,
                            background: 'var(--surface-page)',
                            borderRadius: 12,
                            border: '1px solid var(--border-subtle)'
                        }}>
                            <div style={{ fontSize: 24, marginBottom: 4 }}>{item.icon}</div>
                            <div style={{
                                fontWeight: 700,
                                fontSize: 14,
                                color: 'var(--text-strong)'
                            }}>{item.label}</div>
                            <div style={{
                                fontSize: 12.5,
                                color: 'var(--text-muted)',
                                marginTop: 2
                            }}>{item.desc}</div>
                        </div>
                    ))}
                </div>
            </Section>

            {/* Section 5 : Destinataires */}
            <Section title="5. Destinataires des données">
                <p>Vos données sont accessibles uniquement aux destinataires suivants :</p>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 12,
                    marginTop: 16
                }}>
                    {[
                        { icon: '🏢', label: 'Équipes SendProColis', desc: 'personnel habilité' },
                        { icon: '🚚', label: 'Chauffeurs transporteurs', desc: 'nécessaire à l\'expédition' },
                        { icon: '🔧', label: 'Prestataires techniques', desc: 'PayDunya, OVHcloud, liés par contrat' },
                        { icon: '⚖️', label: 'Autorités compétentes', desc: 'sur demande légale' }
                    ].map((item, index) => (
                        <div key={index} style={{
                            padding: 14,
                            background: 'var(--surface-page)',
                            borderRadius: 12,
                            border: '1px solid var(--border-subtle)'
                        }}>
                            <div style={{ fontSize: 24, marginBottom: 4 }}>{item.icon}</div>
                            <div style={{
                                fontWeight: 700,
                                fontSize: 14,
                                color: 'var(--text-strong)'
                            }}>{item.label}</div>
                            <div style={{
                                fontSize: 12.5,
                                color: 'var(--text-muted)',
                                marginTop: 2
                            }}>{item.desc}</div>
                        </div>
                    ))}
                </div>
                <p style={{ marginTop: 16, padding: 12, background: 'var(--teal-50)', borderRadius: 8, border: '1px solid var(--teal-100)' }}>
                    <strong>📌 Engagements :</strong> SendProColis ne vend ni ne partage vos données personnelles à des tiers à des fins commerciales.
                </p>
            </Section>

            {/* Section 6 : Sécurité */}
            <Section title="6. Sécurité des données">
                <p>Nous mettons en œuvre des mesures techniques et organisationnelles appropriées :</p>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 12,
                    marginTop: 16
                }}>
                    {[
                        { icon: '🔐', label: 'Chiffrement en transit', desc: 'HTTPS/TLS' },
                        { icon: '🔒', label: 'Chiffrement au repos', desc: 'données sensibles' },
                        { icon: '🛡️', label: 'Authentification forte', desc: 'double facteur' },
                        { icon: '🔑', label: 'Contrôle d\'accès', desc: 'strict par les équipes' },
                        { icon: '📊', label: 'Surveillance continue', desc: 'de la sécurité' }
                    ].map((item, index) => (
                        <div key={index} style={{
                            padding: 14,
                            background: 'var(--surface-page)',
                            borderRadius: 12,
                            border: '1px solid var(--border-subtle)'
                        }}>
                            <div style={{ fontSize: 24, marginBottom: 4 }}>{item.icon}</div>
                            <div style={{
                                fontWeight: 700,
                                fontSize: 14,
                                color: 'var(--text-strong)'
                            }}>{item.label}</div>
                            <div style={{
                                fontSize: 12.5,
                                color: 'var(--text-muted)',
                                marginTop: 2
                            }}>{item.desc}</div>
                        </div>
                    ))}
                </div>
            </Section>

            {/* Section 7 : Vos droits */}
            <Section title="7. Vos droits">
                <p>Conformément à la réglementation applicable, vous disposez des droits suivants :</p>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 12,
                    marginTop: 16
                }}>
                    {[
                        { icon: '👁️', label: 'Droit d\'accès', desc: 'obtenir une copie de vos données' },
                        { icon: '✏️', label: 'Droit de rectification', desc: 'corriger vos données inexactes' },
                        { icon: '🚫', label: 'Droit d\'opposition', desc: 'pour des motifs légitimes' },
                        { icon: '📤', label: 'Droit à la portabilité', desc: 'recevoir vos données dans un format structuré' },
                        { icon: '🗑️', label: 'Droit à l\'effacement', desc: 'dans les conditions prévues par la loi' }
                    ].map((item, index) => (
                        <div key={index} style={{
                            padding: 14,
                            background: 'var(--surface-page)',
                            borderRadius: 12,
                            border: '1px solid var(--border-subtle)'
                        }}>
                            <div style={{ fontSize: 24, marginBottom: 4 }}>{item.icon}</div>
                            <div style={{
                                fontWeight: 700,
                                fontSize: 14,
                                color: 'var(--text-strong)'
                            }}>{item.label}</div>
                            <div style={{
                                fontSize: 12.5,
                                color: 'var(--text-muted)',
                                marginTop: 2
                            }}>{item.desc}</div>
                        </div>
                    ))}
                </div>
                <div style={{
                    marginTop: 16,
                    padding: 16,
                    background: 'var(--surface-page)',
                    borderRadius: 12,
                    border: '1px solid var(--border-subtle)',
                    textAlign: 'center'
                }}>
                    <p style={{ margin: 0 }}>
                        Pour exercer vos droits, contactez-nous à{' '}
                        <a href={`mailto:${CONTACT_INFO.email}`} style={{ color: 'var(--color-primary)' }}>
                            {CONTACT_INFO.email}
                        </a>
                    </p>
                </div>
            </Section>

            {/* Section 8 : DPO */}
            <Section title="8. Délégué à la protection des données (DPO)">
                <div style={{
                    padding: 16,
                    background: 'var(--surface-page)',
                    borderRadius: 12,
                    border: '1px solid var(--border-subtle)'
                }}>
                    <p style={{ margin: 0 }}>
                        Pour toute question relative à la protection de vos données personnelles, contactez notre DPO :{' '}
                        <a href={`mailto:${CONTACT_INFO.email}`} style={{ color: 'var(--color-primary)' }}>
                            {CONTACT_INFO.email}
                        </a>
                    </p>
                </div>
            </Section>

            {/* Section 9 : Cookies */}
            <Section title="9. Cookies">
                <p>
                    La plateforme SendProColis utilise des cookies strictement nécessaires à son fonctionnement :
                </p>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    marginTop: 12
                }}>
                    {[
                        { icon: '🔑', label: 'Cookies de session', desc: 'pour l\'authentification' },
                        { icon: '🛡️', label: 'Cookies de sécurité', desc: 'pour la protection de votre compte' },
                        { icon: '⚙️', label: 'Cookies de préférences', desc: 'pour l\'affichage' }
                    ].map((item, index) => (
                        <div key={index} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: 10,
                            background: 'var(--surface-page)',
                            borderRadius: 8,
                            border: '1px solid var(--border-subtle)'
                        }}>
                            <span style={{ fontSize: 24 }}>{item.icon}</span>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-strong)' }}>
                                    {item.label}
                                </div>
                                <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                                    {item.desc}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <p style={{ marginTop: 12 }}>
                    Aucun cookie publicitaire ou de suivi tiers n'est utilisé sur la plateforme. Vous pouvez configurer
                    votre navigateur pour bloquer les cookies, mais certaines fonctionnalités pourraient ne plus être
                    accessibles.
                </p>
            </Section>

            {/* Section 10 : Modifications */}
            <Section title="10. Modifications de la politique de confidentialité">
                <p>
                    SendProColis se réserve le droit de modifier la présente politique à tout moment. En cas de
                    modification substantielle, les utilisateurs seront informés par email ou via une notification
                    sur la plateforme au moins 15 jours avant l'entrée en vigueur des modifications.
                </p>
                <div style={{
                    marginTop: 12,
                    padding: 16,
                    background: 'var(--amber-50)',
                    borderRadius: 12,
                    border: '1px solid var(--amber-200)'
                }}>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--amber-700)' }}>
                        📌 Nous vous invitons à consulter régulièrement cette page pour prendre connaissance de toute mise à jour.
                    </p>
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
                Dakar, Sénégal ·{' '}
                <a href={`mailto:${CONTACT_INFO.email}`} style={{ color: 'var(--color-primary)' }}>
                    {CONTACT_INFO.email}
                </a>
            </p>
        </div>
    )
}
