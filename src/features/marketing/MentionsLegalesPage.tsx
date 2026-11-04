import { MarketingLayout, MarketingHero, MarketingSection, MarketingAlert } from './MarketingLayout'
import { useSupportContact, useLegalConfig } from '@/lib/usePublicConfig'

export function MentionsLegalesPage() {
    const support = useSupportContact()
    const legal = useLegalConfig()
    return (
        <MarketingLayout>
            <MarketingHero
                eyebrow="Légal"
                eyebrowIcon="gavel"
                title={<>MENTIONS LÉGALES</>}
                lead="SendProColis — Plateforme de mise en relation expéditeurs & transporteurs"
                updated="17 juillet 2026"
            />
            <div className="mkt-sections">
                <MarketingSection title="Équipe de direction" icon="groups" iconTone="teal">
                    <div className="mkt-grid">
                        <div className="mkt-feature">
                            <div className="mkt-feature-title">{legal.directorName || '[À COMPLÉTER]'}</div>
                            <div className="mkt-feature-text">Directeur Général</div>
                            <div className="mkt-feature-text">Spécialiste en Finance &amp; Stratégie</div>
                            {legal.directorEmail ? (
                                <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border-subtle)', fontSize: 13 }}>
                                    <strong>Email :</strong>{' '}
                                    <a href={`mailto:${legal.directorEmail}`}>{legal.directorEmail}</a>
                                </div>
                            ) : null}
                        </div>
                        <div className="mkt-feature">
                            <div className="mkt-feature-title">{legal.technicalDirectorName || '[À COMPLÉTER]'}</div>
                            <div className="mkt-feature-text">Directeur Technique &amp; Développement</div>
                            <div className="mkt-feature-text">Expert en Solutions Digitales &amp; Innovation</div>
                            {legal.technicalDirectorEmail ? (
                                <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border-subtle)', fontSize: 13 }}>
                                    <strong>Email :</strong>{' '}
                                    <a href={`mailto:${legal.technicalDirectorEmail}`}>{legal.technicalDirectorEmail}</a>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </MarketingSection>

                <MarketingSection title="1. Éditeur de la plateforme" icon="business" iconTone="teal">
                    <p>
                        La plateforme <strong>SendProColis</strong> est une solution de mise en relation entre expéditeurs et
                        transporteurs, développée et opérée par <strong>{legal.companyName || 'SendProColis'}</strong>, société de droit sénégalais
                        dont le siège social est situé à <strong>{legal.address || 'Dakar, Sénégal'}</strong>.
                    </p>
                    <ContactInfo address={legal.address || 'Dakar, Sénégal'} />
                </MarketingSection>

                <MarketingSection title="2. Directeur de publication" icon="person" iconTone="teal">
                    <p>
                        <strong>{legal.publisherName || '[À COMPLÉTER]'}</strong>, en sa qualité de Directeur général de {legal.companyName || 'SendProColis'}.
                    </p>
                </MarketingSection>

                <MarketingSection title="3. Hébergement" icon="dns" iconTone="indigo">
                    <p>
                        La plateforme SendProColis est hébergée par <strong>{legal.hostName || '[À COMPLÉTER]'}</strong>.
                    </p>
                </MarketingSection>

                <MarketingSection title="4. Objet de la plateforme" icon="flag" iconTone="teal">
                    <p>SendProColis est une plateforme digitale dont l'objectif est de :</p>
                    <List items={[
                        'permettre la création et le suivi d\'expéditions de colis au Sénégal, en Afrique et à l\'international',
                        'mettre en relation des expéditeurs avec des chauffeurs transporteurs vérifiés',
                        'assurer le suivi en temps réel des colis',
                        'gérer les paiements liés aux expéditions',
                        'prélever des commissions sur les transactions réalisées via la plateforme',
                        'faciliter la communication entre les utilisateurs'
                    ]} />
                </MarketingSection>

                <MarketingSection title="5. Fonctionnement" icon="settings" iconTone="teal">
                    <p>SendProColis agit comme un intermédiaire technologique qui :</p>
                    <List items={[
                        'facilite la mise en relation entre expéditeurs et chauffeurs transporteurs',
                        'sécurise les transactions financières entre les parties',
                        'assure le suivi des colis depuis l\'enlèvement jusqu\'à la livraison finale',
                        'permet l\'évaluation et la notation des chauffeurs pour garantir la qualité du service'
                    ]} />
                </MarketingSection>

                <MarketingSection title="6. Transport de colis" icon="local_shipping" iconTone="teal">
                    <p>
                        L'expéditeur est tenu de fournir des informations exactes et complètes sur le colis (nature, poids,
                        dimensions, valeur estimée). Il est seul responsable du contenu du colis et de sa conformité aux lois
                        et règlements en vigueur au Sénégal et dans les pays de transit et de destination.
                    </p>
                    <MarketingAlert tone="amber" title="Sont strictement interdits :">
                        <List items={[
                            'les armes, explosifs, stupéfiants, produits dangereux',
                            'animaux vivants sans autorisation',
                            'contrefaçons, biens culturels',
                            'et tout objet dont le transport est prohibé par la loi'
                        ]} />
                    </MarketingAlert>
                    <p>
                        Les droits de douane et taxes applicables au transport restent à la charge de l'expéditeur ou du
                        destinataire selon les termes convenus entre les parties.
                    </p>
                </MarketingSection>

                <MarketingSection title="7. Responsabilité" icon="shield" iconTone="amber">
                    <p>SendProColis agit en tant qu'intermédiaire et ne saurait être tenue responsable :</p>
                    <List items={[
                        'des retards, pertes ou avaries survenant pendant le transport, qui relèvent de la responsabilité du transporteur',
                        'des dommages indirects, pertes de données, ou préjudices commerciaux résultant de l\'utilisation de la plateforme',
                        'des actes ou omissions des chauffeurs transporteurs ou des expéditeurs',
                        'des cas de force majeure'
                    ]} />
                    <p>
                        La plateforme est fournie "en l'état" et SendProColis ne garantit pas une disponibilité continue
                        et sans interruption du service.
                    </p>
                </MarketingSection>

                <MarketingSection title="8. Paiements" icon="credit_card" iconTone="teal">
                    <p>
                        Les paiements sur la plateforme sont sécurisés et traités via des prestataires partenaires agréés.
                        SendProColis propose différents moyens de paiement adaptés aux marchés sénégalais, africains et
                        internationaux :
                    </p>
                    <List items={[
                        'Mobile money (Wave, Orange Money, etc.)',
                        'Carte bancaire (Visa, Mastercard)',
                        'Espèces (via les points de collecte)'
                    ]} />
                </MarketingSection>

                <MarketingSection title="9. Données personnelles" icon="lock" iconTone="teal">
                    <p>
                        Conformément à la loi sénégalaise sur la protection des données à caractère personnel, SendProColis
                        collecte les données suivantes :
                    </p>
                    <List items={[
                        'Nom, prénom, numéro de téléphone, adresse email',
                        'Adresse postale et données de localisation',
                        'Informations relatives aux colis expédiés',
                        'Données de connexion et d\'utilisation de la plateforme'
                    ]} />
                    <p>Ces données sont collectées pour les finalités suivantes :</p>
                    <List items={[
                        'Création et gestion des comptes utilisateurs',
                        'Mise en relation entre expéditeurs et chauffeurs',
                        'Suivi des expéditions',
                        'Traitement des paiements',
                        'Sécurité de la plateforme',
                        'Amélioration continue du service'
                    ]} />
                    <p>
                        Conformément à la réglementation, vous disposez d'un droit d'accès, de rectification, de suppression
                        et d'opposition au traitement de vos données. Pour exercer ces droits, contactez-nous à{' '}
                        <a href={`mailto:${support.email}`}>{support.email}</a>.
                    </p>
                </MarketingSection>

                <MarketingSection title="10. Comptes utilisateurs" icon="account_circle" iconTone="teal">
                    <p>Les utilisateurs s'engagent à :</p>
                    <List items={[
                        'fournir des informations exactes, complètes et à les maintenir à jour',
                        'préserver la confidentialité de leurs identifiants de connexion',
                        'ne pas créer de faux comptes ou usurper l\'identité d\'autrui',
                        'utiliser la plateforme de manière loyale et conforme aux lois en vigueur'
                    ]} />
                    <p>
                        SendProColis se réserve le droit de suspendre ou de supprimer tout compte en cas de manquement
                        à ces obligations ou d'utilisation frauduleuse de la plateforme.
                    </p>
                </MarketingSection>

                <MarketingSection title="11. Chauffeurs et transporteurs" icon="local_shipping" iconTone="teal">
                    <p>Les chauffeurs et transporteurs inscrits sur la plateforme s'engagent à :</p>
                    <List items={[
                        'fournir des documents valides (permis de conduire, carte grise, assurance, pièce d\'identité)',
                        'respecter le code de la route et les réglementations applicables au transport de marchandises',
                        'assurer la sécurité et l\'intégrité des colis confiés',
                        'respecter les délais de livraison convenus'
                    ]} />
                </MarketingSection>

                <MarketingSection title="12. Système de réputation" icon="star" iconTone="amber">
                    <p>
                        SendProColis intègre un système d'évaluation des chauffeurs basé sur les retours des expéditeurs.
                        Ce système attribue :
                    </p>
                    <List items={[
                        'des notes (de 1 à 5 étoiles)',
                        'des points de réputation (Score)',
                        'des badges de performance'
                    ]} />
                    <p>
                        Le classement et les badges n'ont aucune valeur monétaire. Ils servent uniquement à informer les
                        expéditeurs sur la fiabilité et la qualité de service des chauffeurs.
                    </p>
                </MarketingSection>

                <MarketingSection title="13. Portefeuille chauffeur (Wallet)" icon="account_balance_wallet" iconTone="teal">
                    <p>Le Wallet Chauffeur est un outil de gestion financière indépendant du système de réputation. Il permet :</p>
                    <List items={[
                        'de cumuler les gains issus des livraisons',
                        'de gérer les commissions prélevées',
                        'd\'effectuer des retraits sécurisés'
                    ]} />
                </MarketingSection>

                <MarketingSection title="14. Propriété intellectuelle" icon="copyright" iconTone="indigo">
                    <p>
                        La marque <strong>SendProColis</strong>, son logo, son nom de domaine, et l'ensemble des éléments
                        graphiques, textuels et techniques de la plateforme sont protégés par les lois relatives à la
                        propriété intellectuelle. Toute reproduction, représentation, modification ou utilisation sans
                        autorisation préalable est strictement interdite.
                    </p>
                </MarketingSection>

                <MarketingSection title="15. Réclamations et médiation" icon="report" iconTone="rose">
                    <p>
                        En cas de litige, l'utilisateur s'engage à contacter SendProColis en priorité par email à{' '}
                        <a href={`mailto:${support.email}`}>{support.email}</a>{' '}
                        pour trouver une solution amiable.
                    </p>
                    <p>
                        Nous nous engageons à accuser réception de toute réclamation dans un délai de 48 heures et à
                        traiter votre demande avec diligence. À défaut d'accord amiable, les tribunaux compétents de
                        Dakar seront saisis.
                    </p>
                </MarketingSection>

                <MarketingSection title="16. Droit applicable" icon="gavel" iconTone="indigo">
                    <p>
                        Les présentes mentions légales sont soumises au droit sénégalais. Tout litige relatif à leur
                        interprétation ou exécution relève de la compétence exclusive des tribunaux de Dakar.
                    </p>
                </MarketingSection>

                <MarketingSection title="17. Modification des mentions légales" icon="edit_note" iconTone="teal">
                    <p>
                        SendProColis se réserve le droit de modifier les présentes mentions légales à tout moment pour
                        s'adapter aux évolutions légales, réglementaires ou techniques. Les utilisateurs seront informés
                        de toute modification substantielle :
                    </p>
                    <List items={[
                        'par email',
                        'via une notification sur la plateforme',
                        'par un message lors de leur prochaine connexion'
                    ]} />
                    <p>La version en vigueur est celle accessible en ligne sur cette page.</p>
                </MarketingSection>
            </div>
        </MarketingLayout>
    )
}

function List({ items }: { items: string[] }) {
    return (
        <ul>
            {items.map((item, index) => (
                <li key={index}>{item}</li>
            ))}
        </ul>
    )
}

function ContactInfo({ address }: { address: string }) {
    const support = useSupportContact()
    return (
        <div style={{
            marginTop: 12,
            padding: 16,
            background: 'var(--surface-sunken)',
            borderRadius: 12,
            border: '1px solid var(--border-subtle)'
        }}>
            <p style={{ margin: 0 }}>
                <strong>Email :</strong>{' '}
                <a href={`mailto:${support.email}`}>{support.email}</a>
            </p>
            <p style={{ margin: '4px 0 0' }}>
                <strong>Téléphone :</strong> {support.technicalPhone || support.phone}
            </p>
            <p style={{ margin: '4px 0 0' }}>
                <strong>Siège :</strong> {address}
            </p>
        </div>
    )
}
