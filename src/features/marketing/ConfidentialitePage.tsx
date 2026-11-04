import { MarketingLayout, MarketingHero, MarketingSection, MarketingAlert, MarketingFeatureGrid } from './MarketingLayout'
import type { MarketingFeatureItem } from './MarketingLayout'
import { useSupportContact, useLegalConfig } from '@/lib/usePublicConfig'

const DATA_COLLECTED: MarketingFeatureItem[] = [
    { icon: 'badge', tone: 'teal', title: 'Données d\'identification', text: 'nom, prénom, téléphone, email' },
    { icon: 'person', tone: 'teal', title: 'Données de profil', text: 'photo, adresse, ville de résidence' },
    { icon: 'pin_drop', tone: 'teal', title: 'Données de localisation', text: 'position pour le suivi des colis' },
    { icon: 'package_2', tone: 'teal', title: 'Données relatives aux colis', text: 'nature, poids, dimensions, valeur' },
    { icon: 'credit_card', tone: 'teal', title: 'Données de transaction', text: 'historique, montants, moyens de paiement' },
    { icon: 'computer', tone: 'teal', title: 'Données techniques', text: 'IP, appareil, OS, journaux de connexion' }
]

const PURPOSES: MarketingFeatureItem[] = [
    { icon: 'person', tone: 'teal', title: 'Gestion de compte', text: 'création et gestion de votre compte utilisateur' },
    { icon: 'package_2', tone: 'teal', title: 'Suivi des expéditions', text: 'traitement et suivi de vos colis' },
    { icon: 'handshake', tone: 'teal', title: 'Mise en relation', text: 'entre expéditeurs et chauffeurs' },
    { icon: 'credit_card', tone: 'teal', title: 'Paiements', text: 'traitement des paiements et des commissions' },
    { icon: 'lock', tone: 'teal', title: 'Sécurité', text: 'sécurisation de la plateforme et lutte contre la fraude' },
    { icon: 'trending_up', tone: 'teal', title: 'Amélioration', text: 'amélioration continue du service' },
    { icon: 'forum', tone: 'teal', title: 'Communication', text: 'notifications, confirmations, support' }
]

const LEGAL_BASIS: MarketingFeatureItem[] = [
    { icon: 'description', tone: 'teal', title: 'Exécution du contrat', text: 'nécessaire à la fourniture de nos services' },
    { icon: 'check_circle', tone: 'green', title: 'Votre consentement', text: 'pour certains traitements spécifiques' },
    { icon: 'gavel', tone: 'indigo', title: 'Obligation légale', text: 'conservation des données comptables et fiscales' },
    { icon: 'target', tone: 'teal', title: 'Intérêt légitime', text: 'amélioration du service, sécurité, prévention de la fraude' }
]

const RETENTION: MarketingFeatureItem[] = [
    { icon: 'person', tone: 'teal', title: 'Données de compte', text: 'pendant toute la durée du compte + 3 ans' },
    { icon: 'bar_chart', tone: 'teal', title: 'Données de transaction', text: '10 ans (obligations comptables)' },
    { icon: 'pin_drop', tone: 'teal', title: 'Données de localisation', text: '6 mois après chaque expédition' },
    { icon: 'computer', tone: 'teal', title: 'Données de connexion', text: '12 mois maximum' }
]

const SECURITY: MarketingFeatureItem[] = [
    { icon: 'enhanced_encryption', tone: 'teal', title: 'Chiffrement en transit', text: 'HTTPS/TLS' },
    { icon: 'lock', tone: 'teal', title: 'Chiffrement au repos', text: 'données sensibles' },
    { icon: 'shield', tone: 'teal', title: 'Authentification forte', text: 'double facteur' },
    { icon: 'vpn_key', tone: 'teal', title: 'Contrôle d\'accès', text: 'strict par les équipes' },
    { icon: 'bar_chart', tone: 'teal', title: 'Surveillance continue', text: 'de la sécurité' }
]

const RIGHTS: MarketingFeatureItem[] = [
    { icon: 'visibility', tone: 'teal', title: 'Droit d\'accès', text: 'obtenir une copie de vos données' },
    { icon: 'edit', tone: 'teal', title: 'Droit de rectification', text: 'corriger vos données inexactes' },
    { icon: 'block', tone: 'rose', title: 'Droit d\'opposition', text: 'pour des motifs légitimes' },
    { icon: 'ios_share', tone: 'teal', title: 'Droit à la portabilité', text: 'recevoir vos données dans un format structuré' },
    { icon: 'delete', tone: 'rose', title: 'Droit à l\'effacement', text: 'dans les conditions prévues par la loi' }
]

const COOKIES: MarketingFeatureItem[] = [
    { icon: 'vpn_key', tone: 'teal', title: 'Cookies de session', text: 'pour l\'authentification' },
    { icon: 'shield', tone: 'teal', title: 'Cookies de sécurité', text: 'pour la protection de votre compte' },
    { icon: 'settings', tone: 'teal', title: 'Cookies de préférences', text: 'pour l\'affichage' }
]

