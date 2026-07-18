# Contrat API REST

## Conventions

- Prefixe cible : `/api/v1`.
- Compatibilite mobile initiale : accepter aussi les routes sans prefixe.
- Authentification : `Authorization: Bearer <accessToken>`.
- Dates : ISO 8601.
- Montants : `numeric`, devise par defaut `XOF`.
- Identifiants : UUID.

## Auth

| Methode | Route | Roles | Description |
| --- | --- | --- | --- |
| POST | `/auth/register` | public | Creer un compte client, chauffeur, admin ou super admin selon autorisation. |
| POST | `/auth/send-otp` | public | Envoyer un OTP a un email ou telephone. |
| POST | `/auth/verify-otp` | public | Verifier OTP et retourner tokens + user. |
| POST | `/auth/login-with-pin` | public | Connexion par PIN et identifiant. |
| POST | `/auth/refresh` | public | Renouveler access token. |
| POST | `/auth/forgot-password` | public | Demander reset password. |
| POST | `/auth/reset-password` | public | Reinitialiser password. |
| POST | `/auth/change-password` | authentifie | Changer password courant. |
| POST | `/auth/verify-email` | public/auth | Verifier email avec OTP. |
| POST | `/auth/resend-verification` | public/auth | Renvoyer verification email. |
| GET | `/auth/me` | authentifie | Retourner utilisateur courant. |

Payload register minimal :

```json
{
  "email": "client@example.com",
  "phone": "+221770000000",
  "fullName": "Client Test",
  "password": "Password123!",
  "role": "client",
  "address": "Dakar",
  "city": "Dakar",
  "region": "Dakar",
  "vehiclePlate": null,
  "vehicleModel": null,
  "vehicleColor": null,
  "vehicleYear": null,
  "garageId": null
}
```

## Users et profils

| Methode | Route | Roles | Description |
| --- | --- | --- | --- |
| PUT | `/client/profile` | client | Modifier profil client. |
| PUT | `/driver/profile` | driver | Modifier profil chauffeur. |
| PUT | `/garage-admin/profile` | admin | Modifier profil admin garage. |
| PUT | `/super-admin/profile` | super_admin | Modifier profil super admin. |
| PUT | `/users/pin` | authentifie | Modifier PIN. |
| DELETE | `/users/account` | authentifie | Suppression logique du compte courant. |
| GET | `/users/stats` | authentifie | Stats personnelles. |
| PUT | `/users/profile-photo` | authentifie | Mettre a jour photo profil. |

## Colis client/chauffeur/admin

| Methode | Route | Roles | Description |
| --- | --- | --- | --- |
| GET | `/client/parcels/my-parcels` | client | Liste des colis du client, filtre `status`. |
| POST | `/client/parcels/create` | client | Creer un colis. |
| POST | `/driver/parcels/create` | driver | Creer un colis pour un client. |
| POST | `/garage-admin/parcels/create` | admin | Creer un colis depuis garage. |
| POST | `/super-admin/parcels/create` | super_admin | Creer un colis globalement. |
| GET | `/driver/parcels` | driver | Colis assignes au chauffeur. |
| GET | `/garage-admin/parcels` | admin | Colis du garage admin. |
| GET | `/super-admin/parcels` | super_admin | Tous les colis. |
| GET | `/{role}/parcels/:parcelId` | role correspondant | Detail colis selon droits. |
| PUT | `/{role}/parcels/:parcelId/status` | authentifie | Changer statut generique selon droits. |
| PATCH/POST | `/{role}/parcels/:parcelId/media` | authentifie | Associer medias uploades au colis. |
| DELETE | `/garage-admin/parcels/:parcelId` | admin | Supprimer/annuler colis garage. |
| DELETE | `/super-admin/parcels/:parcelId` | super_admin | Supprimer/annuler colis global. |
| PUT | `/super-admin/parcels/:parcelId` | super_admin | Modifier colis. |

