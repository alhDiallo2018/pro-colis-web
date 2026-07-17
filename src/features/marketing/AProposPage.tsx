import { Button } from '@/ds'
import { useNavigate } from 'react-router-dom'

export function AProposPage() {
  const navigate = useNavigate()
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px', fontFamily: 'var(--font-body)', color: 'var(--text-body)', lineHeight: 1.7 }}>
      <Button variant="ghost" icon="arrow_back" onClick={() => navigate(-1)} style={{ marginBottom: 32 }}>
        Retour
      </Button>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: 'var(--text-strong)', marginBottom: 24 }}>À PROPOS DE SENDPROCOLIS</h1>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>Qui sommes-nous</h2>
      <p>
        SendProColis est une plateforme de transport interurbain de colis au Sénégal. Nous connectons les
        expéditeurs qui souhaitent envoyer des colis avec des chauffeurs transporteurs vérifiés qui se
        déplacent déjà entre les villes du pays.
      </p>
      <p>
        Fondée à Dakar, notre plateforme s'appuie sur les réalités du marché sénégalais pour offrir une
        solution de transport rapide, fiable et économique. Nous opérons dans les 14 régions du Sénégal,
        permettant aux particuliers comme aux entreprises d'envoyer leurs colis en toute sérénité.
      </p>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>Notre mission</h2>
      <p>
        Notre mission est de connecter les expéditeurs et les chauffeurs pour simplifier le transport de
        colis entre les villes du Sénégal. Nous croyons qu'un service de livraison fiable ne devrait pas
        être un luxe — c'est un besoin quotidien pour les familles, les commerçants et les entreprises.
      </p>
      <p>
        Nous nous engageons à offrir transparence, sécurité et rapidité à chaque étape : de la déclaration
        du colis jusqu'à la livraison au destinataire.
      </p>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>Comment ça marche</h2>
      <p>
        Envoyer un colis avec SendProColis se fait en trois étapes simples :
      </p>
      <ol style={{ paddingLeft: 24 }}>
        <li>
          <strong>Déclarez votre colis :</strong> décrivez le colis (nature, poids, dimensions) et indiquez
          la ville de départ et la ville d'arrivée.
        </li>
        <li>
          <strong>Recevez des offres :</strong> les chauffeurs disponibles sur le trajet vous font leurs
          propositions de prix. Vous choisissez celle qui vous convient le mieux.
        </li>
        <li>
          <strong>Suivez la livraison :</strong> une fois le chauffeur choisi, suivez votre colis en temps
          réel jusqu'à sa remise au destinataire avec code PIN de confirmation.
        </li>
      </ol>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>Nos valeurs</h2>
      <ul style={{ paddingLeft: 24 }}>
        <li>
          <strong>Confiance :</strong> chaque chauffeur est vérifié et évalué par la communauté. Notre système
          de réputation garantit des prestataires fiables.
        </li>
        <li>
          <strong>Rapidité :</strong> notre système de mise en relation instantanée permet de trouver un
          chauffeur en un temps record, souvent inférieur à une heure.
        </li>
        <li>
          <strong>Transparence :</strong> les prix sont affichés avant validation, le suivi est en temps réel,
          et aucune commission n'est cachée.
        </li>
      </ul>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>Contact</h2>
      <p>
        <strong>Email :</strong>{' '}
        <a href="mailto:contact@sendprocolis.com" style={{ color: 'var(--color-primary)' }}>contact@sendprocolis.com</a>
      </p>
      <p>
        <strong>Adresse :</strong> Dakar, Sénégal
      </p>
      <p>
        Notre équipe est disponible du lundi au vendredi de 8h à 18h, et le samedi de 9h à 13h (GMT).
      </p>
    </div>
  )
}
