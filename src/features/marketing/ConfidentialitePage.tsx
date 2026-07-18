import { MarketingHeader } from './MarketingHeader'

export function ConfidentialitePage() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px', fontFamily: 'var(--font-body)', color: 'var(--text-body)', lineHeight: 1.7 }}>
      <MarketingHeader />
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: 'var(--text-strong)', marginBottom: 24 }}>POLITIQUE DE CONFIDENTIALITÉ — SENDPROCOLIS</h1>

      <p>
        SendProColis accorde une importance primordiale à la protection de vos données personnelles. La présente
        politique de confidentialité décrit les données que nous collectons, comment nous les utilisons et les
        droits dont vous disposez.
      </p>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>1. Données collectées</h2>
      <p>Dans le cadre de l'utilisation de la plateforme, nous collectons les données suivantes :</p>
      <ul style={{ paddingLeft: 24 }}>
        <li><strong>Données d'identification :</strong> nom, prénom, numéro de téléphone, adresse email ;</li>
        <li><strong>Données de profil :</strong> photo de profil, adresse postale, ville de résidence ;</li>
        <li><strong>Données de localisation :</strong> position géographique pour le suivi des colis et la mise en relation ;</li>
        <li><strong>Données relatives aux colis :</strong> nature, poids, dimensions, valeur déclarée, adresses de départ et d'arrivée ;</li>
        <li><strong>Données de transaction :</strong> historique des expéditions, montants payés, moyens de paiement utilisés ;</li>
        <li><strong>Données techniques :</strong> adresse IP, type d'appareil, système d'exploitation, journaux de connexion.</li>
      </ul>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>2. Finalités du traitement</h2>
      <p>Vos données sont collectées et traitées pour les finalités suivantes :</p>
      <ul style={{ paddingLeft: 24 }}>
        <li>création et gestion de votre compte utilisateur ;</li>
        <li>traitement et suivi de vos expéditions de colis ;</li>
        <li>mise en relation entre expéditeurs et chauffeurs transporteurs ;</li>
        <li>traitement des paiements et des commissions ;</li>
        <li>sécurisation de la plateforme et lutte contre la fraude ;</li>
        <li>amélioration continue du service et de l'expérience utilisateur ;</li>
        <li>communication avec les utilisateurs (notifications, confirmations, support).</li>
      </ul>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>3. Base légale</h2>
      <p>
        Le traitement de vos données repose sur les bases légales suivantes :
      </p>
      <ul style={{ paddingLeft: 24 }}>
        <li><strong>L'exécution du contrat :</strong> le traitement est nécessaire à la fourniture de nos services ;</li>
        <li><strong>Votre consentement :</strong> pour certains traitements spécifiques (localisation précise, communications marketing) ;</li>
        <li><strong>L'obligation légale :</strong> conservation des données de transaction pour les obligations comptables et fiscales ;</li>
        <li><strong>L'intérêt légitime :</strong> amélioration du service, sécurité de la plateforme, prévention de la fraude.</li>
      </ul>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>4. Conservation des données</h2>
      <p>
        Vos données personnelles sont conservées pour une durée limitée, strictement nécessaire aux finalités
        pour lesquelles elles ont été collectées :
      </p>
      <ul style={{ paddingLeft: 24 }}>
        <li><strong>Données de compte :</strong> pendant toute la durée de votre compte et jusqu'à 3 ans après sa suppression ;</li>
        <li><strong>Données de transaction :</strong> 10 ans conformément aux obligations comptables sénégalaises ;</li>
        <li><strong>Données de localisation :</strong> 6 mois après la fin de chaque expédition ;</li>
        <li><strong>Données de connexion :</strong> 12 mois maximum.</li>
      </ul>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>5. Destinataires des données</h2>
      <p>
        Vos données sont accessibles uniquement aux destinataires suivants :
      </p>
      <ul style={{ paddingLeft: 24 }}>
        <li>les équipes habilitées de SendProColis ;</li>
        <li>les chauffeurs transporteurs, dans la mesure nécessaire à la réalisation de l'expédition ;</li>
        <li>les prestataires techniques et de paiement (PayDunya, OVHcloud) liés par contrat ;</li>
        <li>les autorités compétentes sur demande légale.</li>
      </ul>
      <p>
        SendProColis ne vend ni ne partage vos données personnelles à des tiers à des fins commerciales.
      </p>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>6. Sécurité des données</h2>
      <p>
        Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos
        données contre tout accès non autorisé, perte, altération ou divulgation :
      </p>
      <ul style={{ paddingLeft: 24 }}>
        <li>chiffrement des données en transit (HTTPS/TLS) ;</li>
        <li>chiffrement des données sensibles au repos ;</li>
        <li>authentification forte des utilisateurs ;</li>
        <li>contrôle d'accès strict aux données par les équipes ;</li>
        <li>surveillance continue de la sécurité de la plateforme.</li>
      </ul>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>7. Vos droits</h2>
      <p>
        Conformément à la réglementation applicable en matière de protection des données, vous disposez
        des droits suivants :
      </p>
      <ul style={{ paddingLeft: 24 }}>
        <li><strong>Droit d'accès :</strong> obtenir la confirmation que vos données sont traitées et en recevoir une copie ;</li>
        <li><strong>Droit de rectification :</strong> faire corriger les données inexactes vous concernant ;</li>
        <li><strong>Droit d'opposition :</strong> vous opposer au traitement de vos données pour des motifs légitimes ;</li>
        <li><strong>Droit à la portabilité :</strong> recevoir vos données dans un format structuré et les transmettre à un autre responsable ;</li>
        <li><strong>Droit à l'effacement :</strong> demander la suppression de vos données dans les conditions prévues par la loi.</li>
      </ul>
      <p>
        Pour exercer vos droits, contactez-nous à{' '}
        <a href="mailto:support-commercial@sendprocolis.com" style={{ color: 'var(--color-primary)' }}>support-commercial@sendprocolis.com</a>.
      </p>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>8. Délégué à la protection des données (DPO)</h2>
      <p>
        Pour toute question relative à la protection de vos données personnelles, vous pouvez contacter
        notre DPO à l'adresse :{' '}
        <a href="mailto:support-commercial@sendprocolis.com" style={{ color: 'var(--color-primary)' }}>support-commercial@sendprocolis.com</a>.
      </p>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>9. Cookies</h2>
      <p>
        La plateforme SendProColis utilise des cookies strictement nécessaires à son fonctionnement :
        cookies de session pour l'authentification, cookies de sécurité et cookies de préférences
        d'affichage.
      </p>
      <p>
        Aucun cookie publicitaire ou de suivi tiers n'est utilisé sur la plateforme. Vous pouvez configurer
        votre navigateur pour bloquer les cookies, mais certaines fonctionnalités pourraient ne plus être
        accessibles.
      </p>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>10. Modifications de la politique de confidentialité</h2>
      <p>
        SendProColis se réserve le droit de modifier la présente politique à tout moment. En cas de
        modification substantielle, les utilisateurs seront informés par email ou via une notification
        sur la plateforme au moins 15 jours avant l'entrée en vigueur des modifications.
      </p>
      <p>
        Nous vous invitons à consulter régulièrement cette page pour prendre connaissance de toute mise
        à jour.
      </p>
    </div>
  )
}
