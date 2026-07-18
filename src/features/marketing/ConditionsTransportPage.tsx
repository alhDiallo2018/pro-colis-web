import { MarketingHeader } from './MarketingHeader'

export function ConditionsTransportPage() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px', fontFamily: 'var(--font-body)', color: 'var(--text-body)', lineHeight: 1.7 }}>
      <MarketingHeader />
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: 'var(--text-strong)', marginBottom: 24 }}>CONDITIONS DE TRANSPORT DE COLIS (CDP) — SENDPROCOLIS</h1>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>14.1 Acceptation des conditions</h2>
      <p>
        L'utilisation de la plateforme SendProColis pour l'envoi ou le transport de colis implique
        l'acceptation pleine et entière des présentes conditions de transport. En créant une expédition,
        l'expéditeur et le chauffeur reconnaissent avoir pris connaissance et accepté sans réserve ces
        conditions.
      </p>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>14.2 Obligations de l'expéditeur</h2>
      <p>
        L'expéditeur s'engage à :
      </p>
      <ul style={{ paddingLeft: 24 }}>
        <li>fournir des informations exactes sur le colis (nature, poids, dimensions, valeur déclarée) ;</li>
        <li>emballer le colis de manière adéquate pour assurer sa protection durant le transport ;</li>
        <li>respecter l'ensemble des lois et règlements applicables au transport de marchandises ;</li>
        <li>ne pas confier de colis interdits ou réglementés sans autorisation préalable.</li>
      </ul>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>14.3 Colis interdits</h2>
      <p>
        <strong>Sont strictement interdits au transport :</strong>
      </p>
      <ul style={{ paddingLeft: 24 }}>
        <li>armes à feu, armes blanches, munitions et explosifs ;</li>
        <li>drogues, stupéfiants et substances psychotropes ;</li>
        <li>produits dangereux, corrosifs, inflammables, radioactifs ou toxiques ;</li>
        <li>animaux vivants sans autorisation préalable et sans conditions de transport adaptées ;</li>
        <li>denrées périssables sans conditionnement de conservation approprié ;</li>
        <li>contrefaçons et marchandises portant atteinte aux droits de propriété intellectuelle ;</li>
        <li>objets volés ou d'origine illicite ;</li>
        <li>tout objet dont le transport est interdit par la loi sénégalaise ou par celle du pays de destination.</li>
      </ul>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>14.4 Contrôle des colis</h2>
      <p>
        SendProColis et les chauffeurs partenaires se réservent le droit de vérifier le contenu des colis
        en cas de suspicion légitime, pour des raisons de sécurité. Tout refus de contrôle pourra entraîner
        le refus de prise en charge du colis sans remboursement.
      </p>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>14.5 Délais de livraison</h2>
      <p>
        Les délais de livraison affichés sur la plateforme sont donnés à titre indicatif. Ils varient en
        fonction des conditions de circulation, de la météo, de la distance et d'autres facteurs externes.
        Aucune garantie de délai ferme n'est donnée, sauf pour l'option Express qui engage le chauffeur à
        une livraison prioritaire.
      </p>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>14.6 Livraison et remise du colis</h2>
      <p>
        La livraison est réputée effectuée lorsque le colis est remis au destinataire contre communication
        du code PIN de confirmation. La remise du colis constitue la preuve de livraison. Le destinataire
        est tenu de vérifier l'état du colis au moment de la réception.
      </p>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>14.7 Annulation</h2>
      <p>
        L'annulation d'une expédition est possible :
      </p>
      <ul style={{ paddingLeft: 24 }}>
        <li><strong>Avant la prise en charge</strong> du colis par le chauffeur : annulation sans frais ;</li>
        <li><strong>Après la prise en charge</strong> du colis par le chauffeur : des frais d'annulation peuvent s'appliquer, proportionnels au trajet déjà parcouru.</li>
      </ul>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>14.8 Limitation de responsabilité</h2>
      <p>
        SendProColis agit en tant que plateforme d'intermédiation entre expéditeurs et chauffeurs
        transporteurs. La société n'est pas responsable des dommages causés au colis pendant le transport,
        sauf négligence avérée de la plateforme. La responsabilité du transport incombe au chauffeur
        mandaté par l'expéditeur.
      </p>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>14.9 Réclamations relatives au transport</h2>
      <p>
        Toute réclamation concernant un colis doit être adressée à{' '}
        <a href="mailto:support-commercial@sendprocolis.com" style={{ color: 'var(--color-primary)' }}>support-commercial@sendprocolis.com</a>{' '}
        dans les 48 heures suivant la livraison (ou la date prévue de livraison en cas de retard).
      </p>
      <p>
        Les informations suivantes sont requises pour traiter la réclamation :
      </p>
      <ul style={{ paddingLeft: 24 }}>
        <li>numéro de suivi du colis ;</li>
        <li>date et heure de l'expédition ;</li>
        <li>description détaillée du problème rencontré ;</li>
        <li>photos du colis endommagé le cas échéant.</li>
      </ul>
    </div>
  )
}