Payload creation colis :

```json
{
  "senderName": "Awa Diop",
  "senderPhone": "+221770000001",
  "senderEmail": "awa@example.com",
  "senderId": "uuid-optionnel",
  "receiverName": "Mamadou Fall",
  "receiverPhone": "+221770000002",
  "receiverEmail": "mamadou@example.com",
  "receiverAddress": "Thies",
  "description": "Documents administratifs",
  "weight": 1.2,
  "type": "document",
  "departureGarageId": "uuid",
  "arrivalGarageId": "uuid",
  "price": 2500,
  "isUrgent": false,
  "isInsured": false,
  "driverId": "uuid-optionnel",
  "isFreeForBidding": false,
  "proposedPrice": null,
  "photoUrls": [],
  "videoUrls": [],
  "audioUrls": [],
  "notes": "Fragile"
}
```

## Cycle livraison chauffeur

| Methode | Route | Roles | Description |
| --- | --- | --- | --- |
| PUT | `/driver/parcels/:parcelId/pickup` | driver | Marquer ramasse. |
| PUT | `/driver/parcels/:parcelId/transit` | driver | Marquer en transit. |
| PUT | `/driver/parcels/:parcelId/arrived` | driver | Marquer arrive au garage destination. |
| PUT | `/driver/parcels/:parcelId/out-for-delivery` | driver | Marquer en livraison finale. |
| PUT | `/driver/parcels/:parcelId/deliver` | driver | Confirmer livraison avec signature/photo. |
| POST | `/client/parcels/:parcelId/cancel` | client | Annuler si statut autorise. |

## Tracking public

| Methode | Route | Roles | Description |
| --- | --- | --- | --- |
| GET | `/public/parcels/track/:trackingNumber` | public | Suivre un colis par numero. |
| GET | `/public/parcels/:parcelId/events` | public | Timeline publique. |
| GET | `/public/parcels/free` | public/auth | Colis libres pour offres. |
| GET | `/parcels/:parcelId/timeline` | authentifie | Timeline detaillee. |
| POST | `/parcels/:parcelId/notes` | authentifie | Ajouter note interne. |
| GET | `/parcels/:parcelId/notes` | authentifie | Lister notes internes. |
| GET | `/parcels/:parcelId/proof` | authentifie | Preuve de livraison. |
| POST | `/parcels/estimate` | public/auth | Estimation prix. |

## Offres et libre service

| Methode | Route | Roles | Description |
| --- | --- | --- | --- |
| POST | `/driver/bids` | driver | Faire une offre sur un colis libre. |
| POST | `/client/parcels/:parcelId/bids/:bidId/accept` | client | Accepter offre. |
| POST | `/client/parcels/:parcelId/bids/:bidId/reject` | client | Rejeter offre. |
| GET | `/public/parcels/:parcelId/bids` | public/auth | Lister offres d'un colis. |
| GET | `/client/bids/stats` | client | Stats offres recues. |
| POST | `/client/bids/:bidId/negotiate` | client | Contre-proposition. |
| GET | `/client/bids/received` | client | Offres recues. |
| GET | `/driver/bids/sent` | driver | Offres envoyees. |

## Annonces chauffeur

| Methode | Route | Roles | Description |
| --- | --- | --- | --- |
| GET | `/advertisements` | public/auth | Liste annonces/trajets. |
| GET | `/advertisements/my` | authentifie | Mes annonces. |
| GET | `/advertisements/drivers` | public/auth | Annonces chauffeurs. |
| POST | `/advertisements` | driver | Creer annonce de trajet. |
| GET | `/advertisements/:advertisementId` | public/auth | Detail annonce. |
| PUT | `/advertisements/:advertisementId` | owner/admin | Modifier annonce. |
| DELETE | `/advertisements/:advertisementId` | owner/admin | Supprimer annonce. |
| POST | `/advertisements/:advertisementId/offers` | client | Faire offre sur annonce. |
| GET | `/advertisements/:advertisementId/offers` | owner/admin | Lister offres annonce. |
| POST | `/advertisements/:advertisementId/offers/:offerId/accept` | owner | Accepter offre. |
| POST | `/advertisements/:advertisementId/offers/:offerId/reject` | owner | Rejeter offre. |
| POST | `/advertisements/:advertisementId/close` | owner/admin | Fermer annonce. |
| GET | `/advertisements/stats` | authentifie | Stats annonces. |

