import { Button } from '@/ds'
import { useNavigate } from 'react-router-dom'

export function ColisInterditsPage() {
  const navigate = useNavigate()
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px', fontFamily: 'var(--font-body)', color: 'var(--text-body)', lineHeight: 1.7 }}>
      <Button variant="ghost" icon="arrow_back" onClick={() => navigate(-1)} style={{ marginBottom: 32 }}>
        Retour
      </Button>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: 'var(--text-strong)', marginBottom: 24 }}>COLIS INTERDITS — SENDPROCOLIS</h1>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>1. Colis strictement interdits</h2>
      <p>
        Les articles suivants sont <strong>strictement interdits</strong> au transport sur la plateforme
        SendProColis, conformément à la réglementation sénégalaise :
      </p>
      <ul style={{ paddingLeft: 24 }}>
        <li>
          <strong>Armes et munitions :</strong> armes à feu, armes blanches, fusils, pistolets, munitions,
          pièces d'armes, armes factices réalistes ;
        </li>
        <li>
          <strong>Explosifs et matières inflammables :</strong> explosifs, feux d'artifice, pétards,
          essence, gaz sous pression, aérosols inflammables, allumettes en grande quantité ;
        </li>
        <li>
          <strong>Drogues et stupéfiants :</strong> toute substance classée comme drogue ou stupéfiant
          par la loi sénégalaise, y compris les produits à usage dit récréatif ;
        </li>
        <li>
          <strong>Animaux vivants :</strong> animaux domestiques ou sauvages sans autorisation spéciale
          et conditions de transport adaptées ;
        </li>
        <li>
          <strong>Produits chimiques dangereux :</strong> acides, produits corrosifs, toxiques, radioactifs,
          pesticides, engrais chimiques non autorisés ;
        </li>
        <li>
          <strong>Produits biologiques dangereux :</strong> déchets médicaux, substances infectieuses,
          échantillons biologiques non conditionnés selon les normes ;
        </li>
        <li>
          <strong>Contrefaçons :</strong> produits contrefaits, copies illégales de marques, médicaments
          falsifiés, logiciels piratés ;
        </li>
        <li>
          <strong>Objets volés ou illicites :</strong> tout objet obtenu illégalement ou dont la possession
          est interdite ;
        </li>
        <li>
          <strong>Monnaie et valeurs :</strong> espèces en grande quantité, métaux précieux, pierres
          précieuses sans transport sécurisé agréé ;
        </li>
        <li>
          <strong>Objets obscènes ou interdits :</strong> matériel à caractère obscène ou interdit par
          les lois sénégalaises.
        </li>
      </ul>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>2. Produits réglementés</h2>
      <p>
        Certains produits ne sont pas interdits mais nécessitent une <strong>autorisation spéciale</strong>{' '}
        et un conditionnement conforme :
      </p>
      <ul style={{ paddingLeft: 24 }}>
        <li><strong>Médicaments :</strong> nécessitent une ordonnance valide et un emballage scellé ;</li>
        <li><strong>Denrées périssables :</strong> nécessitent un conditionnement isotherme ou réfrigéré ;</li>
        <li><strong>Produits électroniques avec batterie :</strong> batterie retirée ou protégée contre les courts-circuits ;</li>
        <li><strong>Produits en verre ou fragiles :</strong> emballage renforcé obligatoire avec mention « FRAGILE » visible ;</li>
        <li><strong>Documents confidentiels :</strong> emballés dans une enveloppe scellée opaque.</li>
      </ul>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>3. Conséquences du non-respect</h2>
      <p>
        Le non-respect de la politique relative aux colis interdits entraînera :
      </p>
      <ul style={{ paddingLeft: 24 }}>
        <li>le refus immédiat de prise en charge du colis par le chauffeur ;</li>
        <li>le signalement aux autorités compétentes si la nature du colis l'exige ;</li>
        <li>la suspension temporaire ou définitive du compte de l'utilisateur concerné ;</li>
        <li>la non-éligibilité à tout remboursement en cas d'annulation liée au non-respect ;</li>
        <li>la responsabilité pénale et civile de l'expéditeur en cas d'infraction à la loi.</li>
      </ul>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>4. Conseils d'emballage pour colis autorisés</h2>
      <p>
        Pour garantir la sécurité de vos colis pendant le transport, suivez ces recommandations :
      </p>
      <ul style={{ paddingLeft: 24 }}>
        <li>utilisez un emballage rigide et adapté à la taille et au poids du contenu ;</li>
        <li>remplissez les espaces vides avec du papier bulle, mousse ou papier froissé ;</li>
        <li>fermez solidement l'emballage avec du ruban adhésif résistant ;</li>
        <li>apposez clairement l'adresse du destinataire et un numéro de téléphone de contact ;</li>
        <li>indiquez si le colis est « FRAGILE » ou « NE PAS RENVERSER » le cas échéant ;</li>
        <li>pour les liquides, placez le récipient dans un sac étanche avant emballage ;</li>
        <li>ne dépassez pas 25 kg par colis, sauf accord préalable avec le chauffeur.</li>
      </ul>
    </div>
  )
}
