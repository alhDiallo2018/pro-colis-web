import { MarketingHeader } from './MarketingHeader'

export function MentionsLegalesPage() {
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
                    MENTIONS LÉGALES
                </h1>
                <p style={{
                    fontSize: 16,
                    color: 'var(--text-muted)',
                    margin: 0
                }}>
                    SendProColis — Plateforme de mise en relation expéditeurs & transporteurs
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

            {/* Section Directeurs */}
            <div style={{
                background: 'var(--surface-page)',
                borderRadius: 16,
                padding: 24,
                marginBottom: 40,
                border: '1px solid var(--border-subtle)'
            }}>
                <h2 style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    fontSize: 18,
                    color: 'var(--text-strong)',
                    margin: '0 0 16px 0'
                }}>
                    👥 Équipe de direction
                </h2>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: 16
                }}>
                    <div style={{
                        padding: 16,
                        background: 'var(--card-bg)',
                        borderRadius: 12,
                        border: '1px solid var(--border-subtle)'
                    }}>
                        <div style={{
                            fontWeight: 700,
                            fontSize: 15,
                            color: 'var(--text-strong)',
                            marginBottom: 4
                        }}>
                            Serigne Fallou Ndao
                        </div>
                        <div style={{
                            fontSize: 13,
                            color: 'var(--text-muted)',
                            fontWeight: 500
                        }}>
                            Directeur Général
                        </div>
                        <div style={{
                            fontSize: 12,
                            color: 'var(--text-muted)',
                            marginTop: 4
                        }}>
                            Spécialiste en Finance & Stratégie
                        </div>
                        <div style={{
                            marginTop: 8,
                            paddingTop: 8,
                            borderTop: '1px solid var(--border-subtle)',
                            fontSize: 13
                        }}>
                            <strong>📧 Email :</strong>{' '}
                            <a
                                href="mailto:fallou.edu.uad@gmail.com"
                                style={{color: 'var(--color-primary)'}}
                            >
                                fallou.edu.uad@gmail.com
                            </a>
                        </div>
                    </div>

                </div>

                <div style={{
                    padding: 16,
                    background: 'var(--card-bg)',
                    borderRadius: 12,
                    border: '1px solid var(--border-subtle)'
                }}>
                    <div style={{
                        fontWeight: 700,
                        fontSize: 15,
                        color: 'var(--text-strong)',
                        marginBottom: 4
                    }}>
                        Thierno Alhassane Diallo Garki
                    </div>
                    <div style={{
                        fontSize: 13,
                        color: 'var(--text-muted)',
                        fontWeight: 500
                    }}>
                        Directeur Technique & Développement
                    </div>
                    <div style={{
                        fontSize: 12,
                        color: 'var(--text-muted)',
                        marginTop: 4
                    }}>
                        Expert en Solutions Digitales & Innovation
                    </div>
                    <div style={{
                        marginTop: 8,
                        paddingTop: 8,
                        borderTop: '1px solid var(--border-subtle)',
                        fontSize: 13
                    }}>
                        <strong>📧 Email :</strong>{' '}
                        <a
                            href="mailto:dialloalhassanegarki2018@gmail.com"
                            style={{color: 'var(--color-primary)'}}
                        >
                            dialloalhassanegarki2018@gmail.com
                        </a>
                </div>
            </div>
        </div>

    {/* Sections */
    }
    <div style={{display: 'flex', flexDirection: 'column', gap: 32}}>
        {/* 1. Éditeur */}
        <Section title="1. Éditeur de la plateforme">
            <p>
                La plateforme <strong>SendProColis</strong> est une solution de mise en relation entre expéditeurs et
                transporteurs, développée et opérée par <strong>SendProColis SARL</strong>, société de droit sénégalais
                        dont le siège social est situé à <strong>Dakar, Sénégal</strong>.
                    </p>
                    <ContactInfo />
                </Section>

                {/* 2. Directeur de publication */}
                <Section title="2. Directeur de publication">
                    <p>
                        <strong>Serigne Fallou Ndao</strong>, en sa qualité de Directeur général de SendProColis SARL.
                    </p>
                </Section>

                {/* 3. Hébergement */}
                <Section title="3. Hébergement">
                    <p>
                        La plateforme SendProColis est hébergée par <strong>OVHcloud</strong>, leader européen du cloud computing.
                    </p>
                </Section>

                {/* 4. Objet */}
                <Section title="4. Objet de la plateforme">
                    <p>
                        SendProColis est une plateforme digitale dont l'objectif est de :
                    </p>
                    <List items={[
                        'permettre la création et le suivi d\'expéditions de colis au Sénégal, en Afrique et à l\'international',
                        'mettre en relation des expéditeurs avec des chauffeurs transporteurs vérifiés',
                        'assurer le suivi en temps réel des colis',
                        'gérer les paiements liés aux expéditions',
                        'prélever des commissions sur les transactions réalisées via la plateforme',
                        'faciliter la communication entre les utilisateurs'
                    ]} />
                </Section>

                {/* 5. Fonctionnement */}
                <Section title="5. Fonctionnement">
                    <p>
                        SendProColis agit comme un intermédiaire technologique qui :
                    </p>
                    <List items={[
                        'facilite la mise en relation entre expéditeurs et chauffeurs transporteurs',
                        'sécurise les transactions financières entre les parties',
                        'assure le suivi des colis depuis l\'enlèvement jusqu\'à la livraison finale',
                        'permet l\'évaluation et la notation des chauffeurs pour garantir la qualité du service'
                    ]} />
                </Section>

                {/* 6. Transport */}
                <Section title="6. Transport de colis">
                    <p>
                        L'expéditeur est tenu de fournir des informations exactes et complètes sur le colis (nature, poids,
                        dimensions, valeur estimée). Il est seul responsable du contenu du colis et de sa conformité aux lois
                        et règlements en vigueur au Sénégal et dans les pays de transit et de destination.
                    </p>
                    <div style={{
                        background: 'var(--amber-50)',
                        padding: '16px 20px',
                        borderRadius: 12,
                        borderLeft: '4px solid var(--amber-400)',
                        marginTop: 16
                    }}>
                        <p style={{ margin: 0, fontWeight: 600, color: 'var(--amber-700)' }}>
                            ⚠️ Sont strictement interdits :
                        </p>
                        <List items={[
                            'les armes, explosifs, stupéfiants, produits dangereux',
                            'animaux vivants sans autorisation',
                            'contrefaçons, biens culturels',
                            'et tout objet dont le transport est prohibé par la loi'
                        ]} />
                    </div>
                    <p style={{ marginTop: 12 }}>
                        Les droits de douane et taxes applicables au transport restent à la charge de l'expéditeur ou du
                        destinataire selon les termes convenus entre les parties.
                    </p>
                </Section>

                {/* 7. Responsabilité */}
                <Section title="7. Responsabilité">
                    <p>
                        SendProColis agit en tant qu'intermédiaire et ne saurait être tenue responsable :
                    </p>
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
                </Section>

                {/* 8. Paiements */}
                <Section title="8. Paiements">
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
                </Section>

                {/* 9. Données personnelles */}
                <Section title="9. Données personnelles">
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
                    <p style={{ marginTop: 16 }}>
                        Ces données sont collectées pour les finalités suivantes :
                    </p>
                    <List items={[
                        'Création et gestion des comptes utilisateurs',
                        'Mise en relation entre expéditeurs et chauffeurs',
                        'Suivi des expéditions',
                        'Traitement des paiements',
                        'Sécurité de la plateforme',
                        'Amélioration continue du service'
                    ]} />
                    <p style={{ marginTop: 16 }}>
                        Conformément à la réglementation, vous disposez d'un droit d'accès, de rectification, de suppression
                        et d'opposition au traitement de vos données. Pour exercer ces droits, contactez-nous à{' '}
                        <a href="mailto:support-commercial@sendprocolis.com" style={{ color: 'var(--color-primary)' }}>
                            support-commercial@sendprocolis.com
                        </a>.
                    </p>
                </Section>

                {/* 10. Comptes */}
                <Section title="10. Comptes utilisateurs">
                    <p>
                        Les utilisateurs s'engagent à :
                    </p>
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
                </Section>

                {/* 11. Chauffeurs */}
                <Section title="11. Chauffeurs et transporteurs">
                    <p>
                        Les chauffeurs et transporteurs inscrits sur la plateforme s'engagent à :
                    </p>
                    <List items={[
                        'fournir des documents valides (permis de conduire, carte grise, assurance, pièce d\'identité)',
                        'respecter le code de la route et les réglementations applicables au transport de marchandises',
                        'assurer la sécurité et l\'intégrité des colis confiés',
                        'respecter les délais de livraison convenus'
                    ]} />
                </Section>

                {/* 12. Réputation */}
                <Section title="12. Système de réputation">
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
                </Section>

                {/* 13. Wallet */}
                <Section title="13. Portefeuille chauffeur (Wallet)">
                    <p>
                        Le Wallet Chauffeur est un outil de gestion financière indépendant du système de réputation. Il permet :
                    </p>
                    <List items={[
                        'de cumuler les gains issus des livraisons',
                        'de gérer les commissions prélevées',
                        'd\'effectuer des retraits sécurisés'
                    ]} />
                </Section>

                {/* 14. Propriété intellectuelle */}
                <Section title="14. Propriété intellectuelle">
                    <p>
                        La marque <strong>SendProColis</strong>, son logo, son nom de domaine, et l'ensemble des éléments
                        graphiques, textuels et techniques de la plateforme sont protégés par les lois relatives à la
                        propriété intellectuelle. Toute reproduction, représentation, modification ou utilisation sans
                        autorisation préalable est strictement interdite.
                    </p>
                </Section>

                {/* 15. Réclamations */}
                <Section title="15. Réclamations et médiation">
                    <p>
                        En cas de litige, l'utilisateur s'engage à contacter SendProColis en priorité par email à{' '}
                        <a href="mailto:support-commercial@sendprocolis.com" style={{ color: 'var(--color-primary)' }}>
                            support-commercial@sendprocolis.com
                        </a>{' '}
                        pour trouver une solution amiable.
                    </p>
                    <p>
                        Nous nous engageons à accuser réception de toute réclamation dans un délai de 48 heures et à
                        traiter votre demande avec diligence. À défaut d'accord amiable, les tribunaux compétents de
                        Dakar seront saisis.
                    </p>
                </Section>

                {/* 16. Droit applicable */}
                <Section title="16. Droit applicable">
                    <p>
                        Les présentes mentions légales sont soumises au droit sénégalais. Tout litige relatif à leur
                        interprétation ou exécution relève de la compétence exclusive des tribunaux de Dakar.
                    </p>
                </Section>

                {/* 17. Modifications */}
                <Section title="17. Modification des mentions légales">
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
                    <p>
                        La version en vigueur est celle accessible en ligne sur cette page.
                    </p>
                </Section>
            </div>

            {/* Footer */}
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
        </div>
    )
}

// Composants utilitaires

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
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

function List({ items }: { items: string[] }) {
    return (
        <ul style={{
            paddingLeft: 24,
            margin: '8px 0 0',
            listStyleType: 'disc'
        }}>
            {items.map((item, index) => (
                <li key={index} style={{ marginBottom: 4 }}>{item}</li>
            ))}
        </ul>
    )
}

function ContactInfo() {
    return (
        <div style={{
            marginTop: 12,
            padding: 16,
            background: 'var(--surface-page)',
            borderRadius: 12,
            border: '1px solid var(--border-subtle)'
        }}>
            <p style={{ margin: 0 }}>
                <strong>📧 Email :</strong>{' '}
                <a href="mailto:support-commercial@sendprocolis.com" style={{ color: 'var(--color-primary)' }}>
                    support-commercial@sendprocolis.com
                </a>
            </p>
            <p style={{ margin: '4px 0 0' }}>
                <strong>📞 Téléphone :</strong> +221 76 516 27 96
            </p>
            <p style={{ margin: '4px 0 0' }}>
                <strong>📍 Siège :</strong> Dakar, Sénégal
            </p>
        </div>
    )
}
