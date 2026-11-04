import { MarketingLayout, MarketingHero, MarketingSection, MarketingFeatureGrid } from './MarketingLayout'
import type { MarketingFeatureItem } from './MarketingLayout'
import { useSupportContact, useLegalConfig } from '@/lib/usePublicConfig'

const VALUES: MarketingFeatureItem[] = [
    {
        icon: 'handshake',
        tone: 'teal',
        title: 'Confiance',
        text: 'Chaque chauffeur est vérifié et évalué par la communauté. Notre système de réputation garantit des prestataires fiables.'
    },
    {
        icon: 'bolt',
        tone: 'amber',
        title: 'Rapidité',
        text: 'Notre système de mise en relation instantanée permet de trouver un chauffeur en un temps record, souvent inférieur à une heure.'
    },
    {
        icon: 'search',
        tone: 'indigo',
        title: 'Transparence',
        text: 'Les prix sont affichés avant validation, le suivi est en temps réel, et aucune commission n\'est cachée.'
    }
]

const STATS: MarketingFeatureItem[] = [
    { icon: 'public', tone: 'teal', title: '14', text: 'Régions au Sénégal' },
    { icon: 'local_shipping', tone: 'teal', title: '1 200+', text: 'Chauffeurs vérifiés' },
    { icon: 'schedule', tone: 'teal', title: '45 min', text: 'Délai moyen avant offre' },
    { icon: 'check_circle', tone: 'teal', title: '98,4 %', text: 'Colis livrés à temps' }
]

const STEPS: MarketingFeatureItem[] = [
    {
        icon: 'package_2',
        tone: 'teal',
        title: 'Déclarez votre colis',
        text: 'Décrivez le colis (nature, poids, dimensions) et indiquez la ville de départ et la ville d\'arrivée.'
    },
    {
        icon: 'forum',
        tone: 'amber',
        title: 'Recevez des offres',
        text: 'Les chauffeurs disponibles sur le trajet vous font leurs propositions de prix. Vous choisissez celle qui vous convient le mieux.'
    },
    {
        icon: 'pin_drop',
        tone: 'green',
        title: 'Suivez la livraison',
        text: 'Une fois le chauffeur choisi, suivez votre colis en temps réel jusqu\'à sa remise au destinataire avec code PIN de confirmation.'
    }
]

export function AProposPage() {
    const support = useSupportContact()
    const legal = useLegalConfig()
    return (
        <MarketingLayout>
            <MarketingHero
                eyebrow="Notre histoire"
                eyebrowIcon="badge"
                title={<>À PROPOS DE SENDPROCOLIS</>}
                lead="La plateforme qui connecte expéditeurs et chauffeurs"
                updated="17 juillet 2026"
            />
            <div className="mkt-sections">
                <MarketingSection title="Qui sommes-nous" icon="badge" iconTone="teal">
                    <p>
                        SendProColis est une plateforme de transport de colis née au Sénégal et tournée vers l'Afrique et
                        l'international. Nous connectons les expéditeurs qui souhaitent envoyer des colis avec des chauffeurs
                        transporteurs vérifiés qui se déplacent déjà entre les villes du pays et au-delà des frontières.
                    </p>
                    <p>
                        Fondée à Dakar, notre plateforme s'appuie sur les réalités du marché sénégalais et africain pour offrir
                        une solution de transport rapide, fiable et économique. Nous opérons dans les 14 régions du Sénégal et
                        développons des corridors de livraison vers l'Afrique de l'Ouest et le reste du monde, permettant aux
                        particuliers comme aux entreprises d'envoyer leurs colis en toute sérénité.
                    </p>
                </MarketingSection>

                <MarketingSection title="Statistiques" icon="bar_chart" iconTone="indigo">
                    <MarketingFeatureGrid items={STATS} />
                </MarketingSection>

                <MarketingSection title="Notre mission" icon="rocket_launch" iconTone="violet">
                    <p>
                        Notre mission est de connecter les expéditeurs et les chauffeurs pour simplifier le transport de
                        colis au Sénégal, en Afrique et à l'international. Nous croyons qu'un service de livraison fiable ne devrait pas
                        être un luxe — c'est un besoin quotidien pour les familles, les commerçants et les entreprises.
                    </p>
                    <p>
                        Nous nous engageons à offrir transparence, sécurité et rapidité à chaque étape : de la déclaration
                        du colis jusqu'à la livraison au destinataire.
                    </p>
                </MarketingSection>

                <MarketingSection title="Comment ça marche" icon="route" iconTone="teal">
                    <p>Envoyer un colis avec SendProColis se fait en trois étapes simples :</p>
                    <MarketingFeatureGrid items={STEPS} />
                </MarketingSection>

                <MarketingSection title="Nos valeurs" icon="favorite" iconTone="rose">
                    <MarketingFeatureGrid items={VALUES} />
                </MarketingSection>

                <MarketingSection title="Contact" icon="support_agent" iconTone="teal">
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
                    <p style={{ marginTop: 16, fontSize: 13, color: 'var(--text-muted)' }}>
                        <strong>Horaires :</strong> Lundi au vendredi de 8h à 18h · Samedi de 9h à 13h (GMT)
                    </p>
                </MarketingSection>
            </div>
        </MarketingLayout>
    )
}
