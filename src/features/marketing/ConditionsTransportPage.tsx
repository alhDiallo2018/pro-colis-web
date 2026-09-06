import { MarketingHeader } from './MarketingHeader'

const CONTACT_INFO = {
    email: 'support-commercial@sendprocolis.com',
    address: 'Dakar, Sénégal'
}

export function ConditionsTransportPage() {
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
                    CONDITIONS DE TRANSPORT
                </h1>
                <p style={{
                    fontSize: 16,
                    color: 'var(--text-muted)',
                    margin: 0
                }}>
                    SendProColis — Transport de colis
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

            {/* Avertissement */}
            <div style={{
                background: 'var(--amber-50)',
                borderRadius: 16,
                padding: 24,
                marginBottom: 40,
                border: '1px solid var(--amber-200)',
                borderLeft: '4px solid var(--amber-500)'
            }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <span style={{ fontSize: 28 }}>📋</span>
                    <div>
                        <h3 style={{
                            fontFamily: 'var(--font-display)',
                            fontWeight: 700,
                            fontSize: 16,
                            color: 'var(--amber-700)',
                            margin: '0 0 4px 0'
                        }}>
                            À lire attentivement
                        </h3>
                        <p style={{
                            margin: 0,
                            color: 'var(--amber-600)',
                            fontSize: 14
                        }}>
                            L'utilisation de la plateforme SendProColis pour l'envoi ou le transport de colis implique
                            l'acceptation pleine et entière des présentes conditions de transport.
                        </p>
                    </div>
                </div>
            </div>

            {/* Section 1 : Acceptation des conditions */}
            <Section title="1. Acceptation des conditions">
                <p>
                    En créant une expédition, l'expéditeur et le chauffeur reconnaissent avoir pris connaissance
                    et accepté sans réserve ces conditions de transport.
                </p>
            </Section>

            {/* Section 2 : Obligations de l'expéditeur */}
            <Section title="2. Obligations de l'expéditeur">
                <p>L'expéditeur s'engage à :</p>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 12,
                    marginTop: 16
                }}>
                    {[
                        { icon: '📝', label: 'Informations exactes', desc: 'nature, poids, dimensions, valeur déclarée' },
                        { icon: '📦', label: 'Emballage adéquat', desc: 'assurer la protection du colis' },
                        { icon: '⚖️', label: 'Respect des lois', desc: 'lois applicables au transport' },
                        { icon: '🚫', label: 'Colis autorisés', desc: 'ne pas confier de colis interdits' }
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

            {/* Section 3 : Colis interdits */}
            <Section title="3. Colis interdits">
                <p><strong>Sont strictement interdits au transport :</strong></p>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 12,
                    marginTop: 16
                }}>
                    {[
                        { icon: '🔫', label: 'Armes et explosifs', desc: 'armes à feu, munitions, explosifs' },
                        { icon: '💊', label: 'Drogues et stupéfiants', desc: 'substances psychotropes' },
                        { icon: '☣️', label: 'Produits dangereux', desc: 'corrosifs, inflammables, toxiques' },
                        { icon: '🐕', label: 'Animaux vivants', desc: 'sans autorisation préalable' },
                        { icon: '🥫', label: 'Denrées périssables', desc: 'sans conditionnement approprié' },
                        { icon: '🔖', label: 'Contrefaçons', desc: 'marchandises illicites' },
                        { icon: '🚫', label: 'Objets volés', desc: 'd\'origine illicite' }
                    ].map((item, index) => (
                        <div key={index} style={{
                            padding: 14,
                            background: 'var(--red-50)',
                            borderRadius: 12,
                            border: '1px solid var(--red-200)'
                        }}>
                            <div style={{ fontSize: 24, marginBottom: 4 }}>{item.icon}</div>
                            <div style={{
                                fontWeight: 700,
                                fontSize: 14,
                                color: 'var(--red-700)'
                            }}>{item.label}</div>
                            <div style={{
                                fontSize: 12.5,
                                color: 'var(--red-600)',
                                marginTop: 2
                            }}>{item.desc}</div>
                        </div>
                    ))}
                </div>
            </Section>

            {/* Section 4 : Contrôle des colis */}
            <Section title="4. Contrôle des colis">
                <div style={{
                    padding: 16,
                    background: 'var(--teal-50)',
                    borderRadius: 12,
                    border: '1px solid var(--teal-100)'
                }}>
                    <p style={{ margin: 0 }}>
                        <strong>🔍 Droit de contrôle :</strong> SendProColis et les chauffeurs partenaires se réservent
                        le droit de vérifier le contenu des colis en cas de suspicion légitime. Tout refus de contrôle
                        pourra entraîner le refus de prise en charge du colis sans remboursement.
                    </p>
                </div>
            </Section>

            {/* Section 5 : Délais de livraison */}
            <Section title="5. Délais de livraison">
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 12,
                    marginTop: 16
                }}>
                    {[
                        { icon: '📊', label: 'Délais indicatifs', desc: 'variables selon circulation, météo, distance' },
                        { icon: '⚡', label: 'Option Express', desc: 'livraison prioritaire garantie' },
                        { icon: '⚠️', label: 'Aucune garantie ferme', desc: 'sauf pour l\'option Express' }
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

            {/* Section 6 : Livraison et remise */}
            <Section title="6. Livraison et remise du colis">
                <div style={{
                    padding: 16,
                    background: 'var(--surface-page)',
                    borderRadius: 12,
                    border: '1px solid var(--border-subtle)'
                }}>
                    <p style={{ margin: 0 }}>
                        <strong>🔐 Code PIN :</strong> La livraison est réputée effectuée lorsque le colis est remis
                        au destinataire contre communication du code PIN de confirmation. Le destinataire est tenu de
                        vérifier l'état du colis au moment de la réception.
                    </p>
                </div>
            </Section>

            {/* Section 7 : Annulation */}
            <Section title="7. Annulation">
                <p>L'annulation d'une expédition est possible :</p>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 12,
                    marginTop: 16
                }}>
                    {[
                        { icon: '✅', label: 'Avant prise en charge', desc: 'annulation sans frais' },
                        { icon: '⚠️', label: 'Après prise en charge', desc: 'frais proportionnels au trajet parcouru' }
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

            {/* Section 8 : Limitation de responsabilité */}
            <Section title="8. Limitation de responsabilité">
                <div style={{
                    padding: 16,
                    background: 'var(--amber-50)',
                    borderRadius: 12,
                    border: '1px solid var(--amber-200)'
                }}>
                    <p style={{ margin: 0 }}>
                        <strong>⚖️ Intermédiaire :</strong> SendProColis agit en tant que plateforme d'intermédiation.
                        La société n'est pas responsable des dommages causés au colis pendant le transport, sauf négligence
                        avérée de la plateforme. La responsabilité du transport incombe au chauffeur mandaté par l'expéditeur.
                    </p>
                </div>
            </Section>

            {/* Section 9 : Réclamations */}
            <Section title="9. Réclamations relatives au transport">
                <p>
                    Toute réclamation concernant un colis doit être adressée à{' '}
                    <a href={`mailto:${CONTACT_INFO.email}`} style={{ color: 'var(--color-primary)' }}>
                        {CONTACT_INFO.email}
                    </a>{' '}
                    dans les <strong>48 heures</strong> suivant la livraison (ou la date prévue de livraison en cas de retard).
                </p>

                <div style={{
                    marginTop: 16,
                    padding: 16,
                    background: 'var(--surface-page)',
                    borderRadius: 12,
                    border: '1px solid var(--border-subtle)'
                }}>
                    <div style={{
                        fontWeight: 700,
                        fontSize: 14,
                        color: 'var(--text-strong)',
                        marginBottom: 10
                    }}>
                        📋 Informations requises :
                    </div>
                    <ul style={{
                        paddingLeft: 24,
                        margin: 0,
                        listStyleType: 'disc'
                    }}>
                        <li style={{ marginBottom: 4 }}>numéro de suivi du colis</li>
                        <li style={{ marginBottom: 4 }}>date et heure de l'expédition</li>
                        <li style={{ marginBottom: 4 }}>description détaillée du problème rencontré</li>
                        <li>photos du colis endommagé le cas échéant</li>
                    </ul>
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
