# Parité transport web et PWA

Le web et la PWA utilisent les mêmes composants React et les mêmes API que le mobile.

- Client / Nouveau colis : six catégories, poids, rayon, chauffeurs vérifiés, carte et sélection directe. Localisation facultative, recherche possible autour de la zone de retrait. Distances à vol d’oiseau et positions approximatives explicitement signalées.
- Client / Annonces chauffeurs : filtre GP/navettes/trajets, ligne, retrait/remise intermédiaires et poids ; filtration serveur avant pagination. Offre sur itinéraire liée à un colis compatible ; capacité réévaluée côté serveur.
- Client / Véhicules en direct : un repère par départ, référence du véhicule, chauffeur, ligne, sens, horaire, précision et âge de mesure. Actualisation 5 secondes ; disparition à expiration (60 secondes), coupure ou arrière-plan.
- Chauffeur / Nouvelle annonce : véhicule enregistré réutilisé, catégorie déduite, arrêts ordonnés et durées. Enregistrement automatique du trajet habituel.
- Chauffeur / Mes annonces : réutilisation d’un trajet, publication de 1 à 100 départs avec aperçu, inversion/alternance des sens et reprise idempotente après fermeture ou réponse réseau perdue. Aucune activation GPS automatique.
- Chauffeur / Partage GPS : consentement explicite, mesures réelles seulement, session liée à un départ et compte. Le navigateur arrête le partage en arrière-plan, hors réseau ou à la sortie de la page. Le suivi écran verrouillé nécessite l’application mobile ; référence : https://www.w3.org/TR/geolocation/ (documents actifs et visibles).
- Hors connexion : shell public et bundles précachés à l’installation de la PWA ; session déjà ouverte et profil conservés ; menu Historique hors connexion, copie minimale des 300 derniers colis chargés, date de sauvegarde et lecture seule. Pas de première authentification hors réseau. Copie isolée par compte et effacée à la déconnexion ; aucun cache de positions, disponibilité, codes de remise ou documents d’identité. Pas de file automatique d’opérations métier.

## Validation et limites

Build TypeScript/Vite et suite Vitest. Tests de 50 départs, reprise du même requestId après réouverture, rejet des chevauchements, changement de compte, expiration GPS, arrêt en arrière-plan, historique minimal et worker sans cache API. Contrôle visuel Safari sur les données fictives de la base locale.

Déploiement : utiliser le build `dist`, HTTPS, fallback SPA pour les routes et servir `/sw.js` sans cache prolongé. Le serveur doit inclure les migrations discovery, journey_live et route_templates. La carte Google nécessite la configuration Places/Maps existante et une connexion. Le worker est activé en build de production uniquement ; le serveur Vite de développement n’installe pas la PWA.

Pas de déploiement de production effectué. Vérification physique Android/iOS recommandée pour l’installation et la suspension de la PWA.
