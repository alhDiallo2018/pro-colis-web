# Notifications

## Objectif

Le backend doit produire des notifications persistantes en base. Les notifications push peuvent etre ajoutees ensuite, mais la base `notifications` est obligatoire des le MVP.

## Types

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

## Evenements generateurs

Creation colis :

- notifier client si colis cree par chauffeur/admin.
- notifier garage de depart si utile.

Assignation chauffeur :

- notifier chauffeur.
- notifier client.

Offre creee :

- notifier client proprietaire du colis.

Offre acceptee/rejetee :

- notifier chauffeur.

Changement statut colis :

- notifier client.
- notifier admin garage selon statut.

Livraison confirmee :

- notifier client.
- notifier admin garage.
- notifier chauffeur si score/recompense.

Paiement confirme :

- notifier utilisateur.

Message support :

- notifier admins concernes.

## Payload notification

```json
{
  "id": "uuid",
  "userId": "uuid",
  "parcelId": "uuid",
  "bidId": "uuid",
  "senderId": "uuid",
  "senderName": "PRO COLIS",
  "type": "parcel_status",
  "title": "Colis en transit",
  "body": "Votre colis PC-20260628-A8F2K9 est en transit.",
  "data": {
    "trackingNumber": "PC-20260628-A8F2K9",
    "status": "in_transit"
  },
  "isRead": false,
  "priority": "normal",
  "createdAt": "2026-06-28T12:00:00.000Z"
}
```

## Endpoints

- `GET /notifications?page=1&limit=20`
- `GET /notifications/unread-count`
- `PATCH /notifications/:notificationId/read`
- `POST /notifications/read-all`
- `DELETE /notifications/:notificationId`
- `DELETE /notifications/all`

## Notifications Email & SMS (Brevo)

Le backend utilise Brevo (ex-SendinBlue) pour l'envoi d'emails transactionnels et de SMS.

### Endpoints email

| Methode | Route | Roles | Description |
| --- | --- | --- | --- |
| POST | `/notifications/email/send` | authentifie | Envoyer un email unitaire via Brevo. |
| POST | `/notifications/email/send-bulk` | authentifie | Envoyer un email groupé via Brevo. |

Payload email unitaire :

```json
{
  "to": "client@example.com",
  "toName": "Awa Diop",
  "subject": "Colis PC-20260628-A8F2K9 en transit",
  "htmlContent": "<h1>Colis en transit</h1>...",
  "textContent": "Version texte optionnelle",
  "params": { "trackingNumber": "PC-20260628-A8F2K9" }
}
```

### Endpoints SMS

| Methode | Route | Roles | Description |
| --- | --- | --- | --- |
| POST | `/notifications/sms/send` | authentifie | Envoyer un SMS via Brevo. |

Payload SMS :

```json
{
  "to": "+221770000000",
  "content": "PRO COLIS : Colis PC-20260628-A8F2K9 en transit.",
  "senderName": "PRO COLIS"
}
```

### Endpoints admin

| Methode | Route | Roles | Description |
| --- | --- | --- | --- |
| GET | `/admin/notifications/brevo-config` | super_admin | Récupérer la configuration Brevo. |
| PUT | `/admin/notifications/brevo-config` | super_admin | Modifier la configuration Brevo. |
| POST | `/admin/notifications/brevo-test` | super_admin | Tester la connexion Brevo (email test). |

Payload test Brevo :

```json
{
  "email": "admin@procolis.sn"
}
```

### Preferences utilisateur

| Methode | Route | Roles | Description |
| --- | --- | --- | --- |
| GET | `/notifications/preferences` | authentifie | Récupérer les préférences de notification. |
| PUT | `/notifications/preferences` | authentifie | Modifier les préférences (canaux par type d'événement). |

Payload préférences :

```json
{
  "preferences": [
    { "eventType": "parcel_created", "channels": ["in_app", "email"] },
    { "eventType": "bid_received", "channels": ["in_app", "sms"] }
  ]
}
```

### Configuration serveur Brevo (variables d'environnement)

```
BREVO_API_KEY=xkeysib-...
BREVO_SENDER_EMAIL=no-reply@procolis.sn
BREVO_SENDER_NAME=PRO COLIS
BREVO_SMS_SENDER=PROCOLIS
```

## Autorisations

Un utilisateur ne peut manipuler que ses propres notifications.

Un `super_admin` peut consulter les notifications systeme si un endpoint admin dedie est ajoute.

