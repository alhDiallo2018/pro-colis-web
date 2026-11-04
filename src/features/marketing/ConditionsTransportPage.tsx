import { MarketingLayout, MarketingHero, MarketingSection, MarketingAlert, MarketingFeatureGrid } from './MarketingLayout'
import type { MarketingFeatureItem } from './MarketingLayout'
import { useSupportContact } from '@/lib/usePublicConfig'

const SENDER_OBLIGATIONS: MarketingFeatureItem[] = [
    { icon: 'description', tone: 'teal', title: 'Informations exactes', text: 'nature, poids, dimensions, valeur déclarée' },
    { icon: 'package_2', tone: 'teal', title: 'Emballage adéquat', text: 'assurer la protection du colis' },
    { icon: 'gavel', tone: 'indigo', title: 'Respect des lois', text: 'lois applicables au transport' },
    { icon: 'cancel', tone: 'rose', title: 'Colis autorisés', text: 'ne pas confier de colis interdits' }
]

const FORBIDDEN: MarketingFeatureItem[] = [
    { icon: 'dangerous', tone: 'rose', title: 'Armes et explosifs', text: 'armes à feu, munitions, explosifs' },
    { icon: 'medication', tone: 'rose', title: 'Drogues et stupéfiants', text: 'substances psychotropes' },
    { icon: 'science', tone: 'rose', title: 'Produits dangereux', text: 'corrosifs, inflammables, toxiques' },
    { icon: 'pets', tone: 'rose', title: 'Animaux vivants', text: 'sans autorisation préalable' },
    { icon: 'restaurant', tone: 'rose', title: 'Denrées périssables', text: 'sans conditionnement approprié' },
    { icon: 'sell', tone: 'rose', title: 'Contrefaçons', text: 'marchandises illicites' },
    { icon: 'block', tone: 'rose', title: 'Objets volés', text: 'd\'origine illicite' }
]

const DELAYS: MarketingFeatureItem[] = [
    { icon: 'query_stats', tone: 'teal', title: 'Délais indicatifs', text: 'variables selon circulation, météo, distance' },
    { icon: 'bolt', tone: 'amber', title: 'Option Express', text: 'livraison prioritaire garantie' },
    { icon: 'warning', tone: 'amber', title: 'Aucune garantie ferme', text: 'sauf pour l\'option Express' }
]

const CANCEL: MarketingFeatureItem[] = [
    { icon: 'check_circle', tone: 'green', title: 'Avant prise en charge', text: 'annulation sans frais' },
    { icon: 'warning', tone: 'amber', title: 'Après prise en charge', text: 'frais proportionnels au trajet parcouru' }
]

export function ConditionsTransportPage() {
    const support = useSupportContact()
    return (
        <MarketingLayout>
            <MarketingHero
                eyebrow="Transport"
                eyebrowIcon="local_shipping"
                title={<>CONDITIONS DE TRANSPORT</>}
                lead="SendProColis — Transport de colis"
                updated="17 juillet 2026"
            />
            <div className="mkt-sections">
                <MarketingAlert tone="amber" title="À lire attentivement">
                    L'utilisation de la plateforme SendProColis pour l'envoi ou le transport de colis implique l'acceptation pleine et entière des présentes conditions de transport.
                </MarketingAlert>

                <MarketingSection title="1. Acceptation des conditions" icon="check_circle" iconTone="green">
                    <p>
                        En créant une expédition, l'expéditeur et le chauffeur reconnaissent avoir pris connaissance
                        et accepté sans réserve ces conditions de transport.
                    </p>
                </MarketingSection>

                <MarketingSection title="2. Obligations de l'expéditeur" icon="rule" iconTone="teal">
                    <p>L'expéditeur s'engage à :</p>
                    <MarketingFeatureGrid items={SENDER_OBLIGATIONS} />
                </MarketingSection>

                <MarketingSection title="3. Colis interdits" icon="block" iconTone="rose">
                    <p><strong>Sont strictement interdits au transport :</strong></p>
                    <MarketingFeatureGrid items={FORBIDDEN} />
                </MarketingSection>

                <MarketingSection title="4. Contrôle des colis" icon="search" iconTone="teal">
                    <MarketingAlert tone="info" title="Droit de contrôle">
                        SendProColis et les chauffeurs partenaires se réservent le droit de vérifier le contenu des colis en cas de suspicion légitime. Tout refus de contrôle pourra entraîner le refus de prise en charge du colis sans remboursement.
                    </MarketingAlert>
                </MarketingSection>

                <MarketingSection title="5. Délais de livraison" icon="schedule" iconTone="amber">
                    <MarketingFeatureGrid items={DELAYS} />
                </MarketingSection>

                <MarketingSection title="6. Livraison et remise du colis" icon="verified" iconTone="green">
                    <MarketingAlert tone="info" title="Code PIN">
                        La livraison est réputée effectuée lorsque le colis est remis au destinataire contre communication du code PIN de confirmation. Le destinataire est tenu de vérifier l'état du colis au moment de la réception.
                    </MarketingAlert>
                </MarketingSection>

                <MarketingSection title="7. Annulation" icon="autorenew" iconTone="amber">
                    <p>L'annulation d'une expédition est possible :</p>
                    <MarketingFeatureGrid items={CANCEL} />
                </MarketingSection>

                <MarketingSection title="8. Limitation de responsabilité" icon="shield" iconTone="amber">
                    <MarketingAlert tone="amber" title="Intermédiaire">
                        SendProColis agit en tant que plateforme d'intermédiation. La société n'est pas responsable des dommages causés au colis pendant le transport, sauf négligence avérée de la plateforme. La responsabilité du transport incombe au chauffeur mandaté par l'expéditeur.
                    </MarketingAlert>
                </MarketingSection>

                <MarketingSection title="9. Réclamations relatives au transport" icon="report" iconTone="rose">
                    <p>
                        Toute réclamation concernant un colis doit être adressée à{' '}
                        <a href={`mailto:${support.email}`}>{support.email}</a>{' '}
                        dans les <strong>48 heures</strong> suivant la livraison (ou la date prévue de livraison en cas de retard).
                    </p>
                    <div style={{
                        marginTop: 16,
                        padding: 16,
                        background: 'var(--surface-sunken)',
                        borderRadius: 12,
                        border: '1px solid var(--border-subtle)'
                    }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-strong)', marginBottom: 10 }}>
                            Informations requises :
                        </div>
                        <ul>
                            <li>numéro de suivi du colis</li>
                            <li>date et heure de l'expédition</li>
                            <li>description détaillée du problème rencontré</li>
                            <li>photos du colis endommagé le cas échéant</li>
                        </ul>
                    </div>
                </MarketingSection>
            </div>
        </MarketingLayout>
    )
}