export function ConfidentialitePage() {
    const support = useSupportContact()
    const legal = useLegalConfig()

    const recipients: MarketingFeatureItem[] = [
        { icon: 'business', tone: 'teal', title: 'Équipes SendProColis', text: 'personnel habilité' },
        { icon: 'local_shipping', tone: 'teal', title: 'Chauffeurs transporteurs', text: 'nécessaire à l\'expédition' },
        { icon: 'build', tone: 'teal', title: 'Prestataires techniques', text: legal.hostName ? `PayDunya, ${legal.hostName}, liés par contrat` : 'PayDunya, liés par contrat' },
        { icon: 'gavel', tone: 'indigo', title: 'Autorités compétentes', text: 'sur demande légale' }
    ]

    return (
        <MarketingLayout>
            <MarketingHero
                eyebrow="Vie privée"
                eyebrowIcon="lock"
                title={<>POLITIQUE DE CONFIDENTIALITÉ</>}
                lead="SendProColis — Protection de vos données personnelles"
                updated="17 juillet 2026"
            />
            <div className="mkt-sections">
                <MarketingAlert tone="info">
                    SendProColis accorde une importance primordiale à la protection de vos données personnelles. La présente politique de confidentialité décrit les données que nous collectons, comment nous les utilisons et les droits dont vous disposez.
                </MarketingAlert>

                <MarketingSection title="1. Données collectées" icon="database" iconTone="teal">
                    <p>Dans le cadre de l'utilisation de la plateforme, nous collectons les données suivantes :</p>
                    <MarketingFeatureGrid items={DATA_COLLECTED} />
                </MarketingSection>

                <MarketingSection title="2. Finalités du traitement" icon="target" iconTone="teal">
                    <p>Vos données sont collectées et traitées pour les finalités suivantes :</p>
                    <MarketingFeatureGrid items={PURPOSES} />
                </MarketingSection>

                <MarketingSection title="3. Base légale" icon="gavel" iconTone="indigo">
                    <p>Le traitement de vos données repose sur les bases légales suivantes :</p>
                    <MarketingFeatureGrid items={LEGAL_BASIS} />
                </MarketingSection>

                <MarketingSection title="4. Conservation des données" icon="schedule" iconTone="teal">
                    <p>Vos données personnelles sont conservées pour une durée limitée :</p>
                    <MarketingFeatureGrid items={RETENTION} />
                </MarketingSection>

                <MarketingSection title="5. Destinataires des données" icon="group" iconTone="teal">
                    <p>Vos données sont accessibles uniquement aux destinataires suivants :</p>
                    <MarketingFeatureGrid items={recipients} />
                    <MarketingAlert tone="info" title="Engagements">
                        SendProColis ne vend ni ne partage vos données personnelles à des tiers à des fins commerciales.
                    </MarketingAlert>
                </MarketingSection>

                <MarketingSection title="6. Sécurité des données" icon="shield" iconTone="teal">
                    <p>Nous mettons en œuvre des mesures techniques et organisationnelles appropriées :</p>
                    <MarketingFeatureGrid items={SECURITY} />
                </MarketingSection>

                <MarketingSection title="7. Vos droits" icon="account_circle" iconTone="teal">
                    <p>Conformément à la réglementation applicable, vous disposez des droits suivants :</p>
                    <MarketingFeatureGrid items={RIGHTS} />
                    <p>
                        Pour exercer vos droits, contactez-nous à{' '}
                        <a href={`mailto:${support.email}`}>{support.email}</a>
                    </p>
                </MarketingSection>

                <MarketingSection title="8. Délégué à la protection des données (DPO)" icon="support_agent" iconTone="teal">
                    <p>
                        Pour toute question relative à la protection de vos données personnelles, contactez notre DPO :{' '}
                        <a href={`mailto:${support.email}`}>{support.email}</a>
                    </p>
                </MarketingSection>

                <MarketingSection title="9. Cookies" icon="cookie" iconTone="amber">
                    <p>La plateforme SendProColis utilise des cookies strictement nécessaires à son fonctionnement :</p>
                    <MarketingFeatureGrid items={COOKIES} />
                    <p>
                        Aucun cookie publicitaire ou de suivi tiers n'est utilisé sur la plateforme. Vous pouvez configurer
                        votre navigateur pour bloquer les cookies, mais certaines fonctionnalités pourraient ne plus être
                        accessibles.
                    </p>
                </MarketingSection>

                <MarketingSection title="10. Modifications de la politique de confidentialité" icon="edit_note" iconTone="teal">
                    <p>
                        SendProColis se réserve le droit de modifier la présente politique à tout moment. En cas de
                        modification substantielle, les utilisateurs seront informés par email ou via une notification
                        sur la plateforme au moins 15 jours avant l'entrée en vigueur des modifications.
                    </p>
                    <MarketingAlert tone="amber">
                        Nous vous invitons à consulter régulièrement cette page pour prendre connaissance de toute mise à jour.
                    </MarketingAlert>
                </MarketingSection>
            </div>
        </MarketingLayout>
    )
}
