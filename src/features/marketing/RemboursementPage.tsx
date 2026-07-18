import { MarketingHeader } from './MarketingHeader'

export function RemboursementPage() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px', fontFamily: 'var(--font-body)', color: 'var(--text-body)', lineHeight: 1.7 }}>
      <MarketingHeader />
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: 'var(--text-strong)', marginBottom: 24 }}>ANNULATION ET REMBOURSEMENT — SENDPROCOLIS</h1>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>1. Annulation avant prise en charge</h2>
      <p>
        Vous pouvez annuler une expédition <strong>sans frais</strong> tant que le chauffeur n'a pas
        confirmé la prise en charge du colis. Dans ce cas :
      </p>
      <ul style={{ paddingLeft: 24 }}>
        <li>le montant total est intégralement remboursé ;</li>
        <li>le remboursement est effectué via le même moyen de paiement utilisé lors de la commande ;</li>
        <li>aucun frais d'annulation n'est facturé.</li>
      </ul>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>2. Annulation après prise en charge</h2>
      <p>
        Si le colis a déjà été pris en charge par le chauffeur, l'annulation peut entraîner des frais :
      </p>
      <ul style={{ paddingLeft: 24 }}>
        <li>le remboursement est calculé au prorata du trajet non effectué ;</li>
        <li>des frais de pénalité forfaitaires peuvent s'appliquer selon les circonstances ;</li>
        <li>le chauffeur est indemnisé pour la partie du trajet déjà parcourue.</li>
      </ul>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>3. Conditions de remboursement</h2>
      <p>
        Les remboursements sont effectués selon les modalités suivantes :
      </p>
      <ul style={{ paddingLeft: 24 }}>
        <li>le montant remboursé est calculé automatiquement par la plateforme selon le statut de l'expédition ;</li>
        <li>le remboursement est crédité sur le même moyen de paiement que la transaction initiale ;</li>
        <li>en cas de paiement en espèces, le remboursement est effectué par mobile money ou virement bancaire selon vos préférences.</li>
      </ul>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>4. Colis perdu ou endommagé</h2>
      <p>
        En cas de colis perdu ou endommagé pendant le transport, vous devez suivre la procédure de
        réclamation suivante :
      </p>
      <ul style={{ paddingLeft: 24 }}>
        <li>signaler le problème dans les <strong>48 heures</strong> suivant la livraison (ou la date prévue) ;</li>
        <li>envoyer un email à{' '}
          <a href="mailto:support-commercial@sendprocolis.com" style={{ color: 'var(--color-primary)' }}>support-commercial@sendprocolis.com</a>{' '}
          avec votre numéro de suivi, une description du problème et des photos le cas échéant ;
        </li>
        <li>notre équipe évaluera votre dossier et vous proposera une solution dans un délai de 7 jours ouvrés.</li>
      </ul>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>5. Délais de remboursement</h2>
      <p>
        Les délais de remboursement varient selon la méthode de paiement :
      </p>
      <ul style={{ paddingLeft: 24 }}>
        <li><strong>Mobile Money</strong> (Wave, Orange Money, Free Money) : 5 à 7 jours ouvrés ;</li>
        <li><strong>Carte bancaire</strong> : 7 à 10 jours ouvrés (délai dépendant également de votre banque) ;</li>
        <li><strong>Espèces</strong> : 5 jours ouvrés après validation du remboursement.</li>
      </ul>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>6. Cas de non-remboursement</h2>
      <p>
        Aucun remboursement ne sera accordé dans les cas suivants :
      </p>
      <ul style={{ paddingLeft: 24 }}>
        <li>colis contenant des marchandises interdites par notre politique ;</li>
        <li>informations erronées fournies par l'expéditeur ayant entraîné la perte ou l'endommagement du colis ;</li>
        <li>colis refusé par le destinataire sans motif légitime lié à la plateforme ;</li>
        <li>emballage manifestement inadapté ayant causé les dommages ;</li>
        <li>force majeure (catastrophes naturelles, événements politiques, restrictions gouvernementales).</li>
      </ul>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>7. Contact pour les réclamations</h2>
      <p>
        Pour toute question relative à un remboursement ou pour déposer une réclamation, contactez-nous :
      </p>
      <p>
        <strong>Email :</strong>{' '}
        <a href="mailto:support-commercial@sendprocolis.com" style={{ color: 'var(--color-primary)' }}>support-commercial@sendprocolis.com</a>
      </p>
      <p>
        Nous nous engageons à traiter votre demande avec diligence et à vous tenir informé de l'évolution de
        votre dossier.
      </p>
    </div>
  )
}
