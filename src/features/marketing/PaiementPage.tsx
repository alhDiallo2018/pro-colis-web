import { Button } from '@/ds'
import { useNavigate } from 'react-router-dom'

export function PaiementPage() {
  const navigate = useNavigate()
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px', fontFamily: 'var(--font-body)', color: 'var(--text-body)', lineHeight: 1.7 }}>
      <Button variant="ghost" icon="arrow_back" onClick={() => navigate(-1)} style={{ marginBottom: 32 }}>
        Retour
      </Button>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: 'var(--text-strong)', marginBottom: 24 }}>POLITIQUE DE PAIEMENT — SENDPROCOLIS</h1>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>1. Méthodes de paiement acceptées</h2>
      <p>
        SendProColis propose plusieurs méthodes de paiement adaptées au marché sénégalais :
      </p>
      <ul style={{ paddingLeft: 24 }}>
        <li><strong>Wave</strong> — paiement mobile instantané par code Wave ;</li>
        <li><strong>Orange Money</strong> — paiement via le service Orange Money ;</li>
        <li><strong>Free Money</strong> — paiement via le service Free Money ;</li>
        <li><strong>Carte bancaire</strong> — Visa, Mastercard ;</li>
        <li><strong>Espèces</strong> — paiement en espèces lors de la remise du colis (selon accord entre les parties).</li>
      </ul>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>2. Traitement des paiements</h2>
      <p>
        Tous les paiements électroniques sont traités par l'intermédiaire de <strong>PayDunya</strong>, notre
        partenaire de paiement agréé. PayDunya assure le traitement sécurisé des transactions et garantit la
        conformité avec les normes de sécurité internationales.
      </p>
      <p>
        Lorsque vous effectuez un paiement, le montant est débité immédiatement et conservé sur un compte
        séquestre de la plateforme jusqu'à la confirmation de la livraison du colis.
      </p>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>3. Sécurité des transactions</h2>
      <p>
        La sécurité de vos transactions est notre priorité. SendProColis met en œuvre les mesures suivantes :
      </p>
      <ul style={{ paddingLeft: 24 }}>
        <li>chiffrement SSL/TLS de toutes les communications ;</li>
        <li>authentification forte pour les transactions ;</li>
        <li>conformité PCI-DSS via nos prestataires partenaires ;</li>
        <li>surveillance en temps réel des activités suspectes ;</li>
        <li>aucune donnée de carte bancaire n'est stockée sur nos serveurs.</li>
      </ul>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>4. Frais et commissions</h2>
      <p>
        SendProColis prélève une commission sur chaque transaction réussie. Le montant de la commission est :
      </p>
      <ul style={{ paddingLeft: 24 }}>
        <li>clairement indiqué avant la validation de chaque expédition ;</li>
        <li>déduit automatiquement du montant versé au chauffeur ;</li>
        <li>variable selon le type d'expédition (standard, express) et la valeur du colis.</li>
      </ul>
      <p>
        Des frais additionnels peuvent s'appliquer pour les paiements par carte bancaire ou mobile money,
        conformément aux conditions des prestataires de paiement.
      </p>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>5. Délais de traitement</h2>
      <p>
        Les délais de traitement varient selon la méthode de paiement utilisée :
      </p>
      <ul style={{ paddingLeft: 24 }}>
        <li><strong>Mobile Money</strong> (Wave, Orange Money, Free Money) : instantané ;</li>
        <li><strong>Carte bancaire</strong> : immédiat ;</li>
        <li><strong>Paiement au chauffeur</strong> : traitement à la livraison ;</li>
        <li><strong>Versement aux chauffeurs</strong> : sous 48 heures ouvrées après confirmation de livraison.</li>
      </ul>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>6. Remboursements</h2>
      <p>
        Les remboursements sont traités selon notre politique d'annulation et de remboursement. En règle
        générale :
      </p>
      <ul style={{ paddingLeft: 24 }}>
        <li>les remboursements sont effectués via le même moyen de paiement que la transaction initiale ;</li>
        <li>le délai de remboursement est de 5 à 10 jours ouvrés selon la méthode de paiement ;</li>
        <li>les éventuels frais de transaction ne sont pas remboursables.</li>
      </ul>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>7. Litiges de paiement</h2>
      <p>
        En cas de litige concernant un paiement (débit non autorisé, montant incorrect, double débit), nous
        vous invitons à contacter immédiatement notre service client à{' '}
        <a href="mailto:contact@sendprocolis.com" style={{ color: 'var(--color-primary)' }}>contact@sendprocolis.com</a>.
      </p>
      <p>
        Nous nous engageons à :
      </p>
      <ul style={{ paddingLeft: 24 }}>
        <li>accuser réception de votre réclamation sous 48 heures ouvrées ;</li>
        <li>enquêter sur le litige et vous tenir informé de l'avancement ;</li>
        <li>apporter une solution dans un délai maximum de 7 jours ouvrés.</li>
      </ul>
      <p>
        Si le litige n'est pas résolu à l'amiable, vous pouvez saisir les autorités compétentes au Sénégal.
      </p>
    </div>
  )
}
