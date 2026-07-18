# Regles metier

## Numerotation colis

Chaque colis doit avoir un `tracking_number` unique, lisible et court.

Format recommande :

```text
PC-YYYYMMDD-XXXXXX
```

Exemple : `PC-20260628-A8F2K9`.

## Statuts colis

Statuts supportes :

- `pending`
- `free`
- `confirmed`
- `picked_up`
- `in_transit`
- `arrived`
- `out_for_delivery`
- `delivered`
- `cancelled`

Transitions autorisees :

```text
pending -> confirmed
pending -> free
pending -> cancelled
free -> confirmed
free -> cancelled
confirmed -> picked_up
confirmed -> cancelled
picked_up -> in_transit
in_transit -> arrived
arrived -> out_for_delivery
out_for_delivery -> delivered
```

Un `super_admin` peut corriger un statut avec audit obligatoire.

## Creation colis

Regles :

- `senderName`, `senderPhone`, `receiverName`, `receiverPhone`, `description`, `weight`, `departureGarageId` sont obligatoires.
- `arrivalGarageId` est recommande pour les trajets inter-garages.
- Si `isFreeForBidding=true`, le statut initial doit etre `free`.
- Si `driverId` est fourni, le statut initial peut etre `confirmed`.
- Le prix final est calcule depuis `price`, `proposedPrice`, `negotiatedPrice`, frais urgence et assurance.
- Un evenement initial `pending` ou `free` doit etre cree.

## Assignation chauffeur

Un chauffeur peut etre assigne si :

- son role est `driver`.
- son statut utilisateur est `active`.
- son `driver_status` n'est pas `offline`, sauf decision admin.
- il appartient au garage concerne ou est autorise par le super admin.

Lors de l'assignation :

- `parcels.driver_id` est renseigne.
- statut colis passe a `confirmed` si necessaire.
- une notification est envoyee au chauffeur et au client.
- un audit log est cree.

## Colis libre service et offres

Un colis libre service :

- a `is_free_for_bidding=true`.
- a un statut `free`.
- peut recevoir plusieurs offres `bids`.

Une offre :

- est creee par un chauffeur.
- contient `price`, message optionnel et audio optionnel.
- demarre avec statut `pending`.

Acceptation :

- l'offre choisie passe a `accepted`.
- les autres offres passent a `rejected`.
- le chauffeur de l'offre devient `driver_id` du colis.
- le colis passe a `confirmed`.
- `selected_bid_id` et `negotiated_price` sont mis a jour.

Rejet :

- l'offre passe a `rejected`.
- une raison peut etre stockee dans `response_message`.

## Livraison

Chaque changement de statut doit :

- verifier la transition autorisee.
- verifier que l'utilisateur a le droit d'agir.
- creer un `parcel_event`.
- notifier les utilisateurs concernes.
- journaliser les changements sensibles.

Confirmation de livraison :

- requiert idealement photo ou signature.
- renseigne `delivery_date`.
- met le chauffeur `available` si aucun autre colis actif.
- peut crediter des points au client/chauffeur.

## Annulation

Annulation client autorisee seulement si :

- colis `pending`, `free` ou `confirmed` non ramasse.

Annulation admin/super_admin :

- possible plus largement avec raison obligatoire.

L'annulation doit renseigner :

- `cancelled_by`
- `cancellation_reason`
- `cancelled_at`

## Paiements

Methodes :

- `wave`
- `freemMoney` pour compatibilite mobile existante.
- `orange_money`
- `card`
- `cash`

Statuts :

- `pending`
- `processing`
- `completed`
- `failed`
- `refunded`

Regles :

- un paiement doit etre lie a un `user_id`.
- un paiement colis doit etre lie a `parcel_id`.
- confirmer un paiement doit etre idempotent.
- paiement confirme met a jour `payment_status` du colis si applicable.

## Score et wallet

### Systeme de Points

Le score represente un systeme de points.

Regles :

- une transaction de score est append-only.
- le solde peut etre denormalise dans `scores.points`.
- les credits/debits doivent utiliser une transaction DB.
- un debit ne peut pas rendre le solde negatif sauf configuration explicite.
- chaque transaction de points doit tracer `source` (origine), `motif` (raison), `granted_by` (qui a attribue), `balance_before`, `balance_after`.
- types autorises : `DRIVER_RECHARGE`, `COMMERCIAL_BONUS`, `ADMIN_BONUS`, `PERFORMANCE_REWARD`, `COMMISSION_DEDUCTION`, `REFUND`, `ADJUSTMENT`, `COMPENSATION`.
- conversion pour paiement de commission : **1 point = 1 FCFA**.

### Systeme de Wallet

Le wallet represente de l'argent reel (FCFA) appartenant au chauffeur.

Regles :

