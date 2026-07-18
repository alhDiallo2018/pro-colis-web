# Flux Financiers — Machines à États & Implémentation

## 1. Flux PayDunya → Wallet Chauffeur (CAS A)

```
Client initie paiement
        │
        ▼
  POST /payments/paydunya/create  { type:'parcel', parcelId, amount }
        │
        ▼
  PayDunya crée session → paymentUrl
        │
        ▼
  Client redirigé vers PayDunya (paiement)
        │
        ▼
  PayDunya POST /payments/paydunya/ipn  (IPN - webhook)
        │
   ┌────┴─────────┐
   ▼              ▼
status=completed  status=failed/expired
   │              │
   │              └── paiement FAILED, pas de crédit wallet
   │
   ▼
  BEGIN TRANSACTION
    1. Vérifier idempotence (payment.transaction_id déjà traité ?)
       → si oui, retourner 200 sans rien faire
    2. Insérer/mettre à jour payment: status='completed', completed_at=now()
    3. Calculer commission = MAX(minAmount, MIN(maxAmount, amount × percentage/100))
    4. Créditer wallet: available_balance += (amount - commission)
    5. Créer wallet_transaction:
       type='CREDIT', source='DELIVERY_PAYMENT',
       balance_before, balance_after, parcel_id, payment_id,
       idempotency_key = 'delivery_{parcelId}'
    6. Mettre à jour wallet: total_earned += (amount - commission)
    7. Créer audit_log: payment.confirm
    8. Mettre à jour parcel: payment_status = 'completed'
  COMMIT
    9. Notifier le chauffeur (nouveau solde wallet)
```

### IDEMPOTENCE CRITIQUE

Le `transaction_id` PayDunya est unique dans `payments`. En cas de double IPN (PayDunya renvoie parfois plusieurs IPN) :
- `SELECT id FROM payments WHERE transaction_id = $1` → si existe déjà et `status = 'completed'`, retourner 200.
- Utiliser `SELECT ... FOR UPDATE` sur la ligne wallet pour éviter les races conditions.

---

## 2. Flux Cash (CAS B) — Commission sur ressources chauffeur

```
Livraison confirmée (parcel.status = 'delivered')
  ET parcel.payment_method = 'cash'
        │
        ▼
  POST /driver/parcels/:id/pay-commission  { source: 'auto' }
        │
        ▼
  Calcul commission
        │
   ┌────┴────────────────┐
   ▼                     ▼
wallet >= commission    wallet < commission
   │                     │
   ▼                     ▼
Déduire 100% wallet     wallet disponible > 0 ?
                         │
                    ┌────┴────────┐
                    ▼             ▼
                  oui            non
                   │             │
                   ▼             ▼
         Déduire wallet      score >= commission ?
         + reste points         │
                   │      ┌─────┴──────┐
                   ▼      ▼            ▼
              [si couvert] oui          non
                   │      │            │
                   │      ▼            ▼
                   │   Déduire    wallet+score
                   │   100%       < commission ?
                   │   points         │
                   │              ┌───┴────────┐
                   │              ▼            ▼
                   │            oui           non
                   │              │            │
                   ▼              ▼            ▼
              SUCCESS        Combiner     Politique:
                             wallet+      block → erreur 402
                             points       warn  → dette UNPAID
                                          debt  → commission_debts
```

### Enregistrement

Pour chaque prélèvement, créer `wallet_transaction` (source='CASH_COMMISSION') et/ou `score_transaction` (type='COMMISSION_DEDUCTION'). Toujours une transaction DB atomique.

---

## 3. Machine à États — Retrait (Withdrawal)

```
PENDING ──────────────────────────────────────────────────────────────
  │                                                                    │
  │  POST /driver/wallet/withdraw                                      │
  │  ─────────────────────────                                        │
  │  1. Vérifier: pas d'autre retrait PENDING/PROCESSING               │
  │  2. Vérifier: amount >= minAmount                                  │
  │  3. Vérifier: available_balance >= amount                          │
  │  4. Réserver: available -= amount, pending += amount               │
  │  5. Créer withdrawal (status=PENDING, idempotency_key UNIQUE)      │
  │  6. Créer wallet_transaction (type='WITHDRAWAL', status='pending') │
  │                                                                    │
  ├── action: driver annule                                            │
  │   DELETE /driver/wallet/withdrawals/:id                            │
  │   ─────────────────────────────────────                            │
  │   1. Vérifier: status = PENDING                                    │
  │   2. Restaurer: pending -= amount, available += amount             │
  │   3. withdrawal.status = CANCELLED                                 │
  │   4. wallet_transaction.status = 'cancelled'                       │
  │                                                                    │
  ├── action: admin approuve                                           │
  │   POST /super-admin/withdrawals/:id/approve                        │
  │   ─────────────────────────────────────────                        │
  │   1. Vérifier: status = PENDING                                    │
  │   2. withdrawal.status = PROCESSING                                │
  │   3. reviewed_by = admin_id, reviewed_at = now()                   │
  │   4. Si disbursement.mode = 'auto':                                │
  │      → appeler API PayDunya Disburse                               │
  │      → stocker provider_ref                                        │
  │   5. Audit                                                         │
  │                                                                    │
  ▼                                                                    │
PROCESSING ────────────────────────────────────────────────────────────│
  │                                                                    │
  ├── IPN/webhook SUCCESS                                              │
  │   ─────────────────                                                │
  │   1. Vérifier: withdrawal.status = PROCESSING                      │
  │   2. pending -= amount                                              │
  │   3. total_withdrawn += amount                                      │
  │   4. withdrawal.status = SUCCESS, completed_at = now()             │
  │   5. wallet_transaction.status = 'completed'                       │
  │   6. Audit                                                         │
  │                                                                    │
  ├── IPN/webhook FAILED                                               │
  │   ────────────────                                                 │
  │   1. Vérifier: withdrawal.status = PROCESSING                      │
  │   2. pending -= amount                                              │
  │   3. available += amount  (fonds remis)                             │
  │   4. withdrawal.status = FAILED, failure_reason = ...              │
  │   5. wallet_transaction: créer WITHDRAWAL_REFUND credit            │
  │   6. Notifier le chauffeur                                         │
  │   7. Audit                                                         │
  │                                                                    │
  ├── action: admin rejette                                            │
  │   POST /super-admin/withdrawals/:id/reject                         │
  │   ─────────────────────────────────────────                        │
  │   1. Même que FAILED mais manuellement (admin décision)            │
  │   2. withdrawal.status = FAILED                                    │
  │   3. failure_reason = raison du rejet                              │
  │   4. Audit                                                         │
  │                                                                    │
  └── action: admin complete (manuel)                                  │
      POST /super-admin/withdrawals/:id/complete                       │
      ───────────────────────────────────────────                      │
      1. Vérifier: status = PROCESSING                                 │
      2. Même finalisation que SUCCESS                                 │
      3. Audit                                                         │
```

