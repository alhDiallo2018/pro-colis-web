import { MarketingHeader } from './MarketingHeader'

export function ColisInterditsPage() {
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
                    COLIS INTERDITS
                </h1>
                <p style={{
                    fontSize: 16,
                    color: 'var(--text-muted)',
                    margin: 0
                }}>
                    SendProColis — Ce que vous ne pouvez pas envoyer
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
                background: 'var(--red-50)',
                borderRadius: 16,
                padding: 24,
                marginBottom: 40,
                border: '1px solid var(--red-200)',
                borderLeft: '4px solid var(--red-500)'
            }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <span style={{ fontSize: 28 }}>🚫</span>
                    <div>
                        <h3 style={{
                            fontFamily: 'var(--font-display)',
                            fontWeight: 700,
                            fontSize: 16,
                            color: 'var(--red-700)',
                            margin: '0 0 4px 0'
                        }}>
                            Attention
                        </h3>
                        <p style={{
                            margin: 0,
                            color: 'var(--red-600)',
                            fontSize: 14
                        }}>
                            Le non-respect de cette politique peut entraîner la suspension de votre compte
                            et des poursuites judiciaires.
                        </p>
                    </div>
                </div>
            </div>

            {/* Section 1 : Colis strictement interdits */}
            <Section title="1. Colis strictement interdits">
                <p>
                    Les articles suivants sont <strong>strictement interdits</strong> au transport sur la plateforme
                    SendProColis, conformément à la réglementation sénégalaise et aux réglementations internationales
                    applicables (pays de départ, de transit et de destination) :
                </p>
                <List items={[
                    { label: 'Armes et munitions', desc: 'armes à feu, armes blanches, fusils, pistolets, munitions, pièces d\'armes, armes factices réalistes' },
                    { label: 'Explosifs et matières inflammables', desc: 'explosifs, feux d\'artifice, pétards, essence, gaz sous pression, aérosols inflammables, allumettes en grande quantité' },
                    { label: 'Drogues et stupéfiants', desc: 'toute substance classée comme drogue ou stupéfiant par la loi sénégalaise ou par celle du pays de destination, y compris les produits à usage dit récréatif' },
                    { label: 'Animaux vivants', desc: 'animaux domestiques ou sauvages sans autorisation spéciale et conditions de transport adaptées' },
                    { label: 'Produits chimiques dangereux', desc: 'acides, produits corrosifs, toxiques, radioactifs, pesticides, engrais chimiques non autorisés' },
                    { label: 'Produits biologiques dangereux', desc: 'déchets médicaux, substances infectieuses, échantillons biologiques non conditionnés selon les normes' },
                    { label: 'Contrefaçons', desc: 'produits contrefaits, copies illégales de marques, médicaments falsifiés, logiciels piratés' },
                    { label: 'Objets volés ou illicites', desc: 'tout objet obtenu illégalement ou dont la possession est interdite' },
                    { label: 'Monnaie et valeurs', desc: 'espèces en grande quantité, métaux précieux, pierres précieuses sans transport sécurisé agréé' },
                    { label: 'Objets obscènes ou interdits', desc: 'matériel à caractère obscène ou interdit par les lois sénégalaises ou celles des pays de destination' }
                ]} />
            </Section>

            {/* Section 2 : Produits réglementés */}
            <Section title="2. Produits réglementés">
                <p>
                    Certains produits ne sont pas interdits mais nécessitent une <strong>autorisation spéciale</strong>{' '}
                    et un conditionnement conforme :
                </p>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: 12,
                    marginTop: 16
                }}>
                    {[
                        { icon: '💊', label: 'Médicaments', desc: 'nécessitent une ordonnance valide et un emballage scellé' },
                        { icon: '🥫', label: 'Denrées périssables', desc: 'nécessitent un conditionnement isotherme ou réfrigéré' },
                        { icon: '🔋', label: 'Produits électroniques avec batterie', desc: 'batterie retirée ou protégée contre les courts-circuits' },
                        { icon: '🪟', label: 'Produits en verre ou fragiles', desc: 'emballage renforcé obligatoire avec mention « FRAGILE » visible' },
                        { icon: '📄', label: 'Documents confidentiels', desc: 'emballés dans une enveloppe scellée opaque' }
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

            {/* Section 3 : Conséquences */}
            <Section title="3. Conséquences du non-respect">
                <p>
                    Le non-respect de la politique relative aux colis interdits entraînera :
                </p>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 12,
                    marginTop: 16
                }}>
                    {[
                        { icon: '❌', label: 'Refus immédiat', desc: 'du colis par le chauffeur' },
                        { icon: '👮', label: 'Signalement', desc: 'aux autorités compétentes si nécessaire' },
                        { icon: '⛔', label: 'Suspension', desc: 'temporaire ou définitive du compte' },
                        { icon: '💸', label: 'Non-remboursement', desc: 'en cas d\'annulation liée au non-respect' },
                        { icon: '⚖️', label: 'Responsabilité pénale', desc: 'de l\'expéditeur en cas d\'infraction' }
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

            {/* Section 4 : Conseils d'emballage */}
            <Section title="4. Conseils d'emballage pour colis autorisés">
                <p>
                    Pour garantir la sécurité de vos colis pendant le transport, suivez ces recommandations :
                </p>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 12,
                    marginTop: 16
                }}>
                    {[
                        { icon: '📦', label: 'Emballage rigide', desc: 'adapté à la taille et au poids du contenu' },
                        { icon: '🧻', label: 'Remplissage', desc: 'papier bulle, mousse ou papier froissé pour combler les vides' },
                        { icon: '📐', label: 'Fermeture solide', desc: 'ruban adhésif résistant pour sceller l\'emballage' },
                        { icon: '📍', label: 'Adresse claire', desc: 'apposez l\'adresse et un numéro de téléphone de contact' },
                        { icon: '⚠️', label: 'Mentions visibles', desc: '« FRAGILE » ou « NE PAS RENVERSER » si nécessaire' },
                        { icon: '💧', label: 'Liquides', desc: 'placer le récipient dans un sac étanche avant emballage' },
                        { icon: '⚖️', label: 'Poids maximum', desc: 'ne dépassez pas 25 kg par colis, sauf accord préalable' }
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

function List({ items }: { items: Array<{ label: string; desc: string }> }) {
    return (
        <ul style={{
            paddingLeft: 24,
            margin: '8px 0 0',
            listStyleType: 'disc'
        }}>
            {items.map((item, index) => (
                <li key={`list-item-${index}`} style={{ marginBottom: 8 }}>
                    <strong>{item.label} :</strong> {item.desc}
                </li>
            ))}
        </ul>
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
                <a href="mailto:support-commercial@sendprocolis.com" style={{ color: 'var(--color-primary)' }}>
                    support-commercial@sendprocolis.com
                </a>
            </p>
        </div>
    )
}