## Garages, chauffeurs et vehicules

| Methode | Route | Roles | Description |
| --- | --- | --- | --- |
| GET | `/public/garages` | public | Liste garages actifs. |
| GET | `/public/drivers/search` | public/auth | Recherche chauffeurs. |
| GET | `/public/drivers/:driverId` | public/auth | Detail chauffeur public. |
| GET | `/public/drivers/garage/:garageId` | public/auth | Chauffeurs d'un garage. |
| GET | `/garage-admin/drivers` | admin | Chauffeurs du garage. |
| PUT | `/garage-admin/parcels/:parcelId/assign-driver` | admin | Assigner chauffeur. |
| POST | `/garage-admin/parcels/bulk-assign` | admin | Assignation en masse. |
| POST | `/vehicles` | admin/super_admin | Creer vehicule. |
| GET | `/vehicles` | admin/super_admin | Lister vehicules. |
| PATCH | `/vehicles/:vehicleId/status` | admin/super_admin | Changer disponibilite. |
| DELETE | `/vehicles/:vehicleId` | admin/super_admin | Supprimer vehicule. |

## Uploads

| Methode | Route | Roles | Description |
| --- | --- | --- | --- |
| POST | `/upload/parcel-photo` | authentifie | Upload photo colis base64. |
| POST | `/upload/parcel-video` | authentifie | Upload video colis base64. |
| POST | `/upload/parcel-audio` | authentifie | Upload audio colis base64. |
| POST | `/upload/bid-audio` | driver | Upload audio offre. |
| POST | `/upload/base64` | authentifie | Upload generique base64. |
| POST | `/upload` | authentifie | Upload multipart generique. |

## Notifications

| Methode | Route | Roles | Description |
| --- | --- | --- | --- |
| GET | `/notifications` | authentifie | Liste notifications. |
| GET | `/notifications/unread-count` | authentifie | Nombre non lues. |
| PATCH | `/notifications/:notificationId/read` | authentifie | Marquer lue. |
| POST | `/notifications/read-all` | authentifie | Tout marquer lu. |
| DELETE | `/notifications/:notificationId` | authentifie | Supprimer notification. |
| DELETE | `/notifications/all` | authentifie | Supprimer toutes. |
| GET | `/notifications/preferences` | authentifie | Preferences de canal par evenement. |
| PUT | `/notifications/preferences` | authentifie | Modifier preferences. |
| POST | `/notifications/email/send` | authentifie | Envoyer email via Brevo. |
| POST | `/notifications/email/send-bulk` | authentifie | Envoyer email groupé via Brevo. |
| POST | `/notifications/sms/send` | authentifie | Envoyer SMS via Brevo. |
| GET | `/admin/notifications/brevo-config` | super_admin | Configuration Brevo. |
| PUT | `/admin/notifications/brevo-config` | super_admin | Modifier config Brevo. |
| POST | `/admin/notifications/brevo-test` | super_admin | Tester connexion Brevo. |

## Paiements et score

