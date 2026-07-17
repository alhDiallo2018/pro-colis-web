import { Button } from '@/ds'
import { useNavigate } from 'react-router-dom'

export function ReclamationsPage() {
  const navigate = useNavigate()
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px', fontFamily: 'var(--font-body)', color: 'var(--text-body)', lineHeight: 1.7 }}>
      <Button variant="ghost" icon="arrow_back" onClick={() => navigate(-1)} style={{ marginBottom: 32 }}>
        Retour
      </Button>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: 'var(--text-strong)', marginBottom: 24 }}>RÉCLAMATIONS — SENDPROCOLIS</h1>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>1. Comment déposer une réclamation</h2>
      <p>
        Vous pouvez déposer une réclamation en nous écrivant à l'adresse suivante :{' '}
        <a href="mailto:contact@sendprocolis.com" style={{ color: 'var(--color-primary)' }}>contact@sendprocolis.com</a>.
      </p>
      <p>
        Nous vous recommandons de fournir le maximum d'informations pour nous permettre de traiter votre
        demande dans les meilleurs délais.
      </p>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>2. Informations à fournir</h2>
      <p>
        Afin de faciliter le traitement de votre réclamation, merci de fournir les informations suivantes :
      </p>
      <ul style={{ paddingLeft: 24 }}>
        <li>votre <strong>numéro de suivi</strong> (exemple : PC-7F3K-2291) ;</li>
        <li>la <strong>date et l'heure</strong> de l'expédition ;</li>
        <li>une <strong>description détaillée</strong> du problème rencontré ;</li>
        <li>des <strong>photos</strong> du colis si celui-ci est endommagé ;</li>
        <li>vos coordonnées complètes (nom, téléphone, email).</li>
      </ul>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>3. Délais de traitement</h2>
      <p>
        Notre équipe s'engage à traiter votre réclamation dans les meilleurs délais :
      </p>
      <ul style={{ paddingLeft: 24 }}>
        <li><strong>Accusé de réception :</strong> sous 48 heures ouvrées ;</li>
        <li><strong>Analyse et résolution :</strong> sous 7 jours ouvrés ;</li>
        <li><strong>Cas complexes :</strong> un délai supplémentaire peut être nécessaire, auquel cas vous serez informé.</li>
      </ul>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>4. Types de réclamations traitées</h2>
      <p>
        Nous traitons les types de réclamations suivants :
      </p>
      <ul style={{ paddingLeft: 24 }}>
        <li>
          <strong>Retard de livraison :</strong> si la livraison n'a pas été effectuée dans les délais
          convenus avec le chauffeur ;
        </li>
        <li>
          <strong>Colis endommagé :</strong> si le colis présente des dommages à la livraison (photos
          requises) ;
        </li>
        <li>
          <strong>Colis perdu :</strong> si le colis n'a jamais été livré et que le chauffeur ne peut
          en justifier la livraison ;
        </li>
        <li>
          <strong>Problème de paiement :</strong> débit non autorisé, montant incorrect, non-versement
          au chauffeur ;
        </li>
        <li>
          <strong>Comportement inapproprié :</strong> signalement d'un comportement abusif ou non
          professionnel d'un utilisateur.
        </li>
      </ul>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>5. Escalade</h2>
      <p>
        Si vous n'êtes pas satisfait de la réponse apportée à votre réclamation, vous pouvez demander une
        escalade de votre dossier. Votre demande sera examinée par un responsable hiérarchique qui
        réévaluera la situation et vous apportera une réponse définitive sous 14 jours ouvrés.
      </p>
      <p>
        En dernier recours, vous pouvez saisir les autorités compétentes au Sénégal ou les juridictions
        de Dakar pour tout litige non résolu.
      </p>
    </div>
  )
}