### GARANTIE : AUCUN FONDS PERDU

Le montant reservé (`pending_balance`) ne peut être réduit que par SUCCESS (sortie définitive) ou FAILED/CANCELLED (remis dans available). Il n'y a pas d'autre transition possible.

---

## 4. Flux Points — Bonus Commercial/Admin

```
Admin POST /super-admin/scores/:userId/add
  {
    amount: 500,
    description: "Félicitation performances",
    type: "COMMERCIAL_BONUS",
    source: "commercial",
    motif: "Top chauffeur du mois"
  }
        │
        ▼
  BEGIN TRANSACTION
    1. Vérifier idempotence (idempotency_key UNIQUE)
    2. Mettre à jour scores: points += amount, total_earned += amount
    3. Insérer score_transaction:
       type='COMMERCIAL_BONUS',
       source='commercial', motif='Top chauffeur du mois',
       granted_by = admin_id,
       balance_before, balance_after,
       idempotency_key = 'bonus_{userId}_{timestamp}'
    4. Audit: score.add
  COMMIT
    5. Notifier le chauffeur
```

---

## 5. Ordre d'implémentation backend recommandé

1. **Migrations** : wallets, wallet_transactions, withdrawals, commission_configs, commission_debts, ALTER score_transactions (+ colonnes), nouvelles clés system_config
2. **Service Commission** : `calculateCommission(amount, profile)` → utiliser `commission_configs` avec fallback 5%/100/500
3. **Service Wallet** : `credit(parcelId, amount, idempotencyKey)`, `debit(amount, source, idempotencyKey)`, `getBalance()`, `getTransactions()` — transactions DB avec `FOR UPDATE`
4. **PayDunya IPN idempotent** : vérifier `transaction_id` déjà traité → commission → credit wallet → notif
5. **Pay-commission cash** : `payCashCommission(parcelId, source)` → logique wallet puis points puis combiné puis politique
6. **Service Retrait** : `requestWithdrawal()`, `approve()`, `reject()`, `complete()` — réservation pending + machine à états
7. **Service Disburse** : appels PayDunya Disburse API + webhook handler
8. **Service Points étendu** : `addPoints()` avec source/granted_by/motif, `removePoints()`
9. **Config publique** : endpoint `/config/public` + endpoint `/commissions/estimate` public
10. **Audit** : chaque opération financière côté admin crée un audit_log
11. **Tests** : Jest pour chaque scénario (succès, échec, idempotence, concurrence)

## 6. Tests à implémenter

### Paiement PayDunya
- [x] Paiement réussi → commission → wallet crédité
- [x] Paiement échoué → aucun crédit
- [x] Paiement en attente → pas de crédit
- [x] IPN reçue 2 fois → idempotent (2e IPN = no-op)
- [x] Paiement remboursé → correction wallet

### Wallet
- [x] Crédit → available augmente
- [x] Débit → available diminue
- [x] Solde insuffisant → erreur 402
- [x] Double crédit même idempotency_key → idempotent
- [x] Double débit même idempotency_key → idempotent

### Points
- [x] Recharge chauffeur → points += amount, type=DRIVER_RECHARGE
- [x] Bonus commercial → type=COMMERCIAL_BONUS, source+granted_by+motif
- [x] Bonus admin → type=ADMIN_BONUS, audit
- [x] Déduction commission → type=COMMISSION_DEDUCTION
- [x] Solde insuffisant → erreur

### Cash Commission
- [x] Wallet suffisant → wallet débité
- [x] Points suffisants → points débités
- [x] Wallet + Points combinés → les deux débités
- [x] Wallet + Points insuffisants + politique block → erreur 402
- [x] Wallet + Points insuffisants + politique debt → dette créée

### Retraits
- [x] Retrait réussi → pending → SUCCESS, total_withdrawn++
- [x] Retrait échoué → pending → FAILED, fonds remis
- [x] Retrait en attente → pas de 2e retrait possible
- [x] Double demande → idempotent via idempotency_key
- [x] Solde insuffisant → erreur
- [x] Remboursement après échec → fonds retournés intégralement
