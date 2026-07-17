import { Button } from '@/ds'
import { useNavigate } from 'react-router-dom'

export function CGUPage() {
  const navigate = useNavigate()
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px', fontFamily: 'var(--font-body)', color: 'var(--text-body)', lineHeight: 1.7 }}>
      <Button variant="ghost" icon="arrow_back" onClick={() => navigate(-1)} style={{ marginBottom: 32 }}>
        Retour
      </Button>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: 'var(--text-strong)', marginBottom: 24 }}>CONDITIONS GÉNÉRALES D'UTILISATION — SENDPROCOLIS</h1>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>1. Objet et acceptation</h2>
      <p>
        Les présentes Conditions Générales d'Utilisation (CGU) définissent les modalités d'utilisation de la
        plateforme SendProColis. En créant un compte ou en utilisant nos services, vous acceptez sans réserve
        les présentes CGU.
      </p>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>2. Description des services</h2>
      <p>
        SendProColis propose les services suivants :
      </p>
      <ul style={{ paddingLeft: 24 }}>
        <li>envoi et suivi de colis entre les villes du Sénégal ;</li>
        <li>mise en relation entre expéditeurs et chauffeurs transporteurs vérifiés ;</li>
        <li>gestion des offres, des enchères et du libre service ;</li>
        <li>traitement sécurisé des paiements ;</li>
        <li>système de notation et de réputation pour garantir la qualité du service.</li>
      </ul>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>3. Inscription et compte</h2>
      <p>
        L'accès aux services nécessite la création d'un compte. L'utilisateur s'engage à :
      </p>
      <ul style={{ paddingLeft: 24 }}>
        <li>fournir des informations exactes, complètes et à jour ;</li>
        <li>maintenir la confidentialité de ses identifiants de connexion ;</li>
        <li>ne pas créer de faux compte ni usurper l'identité d'un tiers ;</li>
        <li>informer immédiatement SendProColis en cas d'utilisation frauduleuse de son compte.</li>
      </ul>
      <p>
        Chaque utilisateur est responsable de toute activité effectuée via son compte.
      </p>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>4. Obligations des utilisateurs</h2>
      <p>
        Les utilisateurs s'engagent à :
      </p>
      <ul style={{ paddingLeft: 24 }}>
        <li>respecter l'ensemble des lois et règlements en vigueur au Sénégal ;</li>
        <li>fournir des informations exactes concernant les colis expédiés ;</li>
        <li>ne pas transporter de marchandises interdites ou illicites ;</li>
        <li>ne pas détourner la plateforme à des fins frauduleuses ou illégales ;</li>
        <li>respecter les autres utilisateurs et faire preuve de courtoisie dans les échanges ;</li>
        <li>honorer les offres acceptées et les engagements de transport convenus.</li>
      </ul>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>5. Rôle de SendProColis</h2>
      <p>
        SendProColis agit exclusivement en tant que plateforme d'intermédiation entre expéditeurs et
        chauffeurs transporteurs. Elle ne réalise pas elle-même le transport des colis et n'est pas
        partie au contrat de transport conclu entre l'expéditeur et le chauffeur. Son rôle se limite à
        faciliter la mise en relation et à sécuriser les transactions.
      </p>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>6. Tarifs et commissions</h2>
      <p>
        Les tarifs de transport sont fixés librement entre l'expéditeur et le chauffeur via le système
        d'offres de la plateforme. SendProColis prélève une commission sur chaque transaction, dont le
        montant est clairement affiché avant validation.
      </p>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>7. Paiements</h2>
      <p>
        Les paiements sont traités via des prestataires partenaires agréés, notamment PayDunya. Les méthodes
        de paiement disponibles incluent : Wave, Orange Money, Free Money, carte bancaire et espèces.
      </p>
      <p>
        Les fonds sont sécurisés sur un compte de la plateforme jusqu'à confirmation de la livraison. Les
        détails de la politique de paiement sont consultables sur la page dédiée.
      </p>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>8. Annulation et remboursement</h2>
      <p>
        Les conditions d'annulation et de remboursement varient selon le statut de l'expédition :
      </p>
      <ul style={{ paddingLeft: 24 }}>
        <li><strong>Avant prise en charge :</strong> annulation sans frais, remboursement intégral ;</li>
        <li><strong>Après prise en charge :</strong> des frais de pénalité peuvent s'appliquer selon l'avancement du transport ;</li>
        <li><strong>Annulation par le chauffeur :</strong> l'expéditeur est remboursé intégralement.</li>
      </ul>
      <p>
        La politique complète d'annulation et de remboursement est disponible sur la page dédiée.
      </p>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>9. Propriété intellectuelle</h2>
      <p>
        Tous les éléments de la plateforme (marque, logo, charte graphique, code source, contenus) sont la
        propriété exclusive de SendProColis et sont protégés par les lois relatives à la propriété
        intellectuelle. Toute reproduction, modification ou exploitation non autorisée est interdite.
      </p>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>10. Responsabilité et limitations</h2>
      <p>
        SendProColis s'engage à mettre en œuvre les moyens nécessaires pour assurer la disponibilité et la
        sécurité de la plateforme. Toutefois, la responsabilité de SendProColis ne saurait être engagée :
      </p>
      <ul style={{ paddingLeft: 24 }}>
        <li>en cas d'indisponibilité temporaire due à la maintenance ou à des incidents techniques ;</li>
        <li>pour les actes ou omissions des utilisateurs (expéditeurs et chauffeurs) ;</li>
        <li>pour les dommages indirects, pertes de revenus ou préjudices commerciaux ;</li>
        <li>en cas de force majeure (catastrophes naturelles, grèves, restrictions gouvernementales, etc.).</li>
      </ul>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>11. Résiliation et suspension de compte</h2>
      <p>
        SendProColis se réserve le droit de suspendre ou de résilier un compte utilisateur en cas de :
      </p>
      <ul style={{ paddingLeft: 24 }}>
        <li>violation des présentes CGU ;</li>
        <li>fourniture de fausses informations ;</li>
        <li>utilisation frauduleuse ou abusive de la plateforme ;</li>
        <li>non-respect des obligations légales applicables.</li>
      </ul>
      <p>
        L'utilisateur peut également demander la suppression de son compte à tout moment via les paramètres
        de son profil.
      </p>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>12. Modification des CGU</h2>
      <p>
        SendProColis se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront
        informés de toute modification substantielle par email ou via une notification sur la plateforme au
        moins 15 jours avant l'entrée en vigueur des modifications. L'utilisation continue de la plateforme
        après cette date vaut acceptation des nouvelles CGU.
      </p>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>13. Droit applicable</h2>
      <p>
        Les présentes CGU sont régies par le droit sénégalais. Tout litige relatif à leur interprétation ou
        exécution relève de la compétence des tribunaux de Dakar, Sénégal.
      </p>
    </div>
  )
}