| Methode | Route | Roles | Description |
| --- | --- | --- | --- |
| POST | `/payments/initiate` | authentifie | Initier paiement. |
| POST | `/payments/:paymentId/confirm` | authentifie/admin | Confirmer paiement. |
| GET | `/payments/history` | authentifie | Historique paiements. |
| GET | `/score` | authentifie | Score complet. |
| GET | `/score/balance` | authentifie | Solde points. |
| GET | `/score/history` | authentifie | Historique points. |
| POST | `/score/purchase` | authentifie | Achat points. |
| POST | `/score/debit` | authentifie/system | Debiter points. |
| POST | `/score/credit` | authentifie/system | Crediter points. |
| POST | `/score/refund` | authentifie/system | Rembourser points. |
| GET | `/score/stats` | authentifie | Stats score. |

## PayDunya

| Methode | Route | Roles | Description |
| --- | --- | --- | --- |
| POST | `/payments/paydunya/create` | authentifie | Creer un paiement PayDunya. Body: `{ type: 'parcel' \| 'score' \| 'wallet', parcelId?, amount? }`. Renvoie `{ token, paymentUrl }`. |
| GET | `/payments/paydunya/confirm/:token` | authentifie | Verifier statut paiement PayDunya. Renvoie `{ token, status, amount, receiptUrl? }`. |

**Flux PayDunya avec commission automatique :**
1. Client appelle `POST /payments/paydunya/create` avec `type=parcel` et `parcelId`.
2. Backend initie la session PayDunya et renvoie `paymentUrl`.
3. Client est redirige vers la page de paiement PayDunya.
4. Apres paiement, le client appelle `GET /payments/paydunya/confirm/:token`.
5. **Backend auto :** Si status=completed, le backend calcule la commission sur le montant, preleve la commission, credite le wallet du chauffeur avec `montant - commission`, et cree la transaction correspondante.

## Commissions (Wallet / Score)

| Methode | Route | Roles | Description |
| --- | --- | --- | --- |
| POST | `/super-admin/commissions/simulate` | super_admin | Simuler la commission pour un montant. Body: `{ amount }`. Renvoie `{ simulations: [{ profile, percentage, commission, netAmount }] }`. |
| GET | `/super-admin/commissions/config` | super_admin | Configurations des commissions par profil. |
| PUT | `/super-admin/commissions/config` | super_admin | Modifier configuration commission. |
| GET | `/commissions/estimate` | public/authentifie | Estimer la commission pour un montant (endpoint public). Body: `{ amount }`. Renvoie `{ commission, netAmount, percentage, minAmount, maxAmount }`. |
| GET | `/driver/wallet` | driver | Solde et transactions du portefeuille. Renvoie `{ wallet: { id, userId, balance, pendingBalance, totalEarned, totalWithdrawn, totalCommissionsPaid, status }, transactions[] }`. |
| POST | `/driver/wallet/recharge` | driver | Recharger wallet via methode. Body: `{ amount, method: 'paydunya' \| 'cash' }`. Renvoie `{ paymentUrl }` si paydunya, sinon `{ transaction }`. |
| POST | `/driver/wallet/consume` | driver | Prelever la commission sur le wallet. Body: `{ parcelId, deliveryAmount }`. |
| POST | `/driver/wallet/withdraw` | driver | Demande de retrait. Body: `{ amount, method, phone, idempotencyKey }`. Renvoie `{ withdrawal: { id, amount, method, status, createdAt } }`. Un seul retrait actif (PENDING/PROCESSING) autorise par chauffeur. Montant reserve dans pendingBalance. |
| GET | `/driver/wallet/withdrawals` | driver | Historique des demandes de retrait. |
| DELETE | `/driver/wallet/withdrawals/:id` | driver | Annuler retrait si statut PENDING. Le montant reserve est remis dans available. |
| POST | `/driver/parcels/:parcelId/pay-commission` | driver | **Payer la commission en cash.** Body: `{ source: 'wallet' \| 'score' \| 'auto', amount? }`. Si `auto`, le backend essaye wallet d'abord, puis score, puis combine. Si ressources insuffisantes, applique la politique configuree (block/warn/debt). Renvoie `{ result: { success, commission, walletDebited, pointsDebited, newWalletBalance?, newScoreBalance?, debt? } }`. |
| GET | `/driver/parcels/:parcelId/commission` | driver | Estimer la commission pour un colis. Renvoie `{ commission: { amount, commission, netAmount, percentage, minAmount, maxAmount, profile } }`. |
| GET | `/config/public` | public | Configuration publique. Renvoie `{ commission: { percentage, minAmount, maxAmount }, withdrawal: { minAmount, maxAmount }, insufficientPolicy }`. |

