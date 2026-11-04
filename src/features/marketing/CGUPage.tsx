import { MarketingLayout, MarketingHero, MarketingSection, MarketingAlert, MarketingFeatureGrid } from './MarketingLayout'
import type { MarketingFeatureItem } from './MarketingLayout'

const SERVICES: MarketingFeatureItem[] = [
    { icon: 'package_2', tone: 'teal', title: 'Envoi de colis', text: 'au Sénégal, en Afrique et à l\'international' },
    { icon: 'handshake', tone: 'teal', title: 'Mise en relation', text: 'entre expéditeurs et chauffeurs vérifiés' },
    { icon: 'forum', tone: 'teal', title: 'Gestion des offres', text: 'enchères et libre service' },
    { icon: 'credit_card', tone: 'teal', title: 'Paiements sécurisés', text: 'traitement des transactions' },
    { icon: 'star', tone: 'amber', title: 'Système de réputation', text: 'notation pour garantir la qualité' }
]

const ACCOUNT_RULES: MarketingFeatureItem[] = [
    { icon: 'check_circle', tone: 'green', title: 'Informations exactes', text: 'fournir des données complètes et à jour' },
    { icon: 'lock', tone: 'teal', title: 'Confidentialité', text: 'maintenir la sécurité de ses identifiants' },
    { icon: 'cancel', tone: 'rose', title: 'Authenticité', text: 'ne pas créer de faux compte' },
    { icon: 'campaign', tone: 'amber', title: 'Signalement', text: 'informer en cas d\'utilisation frauduleuse' }
]

const USER_OBLIGATIONS: MarketingFeatureItem[] = [
    { icon: 'gavel', tone: 'indigo', title: 'Respect des lois', text: 'lois sénégalaises et des pays de destination' },
    { icon: 'description', tone: 'teal', title: 'Informations exactes', text: 'sur les colis expédiés' },
    { icon: 'cancel', tone: 'rose', title: 'Marchandises interdites', text: 'ne pas transporter de produits illicites' },
    { icon: 'lock', tone: 'teal', title: 'Usage légitime', text: 'ne pas détourner la plateforme' },
    { icon: 'handshake', tone: 'teal', title: 'Respect des utilisateurs', text: 'courtoisie dans les échanges' },
    { icon: 'check_circle', tone: 'green', title: 'Honorer les engagements', text: 'offres acceptées et transports convenus' }
]

const CANCELLATION: MarketingFeatureItem[] = [
    { icon: 'check_circle', tone: 'green', title: 'Avant prise en charge', text: 'annulation sans frais, remboursement intégral' },
    { icon: 'warning', tone: 'amber', title: 'Après prise en charge', text: 'frais de pénalité selon l\'avancement' },
    { icon: 'autorenew', tone: 'teal', title: 'Annulation par le chauffeur', text: 'remboursement intégral pour l\'expéditeur' }
]

const LIMITATIONS: MarketingFeatureItem[] = [
    { icon: 'build', tone: 'amber', title: 'Indisponibilité', text: 'maintenance ou incidents techniques' },
    { icon: 'person', tone: 'indigo', title: 'Actes des utilisateurs', text: 'expéditeurs et chauffeurs' },
    { icon: 'payments', tone: 'rose', title: 'Dommages indirects', text: 'pertes de revenus ou préjudices commerciaux' },
    { icon: 'cyclone', tone: 'teal', title: 'Force majeure', text: 'catastrophes, grèves, restrictions' }
]

const TERMINATION: MarketingFeatureItem[] = [
    { icon: 'description', tone: 'rose', title: 'Violation des CGU', text: '' },
    { icon: 'cancel', tone: 'rose', title: 'Fausses informations', text: '' },
    { icon: 'block', tone: 'rose', title: 'Utilisation frauduleuse', text: '' },
    { icon: 'gavel', tone: 'rose', title: 'Non-respect des lois', text: '' }
]

