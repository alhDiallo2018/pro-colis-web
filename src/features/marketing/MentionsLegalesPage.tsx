import { MarketingHeader } from './MarketingHeader'

export function MentionsLegalesPage() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px', fontFamily: 'var(--font-body)', color: 'var(--text-body)', lineHeight: 1.7 }}>
      <MarketingHeader />
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: 'var(--text-strong)', marginBottom: 24 }}>MENTIONS LÉGALES — SENDPROCOLIS</h1>

      <p><strong>Dernière mise à jour : 17 juillet 2026</strong></p>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>1. Éditeur de la plateforme</h2>
      <p>
        La plateforme <strong>SendProColis</strong> est une solution de mise en relation entre expéditeurs et 
        transporteurs, développée et opérée par SendProColis SARL, société de droit sénégalais dont le siège 
        social est situé à Dakar, Sénégal.
      </p>
      <p>
        <strong>Contact :</strong>{' '}
        <a href="mailto:support-commercial@sendprocolis.com" style={{ color: 'var(--color-primary)' }}>
          support-commercial@sendprocolis.com
        </a>
        <br />
        <strong>Téléphone :</strong> +221 76 516 27 96
      </p>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>2. Directeur de publication</h2>
      <p>
        <strong>Serigne Fallou</strong>, en sa qualité de Directeur général de SendProColis SARL.
      </p>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>3. Hébergement</h2>
      <p>
        La plateforme SendProColis est hébergée par <strong>OVH / OVHcloud</strong>.
      </p>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>4. Objet de la plateforme</h2>
      <p>
        SendProColis est une plateforme digitale dont l'objectif est de :
      </p>
      <ul style={{ paddingLeft: 24 }}>
        <li>permettre la création et le suivi d'expéditions de colis au Sénégal, en Afrique et à l'international ;</li>
        <li>mettre en relation des expéditeurs avec des chauffeurs transporteurs vérifiés ;</li>
        <li>assurer le suivi en temps réel des colis ;</li>
        <li>gérer les paiements liés aux expéditions ;</li>
        <li>prélever des commissions sur les transactions réalisées via la plateforme ;</li>
        <li>faciliter la communication entre les utilisateurs.</li>
      </ul>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>5. Fonctionnement</h2>
      <p>
        SendProColis agit comme un intermédiaire technologique qui :
      </p>
      <ul style={{ paddingLeft: 24 }}>
        <li>facilite la mise en relation entre expéditeurs et chauffeurs transporteurs ;</li>
        <li>sécurise les transactions financières entre les parties ;</li>
        <li>assure le suivi des colis depuis l'enlèvement jusqu'à la livraison finale ;</li>
        <li>permet l'évaluation et la notation des chauffeurs pour garantir la qualité du service.</li>
      </ul>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>6. Transport de colis</h2>
      <p>
        L'expéditeur est tenu de fournir des informations exactes et complètes sur le colis (nature, poids,
        dimensions, valeur estimée). Il est seul responsable du contenu du colis et de sa conformité aux lois
        et règlements en vigueur au Sénégal et dans les pays de transit et de destination.
      </p>
      <p>
        <strong>Sont strictement interdits :</strong> les armes, explosifs, stupéfiants, produits dangereux,
        animaux vivants sans autorisation, contrefaçons, biens culturels, et tout objet dont le transport
        est prohibé par la loi. La liste complète des colis interdits est disponible sur la page dédiée.
      </p>
      <p>
        Les droits de douane et taxes applicables au transport restent à la charge de l'expéditeur ou du
        destinataire selon les termes convenus entre les parties.
      </p>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>7. Responsabilité</h2>
      <p>
        SendProColis agit en tant qu'intermédiaire et ne saurait être tenue responsable :
      </p>
      <ul style={{ paddingLeft: 24 }}>
        <li>des retards, pertes ou avaries survenant pendant le transport, qui relèvent de la responsabilité du transporteur ;</li>
        <li>des dommages indirects, pertes de données, ou préjudices commerciaux résultant de l'utilisation de la plateforme ;</li>
        <li>des actes ou omissions des chauffeurs transporteurs ou des expéditeurs ;</li>
        <li>des cas de force majeure.</li>
      </ul>
      <p>
        La plateforme est fournie "en l'état" et SendProColis ne garantit pas une disponibilité continue 
        et sans interruption du service.
      </p>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>8. Paiements</h2>
      <p>
        Les paiements sur la plateforme sont sécurisés et traités via des prestataires partenaires agréés. 
        SendProColis propose différents moyens de paiement adaptés aux marchés sénégalais, africains et 
        internationaux :
      </p>
      <ul style={{ paddingLeft: 24 }}>
        <li>Mobile money (Wave, Orange Money, etc.) ;</li>
        <li>Carte bancaire (Visa, Mastercard) ;</li>
        <li>Espèces (via les points de collecte).</li>
      </ul>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>9. Données personnelles</h2>
      <p>
        Conformément à la loi sénégalaise sur la protection des données à caractère personnel, SendProColis 
        collecte les données suivantes :
      </p>
      <ul style={{ paddingLeft: 24 }}>
        <li>Nom, prénom, numéro de téléphone, adresse email ;</li>
        <li>Adresse postale et données de localisation ;</li>
        <li>Informations relatives aux colis expédiés ;</li>
        <li>Données de connexion et d'utilisation de la plateforme.</li>
      </ul>
      <p>
        Ces données sont collectées pour les finalités suivantes :
      </p>
      <ul style={{ paddingLeft: 24 }}>
        <li>Création et gestion des comptes utilisateurs ;</li>
        <li>Mise en relation entre expéditeurs et chauffeurs ;</li>
        <li>Suivi des expéditions ;</li>
        <li>Traitement des paiements ;</li>
        <li>Sécurité de la plateforme ;</li>
        <li>Amélioration continue du service.</li>
      </ul>
      <p>
        Conformément à la réglementation, vous disposez d'un droit d'accès, de rectification, de suppression 
        et d'opposition au traitement de vos données. Pour exercer ces droits, contactez-nous à{' '}
        <a href="mailto:support-commercial@sendprocolis.com" style={{ color: 'var(--color-primary)' }}>
          support-commercial@sendprocolis.com
        </a>.
      </p>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>10. Comptes utilisateurs</h2>
      <p>
        Les utilisateurs s'engagent à :
      </p>
      <ul style={{ paddingLeft: 24 }}>
        <li>fournir des informations exactes, complètes et à les maintenir à jour ;</li>
        <li>préserver la confidentialité de leurs identifiants de connexion ;</li>
        <li>ne pas créer de faux comptes ou usurper l'identité d'autrui ;</li>
        <li>utiliser la plateforme de manière loyale et conforme aux lois en vigueur.</li>
      </ul>
      <p>
        SendProColis se réserve le droit de suspendre ou de supprimer tout compte en cas de manquement 
        à ces obligations ou d'utilisation frauduleuse de la plateforme.
      </p>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>11. Chauffeurs et transporteurs</h2>
      <p>
        Les chauffeurs et transporteurs inscrits sur la plateforme s'engagent à :
      </p>
      <ul style={{ paddingLeft: 24 }}>
        <li>fournir des documents valides (permis de conduire, carte grise, assurance, pièce d'identité) ;</li>
        <li>respecter le code de la route et les réglementations applicables au transport de marchandises ;</li>
        <li>assurer la sécurité et l'intégrité des colis confiés ;</li>
        <li>respecter les délais de livraison convenus.</li>
      </ul>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>12. Système de réputation</h2>
      <p>
        SendProColis intègre un système d'évaluation des chauffeurs basé sur les retours des expéditeurs. 
        Ce système attribue :
      </p>
      <ul style={{ paddingLeft: 24 }}>
        <li>des notes (de 1 à 5 étoiles) ;</li>
        <li>des points de réputation (Score) ;</li>
        <li>des badges de performance.</li>
      </ul>
      <p>
        Le classement et les badges n'ont aucune valeur monétaire. Ils servent uniquement à informer les 
        expéditeurs sur la fiabilité et la qualité de service des chauffeurs.
      </p>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>13. Portefeuille chauffeur (Wallet)</h2>
      <p>
        Le Wallet Chauffeur est un outil de gestion financière indépendant du système de réputation. Il permet :
      </p>
      <ul style={{ paddingLeft: 24 }}>
        <li>de cumuler les gains issus des livraisons ;</li>
        <li>de gérer les commissions prélevées ;</li>
        <li>d'effectuer des retraits sécurisés.</li>
      </ul>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>14. Propriété intellectuelle</h2>
      <p>
        La marque <strong>SendProColis</strong>, son logo, son nom de domaine, et l'ensemble des éléments 
        graphiques, textuels et techniques de la plateforme sont protégés par les lois relatives à la 
        propriété intellectuelle. Toute reproduction, représentation, modification ou utilisation sans 
        autorisation préalable est strictement interdite.
      </p>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>15. Réclamations et médiation</h2>
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

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>16. Droit applicable</h2>
      <p>
        Les présentes mentions légales sont soumises au droit sénégalais. Tout litige relatif à leur 
        interprétation ou exécution relève de la compétence exclusive des tribunaux de Dakar.
      </p>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>17. Modification des mentions légales</h2>
      <p>
        SendProColis se réserve le droit de modifier les présentes mentions légales à tout moment pour 
        s'adapter aux évolutions légales, réglementaires ou techniques. Les utilisateurs seront informés 
        de toute modification substantielle :
      </p>
      <ul style={{ paddingLeft: 24 }}>
        <li>par email ;</li>
        <li>via une notification sur la plateforme ;</li>
        <li>par un message lors de leur prochaine connexion.</li>
      </ul>
      <p>
        La version en vigueur est celle accessible en ligne sur cette page.
      </p>
    </div>
  )
}