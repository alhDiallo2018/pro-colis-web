import type { ReactNode } from 'react'
import { MarketingLayout, MarketingHero, MarketingSection, MarketingAlert, MarketingFeatureGrid } from './MarketingLayout'
import type { MarketingFeatureItem } from './MarketingLayout'
import { useSupportContact, useLegalConfig } from '@/lib/usePublicConfig'

const AFTER_PICKUP: MarketingFeatureItem[] = [
    { icon: 'bar_chart', tone: 'teal', title: 'Remboursement au prorata', text: 'calculé sur le trajet non effectué' },
    { icon: 'payments', tone: 'amber', title: 'Frais de pénalité', text: 'peuvent s\'appliquer selon les circonstances' },
    { icon: 'local_shipping', tone: 'teal', title: 'Indemnisation chauffeur', text: 'pour la partie du trajet déjà parcourue' }
]

const NON_REFUND: MarketingFeatureItem[] = [
    { icon: 'block', tone: 'rose', title: 'Colis interdits', text: 'contenant des marchandises interdites par notre politique' },
    { icon: 'cancel', tone: 'rose', title: 'Informations erronées', text: 'ayant entraîné la perte ou l\'endommagement du colis' },
    { icon: 'do_not_disturb', tone: 'rose', title: 'Refus du destinataire', text: 'sans motif légitime lié à la plateforme' },
    { icon: 'package_2', tone: 'rose', title: 'Emballage inadapté', text: 'ayant causé les dommages' },
    { icon: 'cyclone', tone: 'rose', title: 'Force majeure', text: 'catastrophes naturelles, événements politiques, restrictions gouvernementales' }
]

