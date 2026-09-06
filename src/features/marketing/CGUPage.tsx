import { MarketingHeader } from './MarketingHeader'

const CONTACT_INFO = {
    email: 'support-commercial@sendprocolis.com',
    address: 'Dakar, Sénégal'
}

export function CGUPage() {
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
                    CONDITIONS GÉNÉRALES D'UTILISATION
                </h1>
                <p style={{
                    fontSize: 16,
                    color: 'var(--text-muted)',
                    margin: 0
                }}>
                    SendProColis — CGU
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
                    En créant un compte ou en utilisant nos services, vous acceptez sans réserve
                    les présentes Conditions Générales d'Utilisation (CGU).
                </p>
            </div>

            {/* Section 1 : Objet et acceptation */}
            <Section title="1. Objet et acceptation">
                <p>
                    Les présentes Conditions Générales d'Utilisation (CGU) définissent les modalités d'utilisation de la
                    plateforme SendProColis. En créant un compte ou en utilisant nos services, vous acceptez sans réserve
                    les présentes CGU.
                </p>
            </Section>

            {/* Section 2 : Description des services */}
            <Section title="2. Description des services">
                <p>SendProColis propose les services suivants :</p>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 12,
                    marginTop: 16
                }}>
                    {[
                        { icon: '📦', label: 'Envoi de colis', desc: 'au Sénégal, en Afrique et à l\'international' },
                        { icon: '🤝', label: 'Mise en relation', desc: 'entre expéditeurs et chauffeurs vérifiés' },
                        { icon: '💬', label: 'Gestion des offres', desc: 'enchères et libre service' },
                        { icon: '💳', label: 'Paiements sécurisés', desc: 'traitement des transactions' },
                        { icon: '⭐', label: 'Système de réputation', desc: 'notation pour garantir la qualité' }
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

            {/* Section 3 : Inscription et compte */}
            <Section title="3. Inscription et compte">
                <p>L'accès aux services nécessite la création d'un compte. L'utilisateur s'engage à :</p>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 12,
                    marginTop: 16
                }}>
                    {[
                        { icon: '✅', label: 'Informations exactes', desc: 'fournir des données complètes et à jour' },
                        { icon: '🔒', label: 'Confidentialité', desc: 'maintenir la sécurité de ses identifiants' },
                        { icon: '🚫', label: 'Authenticité', desc: 'ne pas créer de faux compte' },
                        { icon: '📢', label: 'Signalement', desc: 'informer en cas d\'utilisation frauduleuse' }
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
                <p style={{ marginTop: 12 }}>
                    <strong>Responsabilité :</strong> Chaque utilisateur est responsable de toute activité effectuée via son compte.
                </p>
            </Section>

            {/* Section 4 : Obligations des utilisateurs */}
            <Section title="4. Obligations des utilisateurs">
                <p>Les utilisateurs s'engagent à :</p>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 12,
                    marginTop: 16
                }}>
                    {[
                        { icon: '⚖️', label: 'Respect des lois', desc: 'lois sénégalaises et des pays de destination' },
                        { icon: '📝', label: 'Informations exactes', desc: 'sur les colis expédiés' },
                        { icon: '🚫', label: 'Marchandises interdites', desc: 'ne pas transporter de produits illicites' },
                        { icon: '🔒', label: 'Usage légitime', desc: 'ne pas détourner la plateforme' },
                        { icon: '🤝', label: 'Respect des utilisateurs', desc: 'courtoisie dans les échanges' },
                        { icon: '✅', label: 'Honorer les engagements', desc: 'offres acceptées et transports convenus' }
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

            {/* Section 5 : Rôle de SendProColis */}
            <Section title="5. Rôle de SendProColis">
                <div style={{
                    padding: 16,
                    background: 'var(--teal-50)',
                    borderRadius: 12,
                    border: '1px solid var(--teal-100)'
                }}>
                    <p style={{ margin: 0 }}>
                        <strong>📌 Intermédiaire :</strong> SendProColis agit exclusivement en tant que plateforme d'intermédiation
                        entre expéditeurs et chauffeurs transporteurs. Elle ne réalise pas elle-même le transport des colis
                        et n'est pas partie au contrat de transport conclu entre l'expéditeur et le chauffeur.
                    </p>
                </div>
            </Section>

            {/* Section 6 : Tarifs et commissions */}
            <Section title="6. Tarifs et commissions">
                <p>
                    Les tarifs de transport sont fixés librement entre l'expéditeur et le chauffeur via le système
                    d'offres de la plateforme. SendProColis prélève une commission sur chaque transaction, dont le
                    montant est clairement affiché avant validation.
                </p>
            </Section>

            {/* Section 7 : Paiements */}
            <Section title="7. Paiements">
                <p>
                    Les paiements sont traités via des prestataires partenaires agréés, notamment PayDunya. Les méthodes
                    de paiement disponibles incluent :
                </p>
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                    marginTop: 12
                }}>
                    {['Wave', 'Orange Money', 'Free Money', 'Carte bancaire', 'Espèces'].map((method, index) => (
                        <span key={index} style={{
                            padding: '6px 14px',
                            background: 'var(--surface-page)',
                            borderRadius: 20,
                            border: '1px solid var(--border-subtle)',
                            fontSize: 13,
                            fontWeight: 600,
                            color: 'var(--text-body)'
                        }}>
              {method}
            </span>
                    ))}
                </div>
                <p style={{ marginTop: 12 }}>
                    Les fonds sont sécurisés sur un compte de la plateforme jusqu'à confirmation de la livraison.
                </p>
            </Section>

            {/* Section 8 : Annulation et remboursement */}
            <Section title="8. Annulation et remboursement">
                <p>Les conditions d'annulation et de remboursement varient selon le statut de l'expédition :</p>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 12,
                    marginTop: 16
                }}>
                    {[
                        { icon: '✅', label: 'Avant prise en charge', desc: 'annulation sans frais, remboursement intégral' },
                        { icon: '⚠️', label: 'Après prise en charge', desc: 'frais de pénalité selon l\'avancement' },
                        { icon: '🔄', label: 'Annulation par le chauffeur', desc: 'remboursement intégral pour l\'expéditeur' }
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

            {/* Section 9 : Propriété intellectuelle */}
            <Section title="9. Propriété intellectuelle">
                <p>
                    Tous les éléments de la plateforme (marque, logo, charte graphique, code source, contenus) sont la
                    propriété exclusive de SendProColis et sont protégés par les lois relatives à la propriété
                    intellectuelle. Toute reproduction, modification ou exploitation non autorisée est interdite.
                </p>
            </Section>

            {/* Section 10 : Responsabilité */}
            <Section title="10. Responsabilité et limitations">
                <p>SendProColis s'engage à mettre en œuvre les moyens nécessaires pour assurer la disponibilité et la
                    sécurité de la plateforme. Toutefois, la responsabilité de SendProColis ne saurait être engagée :</p>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 12,
                    marginTop: 16
                }}>
                    {[
                        { icon: '🔧', label: 'Indisponibilité', desc: 'maintenance ou incidents techniques' },
                        { icon: '👤', label: 'Actes des utilisateurs', desc: 'expéditeurs et chauffeurs' },
                        { icon: '💸', label: 'Dommages indirects', desc: 'pertes de revenus ou préjudices commerciaux' },
                        { icon: '🌪️', label: 'Force majeure', desc: 'catastrophes, grèves, restrictions' }
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

            {/* Section 11 : Résiliation */}
            <Section title="11. Résiliation et suspension de compte">
                <p>SendProColis se réserve le droit de suspendre ou de résilier un compte utilisateur en cas de :</p>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 12,
                    marginTop: 16
                }}>
                    {[
                        { icon: '📜', label: 'Violation des CGU' },
                        { icon: '❌', label: 'Fausses informations' },
                        { icon: '🚫', label: 'Utilisation frauduleuse' },
                        { icon: '⚖️', label: 'Non-respect des lois' }
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
                        </div>
                    ))}
                </div>
                <p style={{ marginTop: 12 }}>
                    L'utilisateur peut également demander la suppression de son compte à tout moment via les paramètres
                    de son profil.
                </p>
            </Section>

            {/* Section 12 : Modification des CGU */}
            <Section title="12. Modification des CGU">
                <p>
                    SendProColis se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront
                    informés de toute modification substantielle par email ou via une notification sur la plateforme au
                    moins 15 jours avant l'entrée en vigueur des modifications.
                </p>
                <div style={{
                    marginTop: 12,
                    padding: 16,
                    background: 'var(--amber-50)',
                    borderRadius: 12,
                    border: '1px solid var(--amber-200)'
                }}>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--amber-700)' }}>
                        📌 L'utilisation continue de la plateforme après cette date vaut acceptation des nouvelles CGU.
                    </p>
                </div>
            </Section>

            {/* Section 13 : Droit applicable */}
            <Section title="13. Droit applicable">
                <p>
                    Les présentes CGU sont régies par le droit sénégalais. Tout litige relatif à leur interprétation ou
                    exécution relève de la compétence des tribunaux de Dakar, Sénégal.
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
