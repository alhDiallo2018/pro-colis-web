import { MarketingHeader } from './MarketingHeader'

const CONTACT_INFO = {
    email: 'support-commercial@sendprocolis.com',
    address: 'Dakar, Sénégal'
}

export function PaiementPage() {
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
                    POLITIQUE DE PAIEMENT
                </h1>
                <p style={{
                    fontSize: 16,
                    color: 'var(--text-muted)',
                    margin: 0
                }}>
                    SendProColis — Paiements sécurisés
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
                background: 'var(--teal-50)',
                borderRadius: 16,
                padding: 24,
                marginBottom: 40,
                border: '1px solid var(--teal-200)',
                borderLeft: '4px solid var(--teal-500)'
            }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <span style={{ fontSize: 28 }}>💳</span>
                    <div>
                        <h3 style={{
                            fontFamily: 'var(--font-display)',
                            fontWeight: 700,
                            fontSize: 16,
                            color: 'var(--teal-700)',
                            margin: '0 0 4px 0'
                        }}>
                            Paiements sécurisés
                        </h3>
                        <p style={{
                            margin: 0,
                            color: 'var(--teal-600)',
                            fontSize: 14
                        }}>
                            Tous les paiements sont traités via PayDunya, notre partenaire agréé, avec la plus haute
                            sécurité pour vos transactions.
                        </p>
                    </div>
                </div>
            </div>

            {/* Section 1 : Méthodes de paiement */}
            <Section title="1. Méthodes de paiement acceptées">
                <p>SendProColis propose plusieurs méthodes de paiement adaptées au marché sénégalais et aux envois internationaux :</p>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: 12,
                    marginTop: 16
                }}>
                    {[
                        { icon: '📱', label: 'Wave', desc: 'paiement mobile instantané' },
                        { icon: '📱', label: 'Orange Money', desc: 'paiement via Orange Money' },
                        { icon: '📱', label: 'Free Money', desc: 'paiement via Free Money' },
                        { icon: '💳', label: 'Carte bancaire', desc: 'Visa, Mastercard' },
                        { icon: '💰', label: 'Espèces', desc: 'à la remise du colis' }
                    ].map((method, index) => (
                        <div key={index} style={{
                            padding: 14,
                            background: 'var(--surface-page)',
                            borderRadius: 12,
                            border: '1px solid var(--border-subtle)',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: 28, marginBottom: 4 }}>{method.icon}</div>
                            <div style={{
                                fontWeight: 700,
                                fontSize: 14,
                                color: 'var(--text-strong)'
                            }}>{method.label}</div>
                            <div style={{
                                fontSize: 12,
                                color: 'var(--text-muted)',
                                marginTop: 2
                            }}>{method.desc}</div>
                        </div>
                    ))}
                </div>
            </Section>

            {/* Section 2 : Traitement des paiements */}
            <Section title="2. Traitement des paiements">
                <div style={{
                    padding: 16,
                    background: 'var(--surface-page)',
                    borderRadius: 12,
                    border: '1px solid var(--border-subtle)'
                }}>
                    <p style={{ margin: 0 }}>
                        <strong>🤝 Partenaire :</strong> Tous les paiements électroniques sont traités par l'intermédiaire de
                        <strong> PayDunya</strong>, notre partenaire de paiement agréé, qui garantit la conformité avec les
                        normes de sécurité internationales.
                    </p>
                    <p style={{ marginTop: 10 }}>
                        <strong>🔒 Compte séquestre :</strong> Le montant est débité immédiatement et conservé sur un compte
                        séquestre de la plateforme jusqu'à la confirmation de la livraison du colis.
                    </p>
                </div>
            </Section>

            {/* Section 3 : Sécurité des transactions */}
            <Section title="3. Sécurité des transactions">
                <p>La sécurité de vos transactions est notre priorité. SendProColis met en œuvre les mesures suivantes :</p>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 12,
                    marginTop: 16
                }}>
                    {[
                        { icon: '🔐', label: 'Chiffrement SSL/TLS', desc: 'de toutes les communications' },
                        { icon: '🛡️', label: 'Authentification forte', desc: 'pour les transactions' },
                        { icon: '✅', label: 'Conformité PCI-DSS', desc: 'via nos prestataires' },
                        { icon: '📊', label: 'Surveillance en temps réel', desc: 'des activités suspectes' },
                        { icon: '💾', label: 'Données non stockées', desc: 'aucune carte bancaire sur nos serveurs' }
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
                                fontSize: 12,
                                color: 'var(--text-muted)',
                                marginTop: 2
                            }}>{item.desc}</div>
                        </div>
                    ))}
                </div>
            </Section>

            {/* Section 4 : Frais et commissions */}
            <Section title="4. Frais et commissions">
                <p>SendProColis prélève une commission sur chaque transaction réussie. Le montant de la commission est :</p>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 12,
                    marginTop: 16
                }}>
                    {[
                        { icon: '👁️', label: 'Clairement indiqué', desc: 'avant validation de chaque expédition' },
                        { icon: '💳', label: 'Déduction automatique', desc: 'du montant versé au chauffeur' },
                        { icon: '📊', label: 'Commission variable', desc: 'selon le type d\'expédition' }
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
                                fontSize: 12,
                                color: 'var(--text-muted)',
                                marginTop: 2
                            }}>{item.desc}</div>
                        </div>
                    ))}
                </div>
                <p style={{ marginTop: 12 }}>
                    Des frais additionnels peuvent s'appliquer pour les paiements par carte bancaire ou mobile money,
                    conformément aux conditions des prestataires de paiement.
                </p>
            </Section>

            {/* Section 5 : Délais de traitement */}
            <Section title="5. Délais de traitement">
                <p>Les délais de traitement varient selon la méthode de paiement utilisée :</p>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 12,
                    marginTop: 16
                }}>
                    {[
                        { icon: '📱', label: 'Mobile Money', desc: 'instantané', time: '⚡' },
                        { icon: '💳', label: 'Carte bancaire', desc: 'immédiat', time: '⚡' },
                        { icon: '💰', label: 'Paiement au chauffeur', desc: 'à la livraison', time: '📦' },
                        { icon: '🏦', label: 'Versement chauffeur', desc: '48h ouvrées', time: '⏱️' }
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
                                fontSize: 12,
                                color: 'var(--text-muted)',
                                marginTop: 2
                            }}>{item.desc}</div>
                            <div style={{
                                marginTop: 6,
                                fontSize: 18
                            }}>{item.time}</div>
                        </div>
                    ))}
                </div>
            </Section>

            {/* Section 6 : Remboursements */}
            <Section title="6. Remboursements">
                <p>Les remboursements sont traités selon notre politique d'annulation et de remboursement :</p>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 12,
                    marginTop: 16
                }}>
                    {[
                        { icon: '🔄', label: 'Même moyen de paiement', desc: 'que la transaction initiale' },
                        { icon: '⏱️', label: 'Délai de 5 à 10 jours', desc: 'selon la méthode de paiement' },
                        { icon: '💸', label: 'Frais non remboursables', desc: 'frais de transaction' }
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
                                fontSize: 12,
                                color: 'var(--text-muted)',
                                marginTop: 2
                            }}>{item.desc}</div>
                        </div>
                    ))}
                </div>
            </Section>

            {/* Section 7 : Litiges de paiement */}
            <Section title="7. Litiges de paiement">
                <p>
                    En cas de litige concernant un paiement, contactez immédiatement notre service client à{' '}
                    <a href={`mailto:${CONTACT_INFO.email}`} style={{ color: 'var(--color-primary)' }}>
                        {CONTACT_INFO.email}
                    </a>.
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
                        📋 Nos engagements :
                    </div>
                    <ul style={{
                        paddingLeft: 24,
                        margin: 0,
                        listStyleType: 'disc'
                    }}>
                        <li style={{ marginBottom: 6 }}>
                            <strong>Accusé de réception</strong> — sous 48 heures ouvrées
                        </li>
                        <li style={{ marginBottom: 6 }}>
                            <strong>Enquête et suivi</strong> — vous tenir informé de l'avancement
                        </li>
                        <li>
                            <strong>Solution</strong> — dans un délai maximum de 7 jours ouvrés
                        </li>
                    </ul>
                </div>

                <p style={{ marginTop: 12 }}>
                    Si le litige n'est pas résolu à l'amiable, vous pouvez saisir les autorités compétentes au Sénégal.
                </p>
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