## Wallet Admin

| Methode | Route | Roles | Description |
| --- | --- | --- | --- |
| GET | `/super-admin/wallets` | super_admin | Lister wallets. Filtres: search, region, zone, status, minBalance, maxBalance. |
| GET | `/super-admin/wallets/:userId` | super_admin | Detail wallet chauffeur. |
| GET | `/super-admin/wallets/:userId/transactions` | super_admin | Transactions wallet. Filtres: type, from, to, page, limit. |
| POST | `/super-admin/wallets/:userId/recharge` | super_admin | Credit manuel wallet. Body: `{ amount, origin, description }`. Audit obligatoire. |
| POST | `/super-admin/wallets/:userId/debit` | super_admin | Debit manuel wallet. Body: `{ amount, origin, description }`. Audit obligatoire. |
| GET | `/super-admin/finance/dashboard` | super_admin | Dashboard financier: totalWallets, totalBalance, totalDeposited, commissionsMonth, depositsMonth, walletsLow, walletsInactive. |

## Retraits (Withdrawals) Admin

| Methode | Route | Roles | Description |
| --- | --- | --- | --- |
| GET | `/super-admin/withdrawals` | super_admin | Lister retraits. Filtres: status, method, search, page, limit. |
| GET | `/super-admin/withdrawals/:id` | super_admin | Detail retrait. |
| POST | `/super-admin/withdrawals/:id/approve` | super_admin | Approuver retrait. Declenche le deboursement (PayDunya Disburse si auto, ou marque PROCESSING). Audit obligatoire. |
| POST | `/super-admin/withdrawals/:id/reject` | super_admin | Rejeter retrait. Body: `{ reason }`. Remet le montant dans available. Audit obligatoire. |
| POST | `/super-admin/withdrawals/:id/complete` | super_admin | Marquer SUCCESS apres deboursement manuel. Audit obligatoire. |

## Webhook PayDunya IPN

| Methode | Route | Roles | Description |
| --- | --- | --- | --- |
| POST | `/payments/paydunya/ipn` | public (verifie par signature) | IPN PayDunya. **Idempotent** via transaction_id UNIQUE. Flux: completed → commission → credit wallet chauffeur. failed → pas de credit. |

## Configuration système etendue

| Methode | Route | Roles | Description |
| --- | --- | --- | --- |
| GET | `/super-admin/config` | super_admin | Configuration complete (existante + nouvelles cles financieres). |
| PUT | `/super-admin/config` | super_admin | Modifier config. Audit obligatoire. |

## Points / Score Admin (etendu)

| Methode | Route | Roles | Description |
| --- | --- | --- | --- |
| POST | `/super-admin/scores/:userId/add` | super_admin | Ajouter points. **Body etendu** : `{ amount, description, type, source, motif }`. Types: DRIVER_RECHARGE, COMMERCIAL_BONUS, ADMIN_BONUS, PERFORMANCE_REWARD, COMPENSATION, ADJUSTMENT, REFUND. Source identifie l'origine (ex: 'commercial'). Audit obligatoire. |
| POST | `/super-admin/scores/:userId/remove` | super_admin | Retirer points avec motif. Audit obligatoire. |
| GET | `/super-admin/scores` | super_admin | Liste scores. |
| GET | `/super-admin/scores/:userId` | super_admin | Detail score. |
| GET | `/super-admin/scores/:userId/history` | super_admin | Historique points (inclut source, granted_by, motif). |
| GET | `/super-admin/scores/ranking` | super_admin | Classement chauffeurs. |

