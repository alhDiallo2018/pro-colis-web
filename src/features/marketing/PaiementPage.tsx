import { MarketingLayout, MarketingHero, MarketingSection, MarketingAlert, MarketingFeatureGrid } from './MarketingLayout'
import type { MarketingFeatureItem } from './MarketingLayout'
import { useSupportContact } from '@/lib/usePublicConfig'

const METHODS: MarketingFeatureItem[] = [
    { icon: 'smartphone', tone: 'teal', title: 'Wave', text: 'paiement mobile instantané' },
    { icon: 'smartphone', tone: 'teal', title: 'Orange Money', text: 'paiement via Orange Money' },
    { icon: 'smartphone', tone: 'teal', title: 'Free Money', text: 'paiement via Free Money' },
    { icon: 'credit_card', tone: 'indigo', title: 'Carte bancaire', text: 'Visa, Mastercard' },
    { icon: 'payments', tone: 'amber', title: 'Espèces', text: 'à la remise du colis' }
]

const SECURITY: MarketingFeatureItem[] = [
    { icon: 'enhanced_encryption', tone: 'teal', title: 'Chiffrement SSL/TLS', text: 'de toutes les communications' },
    { icon: 'shield', tone: 'teal', title: 'Authentification forte', text: 'pour les transactions' },
    { icon: 'check_circle', tone: 'green', title: 'Conformité PCI-DSS', text: 'via nos prestataires' },
    { icon: 'monitoring', tone: 'teal', title: 'Surveillance en temps réel', text: 'des activités suspectes' },
    { icon: 'storage', tone: 'teal', title: 'Données non stockées', text: 'aucune carte bancaire sur nos serveurs' }
]

const FEES: MarketingFeatureItem[] = [
    { icon: 'visibility', tone: 'teal', title: 'Clairement indiqué', text: 'avant validation de chaque expédition' },
    { icon: 'credit_card', tone: 'teal', title: 'Déduction automatique', text: 'du montant versé au chauffeur' },
    { icon: 'bar_chart', tone: 'amber', title: 'Commission variable', text: 'selon le type d\'expédition' }
]

const DELAYS: MarketingFeatureItem[] = [
    { icon: 'smartphone', tone: 'teal', title: 'Mobile Money', text: 'instantané' },
    { icon: 'credit_card', tone: 'indigo', title: 'Carte bancaire', text: 'immédiat' },
    { icon: 'payments', tone: 'amber', title: 'Paiement au chauffeur', text: 'à la livraison' },
    { icon: 'account_balance', tone: 'teal', title: 'Versement chauffeur', text: '48h ouvrées' }
]

const REFUNDS: MarketingFeatureItem[] = [
    { icon: 'autorenew', tone: 'teal', title: 'Même moyen de paiement', text: 'que la transaction initiale' },
    { icon: 'schedule', tone: 'amber', title: 'Délai de 5 à 10 jours', text: 'selon la méthode de paiement' },
    { icon: 'payments', tone: 'rose', title: 'Frais non remboursables', text: 'frais de transaction' }
]

export function PaiementPage() {
    const support = useSupportContact()
    return (
        <MarketingLayout>
            <MarketingHero
                eyebrow="Paiement"
                eyebrowIcon="payments"
                title={<>POLITIQUE DE PAIEMENT</>}
                lead="SendProColis — Paiements sécurisés"
                updated="17 juillet 2026"
            />
            <div className="mkt-sections">
                <MarketingAlert tone="info" title="Paiements sécurisés">
                    Tous les paiements sont traités via PayDunya, notre partenaire agréé, avec la plus haute sécurité pour vos transactions.
                </MarketingAlert>

                <MarketingSection title="1. Méthodes de paiement acceptées" icon="credit_card" iconTone="teal">
                    <p>SendProColis propose plusieurs méthodes de paiement adaptées au marché sénégalais et aux envois internationaux :</p>
                    <MarketingFeatureGrid items={METHODS} />
                </MarketingSection>

                <MarketingSection title="2. Traitement des paiements" icon="hub" iconTone="teal">
                    <MarketingAlert tone="info" title="Partenaire">
                        Tous les paiements électroniques sont traités par l'intermédiaire de PayDunya, notre partenaire de paiement agréé, qui garantit la conformité avec les normes de sécurité internationales.
                    </MarketingAlert>
                    <MarketingAlert tone="info" title="Compte séquestre">
                        Le montant est débité immédiatement et conservé sur un compte séquestre de la plateforme jusqu'à la confirmation de la livraison du colis.
                    </MarketingAlert>
                </MarketingSection>

                <MarketingSection title="3. Sécurité des transactions" icon="shield" iconTone="teal">
                    <p>La sécurité de vos transactions est notre priorité. SendProColis met en œuvre les mesures suivantes :</p>
                    <MarketingFeatureGrid items={SECURITY} />
                </MarketingSection>

                <MarketingSection title="4. Frais et commissions" icon="payments" iconTone="amber">
                    <p>SendProColis prélève une commission sur chaque transaction réussie. Le montant de la commission est :</p>
                    <MarketingFeatureGrid items={FEES} />
                    <p>
                        Des frais additionnels peuvent s'appliquer pour les paiements par carte bancaire ou mobile money,
                        conformément aux conditions des prestataires de paiement.
                    </p>
                </MarketingSection>

                <MarketingSection title="5. Délais de traitement" icon="schedule" iconTone="teal">
                    <p>Les délais de traitement varient selon la méthode de paiement utilisée :</p>
                    <MarketingFeatureGrid items={DELAYS} />
                </MarketingSection>

                <MarketingSection title="6. Remboursements" icon="autorenew" iconTone="teal">
                    <p>Les remboursements sont traités selon notre politique d'annulation et de remboursement :</p>
                    <MarketingFeatureGrid items={REFUNDS} />
                </MarketingSection>

                <MarketingSection title="7. Litiges de paiement" icon="report" iconTone="rose">
                    <p>
                        En cas de litige concernant un paiement, contactez immédiatement notre service client à{' '}
                        <a href={`mailto:${support.email}`}>{support.email}</a>.
                    </p>
                    <div style={{
                        marginTop: 16,
                        padding: 16,
                        background: 'var(--surface-sunken)',
                        borderRadius: 12,
                        border: '1px solid var(--border-subtle)'
                    }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-strong)', marginBottom: 10 }}>
                            Nos engagements :
                        </div>
                        <ul>
                            <li><strong>Accusé de réception</strong> — sous 48 heures ouvrées</li>
                            <li><strong>Enquête et suivi</strong> — vous tenir informé de l'avancement</li>
                            <li><strong>Solution</strong> — dans un délai maximum de 7 jours ouvrés</li>
                        </ul>
                    </div>
                    <p>Si le litige n'est pas résolu à l'amiable, vous pouvez saisir les autorités compétentes au Sénégal.</p>
                </MarketingSection>
            </div>
        </MarketingLayout>
    )
}
