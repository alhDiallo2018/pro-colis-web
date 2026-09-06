import { MarketingHeader } from './MarketingHeader'

const CONTACT_INFO = {
    email: 'support-commercial@sendprocolis.com',
    phone: '+221 76 516 27 96',
    address: 'Dakar, Sénégal'
}

export function RemboursementPage() {
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
                    ANNULATION ET REMBOURSEMENT
                </h1>
                <p style={{
                    fontSize: 16,
                    color: 'var(--text-muted)',
                    margin: 0
                }}>
                    SendProColis — Politique de remboursement
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
                    <span style={{ fontSize: 28 }}>ℹ️</span>
                    <div>
                        <h3 style={{
                            fontFamily: 'var(--font-display)',
                            fontWeight: 700,
                            fontSize: 16,
                            color: 'var(--amber-700)',
                            margin: '0 0 4px 0'
                        }}>
                            Information importante
                        </h3>
                        <p style={{
                            margin: 0,
                            color: 'var(--amber-600)',
                            fontSize: 14
                        }}>
                            Les remboursements sont traités selon les conditions décrites ci-dessous.
                            En cas de doute, contactez notre support.
                        </p>
                    </div>
                </div>
            </div>

            {/* Section 1 : Annulation avant prise en charge */}
            <Section title="1. Annulation avant prise en charge">
                <p>
                    Vous pouvez annuler une expédition <strong>sans frais</strong> tant que le chauffeur n'a pas
                    confirmé la prise en charge du colis. Dans ce cas :
                </p>
                <FeatureList items={[
                    'le montant total est intégralement remboursé',
                    'le remboursement est effectué via le même moyen de paiement utilisé lors de la commande',
                    'aucun frais d\'annulation n\'est facturé'
                ]} />
            </Section>

            {/* Section 2 : Annulation après prise en charge */}
            <Section title="2. Annulation après prise en charge">
                <p>
                    Si le colis a déjà été pris en charge par le chauffeur, l'annulation peut entraîner des frais :
                </p>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 12,
                    marginTop: 16
                }}>
                    {[
                        { icon: '📊', label: 'Remboursement au prorata', desc: 'calculé sur le trajet non effectué' },
                        { icon: '💰', label: 'Frais de pénalité', desc: 'peuvent s\'appliquer selon les circonstances' },
                        { icon: '🧑‍✈️', label: 'Indemnisation chauffeur', desc: 'pour la partie du trajet déjà parcourue' }
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

            {/* Section 3 : Conditions de remboursement */}
            <Section title="3. Conditions de remboursement">
                <p>
                    Les remboursements sont effectués selon les modalités suivantes :
                </p>
                <FeatureList items={[
                    'le montant remboursé est calculé automatiquement par la plateforme selon le statut de l\'expédition',
                    'le remboursement est crédité sur le même moyen de paiement que la transaction initiale',
                    'en cas de paiement en espèces, le remboursement est effectué par mobile money ou virement bancaire selon vos préférences'
                ]} />
            </Section>

            {/* Section 4 : Colis perdu ou endommagé */}
            <Section title="4. Colis perdu ou endommagé">
                <p>
                    En cas de colis perdu ou endommagé pendant le transport, vous devez suivre la procédure de
                    réclamation suivante :
                </p>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    marginTop: 16
                }}>
                    {[
                        { step: '1', label: 'Signaler le problème', desc: 'dans les 48 heures suivant la livraison (ou la date prévue)' },
                        { step: '2', label: 'Envoyer un email', desc: (
                                <>
                                    à <strong><EmailLink email={CONTACT_INFO.email} /></strong> avec votre numéro de suivi,
                                    une description du problème et des photos le cas échéant
                                </>
                            ) },
                        { step: '3', label: 'Évaluation', desc: 'notre équipe évaluera votre dossier et vous proposera une solution dans un délai de 7 jours ouvrés' }
                    ].map((item) => (
                        <div key={item.step} style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 14,
                            padding: 12,
                            background: 'var(--surface-page)',
                            borderRadius: 10,
                            border: '1px solid var(--border-subtle)'
                        }}>
                            <div style={{
                                width: 30,
                                height: 30,
                                borderRadius: '50%',
                                background: 'var(--color-primary)',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 13,
                                fontWeight: 700,
                                flexShrink: 0
                            }}>
                                {item.step}
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-strong)' }}>
                                    {item.label}
                                </div>
                                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                                    {item.desc}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Section>

            {/* Section 5 : Délais de remboursement */}
            <Section title="5. Délais de remboursement">
                <p>
                    Les délais de remboursement varient selon la méthode de paiement :
                </p>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 12,
                    marginTop: 16
                }}>
                    {[
                        { icon: '📱', label: 'Mobile Money', desc: 'Wave, Orange Money, Free Money', delay: '5 à 7 jours ouvrés' },
                        { icon: '💳', label: 'Carte bancaire', desc: 'Visa, Mastercard', delay: '7 à 10 jours ouvrés' },
                        { icon: '💰', label: 'Espèces', desc: 'Paiement en liquide', delay: '5 jours ouvrés' }
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
                            <div style={{
                                marginTop: 8,
                                paddingTop: 8,
                                borderTop: '1px solid var(--border-subtle)',
                                fontSize: 13,
                                fontWeight: 600,
                                color: 'var(--color-primary)'
                            }}>
                                ⏱️ {item.delay}
                            </div>
                        </div>
                    ))}
                </div>
            </Section>

            {/* Section 6 : Cas de non-remboursement */}
            <Section title="6. Cas de non-remboursement">
                <p>
                    Aucun remboursement ne sera accordé dans les cas suivants :
                </p>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 12,
                    marginTop: 16
                }}>
                    {[
                        { icon: '🚫', label: 'Colis interdits', desc: 'contenant des marchandises interdites par notre politique' },
                        { icon: '❌', label: 'Informations erronées', desc: 'ayant entraîné la perte ou l\'endommagement du colis' },
                        { icon: '🙅', label: 'Refus du destinataire', desc: 'sans motif légitime lié à la plateforme' },
                        { icon: '📦', label: 'Emballage inadapté', desc: 'ayant causé les dommages' },
                        { icon: '🌪️', label: 'Force majeure', desc: 'catastrophes naturelles, événements politiques, restrictions gouvernementales' }
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

            {/* Section 7 : Contact */}
            <Section title="7. Contact pour les réclamations">
                <div style={{
                    padding: 20,
                    background: 'var(--surface-page)',
                    borderRadius: 12,
                    border: '1px solid var(--border-subtle)'
                }}>
                    <p style={{ margin: '0 0 12px 0' }}>
                        Pour toute question relative à un remboursement ou pour déposer une réclamation, contactez-nous :
                    </p>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8
                    }}>
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
                    <p style={{ marginTop: 12, fontSize: 13, color: 'var(--text-muted)' }}>
                        Nous nous engageons à traiter votre demande avec diligence et à vous tenir informé de l'évolution de
                        votre dossier.
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

function FeatureList({ items }: { items: string[] }) {
    return (
        <ul style={{
            paddingLeft: 24,
            margin: '8px 0 0',
            listStyleType: 'disc'
        }}>
            {items.map((item, index) => (
                <li key={`feature-${index}`} style={{ marginBottom: 6 }}>
                    {item}
                </li>
            ))}
        </ul>
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
