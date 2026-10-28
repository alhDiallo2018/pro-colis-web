import { Component, type ReactNode } from "react";

// Un écran chargé à la demande peut manquer hors connexion ou après une mise
// à jour. Conserver une issue visible au lieu de laisser une page blanche.
export class PageLoadBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main
        style={{ maxWidth: 480, margin: "60px auto", padding: 24 }}
        role="alert"
      >
        <h1>Cette page n’a pas pu s’ouvrir</h1>
        <p>
          Vérifiez votre connexion, puis rechargez la page. Vos brouillons
          enregistrés restent disponibles.
        </p>
        <button onClick={() => window.location.reload()}>Réessayer</button>
        <p>
          <a href="/">Revenir à l’accueil</a>
        </p>
      </main>
    ) : (
      this.props.children
    );
  }
}