- `available_balance` est le solde disponible pour retrait et commissions.
- `pending_balance` est le montant reserve par un retrait en cours (PENDING ou PROCESSING).
- tout debit/credit doit passer par `wallet_transactions` (append-only, idempotent via `idempotency_key` UNIQUE).
- un credit ne doit jamais etre duplique — utiliser `SELECT ... FOR UPDATE` dans la transaction DB.
- un paiement PayDunya confirme (token unique) doit etre idempotent : si deja traite, retourner le resultat sans modifier.

### Commission

Formule :

```
commission = deliveryAmount × percentage / 100
commission = MAX(minAmount, MIN(maxAmount, commission))
```

Regles :

- configurable par profil (`local`, `regional`, `express`, `international`) via `commission_configs`.
- profil par defaut : `local` (5%, min 100 FCFA, max 500 FCFA).
- si aucun profil ne correspond, utiliser le profil `local`.
- la commission pour les livraisons payees via PayDunya est prelevee automatiquement sur le montant avant credit du wallet chauffeur.
- la commission pour les livraisons payees en especes est prelevee sur les ressources du chauffeur (wallet puis points).
- `POST /commissions/estimate` est public et ne necessite pas d'authentification.

### Paiement Cash — Ordre de prelevement

1. Calculer la commission.
2. Si `wallet.available_balance >= commission` : debiter le wallet.
3. Sinon, si `scores.points >= commission` : debiter les points.
4. Sinon, combiner wallet restant + points.
5. Si wallet + points < commission : appliquer la politique configuree.

### Politique en cas d'insuffisance

Configuree dans `system_configs` (`commission.insufficientPolicy`) :

- `block` : refuser la validation de la livraison. Message : "Solde insuffisant. Rechargez votre portefeuille ou vos points."
- `warn` (defaut) : autoriser la livraison avec un avertissement. Le chauffeur pourra payer la commission plus tard.
- `debt` : creer une `commission_debt` et autoriser la livraison. La dette devra etre reglee avant le prochain retrait.

### Retrait (Withdrawal)

Regles :

- montant minimum configurable (defaut 500 FCFA, cle `withdrawal.minAmount`).
- montant maximum configurable (defaut 0 = illimite, cle `withdrawal.maxAmount`).
- un seul retrait actif (statut PENDING ou PROCESSING) par chauffeur a la fois.
- la demande cree une reservation : `available -= amount`, `pending += amount`.
- statuts : `PENDING` → `PROCESSING` → `SUCCESS` ou `FAILED`.
- si `FAILED` ou `CANCELLED` : `pending -= amount`, `available += amount` (aucun fonds perdu).
- si `SUCCESS` : `pending -= amount`, `total_withdrawn += amount` (fonds definitivement sortis).
- idempotency : `idempotency_key` UNIQUE empeche les doublons.
- annulation possible seulement si statut `PENDING`.

### Deboursement

- mode `manual` (defaut) : un admin doit approuver (`/approve`) puis completer (`/complete`) le retrait.
- mode `auto` : l'approbation declenche automatiquement l'appel a l'API PayDunya Disburse.
- IPN/webhook PayDunya Disburse met a jour le statut du retrait (SUCCESS/FAILED).
- en cas d'echec du deboursement, le montant est automatiquement remis dans `available`.

### Idempotence des operations financieres

Chaque operation doit etre idempotente :

| Operation | Cle d'idempotence |
|-----------|-------------------|
| PayDunya IPN | `payments.transaction_id` (UNIQUE) |
| Credit wallet livraison | `wallet_transactions.idempotency_key` = `delivery_{parcelId}` |
| Commission prelevee | `wallet_transactions.idempotency_key` = `commission_{parcelId}` |
| Retrait | `withdrawals.idempotency_key` (UNIQUE, fourni par le client) |
| Bonus points | `score_transactions.idempotency_key` = `bonus_{userId}_{timestamp}` |

### Audit

Actions auditees obligatoirement :

- `wallet.credit` (admin)
- `wallet.debit` (admin)
- `score.add` (admin)
- `score.remove` (admin)
- `withdrawal.approve`
- `withdrawal.reject`
- `withdrawal.complete`
- `commission.config.update`
- `config.update` (tout changement de config systeme)
- `payment.confirm` (IPN)

## Notifications

Types :

- `bid_created`
- `bid_accepted`
- `bid_rejected`
- `parcel_status`
- `parcel_created`
- `driver_assigned`
- `delivery_confirmed`
- `message`
- `system`
- `info`

Priorites :

- `low`
- `normal`
- `high`
- `urgent`

## Rapports

Les rapports doivent pouvoir calculer :

- nombre total utilisateurs, clients, chauffeurs, garages, vehicules.
- colis par statut.
- colis livres aujourd'hui.
- revenus total/mois courant/mois precedent.
- performance garages : colis traites, livraisons a temps, note, revenu.
- statistiques journalieres : colis, revenu, chauffeurs actifs.

