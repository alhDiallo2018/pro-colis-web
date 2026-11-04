import { MarketingLayout, MarketingHero, MarketingSection, MarketingAlert, MarketingFeatureGrid } from './MarketingLayout'
import type { MarketingFeatureItem } from './MarketingLayout'

const REGULATED: MarketingFeatureItem[] = [
    { icon: 'medication', tone: 'amber', title: 'Médicaments', text: 'nécessitent une ordonnance valide et un emballage scellé' },
    { icon: 'restaurant', tone: 'amber', title: 'Denrées périssables', text: 'nécessitent un conditionnement isotherme ou réfrigéré' },
    { icon: 'battery_charging_full', tone: 'amber', title: 'Produits électroniques avec batterie', text: 'batterie retirée ou protégée contre les courts-circuits' },
    { icon: 'wine_bar', tone: 'amber', title: 'Produits en verre ou fragiles', text: 'emballage renforcé obligatoire avec mention « FRAGILE » visible' },
    { icon: 'description', tone: 'amber', title: 'Documents confidentiels', text: 'emballés dans une enveloppe scellée opaque' }
]

const CONSEQUENCES: MarketingFeatureItem[] = [
    { icon: 'cancel', tone: 'rose', title: 'Refus immédiat', text: 'du colis par le chauffeur' },
    { icon: 'local_police', tone: 'rose', title: 'Signalement', text: 'aux autorités compétentes si nécessaire' },
    { icon: 'block', tone: 'rose', title: 'Suspension', text: 'temporaire ou définitive du compte' },
    { icon: 'payments', tone: 'rose', title: 'Non-remboursement', text: 'en cas d\'annulation liée au non-respect' },
    { icon: 'gavel', tone: 'rose', title: 'Responsabilité pénale', text: 'de l\'expéditeur en cas d\'infraction' }
]

const PACKAGING: MarketingFeatureItem[] = [
    { icon: 'package_2', tone: 'teal', title: 'Emballage rigide', text: 'adapté à la taille et au poids du contenu' },
    { icon: 'inventory_2', tone: 'teal', title: 'Remplissage', text: 'papier bulle, mousse ou papier froissé pour combler les vides' },
    { icon: 'straighten', tone: 'teal', title: 'Fermeture solide', text: 'ruban adhésif résistant pour sceller l\'emballage' },
    { icon: 'pin_drop', tone: 'teal', title: 'Adresse claire', text: 'apposez l\'adresse et un numéro de téléphone de contact' },
    { icon: 'warning', tone: 'amber', title: 'Mentions visibles', text: '« FRAGILE » ou « NE PAS RENVERSER » si nécessaire' },
    { icon: 'water_drop', tone: 'indigo', title: 'Liquides', text: 'placer le récipient dans un sac étanche avant emballage' },
    { icon: 'scale', tone: 'teal', title: 'Poids maximum', text: 'ne dépassez pas 25 kg par colis, sauf accord préalable' }
]

export function ColisInterditsPage() {
    return (
        <MarketingLayout>
            <MarketingHero
                eyebrow="Sécurité"
                eyebrowIcon="shield"
                title={<>COLIS INTERDITS</>}
                lead="SendProColis — Ce que vous ne pouvez pas envoyer"
                updated="17 juillet 2026"
            />
            <div className="mkt-sections">
                <MarketingAlert tone="danger" title="Attention">
                    Le non-respect de cette politique peut entraîner la suspension de votre compte et des poursuites judiciaires.
                </MarketingAlert>

                <MarketingSection title="1. Colis strictement interdits" icon="block" iconTone="rose">
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
                </MarketingSection>

                <MarketingSection title="2. Produits réglementés" icon="rule" iconTone="amber">
                    <p>
                        Certains produits ne sont pas interdits mais nécessitent une <strong>autorisation spéciale</strong>{' '}
                        et un conditionnement conforme :
                    </p>
                    <MarketingFeatureGrid items={REGULATED} />
                </MarketingSection>

                <MarketingSection title="3. Conséquences du non-respect" icon="warning" iconTone="rose">
                    <p>Le non-respect de la politique relative aux colis interdits entraînera :</p>
                    <MarketingFeatureGrid items={CONSEQUENCES} />
                </MarketingSection>

                <MarketingSection title="4. Conseils d'emballage pour colis autorisés" icon="inventory_2" iconTone="teal">
                    <p>Pour garantir la sécurité de vos colis pendant le transport, suivez ces recommandations :</p>
                    <MarketingFeatureGrid items={PACKAGING} />
                </MarketingSection>
            </div>
        </MarketingLayout>
    )
}

function List({ items }: { items: Array<{ label: string; desc: string }> }) {
    return (
        <ul>
            {items.map((item, index) => (
                <li key={`list-item-${index}`}>
                    <strong>{item.label} :</strong> {item.desc}
                </li>
            ))}
        </ul>
    )
}
