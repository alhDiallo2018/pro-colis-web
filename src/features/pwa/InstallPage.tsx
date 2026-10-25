import { Link } from 'react-router-dom'
import { MarketingHeader } from '@/features/marketing/MarketingHeader'
import { usePwa } from './context'

export function InstallPage() {
  const { installed } = usePwa()
  return (
    <main className="pwa-page">
      <MarketingHeader />
      <div className="pwa-install-layout">
        <section className="pwa-intro" aria-labelledby="install-title">
          <p className="pwa-eyebrow">IPHONE & IPAD</p>
          <h1 id="install-title">Vos colis.<br />À portée de main.</h1>
          <p>Retrouvez ProColis sur votre écran d’accueil, avec votre compte habituel. Sans passer par l’App Store.</p>
          <div className="pwa-app-preview">
            <img src="/icons/apple-touch-icon.png" alt="Icône ProColis" width="88" height="88" />
            <div><strong>ProColis</strong><span>Envoyez. Suivez. Recevez.</span></div>
          </div>
          <Link className="pwa-primary-link" to="/app">{installed ? 'Ouvrir mon espace' : 'Continuer dans le navigateur'} <span aria-hidden="true">→</span></Link>
        </section>
        <section className="pwa-steps" aria-labelledby="steps-title">
          {installed ? (
            <>
              <p className="pwa-eyebrow">VOUS ÊTES PRÊT</p>
              <h2 id="steps-title">ProColis est ouvert en mode application.</h2>
              <p>Connectez-vous pour retrouver vos colis et vos messages.</p>
            </>
          ) : (
            <>
              <p className="pwa-eyebrow">INSTALLATION GRATUITE</p>
              <h2 id="steps-title">Trois étapes, et c’est à vous.</h2>
              <ol>
                <li><strong>Ouvrez ce site dans Safari</strong><p>Si vous venez de WhatsApp, Facebook ou d’un autre navigateur, copiez le lien de cette page puis ouvrez-le dans Safari.</p></li>
                <li><strong>Touchez Partager</strong><p>Repérez le carré avec une flèche vers le haut. Selon votre version d’iOS, il se trouve dans le menu de la page.</p></li>
                <li><strong>Choisissez « Sur l’écran d’accueil »</strong><p>Activez « Ouvrir comme app web » si cette option apparaît, puis touchez « Ajouter ». L’icône ProColis est prête.</p></li>
              </ol>
              <p className="pwa-tip">L’option n’apparaît pas ? Faites défiler le menu Partager et vérifiez « Modifier les actions ».</p>
            </>
          )}
          <p className="pwa-connection-note">Une connexion Internet est nécessaire pour les colis, les paiements et les messages.</p>
        </section>
      </div>
      <p className="pwa-other-devices">Sur Android ou ordinateur, utilisez l’option d’installation du menu de votre navigateur lorsqu’elle est disponible.</p>
    </main>
  )
}