export function CGUPage() {
    return (
        <MarketingLayout>
            <MarketingHero
                eyebrow="Légal"
                eyebrowIcon="gavel"
                title={<>CONDITIONS GÉNÉRALES D'UTILISATION</>}
                lead="SendProColis — CGU"
                updated="17 juillet 2026"
            />
            <div className="mkt-sections">
                <MarketingAlert tone="info" title="Acceptation">
                    En créant un compte ou en utilisant nos services, vous acceptez sans réserve les présentes Conditions Générales d'Utilisation (CGU).
                </MarketingAlert>

                <MarketingSection title="1. Objet et acceptation" icon="gavel" iconTone="teal">
                    <p>
                        Les présentes Conditions Générales d'Utilisation (CGU) définissent les modalités d'utilisation de la
                        plateforme SendProColis. En créant un compte ou en utilisant nos services, vous acceptez sans réserve
                        les présentes CGU.
                    </p>
                </MarketingSection>

                <MarketingSection title="2. Description des services" icon="apps" iconTone="teal">
                    <p>SendProColis propose les services suivants :</p>
                    <MarketingFeatureGrid items={SERVICES} />
                </MarketingSection>

                <MarketingSection title="3. Inscription et compte" icon="person_add" iconTone="indigo">
                    <p>L'accès aux services nécessite la création d'un compte. L'utilisateur s'engage à :</p>
                    <MarketingFeatureGrid items={ACCOUNT_RULES} />
                    <p>
                        <strong>Responsabilité :</strong> Chaque utilisateur est responsable de toute activité effectuée via son compte.
                    </p>
                </MarketingSection>

                <MarketingSection title="4. Obligations des utilisateurs" icon="rule" iconTone="amber">
                    <p>Les utilisateurs s'engagent à :</p>
                    <MarketingFeatureGrid items={USER_OBLIGATIONS} />
                </MarketingSection>

                <MarketingSection title="5. Rôle de SendProColis" icon="hub" iconTone="teal">
                    <MarketingAlert tone="info" title="Intermédiaire">
                        SendProColis agit exclusivement en tant que plateforme d'intermédiation entre expéditeurs et chauffeurs transporteurs. Elle ne réalise pas elle-même le transport des colis et n'est pas partie au contrat de transport conclu entre l'expéditeur et le chauffeur.
                    </MarketingAlert>
                </MarketingSection>

                <MarketingSection title="6. Tarifs et commissions" icon="payments" iconTone="amber">
                    <p>
                        Les tarifs de transport sont fixés librement entre l'expéditeur et le chauffeur via le système
                        d'offres de la plateforme. SendProColis prélève une commission sur chaque transaction, dont le
                        montant est clairement affiché avant validation.
                    </p>
                </MarketingSection>

                <MarketingSection title="7. Paiements" icon="credit_card" iconTone="teal">
                    <p>
                        Les paiements sont traités via des prestataires partenaires agréés, notamment PayDunya. Les méthodes
                        de paiement disponibles incluent :
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
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
                </MarketingSection>

                <MarketingSection title="8. Annulation et remboursement" icon="autorenew" iconTone="amber">
                    <p>Les conditions d'annulation et de remboursement varient selon le statut de l'expédition :</p>
                    <MarketingFeatureGrid items={CANCELLATION} />
                </MarketingSection>

                <MarketingSection title="9. Propriété intellectuelle" icon="copyright" iconTone="indigo">
                    <p>
                        Tous les éléments de la plateforme (marque, logo, charte graphique, code source, contenus) sont la
                        propriété exclusive de SendProColis et sont protégés par les lois relatives à la propriété
                        intellectuelle. Toute reproduction, modification ou exploitation non autorisée est interdite.
                    </p>
                </MarketingSection>

                <MarketingSection title="10. Responsabilité et limitations" icon="shield" iconTone="amber">
                    <p>SendProColis s'engage à mettre en œuvre les moyens nécessaires pour assurer la disponibilité et la
                        sécurité de la plateforme. Toutefois, la responsabilité de SendProColis ne saurait être engagée :</p>
                    <MarketingFeatureGrid items={LIMITATIONS} />
                </MarketingSection>

                <MarketingSection title="11. Résiliation et suspension de compte" icon="block" iconTone="rose">
                    <p>SendProColis se réserve le droit de suspendre ou de résilier un compte utilisateur en cas de :</p>
                    <MarketingFeatureGrid items={TERMINATION} />
                    <p>
                        L'utilisateur peut également demander la suppression de son compte à tout moment via les paramètres
                        de son profil.
                    </p>
                </MarketingSection>

                <MarketingSection title="12. Modification des CGU" icon="edit_note" iconTone="teal">
                    <p>
                        SendProColis se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront
                        informés de toute modification substantielle par email ou via une notification sur la plateforme au
                        moins 15 jours avant l'entrée en vigueur des modifications.
                    </p>
                    <MarketingAlert tone="amber">
                        L'utilisation continue de la plateforme après cette date vaut acceptation des nouvelles CGU.
                    </MarketingAlert>
                </MarketingSection>

                <MarketingSection title="13. Droit applicable" icon="gavel" iconTone="indigo">
                    <p>
                        Les présentes CGU sont régies par le droit sénégalais. Tout litige relatif à leur interprétation ou
                        exécution relève de la compétence des tribunaux de Dakar, Sénégal.
                    </p>
                </MarketingSection>
            </div>
        </MarketingLayout>
    )
}