## Super admin et administration

| Methode | Route | Roles | Description |
| --- | --- | --- | --- |
| GET | `/super-admin/stats` | super_admin | Stats globales. |
| GET | `/super-admin/stats/advanced` | super_admin | Stats avancees. |
| GET | `/super-admin/reports/monthly` | super_admin | Rapport mensuel. |
| GET | `/super-admin/reports/daily` | super_admin | Rapport journalier. |
| GET | `/super-admin/export` | super_admin | Export donnees. |
| GET | `/super-admin/users` | super_admin | Lister utilisateurs. |
| POST | `/super-admin/users` | super_admin | Creer utilisateur. |
| GET | `/super-admin/users/:userId` | super_admin | Detail utilisateur. |
| PUT | `/super-admin/users/:userId` | super_admin | Modifier utilisateur. |
| PATCH | `/super-admin/users/:userId/role` | super_admin | Modifier role. |
| PATCH | `/super-admin/users/:userId/status` | super_admin | Modifier statut. |
| DELETE | `/super-admin/users/:userId` | super_admin | Suppression logique utilisateur. |
| GET | `/super-admin/garages` | super_admin | Lister garages. |
| POST | `/super-admin/garages` | super_admin | Creer garage. |
| GET | `/super-admin/garages/:garageId` | super_admin | Detail garage. |
| PUT | `/super-admin/garages/:garageId` | super_admin | Modifier garage. |
| DELETE | `/super-admin/garages/:garageId` | super_admin | Supprimer garage. |
| GET | `/super-admin/system/health` | super_admin | Sante systeme. |
| GET | `/super-admin/audit-logs` | super_admin | Audit logs. |
| GET | `/super-admin/config` | super_admin | Configuration. |
| PUT | `/super-admin/config` | super_admin | Modifier configuration. |
| POST | `/super-admin/backup` | super_admin | Demarrer backup. |
| POST | `/super-admin/restore` | super_admin | Restaurer backup. |
| GET | `/super-admin/backups` | super_admin | Lister backups. |

## Support, identite et divers

| Methode | Route | Roles | Description |
| --- | --- | --- | --- |
| POST | `/support/messages` | authentifie | Envoyer message support. |
| GET | `/support/messages` | authentifie/admin | Lister messages support. |
| POST | `/identity/verify` | authentifie | Demande verification identite. |
| POST | `/identity/upload` | authentifie | Upload document identite. |
| GET | `/identity/status` | authentifie | Statut verification. |
| POST | `/ratings` | authentifie | Noter chauffeur/service. |
| GET | `/ratings/driver/:driverId` | public/auth | Notes chauffeur. |
| GET | `/coupons/available` | authentifie | Coupons disponibles. |
| POST | `/messages` | authentifie | Envoyer message interne. |
| GET | `/messages/conversations` | authentifie | Conversations. |
| PATCH | `/messages/:messageId/read` | authentifie | Marquer message lu. |
| POST | `/favorites/garages/:garageId` | authentifie | Ajouter favori. |
| DELETE | `/favorites/garages/:garageId` | authentifie | Retirer favori. |
| GET | `/favorites/garages` | authentifie | Lister favoris. |
| POST | `/addresses` | authentifie | Creer adresse. |
| GET | `/addresses` | authentifie | Lister adresses. |
| PUT | `/addresses/:addressId` | authentifie | Modifier adresse. |
| DELETE | `/addresses/:addressId` | authentifie | Supprimer adresse. |
| PATCH | `/addresses/:addressId/default` | authentifie | Adresse par defaut. |
| GET | `/search/parcels` | authentifie | Recherche colis. |
| POST | `/webhooks` | super_admin | Enregistrer webhook. |
| GET | `/webhooks` | super_admin | Lister webhooks. |
| DELETE | `/webhooks/:webhookId` | super_admin | Supprimer webhook. |