export function RemboursementPage() {
    const support = useSupportContact()
    const legal = useLegalConfig()

    const steps: Array<{ step: string; label: string; desc: ReactNode }> = [
        { step: '1', label: 'Signaler le problème', desc: 'dans les 48 heures suivant la livraison (ou la date prévue)' },
        { step: '2', label: 'Envoyer un email', desc: (
                <>
                    à <strong><EmailLink email={support.email} /></strong> avec votre numéro de suivi,
                    une description du problème et des photos le cas échéant
                </>
            ) },
        { step: '3', label: 'Évaluation', desc: 'notre équipe évaluera votre dossier et vous proposera une solution dans un délai de 7 jours ouvrés' }
    ]

    const delays: Array<{ icon: string; label: string; desc: string; delay: string }> = [
        { icon: 'smartphone', label: 'Mobile Money', desc: 'Wave, Orange Money, Free Money', delay: '5 à 7 jours ouvrés' },
        { icon: 'credit_card', label: 'Carte bancaire', desc: 'Visa, Mastercard', delay: '7 à 10 jours ouvrés' },
        { icon: 'payments', label: 'Espèces', desc: 'Paiement en liquide', delay: '5 jours ouvrés' }
    ]

    return (
        <MarketingLayout>
            <MarketingHero
                eyebrow="Garantie"
                eyebrowIcon="verified_user"
                title={<>ANNULATION ET REMBOURSEMENT</>}
                lead="SendProColis — Politique de remboursement"
                updated="17 juillet 2026"
            />
            <div className="mkt-sections">
                <MarketingAlert tone="amber" title="Information importante" icon="info">
                    Les remboursements sont traités selon les conditions décrites ci-dessous. En cas de doute, contactez notre support.
                </MarketingAlert>

                <MarketingSection title="1. Annulation avant prise en charge" icon="check_circle" iconTone="green">
                    <p>
                        Vous pouvez annuler une expédition <strong>sans frais</strong> tant que le chauffeur n'a pas
                        confirmé la prise en charge du colis. Dans ce cas :
                    </p>
                    <FeatureList items={[
                        'le montant total est intégralement remboursé',
                        'le remboursement est effectué via le même moyen de paiement utilisé lors de la commande',
                        'aucun frais d\'annulation n\'est facturé'
                    ]} />
                </MarketingSection>

                <MarketingSection title="2. Annulation après prise en charge" icon="autorenew" iconTone="amber">
                    <p>Si le colis a déjà été pris en charge par le chauffeur, l'annulation peut entraîner des frais :</p>
                    <MarketingFeatureGrid items={AFTER_PICKUP} />
                </MarketingSection>

                <MarketingSection title="3. Conditions de remboursement" icon="rule" iconTone="teal">
                    <p>Les remboursements sont effectués selon les modalités suivantes :</p>
                    <FeatureList items={[
                        'le montant remboursé est calculé automatiquement par la plateforme selon le statut de l\'expédition',
                        'le remboursement est crédité sur le même moyen de paiement que la transaction initiale',
                        'en cas de paiement en espèces, le remboursement est effectué par mobile money ou virement bancaire selon vos préférences'
                    ]} />
                </MarketingSection>

                <MarketingSection title="4. Colis perdu ou endommagé" icon="report" iconTone="rose">
                    <p>En cas de colis perdu ou endommagé pendant le transport, vous devez suivre la procédure de réclamation suivante :</p>
                    <div className="mkt-steps">
                        {steps.map((item) => (
                            <div key={item.step} className="mkt-step">
                                <div className="mkt-step-num">{item.step}</div>
                                <div className="mkt-step-body">
                                    <div className="mkt-step-title">{item.label}</div>
                                    <div className="mkt-step-text">{item.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </MarketingSection>

                <MarketingSection title="5. Délais de remboursement" icon="schedule" iconTone="teal">
                    <p>Les délais de remboursement varient selon la méthode de paiement :</p>
                    <div className="mkt-grid">
                        {delays.map((item, index) => (
                            <div key={index} className="mkt-feature">
                                <div className="mkt-feature-icon">
                                    <span className="material-symbols-rounded" aria-hidden="true">{item.icon}</span>
                                </div>
                                <div className="mkt-feature-title">{item.label}</div>
                                <div className="mkt-feature-text">{item.desc}</div>
                                <div style={{
                                    marginTop: 8,
                                    paddingTop: 8,
                                    borderTop: '1px solid var(--border-subtle)',
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: 'var(--color-primary)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4
                                }}>
                                    <span className="material-symbols-rounded" aria-hidden="true" style={{ fontSize: 16 }}>schedule</span>
                                    {item.delay}
                                </div>
                            </div>
                        ))}
                    </div>
                </MarketingSection>

                <MarketingSection title="6. Cas de non-remboursement" icon="block" iconTone="rose">
                    <p>Aucun remboursement ne sera accordé dans les cas suivants :</p>
                    <MarketingFeatureGrid items={NON_REFUND} />
                </MarketingSection>

                <MarketingSection title="7. Contact pour les réclamations" icon="support_agent" iconTone="teal">
                    <p>Pour toute question relative à un remboursement ou pour déposer une réclamation, contactez-nous :</p>
                    <div className="mkt-grid">
                        <a href={`mailto:${support.email}`} className="mkt-contact-card">
                            <div className="mkt-contact-card-icon"><span className="material-symbols-rounded">mail</span></div>
                            <div>
                                <div className="mkt-contact-card-label">Email</div>
                                <div className="mkt-contact-card-value">{support.email}</div>
                            </div>
                        </a>
                        <a href={`tel:${(support.technicalPhone || support.phone || '').replace(/\s/g, '')}`} className="mkt-contact-card">
                            <div className="mkt-contact-card-icon"><span className="material-symbols-rounded">call</span></div>
                            <div>
                                <div className="mkt-contact-card-label">Téléphone</div>
                                <div className="mkt-contact-card-value">{support.technicalPhone || support.phone}</div>
                            </div>
                        </a>
                        <div className="mkt-contact-card">
                            <div className="mkt-contact-card-icon"><span className="material-symbols-rounded">pin_drop</span></div>
                            <div>
                                <div className="mkt-contact-card-label">Adresse</div>
                                <div className="mkt-contact-card-value">{legal.address || 'Dakar, Sénégal'}</div>
                            </div>
                        </div>
                    </div>
                    <p style={{ marginTop: 12, fontSize: 13, color: 'var(--text-muted)' }}>
                        Nous nous engageons à traiter votre demande avec diligence et à vous tenir informé de l'évolution de
                        votre dossier.
                    </p>
                </MarketingSection>
            </div>
        </MarketingLayout>
    )
}

function FeatureList({ items }: { items: string[] }) {
    return (
        <ul>
            {items.map((item, index) => (
                <li key={`feature-${index}`}>{item}</li>
            ))}
        </ul>
    )
}

function EmailLink({ email }: { email: string }) {
    return (
        <a href={`mailto:${email}`}>{email}</a>
    )
}
